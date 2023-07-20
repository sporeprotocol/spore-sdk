import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { Script } from '@ckb-lumos/base';
import { SporeConfig } from '../../../config';
import { injectNeededCapacity, payFee } from '../../../helpers';
import { injectNewSporeOutput, injectSporeIds, SporeDataProps } from '../../joints/spore';

export async function createSpore(props: {
  sporeData: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
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
    sporeData: props.sporeData,
    toLock: props.toLock,
    txSkeleton,
    config,
  });
  txSkeleton = injectNewSporeResult.txSkeleton;

  // Inject capacity
  const injectCapacityResult = await injectNeededCapacity({
    txSkeleton,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config: config.lumos,
  });
  txSkeleton = injectCapacityResult.txSkeleton;

  // Generate and inject spore id
  txSkeleton = injectSporeIds({
    sporeOutputIndices: [injectNewSporeResult.outputIndex],
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
    outputIndex: injectNewSporeResult.outputIndex,
    cluster: injectNewSporeResult.cluster,
  };
}
