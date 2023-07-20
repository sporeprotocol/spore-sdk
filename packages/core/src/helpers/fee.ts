import { common, FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, RPC } from '@ckb-lumos/lumos';
import { BIish } from '@ckb-lumos/bi';
import { SporeConfig } from '../config';

/**
 * Get minimal fee rate CKB can accepts
 */
export async function getMinFeeRate(rpc: RPC) {
  const info = await rpc.txPoolInfo();
  return BI.from(info.minFeeRate);
}

/**
 * Pay transaction fee by getting the minimal accepted fee rate from the RPC.
 */
export async function payFeeByMinFeeRate(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config: SporeConfig;
}) {
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

export async function payFee(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config: SporeConfig;
  feeRate?: BIish;
}) {
  if (props.feeRate) {
    return await common.payFeeByFeeRate(props.txSkeleton, props.fromInfos, props.feeRate, void 0, {
      config: props.config.lumos,
    });
  } else {
    return await payFeeByMinFeeRate(props);
  }
}
