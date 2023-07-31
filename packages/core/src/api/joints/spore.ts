import { bytes, BytesLike } from '@ckb-lumos/codec';
import { OutPoint, PackedSince, Script } from '@ckb-lumos/base';
import { Cell, helpers, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { getSporeConfig, getSporeConfigScript, SporeConfig } from '../../config';
import { EncodableContentType, setContentTypeParameters, setupCell, generateTypeIdGroup } from '../../helpers';
import {
  correctCellMinimalCapacity,
  getCellWithStatusByOutPoint,
  getCellByType,
  isScriptIdEquals,
} from '../../helpers';
import { getClusterCellByType, injectLiveClusterCell } from './cluster';
import { SporeData } from '../../codec';

export interface SporeDataProps {
  /**
   * Specify the MIME type of the content.
   * An example: type/subtype;param1=value1;param2=value2
   */
  contentType: string;
  /**
   * Additional parameters of the contentType.
   *
   * For example, if the contentType is "image/jpeg",
   * and you want to use the "immortal" core extension,
   * which requires adding an "immortal" parameter at the end of the contentType,
   * you can then pass the following object to the contentTypeParameters:
   * {
   *   immortal: true,
   * }
   * Later on in the "createSpore" function,
   * the contentTypeParameters will be merged into the contentType,
   * so finally the contentType will be: "image/jpeg;immortal=true".
   */
  contentTypeParameters?: EncodableContentType['parameters'];
  /**
   * The content of the NFT as bytes.
   */
  content: BytesLike;
  /**
   * Cluster Id of the spore, optional.
   * It should be a 32-byte hash.
   */
  clusterId?: HexString;
}

export async function injectNewSporeOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  data: SporeDataProps;
  toLock: Script;
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  // spore info
  outputIndex: number;
  hasId: boolean;
  // cluster info
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const sporeData = props.data;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // If the creating spore requires a cluster, collect it to inputs/outputs
  let injectClusterCellResult: Awaited<ReturnType<typeof injectLiveClusterCell>> | undefined;
  let injectClusterInfo: { inputIndex: number; outputIndex: number } | undefined;
  let clusterCell: Cell | undefined;
  if (sporeData.clusterId) {
    const cluster = getSporeConfigScript(config, 'Cluster');
    clusterCell = await getClusterCellByType(
      {
        ...cluster.script,
        args: sporeData.clusterId,
      },
      config,
    );

    // Add dep cluster to Transaction.inputs and Transaction.outputs,
    // but don't change its lock script
    injectClusterCellResult = await injectLiveClusterCell({
      cell: clusterCell,
      txSkeleton,
      config,
      addOutput: true,
    });
    txSkeleton = injectClusterCellResult.txSkeleton;

    // Record cluster's index info
    injectClusterInfo = {
      inputIndex: injectClusterCellResult.inputIndex,
      outputIndex: injectClusterCellResult.outputIndex,
    };
  }

  // Create spore cell
  const spore = getSporeConfigScript(config, 'Spore');
  const sporeCell: Cell = correctCellMinimalCapacity({
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...spore.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte TypeId placeholder
      },
    },
    data: bytes.hexify(
      SporeData.pack({
        contentType: bytes.bytifyRawString(
          setContentTypeParameters(sporeData.contentType, sporeData.contentTypeParameters ?? {}),
        ),
        content: sporeData.content,
        clusterId: sporeData.clusterId,
      }),
    ),
  });

  // Add to Transaction.outputs
  const outputIndex = txSkeleton.get('outputs').size;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push(sporeCell);
  });

  // Fix the spore's output index (and cluster's output index) to prevent it from future reduction
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    // Fix the spore's output index to prevent it from future reduction
    fixedEntries = fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });

    // Fix the required cluster's output index to prevent it from future reduction
    if (sporeData.clusterId && !!injectClusterCellResult) {
      fixedEntries = fixedEntries.push({
        field: 'outputs',
        index: injectClusterCellResult.outputIndex,
      });
    }

    return fixedEntries;
  });

  // Generate Spore Id if possible
  const firstInput = txSkeleton.get('inputs').first();
  if (firstInput !== void 0) {
    txSkeleton = injectSporeIds({
      outputIndices: [outputIndex],
      txSkeleton,
      config,
    });
  }

  // Add Spore cellDeps
  txSkeleton = addCellDep(txSkeleton, spore.cellDep);
  // Add Cluster cellDeps if exists
  if (clusterCell?.outPoint) {
    txSkeleton = addCellDep(txSkeleton, {
      outPoint: clusterCell.outPoint,
      depType: 'code',
    });
  }

  return {
    txSkeleton,
    outputIndex,
    hasId: firstInput !== void 0,
    cluster: injectClusterInfo ?? void 0,
  };
}

export function injectSporeIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndices: number[];
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
    throw new Error('Cannot generate Spore Id because Transaction.inputs[0] does not exist');
  }

  // Get SporeType script
  const spore = getSporeConfigScript(config, 'Spore');

  // Calculates type id by group
  let outputs = txSkeleton.get('outputs');
  let typeIdGroup = generateTypeIdGroup(firstInput, outputs.toArray(), (cell) => {
    return !!cell.cellOutput.type && isScriptIdEquals(cell.cellOutput.type, spore.script);
  });

  // If `sporeOutputIndices` is provided, filter the result
  if (props.outputIndices) {
    typeIdGroup = typeIdGroup.filter(([typeIdIndex]) => {
      const index = props.outputIndices!.findIndex((index) => index === typeIdIndex);
      return index >= 0;
    });
    if (typeIdGroup.length !== props.outputIndices.length) {
      throw new Error('Cannot generate Spore Id because sporeOutputIndices cannot be fully handled');
    }
  }

  for (const [index, typeId] of typeIdGroup) {
    const output = outputs.get(index);
    if (!output) {
      throw new Error(`Cannot generate Spore Id because Transaction.outputs[${index}] does not exist`);
    }

    output.cellOutput.type!.args = typeId;
    outputs = outputs.set(index, output);
  }

  return txSkeleton.set('outputs', outputs);
}

export async function injectLiveSporeCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  cell: Cell;
  config?: SporeConfig;
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
  const config = props.config ?? getSporeConfig();
  const sporeCell = props.cell;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Check target cell type
  const spore = getSporeConfigScript(config, 'Spore');
  if (!sporeCell.cellOutput.type || !isScriptIdEquals(sporeCell.cellOutput.type, spore.script)) {
    throw new Error('Cannot inject live spore because target cell type is invalid');
  }

  // Add spore to Transaction.inputs
  const setupCellResult = await setupCell({
    txSkeleton,
    input: sporeCell,
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

  // Add spore required cellDeps
  txSkeleton = addCellDep(txSkeleton, spore.cellDep);

  return {
    txSkeleton,
    inputIndex: setupCellResult.inputIndex,
    outputIndex: setupCellResult.outputIndex,
  };
}

export async function getSporeCellByType(type: Script, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({
    type,
    indexer,
  });
  if (cell === void 0) {
    throw new Error('Cannot find Spore by Type because target cell does not exist');
  }

  // Check target cell's type script
  const spore = getSporeConfigScript(config, 'Spore');
  if (!cell.cellOutput.type || !isScriptIdEquals(cell.cellOutput.type, spore.script)) {
    throw new Error('Cannot find spore by OutPoint because target cell type is invalid');
  }

  return cell;
}

export async function getSporeCellByOutPoint(outPoint: OutPoint, config?: SporeConfig): Promise<Cell> {
  // Env
  config = config ?? getSporeConfig();
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint,
    rpc,
  });
  if (cellWithStatus.status !== 'live') {
    throw new Error('Cannot find spore by OutPoint because target cell is not lived');
  }

  // Check target cell's type script
  const spore = getSporeConfigScript(config, 'Spore');
  if (!cellWithStatus.cell.cellOutput.type || !isScriptIdEquals(cellWithStatus.cell.cellOutput.type, spore.script)) {
    throw new Error('Cannot find spore by OutPoint because target cell type is invalid');
  }

  return cellWithStatus.cell;
}
