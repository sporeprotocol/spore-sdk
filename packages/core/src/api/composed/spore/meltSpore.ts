import { Address, OutPoint } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, helpers, HexString, Indexer } from '@ckb-lumos/lumos';
import { injectCapacityAndPayFee } from '../../../helpers';
import { getSporeConfig, SporeConfig } from '../../../config';
import { getSporeByOutPoint, injectLiveSporeCell } from '../..';

export async function meltSpore(props: {
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  config?: SporeConfig;
  changeAddress?: Address;
  updateWitness?: HexString | ((witness: HexString) => HexString);
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Inject live spore to Transaction.inputs
  const sporeCell = await getSporeByOutPoint(props.outPoint, config);
  const injectLiveSporeCellResult = await injectLiveSporeCell({
    cell: sporeCell,
    updateWitness: props.updateWitness,
    txSkeleton,
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
  };
}
