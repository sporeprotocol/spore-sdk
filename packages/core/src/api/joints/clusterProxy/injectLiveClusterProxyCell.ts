import { BIish } from '@ckb-lumos/bi';
import { bytes } from '@ckb-lumos/codec';
import { PackedSince } from '@ckb-lumos/base';
import { BI, Cell, helpers, HexString } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';
import { assetCellMinimalCapacity, setAbsoluteCapacityMargin, setupCell } from '../../../helpers';
import { packRawClusterProxyArgs, unpackToRawClusterProxyArgs } from '../../../codec';

export async function injectLiveClusterProxyCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  cell: Cell;
  minPayment?: BIish;
  addOutput?: boolean;
  updateOutput?: (cell: Cell) => Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  updateWitness?: HexString | ((witness: HexString) => HexString);
  defaultWitness?: HexString;
  since?: PackedSince;
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const clusterProxyCell = props.cell;

  // TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Check target cell's type
  const cellType = clusterProxyCell.cellOutput.type;
  const clusterProxyScript = getSporeScript(config, 'ClusterProxy', cellType);
  if (!cellType || !clusterProxyScript) {
    throw new Error('Cannot inject ClusterProxy because target cell is not ClusterProxy');
  }

  // Add target cell to Transaction.inputs (and outputs if needed)
  const setupCellResult = await setupCell({
    txSkeleton,
    input: clusterProxyCell,
    addOutput: props.addOutput,
    updateOutput(cell) {
      if (props.minPayment !== void 0) {
        const unpackedArgs = unpackToRawClusterProxyArgs(cell.cellOutput.type!.args!);
        const newArgs = packRawClusterProxyArgs({
          ...unpackedArgs,
          minPayment: BI.from(props.minPayment),
        });
        cell.cellOutput.type!.args = bytes.hexify(newArgs);
      }
      if (props.capacityMargin !== void 0) {
        cell = setAbsoluteCapacityMargin(cell, props.capacityMargin);
      }
      if (props.updateOutput instanceof Function) {
        cell = props.updateOutput(cell);
      }
      return cell;
    },
    defaultWitness: props.defaultWitness,
    updateWitness: props.updateWitness,
    since: props.since,
    config: config.lumos,
  });
  txSkeleton = setupCellResult.txSkeleton;

  // If the target cell is added to Transaction.outputs
  if (props.addOutput) {
    // Make sure the cell's output has declared enough capacity
    const output = txSkeleton.get('outputs').get(setupCellResult.outputIndex)!;
    assetCellMinimalCapacity(output);

    // Fix the cell's output index
    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: setupCellResult.outputIndex,
      });
    });
  }

  // Add ClusterProxy required cellDeps
  txSkeleton = addCellDep(txSkeleton, clusterProxyScript.cellDep);

  return {
    txSkeleton,
    inputIndex: setupCellResult.inputIndex,
    outputIndex: setupCellResult.outputIndex,
  };
}
