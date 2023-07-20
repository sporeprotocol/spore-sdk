import { OutPoint, Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { SporeConfig } from '../../../config';
import { injectNeededCapacity, payFee } from '../../../helpers';
import { getClusterCellByOutPoint, injectLiveClusterCell } from '../../joints/cluster';

export async function transferCluster(props: {
  clusterOutPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const config = props.config;
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Find cluster by OutPoint
  const clusterCell = await getClusterCellByOutPoint(props.clusterOutPoint, config);

  // Add cluster to Transaction.inputs and Transaction.outputs
  const injectInputResult = await injectLiveClusterCell({
    txSkeleton,
    clusterCell,
    addOutput: true,
    updateOutput(cell) {
      cell.cellOutput.lock = props.toLock;
      return cell;
    },
    config,
  });
  txSkeleton = injectInputResult.txSkeleton;

  // Inject capacity
  const injectCapacityResult = await injectNeededCapacity({
    txSkeleton,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config: config.lumos,
    enableDeductCapacity: false,
  });
  txSkeleton = injectCapacityResult.txSkeleton;

  // Pay fee
  txSkeleton = await payFee({
    fromInfos: props.fromInfos,
    txSkeleton,
    config,
  });

  return {
    txSkeleton,
    inputIndex: injectInputResult.inputIndex,
    outputIndex: injectInputResult.outputIndex,
  };
}
