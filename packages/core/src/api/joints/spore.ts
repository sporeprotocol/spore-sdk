import { bytes, BytesLike } from '@ckb-lumos/codec';
import { OutPoint, PackedSince, Script } from '@ckb-lumos/base';
import { Cell, helpers, HexString, Indexer, RPC } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { getSporeConfigScript, SporeConfig } from '../../config';
import { EncodableContentType, setContentTypeParameters, generateTypeId, setupCell } from '../../helpers';
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
  cluster?: HexString;
}

export async function injectNewSporeOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  sporeData: SporeDataProps;
  toLock: Script;
  config: SporeConfig;
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
  const config = props.config;
  const sporeData = props.sporeData;

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // If the creating spore requires a cluster, collect it to inputs/outputs
  let injectClusterCellResult: Awaited<ReturnType<typeof injectLiveClusterCell>> | undefined;
  if (sporeData.cluster) {
    const cluster = getSporeConfigScript(config, 'Cluster');
    const clusterCell = await getClusterCellByType(
      {
        ...cluster.script,
        args: sporeData.cluster,
      },
      config,
    );

    // Add dep cluster to Transaction.inputs and Transaction.outputs,
    // but don't change its lock script
    injectClusterCellResult = await injectLiveClusterCell({
      clusterCell,
      txSkeleton,
      config,
      addOutput: true,
    });
    txSkeleton = injectClusterCellResult.txSkeleton;
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
        cluster: sporeData.cluster,
      }),
    ),
  });

  // Generate TypeId (if possible)
  const firstInput = txSkeleton.get('inputs').first();
  const outputIndex = txSkeleton.get('outputs').size;
  if (firstInput !== void 0) {
    sporeCell.cellOutput.type!.args = generateTypeId(firstInput, outputIndex);
  }

  // Add to Transaction.outputs
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
    if (sporeData.cluster && !!injectClusterCellResult) {
      fixedEntries = fixedEntries.push({
        field: 'outputs',
        index: injectClusterCellResult.outputIndex,
      });
    }

    return fixedEntries;
  });

  // Add cellDeps
  txSkeleton = addCellDep(txSkeleton, spore.cellDep);

  return {
    txSkeleton,
    outputIndex,
    hasId: !!firstInput,
    cluster:
      sporeData.cluster && !!injectClusterCellResult
        ? {
            inputIndex: injectClusterCellResult!.inputIndex,
            outputIndex: injectClusterCellResult!.outputIndex,
          }
        : void 0,
  };
}

export function injectSporeIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  sporeOutputIndices: number[];
  config: SporeConfig;
}): helpers.TransactionSkeletonType {
  let txSkeleton = props.txSkeleton;
  const inputs = txSkeleton.get('inputs');
  const firstInput = inputs.get(0);
  if (!firstInput) {
    throw new Error('Cannot generate Spore Id because Transaction.inputs[0] does not exist');
  }

  const spore = getSporeConfigScript(props.config, 'Spore');
  let outputs = txSkeleton.get('outputs');

  const targetIndices: number[] = [];
  if (props.sporeOutputIndices) {
    targetIndices.push(...props.sporeOutputIndices);
  } else {
    outputs.forEach((output, index) => {
      const outputType = output.cellOutput.type;
      if (outputType && isScriptIdEquals(outputType, spore.script)) {
        targetIndices.push(index);
      }
    });
  }

  for (const index of targetIndices) {
    const output = outputs.get(index);
    if (!output) {
      throw new Error(`Cannot generate Spore Id because Transaction.outputs[${index}] does not exist`);
    }

    const outputType = output.cellOutput.type;
    if (!outputType || !isScriptIdEquals(outputType, spore.script)) {
      throw new Error(`Cannot generate Spore Id because Transaction.outputs[${index}] is not a Spore cell`);
    }

    output.cellOutput.type!.args = generateTypeId(firstInput, index);
    outputs = outputs.set(index, output);
  }

  return txSkeleton.set('outputs', outputs);
}

export async function injectLiveSporeCell(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  sporeCell: Cell;
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
  const config = props.config;
  const sporeCell = props.sporeCell;

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

export async function getSporeCellByType(clusterType: Script, config: SporeConfig): Promise<Cell> {
  // Env
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get cell by type
  const cell = await getCellByType({
    type: clusterType,
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

export async function getSporeCellByOutPoint(clusterOutPoint: OutPoint, config: SporeConfig): Promise<Cell> {
  // Env
  const rpc = new RPC(config.ckbNodeUrl);

  // Get cell from rpc
  const cellWithStatus = await getCellWithStatusByOutPoint({
    outPoint: clusterOutPoint,
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
