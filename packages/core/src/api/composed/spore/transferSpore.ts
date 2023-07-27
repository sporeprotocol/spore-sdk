import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { Address, OutPoint, Script } from '@ckb-lumos/base';
import { SporeConfig } from '../../../config';
import { injectCapacityAndPayFee } from '../../../helpers';
import { getSporeCellByOutPoint, injectLiveSporeCell } from '../../joints/spore';

export async function transferSpore(props: {
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
  changeAddress?: Address;
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

  // Inject live spore to Transaction.inputs and Transaction.outputs
  const sporeCell = await getSporeCellByOutPoint(props.outPoint, config);
  const injectLiveSporeCellResult = await injectLiveSporeCell({
    cell: sporeCell,
    txSkeleton,
    addOutput: true,
    updateOutput(cell) {
      cell.cellOutput.lock = props.toLock;
      return cell;
    },
    config,
  });
  txSkeleton = injectLiveSporeCellResult.txSkeleton;

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
    inputIndex: injectLiveSporeCellResult.inputIndex,
    outputIndex: injectLiveSporeCellResult.outputIndex,
  };
}
