import { BIish } from '@ckb-lumos/bi';
import { PackedSince } from '@ckb-lumos/base';
import { BI, Cell, helpers, HexString } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { setAbsoluteCapacityMargin, setupCell } from '../../../helpers';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';

export async function injectLiveSporeCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  cell: Cell;
  config?: SporeConfig;
  addOutput?: boolean;
  updateOutput?(cell: Cell): Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  updateWitness?: HexString | ((witness: HexString) => HexString);
  defaultWitness?: HexString;
  since?: PackedSince;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const sporeCell = props.cell;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Check target cell's type script id
  const sporeType = sporeCell.cellOutput.type;
  const sporeScript = getSporeScript(config, 'Spore', sporeType);
  if (!sporeType || !sporeScript) {
    throw new Error('Cannot inject live spore because target cell type is not Spore');
  }

  // Add spore to Transaction.inputs
  const setupCellResult = await setupCell({
    txSkeleton,
    input: sporeCell,
    addOutput: props.addOutput,
    updateOutput(cell) {
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
    config: config.lumos,
    since: props.since,
  });
  txSkeleton = setupCellResult.txSkeleton;

  // If added to outputs, fix the cell's output index
  if (props.addOutput) {
    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: setupCellResult.outputIndex,
      });
    });
  }

  // Add spore type as cellDep
  txSkeleton = addCellDep(txSkeleton, sporeScript.cellDep);

  return {
    txSkeleton,
    inputIndex: setupCellResult.inputIndex,
    outputIndex: setupCellResult.outputIndex,
  };
}
