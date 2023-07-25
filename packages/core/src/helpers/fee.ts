import { BI, RPC } from '@ckb-lumos/lumos';

/**
 * Get minimal fee rate CKB can accepts
 */
export async function getMinFeeRate(rpc: RPC) {
  const info = await rpc.txPoolInfo();
  return BI.from(info.minFeeRate);
}
