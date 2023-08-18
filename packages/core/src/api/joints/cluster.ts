import { BIish } from '@ckb-lumos/bi';
import { bytes } from '@ckb-lumos/codec';
import { OutPoint, PackedSince, Script } from '@ckb-lumos/base';
import { BI, Cell, helpers, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { setAbsoluteCapacityMargin } from '../../helpers';
import { generateTypeIdsByOutputs, correctCellMinimalCapacity, assetCellMinimalCapacity } from '../../helpers';
import { getCellWithStatusByOutPoint, getCellByType, setupCell } from '../../helpers';
import { isSporeScriptSupported, isSporeScriptSupportedByName } from '../../config';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../config';
import { packRawClusterData } from '../../codec';

export interface ClusterDataProps {
  name: string;
  description: string;
}

export function injectNewClusterOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  data: ClusterDataProps;
  toLock: Script;
  config?: SporeConfig;
  updateOutput?(cell: Cell): Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
}): {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  hasId: boolean;
} {
  // Env
  const config = props.config ?? getSporeConfig();

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Create cluster cell (with the latest version of ClusterType script)
  const clusterScript = getSporeScript(config, 'Cluster');
  let clusterCell: Cell = correctCellMinimalCapacity({
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...clusterScript.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte TypeId placeholder
      },
    },
    data: bytes.hexify(packRawClusterData(props.data)),
  });

  // Add to Transaction.outputs
  const outputIndex = txSkeleton.get('outputs').size;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    if (props.capacityMargin !== void 0) {
      clusterCell = setAbsoluteCapacityMargin(clusterCell, props.capacityMargin);
    }
    if (props.updateOutput instanceof Function) {
      clusterCell = props.updateOutput(clusterCell);
    }
    return outputs.push(clusterCell);
  });

  // Fix the output's index to prevent it from future reduction
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Generate ID for the new cluster if possible
  const firstInput = txSkeleton.get('inputs').first();
  if (firstInput) {
    txSkeleton = injectClusterIds({
      outputIndices: [outputIndex],
      txSkeleton,
      config,
    });
  }

  // Add cluster required dependencies
  txSkeleton = addCellDep(txSkeleton, clusterScript.cellDep);

  return {
    txSkeleton,
    outputIndex,
    hasId: firstInput !== void 0,
  };
}

export function injectClusterIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndices?: number[];
  config?: SporeConfig;
}): helpers.TransactionSkeletonType {
  // Env
  const config = props.config ?? getSporeConfig();

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Get the first input
  const inputs = txSkeleton.get('inputs');
  const firstInput = inputs.get(0);
  if (!firstInput) {
    throw new Error('Cannot generate Cluster Id because Transaction.inputs[0] does not exist');
  }

  // Get ClusterType script
  const clusterScript = getSporeScript(config, 'Cluster');

  // Calculates TypeIds by the outputs' indices
  let outputs = txSkeleton.get('outputs');
  let typeIdGroup = generateTypeIdsByOutputs(firstInput, outputs.toArray(), (cell) => {
    return !!cell.cellOutput.type && isSporeScriptSupported(clusterScript, cell.cellOutput.type);
  });

  // If `clusterOutputIndices` is provided, filter the result
  if (props.outputIndices) {
    typeIdGroup = typeIdGroup.filter(([outputIndex]) => {
      const index = props.outputIndices!.findIndex((index) => index === outputIndex);
      return index >= 0;
    });
    if (typeIdGroup.length !== props.outputIndices.length) {
      throw new Error('Cannot generate Cluster Id because clusterOutputIndices cannot be fully handled');
    }
  }

  // Update results
  for (const [index, typeId] of typeIdGroup) {
    const output = outputs.get(index);
    if (!output) {
      throw new Error(`Cannot generate Cluster Id because Transaction.outputs[${index}] does not exist`);
    }

    output.cellOutput.type!.args = typeId;
    outputs = outputs.set(index, output);
  }

  return txSkeleton.set('outputs', outputs);
}

export async function injectLiveClusterCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  cell: Cell;
  addOutput?: boolean;
  config?: SporeConfig;
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
  const clusterCell = props.cell;
  const config = props.config ?? getSporeConfig();

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Check target cell type
  const clusterCellType = clusterCell.cellOutput.type;
  const clusterScript = getSporeScript(config, 'Cluster', clusterCellType);
  if (!clusterCellType || !clusterScript) {
    throw new Error('Cannot inject cluster because target cell is not Cluster');
  }

  // Add cluster cell to Transaction.inputs
  const setupCellResult = await setupCell({
    txSkeleton,
    input: props.cell,
    config: config.lumos,
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
    since: props.since,
  });
  txSkeleton = setupCellResult.txSkeleton;

  // If the cluster is added to Transaction.outputs
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

  // Add cluster required cellDeps
  txSkeleton = addCellDep(txSkeleton, clusterScript.cellDep);

  return {
    txSkeleton,
    inputIndex: setupCellResult.inputIndex,
    outputIndex: setupCellResult.outputIndex,
  };
}

export async function getClusterCellByType(type: Script, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({ type, indexer });
  if (cell === void 0) {
    throw new Error('Cannot find cluster by Type because target cell does not exist');
  }

  // Check target cell's type script
  const cellType = cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Cluster', cellType)) {
    throw new Error('Cannot find cluster by Type because target cell is not Cluster');
  }

  return cell;
}

export async function getClusterCellByOutPoint(outPoint: OutPoint, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint,
    rpc,
  });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find cluster by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const cellType = cellWithStatus.cell.cellOutput.type;
  if (!cellType || !isSporeScriptSupportedByName(config, 'Cluster', cellType)) {
    throw new Error('Cannot find cluster by OutPoint because target cell is not Cluster');
  }

  return cellWithStatus.cell;
}

export async function getClusterCellById(id: HexString, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();

  // Get cluster versioned script
  const clusterScript = getSporeScript(config, 'Cluster');
  const versionScripts = (clusterScript.versions ?? []).map((r) => r.script);
  const scripts = [clusterScript.script, ...versionScripts];

  // Search target cluster from the latest version to the oldest
  for (const script of scripts) {
    try {
      return await getClusterCellByType(
        {
          ...script,
          args: id,
        },
        config,
      );
    } catch (e) {
      // Not found in the script, don't have to do anything
      console.error('getClusterCellById error:', e);
    }
  }

  throw new Error(`Cannot find cluster by ClusterId because target cell does not exist or it's not Cluster`);
}
