import { Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { SporeConfig } from '../../../config';
import { injectNeededCapacity, payFee } from '../../../helpers';
import { ClusterDataProps, injectClusterIds, injectNewClusterOutput } from '../../joints/cluster';

export async function createCluster(props: {
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
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Generate and inject cluster cell
  const injectNewClusterResult = injectNewClusterOutput({
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

  // Generate and inject cluster ID
  txSkeleton = injectClusterIds({
    clusterOutputIndices: [injectNewClusterResult.outputIndex],
    txSkeleton,
    config,
  });

  // Pay fee
  txSkeleton = await payFee({
    fromInfos: props.fromInfos,
    txSkeleton,
    config,
  });

  return {
    txSkeleton,
    outputIndex: injectNewClusterResult.outputIndex,
  };
}
