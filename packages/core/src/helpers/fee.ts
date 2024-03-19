import { common, FromInfo } from '@ckb-lumos/common-scripts/lib';
import { Address, Transaction } from '@ckb-lumos/base/lib';
import { BI, helpers, RPC } from '@ckb-lumos/lumos';
import { BIish } from '@ckb-lumos/bi/lib';
import { getSporeConfig, SporeConfig } from '../config';
import { createCapacitySnapshot, injectNeededCapacity } from './capacity';
import { getTransactionSize } from './transaction';

/**
 * Get minimal acceptable fee rate from RPC.
 */
export async function getMinFeeRate(rpc: RPC | string): Promise<BI> {
  rpc = typeof rpc === 'string' ? new RPC(rpc) : rpc;
  const info = await rpc.txPoolInfo();
  return BI.from(info.minFeeRate);
}

/**
 * Calculate transaction fee by transaction size and feeRate.
 */
export function calculateFee(size: number, feeRate: BIish): BI {
  const ratio = BI.from(1000);
  const base = BI.from(size).mul(feeRate);
  const fee = base.div(ratio);
  if (fee.mul(ratio).lt(base)) {
    return fee.add(1);
  }
  return BI.from(fee);
}

/**
 * Calculate transaction fee by Transaction and a specific feeRate.
 */
export function calculateFeeByTransaction(tx: Transaction, feeRate: BIish): BI {
  const size = getTransactionSize(tx);
  return calculateFee(size, feeRate);
}

/**
 * Calculate transaction fee by TransactionSkeleton and a specific feeRate.
 */
export function calculateFeeByTransactionSkeleton(txSkeleton: helpers.TransactionSkeletonType, feeRate: BIish) {
  const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  return calculateFeeByTransaction(tx, feeRate);
}

/**
 * Pay fee by minimal acceptable fee rate from the RPC,
 * of pay fee by a manual fee rate.
 */
export async function payFee(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config?: SporeConfig;
  feeRate?: BIish;
  enableDeductCapacity?: boolean;
  useLocktimeCellsFirst?: boolean;
}): Promise<helpers.TransactionSkeletonType> {
  // Env
  const config = props.config ?? getSporeConfig();
  const feeRate = props.feeRate ?? (await getMinFeeRate(config.ckbNodeUrl));

  // Use lumos common script to pay fee
  return await common.payFeeByFeeRate(props.txSkeleton, props.fromInfos, feeRate, void 0, {
    useLocktimeCellsFirst: props.useLocktimeCellsFirst,
    enableDeductCapacity: props.enableDeductCapacity,
    config: config.lumos,
  });
}

/**
 * Specify an output to pay transaction fee.
 */
export async function payFeeByOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  feeRate?: BIish;
  config?: SporeConfig;
}): Promise<helpers.TransactionSkeletonType> {
  // Env
  const config = props.config ?? getSporeConfig();
  const feeRate = props.feeRate ?? (await getMinFeeRate(config.ckbNodeUrl));

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Get target output cell
  let outputs = txSkeleton.get('outputs');
  const output = outputs.get(props.outputIndex);
  if (!output) {
    throw new Error(`Cannot pay fee by Transaction.outputs[${props.outputIndex}] because it does not exist`);
  }

  // Check can pay fee with capacity margin
  const minimalCellCapacity = helpers.minimalCellCapacityCompatible(output);
  const outputCapacity = BI.from(output.cellOutput.capacity);
  const capacityMargin = outputCapacity.sub(minimalCellCapacity);
  const fee = calculateFeeByTransactionSkeleton(txSkeleton, feeRate);
  if (capacityMargin.lt(fee)) {
    throw new Error(`Cannot pay fee by Transaction.outputs[${props.outputIndex}] due to insufficient capacity`);
  }

  // Pay fee and update capacity
  output.cellOutput.capacity = outputCapacity.sub(fee).toHexString();
  outputs = outputs.set(props.outputIndex, output);
  return txSkeleton.set('outputs', outputs);
}

/**
 * Inject needed amount of capacity,
 * and then pay fee by minimal acceptable fee rate or by a manual fee rate.
 */
export async function injectCapacityAndPayFee(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  fromInfos: FromInfo[];
  config?: SporeConfig;
  feeRate?: BIish;
  fee?: BIish;
  changeAddress?: Address;
  enableDeductCapacity?: boolean;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  before: ReturnType<typeof createCapacitySnapshot>;
  after: ReturnType<typeof createCapacitySnapshot>;
}> {
  // Env
  const config = props.config ?? getSporeConfig();

  // Collect capacity
  const injectNeededCapacityResult = await injectNeededCapacity({
    ...props,
    config: config.lumos,
  });

  // Pay fee
  const txSkeleton = await payFee({
    ...props,
    txSkeleton: injectNeededCapacityResult.txSkeleton,
  });

  return {
    txSkeleton,
    before: injectNeededCapacityResult.before,
    after: createCapacitySnapshot(txSkeleton.get('inputs').toArray(), txSkeleton.get('outputs').toArray()),
  };
}
