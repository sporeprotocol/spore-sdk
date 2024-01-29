import { BIish } from '@ckb-lumos/bi';
import { UnpackResult } from '@ckb-lumos/codec';
import { Address, Script } from '@ckb-lumos/base';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BI, Cell, helpers, Indexer } from '@ckb-lumos/lumos';
import { injectCapacityAndPayFee } from '../../helpers';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../config';
import { injectNewSporeIds, injectNewSporeOutput, SporeDataProps } from '../../api';
import { Action, generateCreateSporeAction, injectCommonCobuildProof } from '../../cobuild';

export async function createMultipleSpores(props: {
  sporeInfos: {
    data: SporeDataProps;
    toLock: Script;
  }[];
  fromInfos: FromInfo[];
  changeAddress?: Address;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndices: number[];
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);
  const capacityMargin = BI.from(props.capacityMargin ?? 1_0000_0000);

  // TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Create and inject Spores to Transaction.outputs
  const injectNewSporeResults: Awaited<ReturnType<typeof injectNewSporeOutput>>[] = [];
  for (const sporeInfo of props.sporeInfos) {
    const result = await injectNewSporeOutput({
      txSkeleton,
      data: sporeInfo.data,
      toLock: sporeInfo.toLock,
      fromInfos: props.fromInfos,
      changeAddress: props.changeAddress,
      capacityMargin,
      config,
    });

    txSkeleton = result.txSkeleton;
    injectNewSporeResults.push(result);
  }

  // Inject needed capacity and pay fee
  const sporeOutputIndices = injectNewSporeResults.map((r) => r.outputIndex);
  const injectCapacityAndPayFeeResult = await injectCapacityAndPayFee({
    txSkeleton,
    fromInfos: props.fromInfos,
    changeAddress: props.changeAddress,
    updateTxSkeletonAfterCollection(_txSkeleton) {
      // Generate and inject SporeID
      _txSkeleton = injectNewSporeIds({
        txSkeleton: _txSkeleton,
        outputIndices: sporeOutputIndices,
        config,
      });

      // Inject CobuildProof
      const actions: UnpackResult<typeof Action>[] = [];
      for (const injectNewSporeResult of injectNewSporeResults) {
        const sporeCell = txSkeleton.get('outputs').get(injectNewSporeResult.outputIndex)!;
        const sporeScript = getSporeScript(config, 'Spore', sporeCell.cellOutput.type!);
        if (sporeScript.behaviors?.cobuild) {
          const actionResult = generateCreateSporeAction({
            txSkeleton: _txSkeleton,
            reference: injectNewSporeResult.reference,
            outputIndex: injectNewSporeResult.outputIndex,
          });
          actions.push(...actionResult.actions);
        }
      }
      if (actions.length) {
        const injectCobuildProofResult = injectCommonCobuildProof({
          txSkeleton: _txSkeleton,
          actions,
        });
        _txSkeleton = injectCobuildProofResult.txSkeleton;
      }

      return _txSkeleton;
    },
    config,
  });
  txSkeleton = injectCapacityAndPayFeeResult.txSkeleton;

  return {
    txSkeleton,
    outputIndices: sporeOutputIndices,
  };
}
