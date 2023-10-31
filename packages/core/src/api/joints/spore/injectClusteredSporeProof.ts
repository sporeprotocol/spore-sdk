import { BIish } from '@ckb-lumos/bi';
import { Address, Hash, Script } from '@ckb-lumos/base';
import { BI, Cell, helpers, HexString } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { FromInfo, parseFromInfo } from '@ckb-lumos/common-scripts';
import { isScriptValueEquals } from '../../../helpers';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';
import { injectLiveClusterCell } from '../cluster/injectLiveClusterCell';
import { getClusterById } from '../cluster/getCluster';

export async function injectClusteredSporeProof(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  clusterId: Hash;
  toLock: Script;
  fromInfos: FromInfo[];
  changeAddress?: Address;
  cluster?: {
    updateOutput?(cell: Cell): Cell;
    capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
    updateWitness?: HexString | ((witness: HexString) => HexString);
  };
  config?: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  useLockProxyPattern: boolean;
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
}> {
  let txSkeleton = props.txSkeleton;
  const config = props.config ?? getSporeConfig();

  const cluster = await getClusterById(props.clusterId, config);
  const clusterLock = cluster.cellOutput.lock;

  const fromInfos = props.fromInfos.map((fromInfo) => {
    return parseFromInfo(fromInfo, { config: config.lumos });
  });

  // Check if any sponsor's lock is equals to the cluster's lock,
  // if it does, Transaction.inputs may contain cells from the specific sponsor.
  // Note that due to the capacity collection rules, the sdk starts collecting from the first of fromInfos.
  const isAnyFromInfoEquals = fromInfos.some((fromInfo) => {
    return isScriptValueEquals(clusterLock, fromInfo.fromScript);
  });

  // Check if the new spore's lock equals to the cluster's lock,
  // if it does, Transaction.outputs will contain at least one cell with the same lock as the cluster.
  const isSporeLockEquals = isScriptValueEquals(clusterLock, props.toLock);

  // Check if the change cell's lock equals to the cluster's lock,
  // if it does, Transaction.outputs will contain at least one cell with the same lock as the cluster.
  const firstFromInfo = fromInfos[0];
  const changeLock = props.changeAddress
    ? helpers.addressToScript(props.changeAddress, { config: config.lumos })
    : firstFromInfo.fromScript;
  const isChangeLockEquals = isScriptValueEquals(clusterLock, changeLock);

  // Apply patterns of lock proxy
  const useLockProxyPattern = isAnyFromInfoEquals && (isSporeLockEquals || isChangeLockEquals);
  console.log(isAnyFromInfoEquals, isSporeLockEquals, isChangeLockEquals);
  console.log(useLockProxyPattern);
  if (useLockProxyPattern) {
    const clusterType = cluster.cellOutput.type;
    const clusterScript = getSporeScript(config, 'Cluster', clusterType);
    if (!clusterType || !clusterScript) {
      throw new Error('Cannot inject cluster because target cell is not Cluster');
    }

    // Add cluster required cellDeps
    txSkeleton = addCellDep(txSkeleton, clusterScript.cellDep);
  }

  // Apply normal cluster unlocking rules
  let injectLiveClusterResult: Awaited<ReturnType<typeof injectLiveClusterCell>> | undefined;
  if (!useLockProxyPattern) {
    injectLiveClusterResult = await injectLiveClusterCell({
      cell: await getClusterById(props.clusterId, config),
      capacityMargin: props.cluster?.capacityMargin,
      updateWitness: props.cluster?.updateWitness,
      updateOutput: props.cluster?.updateOutput,
      addOutput: true,
      txSkeleton,
      config,
    });
    txSkeleton = injectLiveClusterResult.txSkeleton;

    // Fix the referenced cluster's output index to prevent it from future reduction
    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: injectLiveClusterResult!.outputIndex,
      });
    });
  }

  // Add referenced cluster to cellDeps
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: cluster.outPoint!,
    depType: 'code',
  });

  return {
    txSkeleton,
    useLockProxyPattern,
    cluster: injectLiveClusterResult
      ? {
          inputIndex: injectLiveClusterResult.inputIndex,
          outputIndex: injectLiveClusterResult.outputIndex,
        }
      : void 0,
  };
}

export async function assetClusteredSporeProof(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  useLockProxyPattern: boolean;
  clusterId: Hash;
  config?: SporeConfig;
}) {
  let txSkeleton = props.txSkeleton;
  const config = props.config ?? getSporeConfig();
  const cluster = await getClusterById(props.clusterId, config);
  const clusterLock = cluster.cellOutput.lock;

  if (props.useLockProxyPattern) {
    const foundLockInInputs = txSkeleton.get('inputs').some((cell) => {
      return isScriptValueEquals(cell.cellOutput.lock, clusterLock);
    });
    if (!foundLockInInputs) {
      throw new Error('Cannot find lock proxy cell in Transaction.inputs');
    }

    const foundLockInOutputs = txSkeleton.get('outputs').some((cell) => {
      return isScriptValueEquals(cell.cellOutput.lock, clusterLock);
    });
    if (!foundLockInOutputs) {
      throw new Error('Cannot find lock proxy cell in Transaction.outputs');
    }
  }
}
