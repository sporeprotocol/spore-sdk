import { BIish } from '@ckb-lumos/bi';
import { Address, Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, Cell, helpers, Indexer } from '@ckb-lumos/lumos';
import { getSporeConfig, SporeConfig } from '../../../config';
import { injectCapacityAndPayFee, assetTransactionSkeletonSize } from '../../../helpers';
import { ClusterDataProps, injectNewClusterIds, injectNewClusterOutput } from '../..';

export async function createCluster(props: {
  data: ClusterDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
  maxTransactionSize?: number | false;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  updateOutput?(cell: Cell): Cell;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);
  const capacityMargin = BI.from(props.capacityMargin ?? 1_0000_0000);
  const maxTransactionSize = props.maxTransactionSize ?? config.maxTransactionSize ?? false;

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Generate and inject cluster cell
  const injectNewClusterResult = injectNewClusterOutput({
    ...props,
    txSkeleton,
    capacityMargin,
    updateOutput: props.updateOutput,
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
  txSkeleton = injectNewClusterIds({
    outputIndices: [injectNewClusterResult.outputIndex],
    txSkeleton,
    config,
  });

  // Make sure the tx size is in range (if needed)
  if (typeof maxTransactionSize === 'number') {
    assetTransactionSkeletonSize(txSkeleton, void 0, maxTransactionSize);
  }

  return {
    txSkeleton,
    outputIndex: injectNewClusterResult.outputIndex,
  };
}
