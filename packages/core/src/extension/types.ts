import { TransactionSkeletonType } from '@ckb-lumos/helpers';
import { Hash } from '@ckb-lumos/base';

export interface SporeExtension {
  name: string;
  dataHash: Hash;
  hooks: SporeApiHooks;
}

export interface SporeApiHooks {
  onCreateSpore?(context: { txSkeleton: TransactionSkeletonType; outputIndex: number }): TransactionSkeletonType;
  onMeltSpore?(context: { txSkeleton: TransactionSkeletonType; inputIndex: number }): TransactionSkeletonType;
}
