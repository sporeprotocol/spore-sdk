import { Address, OutPoint, Script } from '@ckb-lumos/base';
import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { injectCapacityAndPayFee } from '../../../helpers';
import { getSporeConfig, SporeConfig } from '../../../config';
import { getClusterCellByOutPoint, injectLiveClusterCell } from '../../joints/cluster';

export async function transferCluster(props: {
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Find cluster by OutPoint
  const clusterCell = await getClusterCellByOutPoint(props.outPoint, config);

  // Add cluster to Transaction.inputs and Transaction.outputs
  const injectInputResult = await injectLiveClusterCell({
    txSkeleton,
    cell: clusterCell,
    addOutput: true,
    updateOutput(cell) {
      cell.cellOutput.lock = props.toLock;
      return cell;
    },
    config,
  });
  txSkeleton = injectInputResult.txSkeleton;

  // Inject needed capacity and pay fee
  const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
    txSkeleton,
    changeAddress: props.changeAddress,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config,
  });
  txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;

  return {
    txSkeleton,
    inputIndex: injectInputResult.inputIndex,
    outputIndex: injectInputResult.outputIndex,
  };
}
