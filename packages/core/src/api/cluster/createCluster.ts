import { bytes } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/base';
import { common, FromInfo } from '@ckb-lumos/common-scripts';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { BI, Cell, helpers, Indexer, RPC } from '@ckb-lumos/lumos';
import { injectNeededCapacity, isScriptIdEquals } from '../../helpers';
import { correctCellMinimalCapacity, generateTypeId, getMinFeeRate } from '../../helpers';
import { SporeConfig, getSporeConfigScript } from '../../config';
import { ClusterData } from '../../codec';

export interface ClusterDataProps {
  /**
   * Name of the cluster.
   *
   * Spores in a cluster (sharing the same cluster ID)
   * will be represented with the same name and description.
   */
  name: string;
  description: string;
}

export async function createCluster(props: {
  /**
   * Data of the cluster.
   *
   * Spores in a cluster (sharing the same cluster ID)
   * will be represented with the same name and description.
   */
  clusterData: ClusterDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}> {
  // Env
  const config = props.config;
  const rpc = new RPC(config.ckbNodeUrl);
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Generate and inject cluster cell
  const injectNewClusterResult = injectNewCluster({
    txSkeleton,
    ...props,
  });
  txSkeleton = injectNewClusterResult.txSkeleton;

  // Inject capacity
  const injectCapacityResult = await injectNeededCapacity({
    txSkeleton,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config: config.lumos,
  });
  txSkeleton = injectCapacityResult.txSkeleton;

  // Generate and inject Cluster ID
  txSkeleton = injectClusterIds({
    clusterOutputIndices: [injectNewClusterResult.outputIndex],
    txSkeleton,
    config,
  });

  // Pay fee
  const minFeeRate = await getMinFeeRate(rpc);
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, props.fromInfos, minFeeRate, void 0, {
    config: props.config.lumos,
  });

  return {
    txSkeleton,
    outputIndex: injectNewClusterResult.outputIndex,
  };
}

export function injectNewCluster(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  clusterData: ClusterDataProps;
  toLock: Script;
  config: SporeConfig;
}) {
  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Create cluster cell
  const cluster = getSporeConfigScript(props.config, 'Cluster');
  const clusterCell: Cell = {
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...cluster.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte placeholder
      },
    },
    data: bytes.hexify(
      ClusterData.pack({
        name: bytes.bytifyRawString(props.clusterData.name),
        description: bytes.bytifyRawString(props.clusterData.description),
      }),
    ),
  };

  // Generate cluster cell TypeId (if possible)
  const firstInput = txSkeleton.get('inputs').first();
  const outputIndex = txSkeleton.get('outputs').size;
  if (firstInput !== void 0) {
    clusterCell.cellOutput.type!.args = generateTypeId(firstInput, outputIndex);
  }

  // Add to output
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push(correctCellMinimalCapacity(clusterCell));
  });

  // Fix output's index to prevent it to be deducted
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Add cluster required dependencies
  txSkeleton = addCellDep(txSkeleton, cluster.cellDep);

  return {
    txSkeleton,
    outputIndex,
  };
}

export function injectClusterIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  clusterOutputIndices?: number[];
  config: SporeConfig;
}) {
  let txSkeleton = props.txSkeleton;
  const inputs = txSkeleton.get('inputs');
  const firstInput = inputs.get(0);
  if (!firstInput) {
    throw new Error('Cannot generate Cluster Id because Transaction.inputs[0] does not exist');
  }

  const cluster = getSporeConfigScript(props.config, 'Cluster');
  let outputs = txSkeleton.get('outputs');

  const targetIndices: number[] = [];
  if (props.clusterOutputIndices) {
    targetIndices.push(...props.clusterOutputIndices);
  } else {
    outputs.forEach((output, index) => {
      const outputType = output.cellOutput.type;
      if (outputType && isScriptIdEquals(outputType, cluster.script)) {
        targetIndices.push(index);
      }
    });
  }

  for (const index of targetIndices) {
    const output = outputs.get(index);
    if (!output) {
      throw new Error(`Cannot generate Cluster Id because Transaction.outputs[${index}] does not exist`);
    }

    const outputType = output.cellOutput.type;
    if (!outputType || !isScriptIdEquals(outputType, cluster.script)) {
      throw new Error(`Cannot generate Cluster Id because Transaction.outputs[${index}] is not a Cluster cell`);
    }

    output.cellOutput.type!.args = generateTypeId(firstInput, index);
    outputs = outputs.set(index, output);
  }

  return txSkeleton.set('outputs', outputs);
}
