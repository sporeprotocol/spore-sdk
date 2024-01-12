import { Transaction, blockchain } from '@ckb-lumos/base';
import { helpers } from '@ckb-lumos/lumos';

/**
 * Calculates the size of a transaction.
 *
 * Note: Why adding 4 bytes to the size of transaction:
 * [Calculate transaction fee](https://github.com/nervosnetwork/ckb/wiki/Transaction-%C2%BB-Transaction-Fee#calculate-transaction-fee)
 */
export function getTransactionSize(tx: Transaction): number {
  const serializedTx = blockchain.Transaction.pack(tx);
  return 4 + serializedTx.buffer.byteLength;
}

/**
 * Calculates the size of a TransactionSkeleton.
 */
export function getTransactionSkeletonSize(txSkeleton: helpers.TransactionSkeletonType): number {
  const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  return getTransactionSize(tx);
}

/**
 * Check if the Transaction's size (in bytes) is as expected.
 * Expected: min < size <= max.
 */
export function isTransactionSizeInRange(tx: Transaction, min?: number, max?: number): boolean {
  const size = getTransactionSize(tx);
  return size <= (min ?? 0) || size > (max ?? Infinity);
}

/**
 * Check if the TransactionSkeleton's size (in bytes) is as expected.
 * Expected: min < size <= max.
 */
export function isTransactionSkeletonSizeInRange(
  txSkeleton: helpers.TransactionSkeletonType,
  min?: number,
  max?: number,
): boolean {
  const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  return isTransactionSizeInRange(tx, min, max);
}

/**
 * Throw an error if the Transaction's size (in bytes) is not as expected.
 * Expected: min < size <= max.
 */
export function assetTransactionSize(tx: Transaction, min?: number, max?: number): void {
  min = min ?? 0;
  max = max ?? Infinity;

  const size = getTransactionSize(tx);
  if (size <= min) {
    throw new Error(`Expected the transaction size to be > ${min}, actual size: ${size}`);
  }
  if (size > max) {
    throw new Error(`Expected the transaction size to be <= ${max}, actual size: ${size}`);
  }
}

/**
 * Throw an error if the TransactionSkeleton's size (in bytes) is not as expected.
 * Expected: min < size <= max.
 */
export function assetTransactionSkeletonSize(
  txSkeleton: helpers.TransactionSkeletonType,
  min?: number,
  max?: number,
): void {
  const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  assetTransactionSize(tx, min, max);
}
