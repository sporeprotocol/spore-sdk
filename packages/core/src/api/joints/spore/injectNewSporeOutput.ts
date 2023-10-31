import { BIish } from '@ckb-lumos/bi';
import { Address, Script } from '@ckb-lumos/base';
import { bytes, BytesLike } from '@ckb-lumos/codec';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, Cell, helpers, Hash, HexString } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { packRawSporeData } from '../../../codec';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';
import { EncodableContentType, setContentTypeParameters } from '../../../helpers';
import { correctCellMinimalCapacity, setAbsoluteCapacityMargin } from '../../../helpers';
import { injectClusteredSporeProof } from './injectClusteredSporeProof';
import { injectNewSporeIds } from './injectNewSporeIds';

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
   * Cluster ID bind to the spore, optional.
   * It should be a 32-byte hash.
   */
  clusterId?: Hash;
}

export async function injectNewSporeOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  data: SporeDataProps;
  toLock: Script;
  fromInfos: FromInfo[];
  changeAddress?: Address;
  updateOutput?(cell: Cell): Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  cluster?: {
    updateOutput?(cell: Cell): Cell;
    capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
    updateWitness?: HexString | ((witness: HexString) => HexString);
  };
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  hasId: boolean;
  useLockProxyPattern: boolean;
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

  // If the creating spore requires a cluster, collect it to inputs/outputs to prove it's unlock-able
  let injectClusteredSporeProofResult: Awaited<ReturnType<typeof injectClusteredSporeProof>> | undefined;
  if (sporeData.clusterId) {
    injectClusteredSporeProofResult = await injectClusteredSporeProof({
      clusterId: sporeData.clusterId,
      changeAddress: props.changeAddress,
      fromInfos: props.fromInfos,
      cluster: props.cluster,
      toLock: props.toLock,
      txSkeleton,
      config,
    });
    txSkeleton = injectClusteredSporeProofResult.txSkeleton;
  }

  // Create spore cell (with the latest version of SporeType script)
  const sporeScript = getSporeScript(config, 'Spore');
  let sporeCell: Cell = correctCellMinimalCapacity({
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...sporeScript.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte TypeId placeholder
      },
    },
    data: bytes.hexify(
      packRawSporeData({
        contentType: setContentTypeParameters(sporeData.contentType, sporeData.contentTypeParameters ?? {}),
        content: sporeData.content,
        clusterId: sporeData.clusterId,
      }),
    ),
  });

  // Add to Transaction.outputs
  const outputIndex = txSkeleton.get('outputs').size;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    if (props.capacityMargin !== void 0) {
      sporeCell = setAbsoluteCapacityMargin(sporeCell, props.capacityMargin);
    }
    if (props.updateOutput instanceof Function) {
      sporeCell = props.updateOutput(sporeCell);
    }
    return outputs.push(sporeCell);
  });

  // Fix the spore's output index to prevent it from future reduction
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Generate Spore Id if possible
  const firstInput = txSkeleton.get('inputs').first();
  if (firstInput !== void 0) {
    txSkeleton = injectNewSporeIds({
      outputIndices: [outputIndex],
      txSkeleton,
      config,
    });
  }

  // Add Spore cellDeps
  txSkeleton = addCellDep(txSkeleton, sporeScript.cellDep);

  return {
    txSkeleton,
    outputIndex,
    hasId: firstInput !== void 0,
    cluster: injectClusteredSporeProofResult?.cluster,
    useLockProxyPattern: injectClusteredSporeProofResult?.useLockProxyPattern ?? false,
  };
}
