import { common, FromInfo } from '@ckb-lumos/common-scripts';
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
 * Calculate the capacity difference between Transaction.inputs and Transaction.outputs,
 * and then inject enough capacity (including transaction fee) into Transaction.inputs.
 */
export function calculateNeededCapacity(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfo: FromInfo;
  fee?: BIish;
  config?: Config;
}) {
  let txSkeleton = props.txSkeleton;

  const inputs = txSkeleton.get('inputs').toArray();
  const outputs = txSkeleton.get('outputs').toArray();
  const snapshot = createCapacitySnapshot(inputs, outputs);

  const estimatedFee = BI.from(props.fee ?? '100000000');
  let neededCapacity = snapshot.outputsRemainCapacity.add(estimatedFee);

  return {
    snapshot,
    estimatedFee,
    neededCapacity,
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
}) {
  let txSkeleton = props.txSkeleton;

  const {
    snapshot: before,
    neededCapacity,
    estimatedFee,
  } = calculateNeededCapacity({
    txSkeleton,
    fromInfo: props.fromInfos[0],
    fee: props.fee,
    config: props.config,
  });

  let after: ReturnType<typeof createCapacitySnapshot> | undefined;

  if (neededCapacity.gt(0)) {
    txSkeleton = await common.injectCapacity(txSkeleton, props.fromInfos, neededCapacity, props.changeAddress, void 0, {
      enableDeductCapacity: props.enableDeductCapacity,
      config: props.config,
    });

    after = createCapacitySnapshot(txSkeleton.get('inputs').toArray(), txSkeleton.get('outputs').toArray());
  }

  return {
    txSkeleton,
    before,
    after,

    estimatedFee,
    neededCapacity,
    collectedAny: after !== void 0,
    collectedCapacity: after !== void 0 ? after.inputsCapacity.sub(before.inputsCapacity) : BI.from(0),
  };
}
