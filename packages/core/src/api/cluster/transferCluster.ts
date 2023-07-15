import { FromInfo } from '@ckb-lumos/common-scripts';
import { OutPoint, Script } from '@ckb-lumos/base';
import { helpers } from '@ckb-lumos/lumos';
import { SporeConfig } from '../../config';

declare function transferCluster(props: {
  clusterOutPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
