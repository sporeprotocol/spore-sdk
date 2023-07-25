import { common, FromInfo, parseFromInfo } from '@ckb-lumos/common-scripts';
import { BI, Cell, helpers } from '@ckb-lumos/lumos';
import { Config } from '@ckb-lumos/config-manager';
import { Address, Script } from '@ckb-lumos/base';
import { BIish } from '@ckb-lumos/bi';

/**
 * Calculate target cell's minimal occupied capacity by lock script.
 */
export function minimalCellCapacityByLock(lock: Script) {
  return helpers.minimalCellCapacityCompatible({
    cellOutput: {
      capacity: '0x0',
      lock,
    },
    data: '0x',
  });
}

/**
 * Fix cell's minimal occupied capacity by 'helpers.minimalCellCapacityCompatible' API.

 * Note: this function will modify the original cell object.
 */
export function correctCellMinimalCapacity(cell: Cell) {
  const occupiedCapacity = helpers.minimalCellCapacityCompatible(cell);
  if (!occupiedCapacity.eq(cell.cellOutput.capacity)) {
    cell.cellOutput.capacity = occupiedCapacity.toHexString();
  }

  return cell;
}

/**
 * Count the total containing capacity of a cells list.
 */
export function getCellsTotalCapacity(cells: Cell[]) {
  return cells.reduce((sum, cell) => sum.add(cell.cellOutput.capacity), BI.from(0));
}

/**
 * Calculate the summary of capacity/length difference between inputs and outputs.
 */
export function createCapacitySnapshot(inputs: Cell[], outputs: Cell[]) {
  const inputsCapacity = getCellsTotalCapacity(inputs);
  const outputsCapacity = getCellsTotalCapacity(outputs);
  const inputsRemainCapacity = inputsCapacity.sub(outputsCapacity);
  const outputsRemainCapacity = outputsCapacity.sub(inputsCapacity);

  return {
    inputsLength: inputs.length,
    outputsLength: outputs.length,
    inputsCapacity,
    outputsCapacity,
    inputsRemainCapacity,
    outputsRemainCapacity,
  };
}

/**
 * Calculates the capacity different in Transaction.inputs and Transaction.outputs,
 * then fix the change cell's containing capacity if inputs' total capacity has any left.
 *
 * Note: normally the change cell is the last cell in Transaction.outputs,
 * but if things are different you can also provide the change cell's output index.
 */
export function correctChangeCellCapacity(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  changeOutputIndex?: number;
}) {
  let txSkeleton = props.txSkeleton;

  const inputs = txSkeleton.get('inputs').toArray();
  const outputs = txSkeleton.get('outputs').toArray();
  const snapshot = createCapacitySnapshot(inputs, outputs);

  if (snapshot.inputsRemainCapacity.gt(0)) {
    const outputIndex = props.changeOutputIndex ?? txSkeleton.get('outputs').size - 1;
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      const output = outputs.get(outputIndex);
      if (!output) {
        throw new Error('Cannot correct change cell capacity because Transaction.outputs is empty');
      }

      const oldCapacity = BI.from(output.cellOutput.capacity);
      output.cellOutput.capacity = oldCapacity.add(snapshot.inputsRemainCapacity).toHexString();
      return outputs;
    });
  }

  return txSkeleton;
}

/**
 * Calculate the capacity difference between Transaction.inputs and Transaction.outputs,
 * and see how much capacity is needed for the transaction to be constructed.
 */
export function calculateNeededCapacity(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfo: FromInfo;
  config?: Config;
  fee?: BIish;
}) {
  let txSkeleton = props.txSkeleton;

  // Get snapshot of inputs/outputs
  const inputs = txSkeleton.get('inputs').toArray();
  const outputs = txSkeleton.get('outputs').toArray();
  const snapshot = createCapacitySnapshot(inputs, outputs);

  // If not specified a fee, will collect 1 CKB by default
  const estimatedFee = BI.from(props.fee ?? '100000000');
  let neededCapacity = snapshot.outputsRemainCapacity.add(estimatedFee);

  // Calculate remain capacity
  const remainCapacity = snapshot.inputsRemainCapacity;
  const fromInfo = parseFromInfo(props.fromInfo, { config: props.config });
  const minimalChangeCapacity = minimalCellCapacityByLock(fromInfo.fromScript).add(estimatedFee);
  if (neededCapacity.lte(0) && remainCapacity.gt(0) && remainCapacity.lt(minimalChangeCapacity)) {
    neededCapacity = minimalChangeCapacity;
  }

  return {
    snapshot,
    estimatedFee,
    neededCapacity,
    remainCapacity,
  };
}

/**
 * Calculate the minimal required capacity for the transaction to be constructed,
 * and then collect ckb cells to inputs, it also fills cellDeps and witnesses.
 * After collecting, it will generate an output to return unused ckb.
 *
 * Note: The function also collects for estimated transaction fee.
 */
export async function injectNeededCapacity(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  fee?: BIish;
  config?: Config;
  changeAddress?: Address;
  enableDeductCapacity?: boolean;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  before: ReturnType<typeof createCapacitySnapshot>;
  after?: ReturnType<typeof createCapacitySnapshot>;
}> {
  let txSkeleton = props.txSkeleton;

  const changeInfo = props.changeAddress ?? props.fromInfos[0];
  const calculated = calculateNeededCapacity({
    txSkeleton,
    fee: props.fee,
    config: props.config,
    fromInfo: changeInfo,
  });

  const before: ReturnType<typeof createCapacitySnapshot> = calculated.snapshot;
  let after: ReturnType<typeof createCapacitySnapshot> | undefined;

  // collect needed capacity
  if (calculated.neededCapacity.gt(0)) {
    txSkeleton = await common.injectCapacity(
      txSkeleton,
      props.fromInfos,
      calculated.neededCapacity,
      props.changeAddress,
      void 0,
      {
        enableDeductCapacity: props.enableDeductCapacity,
        config: props.config,
      },
    );

    const inputs = txSkeleton.get('inputs').toArray();
    const outputs = txSkeleton.get('outputs').toArray();
    after = createCapacitySnapshot(inputs, outputs);
  }

  // If no needed capacity, but has remained capacity needed to be return
  if (calculated.neededCapacity.lte(0) && calculated.remainCapacity.gt(0)) {
    const parsedChangeInfo = parseFromInfo(changeInfo, {
      config: props.config,
    });
    const changeCell: Cell = {
      cellOutput: {
        lock: parsedChangeInfo.fromScript,
        capacity: calculated.remainCapacity.toHexString(),
      },
      data: '0x',
    };

    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push(changeCell);
    });
  }

  return {
    txSkeleton,
    before,
    after,
  };
}
