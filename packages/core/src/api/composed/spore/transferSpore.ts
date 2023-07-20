import { BI, helpers, Indexer } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { OutPoint, Script } from '@ckb-lumos/base';
import { SporeConfig } from '../../../config';
import { injectNeededCapacity, payFee } from '../../../helpers';
import { getSporeCellByOutPoint, injectLiveSporeCell } from '../../joints/spore';

export async function transferSpore(props: {
  sporeOutPoint: OutPoint;
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

  // Inject live spore to Transaction.inputs and Transaction.outputs
  const sporeCell = await getSporeCellByOutPoint(props.sporeOutPoint, config);
  const injectLiveSporeCellResult = await injectLiveSporeCell({
    sporeCell,
    txSkeleton,
    addOutput: true,
    updateOutput(cell) {
      cell.cellOutput.lock = props.toLock;
      return cell;
    },
    config,
  });
  txSkeleton = injectLiveSporeCellResult.txSkeleton;

  // Inject capacity
  const injectCapacityResult = await injectNeededCapacity({
    txSkeleton,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config: config.lumos,
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
    inputIndex: injectLiveSporeCellResult.inputIndex,
    outputIndex: injectLiveSporeCellResult.outputIndex,
  };
}
