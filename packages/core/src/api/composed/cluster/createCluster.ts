import { Address, Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { injectCapacityAndPayFee } from '../../../helpers';
import { getSporeConfig, SporeConfig } from '../../../config';
import { ClusterDataProps, injectClusterIds, injectNewClusterOutput } from '../../joints/cluster';

export async function createCluster(props: {
  data: ClusterDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
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

  // Inject needed capacity and pay fee
  const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
    txSkeleton,
    changeAddress: props.changeAddress,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config,
  });
  txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;

  // Generate and inject cluster ID
  txSkeleton = injectClusterIds({
    outputIndices: [injectNewClusterResult.outputIndex],
    txSkeleton,
    config,
  });

  return {
    txSkeleton,
    outputIndex: injectNewClusterResult.outputIndex,
  };
}
