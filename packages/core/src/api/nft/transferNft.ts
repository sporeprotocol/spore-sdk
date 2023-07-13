import { FromInfo } from '@ckb-lumos/common-scripts';
import { OutPoint, Script } from '@ckb-lumos/base';
import { helpers } from '@ckb-lumos/lumos';
import { CNftConfig } from '../../config';

declare function transferNft(props: {
  nftOutPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: CNftConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
