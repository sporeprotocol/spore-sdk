import { BIish } from '@ckb-lumos/bi';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { Address, OutPoint, Script } from '@ckb-lumos/base';
import { BI, Cell, helpers, HexString, Indexer } from '@ckb-lumos/lumos';
import { getSporeConfig, SporeConfig } from '../../../config';
import { injectCapacityAndPayFee } from '../../../helpers';
import { getClusterByOutPoint, injectNewClusterProxyOutput, injectNewClusterProxyIds } from '../..';

export async function createClusterProxy(props: {
  clusterOutPoint: OutPoint;
  minPayment?: BIish;
  toLock: Script;
  fromInfos: FromInfo[];
  changeAddress?: Address;
  updateOutput?(cell: Cell): Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  cluster?: {
    updateOutput?(cell: Cell): Cell;
    capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
    updateWitness?: HexString | ((witness: HexString) => HexString);
  };
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  reference: Awaited<ReturnType<typeof injectNewClusterProxyOutput>>['reference'];
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);
  const capacityMargin = BI.from(props.capacityMargin ?? 1_0000_0000);

  // TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Get referenced Cluster
  const clusterCell = await getClusterByOutPoint(props.clusterOutPoint, config);

  // Create and inject a new ClusterProxy cell,
  // also inject the referenced Cluster or its LockProxy to the transaction
  const injectNewClusterProxyResult = await injectNewClusterProxyOutput({
    txSkeleton,
    clusterCell,
    toLock: props.toLock,
    fromInfos: props.fromInfos,
    minPayment: props.minPayment,
    changeAddress: props.changeAddress,
    updateOutput: props.updateOutput,
    cluster: props.cluster,
    capacityMargin,
    config,
  });
  txSkeleton = injectNewClusterProxyResult.txSkeleton;

  // Inject needed capacity and pay fee
  const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
    txSkeleton,
    fromInfos: props.fromInfos,
    changeAddress: props.changeAddress,
    config,
  });
  txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;

  // Generate and inject ID for the new ClusterProxy
  txSkeleton = injectNewClusterProxyIds({
    outputIndices: [injectNewClusterProxyResult.outputIndex],
    txSkeleton,
    config,
  });

  // TODO: Validate the referenced Cluster/LockProxy

  return {
    txSkeleton,
    outputIndex: injectNewClusterProxyResult.outputIndex,
    reference: injectNewClusterProxyResult.reference,
  };
}
