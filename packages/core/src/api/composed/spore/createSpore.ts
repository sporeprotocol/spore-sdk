import { BIish } from '@ckb-lumos/bi';
import { Address, Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, Cell, helpers, HexString, Indexer } from '@ckb-lumos/lumos';
import { getSporeConfig, SporeConfig } from '../../../config';
import { assetTransactionSkeletonSize } from '../../../helpers';
import { injectCapacityAndPayFee, setAbsoluteCapacityMargin } from '../../../helpers';
import { injectNewSporeOutput, injectNewSporeIds, SporeDataProps } from '../..';
import { assetClusteredSporeProof } from '../../joints/spore/injectClusteredSporeProof';

export async function createSpore(props: {
  data: SporeDataProps;
  toLock: Script;
  fromInfos: FromInfo[];
  config?: SporeConfig;
  changeAddress?: Address;
  maxTransactionSize?: number | false;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  updateOutput?(cell: Cell): Cell;
  cluster?: {
    capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
    updateWitness?: HexString | ((witness: HexString) => HexString);
    updateOutput?(cell: Cell): Cell;
  };
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
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

  // Create and inject a new spore cell, also inject cluster if exists
  const injectNewSporeResult = await injectNewSporeOutput({
    data: props.data,
    toLock: props.toLock,
    fromInfos: props.fromInfos,
    changeAddress: props.changeAddress,
    capacityMargin: props.capacityMargin,
    updateOutput(cell) {
      if (capacityMargin.gt(0)) {
        cell = setAbsoluteCapacityMargin(cell, capacityMargin);
      }
      if (props.updateOutput instanceof Function) {
        cell = props.updateOutput(cell);
      }
      return cell;
    },
    cluster: props.cluster,
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
  txSkeleton = injectNewSporeIds({
    outputIndices: [injectNewSporeResult.outputIndex],
    txSkeleton,
    config,
  });

  // If creating a clustered spore, validate the transaction
  if (props.data.clusterId !== void 0) {
    await assetClusteredSporeProof({
      useLockProxyPattern: injectNewSporeResult.useLockProxyPattern,
      clusterId: props.data.clusterId,
      txSkeleton,
      config,
    });
  }

  // Make sure the tx size is in range (if needed)
  if (typeof maxTransactionSize === 'number') {
    assetTransactionSkeletonSize(txSkeleton, void 0, maxTransactionSize);
  }

  return {
    txSkeleton,
    outputIndex: injectNewSporeResult.outputIndex,
    cluster: injectNewSporeResult.cluster,
  };
}
