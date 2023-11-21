import { Address, OutPoint } from '@ckb-lumos/base';
import { helpers, HexString, Indexer } from '@ckb-lumos/lumos';
import { returnExceededCapacityAndPayFee } from '../../../helpers';
import { getSporeConfig, SporeConfig } from '../../../config';
import { getSporeByOutPoint, injectLiveSporeCell } from '../..';

export async function meltSpore(props: {
  outPoint: OutPoint;
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
  const spore = await getSporeByOutPoint(props.outPoint, config);
  const injectLiveSporeCellResult = await injectLiveSporeCell({
    updateWitness: props.updateWitness,
    cell: spore,
    txSkeleton,
    config,
  });
  txSkeleton = injectLiveSporeCellResult.txSkeleton;

  // Redeem capacity from the melted spore
  const sporeAddress = helpers.encodeToAddress(spore.cellOutput.lock, { config: config.lumos });
  const returnExceededCapacityAndPayFeeResult = await returnExceededCapacityAndPayFee({
    changeAddress: props.changeAddress ?? sporeAddress,
    txSkeleton,
    config,
  });
  txSkeleton = returnExceededCapacityAndPayFeeResult.txSkeleton;

  return {
    txSkeleton,
    inputIndex: injectLiveSporeCellResult.inputIndex,
  };
}
