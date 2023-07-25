import { bytes } from '@ckb-lumos/codec';
import { OutPoint, PackedSince, Script } from '@ckb-lumos/base';
import { Cell, helpers, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import {
  correctCellMinimalCapacity,
  getCellWithStatusByOutPoint,
  getCellByType,
  setupCell,
  generateTypeIdGroup,
} from '../../helpers';
import { getSporeConfigScript, SporeConfig } from '../../config';
import { isScriptIdEquals } from '../../helpers';
import { ClusterData } from '../../codec';

export interface ClusterDataProps {
  name: string;
  description: string;
}

export function injectNewClusterOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  clusterData: ClusterDataProps;
  toLock: Script;
  config: SporeConfig;
}): {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  hasId: boolean;
} {
  // Env
  const config = props.config;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Create cluster cell
  const cluster = getSporeConfigScript(config, 'Cluster');
  const clusterCell: Cell = correctCellMinimalCapacity({
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...cluster.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte TypeId placeholder
      },
    },
    data: bytes.hexify(
      ClusterData.pack({
        name: bytes.bytifyRawString(props.clusterData.name),
        description: bytes.bytifyRawString(props.clusterData.description),
      }),
    ),
  });

  // Add to Transaction.outputs
  const outputIndex = txSkeleton.get('outputs').size;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push(clusterCell);
  });

  // Fix the output's index to prevent it from future reduction
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Generate Cluster Id if possible
  const firstInput = txSkeleton.get('inputs').first();
  if (firstInput) {
    txSkeleton = injectClusterIds({
      clusterOutputIndices: [outputIndex],
      txSkeleton,
      config,
    });
  }

  // Add cluster required dependencies
  txSkeleton = addCellDep(txSkeleton, cluster.cellDep);

  return {
    txSkeleton,
    outputIndex,
    hasId: firstInput !== void 0,
  };
}

export function injectClusterIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  clusterOutputIndices?: number[];
  config: SporeConfig;
}): helpers.TransactionSkeletonType {
  let txSkeleton = props.txSkeleton;

  // Get the first input
  const inputs = txSkeleton.get('inputs');
  const firstInput = inputs.get(0);
  if (!firstInput) {
    throw new Error('Cannot generate Cluster Id because Transaction.inputs[0] does not exist');
  }

  // Get ClusterType script
  const cluster = getSporeConfigScript(props.config, 'Cluster');

  // Calculates type id by group
  let outputs = txSkeleton.get('outputs');
  let typeIdGroup = generateTypeIdGroup(firstInput, outputs.toArray(), (cell) => {
    return !!cell.cellOutput.type && isScriptIdEquals(cell.cellOutput.type, cluster.script);
  });

  // If `clusterOutputIndices` is provided, filter the result
  if (props.clusterOutputIndices) {
    typeIdGroup = typeIdGroup.filter(([typeIdIndex]) => {
      const index = props.clusterOutputIndices!.findIndex((index) => index === typeIdIndex);
      return index >= 0;
    });
    if (typeIdGroup.length !== props.clusterOutputIndices.length) {
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
  clusterCell: Cell;
  config: SporeConfig;
  addOutput?: boolean;
  updateOutput?(cell: Cell): Cell;
  since?: PackedSince;
  defaultWitness?: HexString;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const clusterCell = props.clusterCell;
  const config = props.config;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Check target cell type
  const cluster = getSporeConfigScript(config, 'Cluster');
  if (!clusterCell.cellOutput.type || !isScriptIdEquals(clusterCell.cellOutput.type, cluster.script)) {
    throw new Error('Cannot inject live cluster because target cell type is invalid');
  }

  // Add cluster cell to Transaction.inputs
  const setupCellResult = await setupCell({
    txSkeleton,
    input: props.clusterCell,
    addOutput: props.addOutput,
    updateOutput: props.updateOutput,
    since: props.since,
    config: config.lumos,
    defaultWitness: props.defaultWitness,
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

  // Add cluster required cellDeps
  txSkeleton = addCellDep(txSkeleton, cluster.cellDep);

  return {
    txSkeleton,
    inputIndex: setupCellResult.inputIndex,
    outputIndex: setupCellResult.outputIndex,
  };
}

export async function getClusterCellByType(clusterType: Script, config: SporeConfig): Promise<Cell> {
  // Env
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({
    type: clusterType,
    indexer,
  });
  if (cell === void 0) {
    throw new Error('Cannot find Cluster by Type because target cell does not exist');
  }

  // Check target cell's type script
  const cluster = getSporeConfigScript(config, 'Cluster');
  if (!cell.cellOutput.type || !isScriptIdEquals(cell.cellOutput.type, cluster.script)) {
    throw new Error('Cannot find cluster by OutPoint because target cell type is invalid');
  }

  return cell;
}

export async function getClusterCellByOutPoint(clusterOutPoint: OutPoint, config: SporeConfig): Promise<Cell> {
  // Env
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint: clusterOutPoint,
    rpc,
  });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find Cluster by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const cluster = getSporeConfigScript(config, 'Cluster');
  if (!cellWithStatus.cell.cellOutput.type || !isScriptIdEquals(cellWithStatus.cell.cellOutput.type, cluster.script)) {
    throw new Error('Cannot find cluster by OutPoint because target cell is not Cluster');
  }

  return cellWithStatus.cell;
}
