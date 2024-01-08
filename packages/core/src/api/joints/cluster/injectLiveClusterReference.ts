import { BIish } from '@ckb-lumos/bi';
import { Cell, PackedSince, Script } from '@ckb-lumos/base';
import { BI, helpers, HexString } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';
import { referenceCellOrLockProxy } from '../../../helpers';
import { injectLiveClusterCell } from './injectLiveClusterCell';

export async function injectLiveClusterReference(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  cell: Cell;
  inputLocks: Script[];
  outputLocks: Script[];
  updateOutput?: (cell: Cell) => Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
  updateWitness?: HexString | ((witness: HexString) => HexString);
  defaultWitness?: HexString;
  since?: PackedSince;
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  referenceType: 'cell' | 'lockProxy';
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
}> {
  // Env
  const config = props.config ?? getSporeConfig();
  const clusterCell = props.cell;

  // TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Injection status & hooks
  let injectLiveClusterResult: Awaited<ReturnType<typeof injectLiveClusterCell>> | undefined;
  async function referenceCell(tx: helpers.TransactionSkeletonType): Promise<helpers.TransactionSkeletonType> {
    injectLiveClusterResult = await injectLiveClusterCell({
      txSkeleton: tx,
      cell: clusterCell,
      addOutput: true,
      updateOutput: props.updateOutput,
      updateWitness: props.updateWitness,
      capacityMargin: props.capacityMargin,
      defaultWitness: props.defaultWitness,
      since: props.since,
      config,
    });

    return injectLiveClusterResult.txSkeleton;
  }
  function referenceLockProxy(tx: helpers.TransactionSkeletonType): helpers.TransactionSkeletonType {
    const clusterType = clusterCell.cellOutput.type;
    const clusterScript = getSporeScript(config, 'Cluster', clusterType);
    if (!clusterType || !clusterScript) {
      throw new Error('Cannot inject Cluster because target cell is not Cluster');
    }

    // Add cluster required cellDeps
    tx = addCellDep(tx, clusterScript.cellDep);

    return tx;
  }

  // Inject referenced cluster directly or inject LockProxy only
  const referenceResult = await referenceCellOrLockProxy({
    txSkeleton,
    cell: clusterCell,
    inputLocks: props.inputLocks,
    outputLocks: props.outputLocks,
    referenceCell,
    referenceLockProxy,
  });
  txSkeleton = referenceResult.txSkeleton;

  return {
    txSkeleton,
    referenceType: referenceResult.referencedCell ? 'cell' : 'lockProxy',
    cluster:
      referenceResult.referencedCell && injectLiveClusterResult !== void 0
        ? {
            inputIndex: injectLiveClusterResult.inputIndex,
            outputIndex: injectLiveClusterResult.outputIndex,
          }
        : void 0,
  };
}
