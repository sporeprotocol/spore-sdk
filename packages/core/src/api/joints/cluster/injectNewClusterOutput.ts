import { BIish } from '@ckb-lumos/bi';
import { bytes } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/base';
import { BI, Cell, helpers } from '@ckb-lumos/lumos';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { packRawClusterData } from '../../../codec';
import { getSporeConfig, getSporeScript, SporeConfig } from '../../../config';
import { correctCellMinimalCapacity, setAbsoluteCapacityMargin } from '../../../helpers';
import { injectClusterIds } from './injectClusterIds';

export interface ClusterDataProps {
  name: string;
  description: string;
}

export function injectNewClusterOutput(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  data: ClusterDataProps;
  toLock: Script;
  config?: SporeConfig;
  updateOutput?(cell: Cell): Cell;
  capacityMargin?: BIish | ((cell: Cell, margin: BI) => BIish);
}): {
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  hasId: boolean;
} {
  // Env
  const config = props.config ?? getSporeConfig();

  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Create cluster cell (with the latest version of ClusterType script)
  const clusterScript = getSporeScript(config, 'Cluster');
  let clusterCell: Cell = correctCellMinimalCapacity({
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...clusterScript.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte TypeId placeholder
      },
    },
    data: bytes.hexify(packRawClusterData(props.data)),
  });

  // Add to Transaction.outputs
  const outputIndex = txSkeleton.get('outputs').size;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    if (props.capacityMargin !== void 0) {
      clusterCell = setAbsoluteCapacityMargin(clusterCell, props.capacityMargin);
    }
    if (props.updateOutput instanceof Function) {
      clusterCell = props.updateOutput(clusterCell);
    }
    return outputs.push(clusterCell);
  });

  // Fix the output's index to prevent it from future reduction
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Generate ID for the new cluster if possible
  const firstInput = txSkeleton.get('inputs').first();
  if (firstInput) {
    txSkeleton = injectClusterIds({
      outputIndices: [outputIndex],
      txSkeleton,
      config,
    });
  }

  // Add cluster required dependencies
  txSkeleton = addCellDep(txSkeleton, clusterScript.cellDep);

  return {
    txSkeleton,
    outputIndex,
    hasId: firstInput !== void 0,
  };
}
