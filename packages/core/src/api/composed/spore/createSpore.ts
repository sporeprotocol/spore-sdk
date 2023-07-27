import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { Address, Script } from '@ckb-lumos/base';
import { SporeConfig } from '../../../config';
import { injectCapacityAndPayFee } from '../../../helpers';
import { injectNewSporeOutput, injectSporeIds, SporeDataProps } from '../../joints/spore';

export async function createSpore(props: {
  data: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
  changeAddress?: Address;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
}> {
  // Env
  const config = props.config;
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Create and inject a new spore cell, also inject cluster if exists
  const injectNewSporeResult = await injectNewSporeOutput({
    data: props.data,
    toLock: props.toLock,
    txSkeleton,
    config,
  });
  txSkeleton = injectNewSporeResult.txSkeleton;

  // Inject needed capacity and pay fee
  const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
    txSkeleton,
    changeAddress: props.changeAddress,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config,
  });
  txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;

  // Generate and inject spore id
  txSkeleton = injectSporeIds({
    outputIndices: [injectNewSporeResult.outputIndex],
    txSkeleton,
    config,
  });

  return {
    txSkeleton,
    outputIndex: injectNewSporeResult.outputIndex,
    cluster: injectNewSporeResult.cluster,
  };
}
