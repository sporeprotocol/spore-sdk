import { BIish } from '@ckb-lumos/bi';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { Address, OutPoint, Script } from '@ckb-lumos/base';
import { BI, Cell, helpers, Indexer } from '@ckb-lumos/lumos';
import { getSporeConfig, SporeConfig } from '../../../config';
import { injectCapacityAndPayFee, payFeeByOutput, setCellAbsoluteCapacityMargin } from '../../../helpers';
import { getSporeCellByOutPoint, injectLiveSporeCell } from '../../joints/spore';

export async function transferSpore(props: {
  outPoint: OutPoint;
  toLock: Script;
  config?: SporeConfig;
  fromInfos?: FromInfo[];
  changeAddress?: Address;
  capacityMargin?: BIish;
  useCapacityMarginAsFee?: boolean;
  updateOutput?(cell: Cell): Cell;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);
  const useCapacityMarginAsFee = props.useCapacityMarginAsFee ?? true;

  // Check capacity margin related props
  if (!useCapacityMarginAsFee && !props.fromInfos) {
    throw new Error('When useCapacityMarginAsFee is enabled, fromInfos is also required');
  }
  if (useCapacityMarginAsFee && props.capacityMargin !== void 0) {
    throw new Error('When useCapacityMarginAsFee is enabled, cannot set capacity margin of the spore');
  }

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
      if (props.capacityMargin) {
        cell = setCellAbsoluteCapacityMargin(cell, props.capacityMargin);
      }
      if (props.updateOutput instanceof Function) {
        cell = props.updateOutput(cell);
      }
      return cell;
    },
    config,
  });
  txSkeleton = injectLiveSporeCellResult.txSkeleton;

  if (!useCapacityMarginAsFee) {
    // Inject needed capacity from fromInfos and pay fee
    const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
      txSkeleton,
      changeAddress: props.changeAddress,
      fromInfos: props.fromInfos!,
      fee: BI.from(0),
      config,
    });
    txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;
  } else {
    // Pay fee by the spore cell's capacity margin
    txSkeleton = await payFeeByOutput({
      outputIndex: injectLiveSporeCellResult.outputIndex,
      txSkeleton,
      config,
    });
  }

  return {
    txSkeleton,
    inputIndex: injectLiveSporeCellResult.inputIndex,
    outputIndex: injectLiveSporeCellResult.outputIndex,
  };
}
