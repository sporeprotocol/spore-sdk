import { common, FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, RPC } from '@ckb-lumos/lumos';
import { Address } from '@ckb-lumos/base';
import { BIish } from '@ckb-lumos/bi';
import { SporeConfig } from '../config';
import { createCapacitySnapshot, injectNeededCapacity } from './capacity';

/**
 * Get minimal acceptable fee rate from RPC.
 */
export async function getMinFeeRate(rpc: RPC) {
  const info = await rpc.txPoolInfo();
  return BI.from(info.minFeeRate);
}

/**
 * Pay transaction fee by getting the minimal acceptable fee rate from the RPC.
 */
export async function payFeeByMinFeeRate(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config: SporeConfig;
}): Promise<helpers.TransactionSkeletonType> {
  // Env
  const config = props.config;
  const rpc = new RPC(config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Get minimal accepted fee rate from the rpc
  const minFeeRate = await getMinFeeRate(rpc);

  // Pay fee
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, props.fromInfos, minFeeRate, void 0, {
    config: props.config.lumos,
  });

  return txSkeleton;
}

/**
 * Pay fee by minimal acceptable fee rate from the RPC,
 * of pay fee by a manual fee rate.
 */
export async function payFee(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config: SporeConfig;
  feeRate?: BIish;
}): Promise<helpers.TransactionSkeletonType> {
  if (props.feeRate) {
    return await common.payFeeByFeeRate(props.txSkeleton, props.fromInfos, props.feeRate, void 0, {
      config: props.config.lumos,
    });
  } else {
    return await payFeeByMinFeeRate(props);
  }
}

/**
 * Inject needed amount of capacity,
 * and then pay fee by minimal acceptable fee rate or by a manual fee rate.
 */
export async function injectCapacityAndPayFee(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config: SporeConfig;
  feeRate?: BIish;
  fee?: BIish;
  changeAddress?: Address;
  enableDeductCapacity?: boolean;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  before: ReturnType<typeof createCapacitySnapshot>;
  after: ReturnType<typeof createCapacitySnapshot>;
}> {
  const injectNeededCapacityResult = await injectNeededCapacity({
    ...props,
    config: props.config.lumos,
  });

  const txSkeleton = await payFee({
    ...props,
    txSkeleton: injectNeededCapacityResult.txSkeleton,
  });

  const inputs = txSkeleton.get('inputs').toArray();
  const outputs = txSkeleton.get('outputs').toArray();

  return {
    txSkeleton,
    before: injectNeededCapacityResult.before,
    after: createCapacitySnapshot(inputs, outputs),
  };
}
