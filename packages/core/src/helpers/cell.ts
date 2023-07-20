import { Config } from '@ckb-lumos/config-manager';
import { common, FromInfo } from '@ckb-lumos/common-scripts';
import { OutPoint, PackedSince, Script } from '@ckb-lumos/base';
import { Cell, helpers, HexString, Indexer, RPC } from '@ckb-lumos/lumos';

/**
 * Find and return the first cell of target type script from CKB Indexer.
 */
export async function getCellByType(props: { type: Script; indexer: Indexer }) {
  const collector = props.indexer.collector({
    type: props.type,
  });

  for await (const cell of collector.collect()) {
    return cell;
  }

  return void 0;
}

/**
 * A wrapper function, to get a Cell structure from RPC.getLiveCell() method.
 */
export async function getCellWithStatusByOutPoint(props: { outPoint: OutPoint; rpc: RPC }) {
  const liveCell = await props.rpc.getLiveCell(props.outPoint, true);
  const cell: Cell = {
    cellOutput: liveCell.cell.output,
    data: liveCell.cell.data.content,
    outPoint: props.outPoint,
  };

  return {
    cell,
    status: liveCell.status,
  };
}

/**
 * Inject a cell to Transaction.inputs, and to Transaction.outputs if needed.
 * The function also add needed/supported witness placeholders and cellDeps.
 */
export async function setupCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  input: Cell;
  fromInfo?: FromInfo;
  addOutput?: boolean;
  updateOutput?(cell: Cell): Cell;
  config?: Config;
  since?: PackedSince;
  defaultWitness?: HexString;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const addOutput = props.addOutput ?? false;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Add target cell to inputs and outputs,
  // the function also handles witnesses and cellDeps
  txSkeleton = await common.setupInputCell(txSkeleton, props.input, props.fromInfo, {
    since: props.since,
    config: props.config,
    defaultWitness: props.defaultWitness,
  });

  // Remove it from outputs if not needed
  if (!addOutput) {
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.remove(outputs.size - 1);
    });
  }

  // Indices
  const inputIndex = txSkeleton.get('inputs').size - 1;
  const outputIndex = addOutput ? txSkeleton.get('outputs').size - 1 : -1;

  // If added output, and need to update the added output
  if (addOutput && props.updateOutput instanceof Function) {
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      const output = outputs.last();
      if (!output) {
        throw new Error('Cannot update output because the added output could not be found');
      }

      return outputs.set(outputIndex, props.updateOutput!(output));
    });
  }

  return {
    txSkeleton,
    inputIndex,
    outputIndex,
  };
}
