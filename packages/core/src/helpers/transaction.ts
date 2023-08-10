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
