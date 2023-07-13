import { bytes } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/base';
import { common, FromInfo } from '@ckb-lumos/common-scripts';
import { addCellDep } from '@ckb-lumos/common-scripts/lib/helper';
import { BI, Cell, helpers, Indexer, RPC } from '@ckb-lumos/lumos';
import { injectNeededCapacity, isScriptIdEquals } from '../../helpers';
import { correctCellMinimalCapacity, generateTypeId, getMinFeeRate } from '../../helpers';
import { CNftConfig, getCNftConfigScript } from '../../config';
import { GroupData } from '../../codec';

export interface GroupDataProps {
  name: string;
  description: string;
}

export async function createGroup(props: {
  groupData: GroupDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: CNftConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}> {
  // Env
  const config = props.config;
  const rpc = new RPC(config.ckbNodeUrl);
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);

  // Get TransactionSkeleton
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: indexer,
  });

  // Generate and inject Group cell
  const injectNewGroupResult = injectNewGroup({
    txSkeleton,
    ...props,
  });
  txSkeleton = injectNewGroupResult.txSkeleton;

  // Inject capacity
  const injectCapacityResult = await injectNeededCapacity({
    txSkeleton,
    fromInfos: props.fromInfos,
    fee: BI.from(0),
    config: config.lumos,
  });
  txSkeleton = injectCapacityResult.txSkeleton;

  // Generate and inject Group ID
  txSkeleton = injectGroupIds({
    groupOutputIndices: [injectNewGroupResult.outputIndex],
    txSkeleton,
    config,
  });

  // Pay fee
  const minFeeRate = await getMinFeeRate(rpc);
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, props.fromInfos, minFeeRate, void 0, {
    config: props.config.lumos,
  });

  return {
    txSkeleton,
    outputIndex: injectNewGroupResult.outputIndex,
  };
}

export function injectNewGroup(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  groupData: GroupDataProps;
  toLock: Script;
  config: CNftConfig;
}) {
  // Get TransactionSkeleton
  let txSkeleton = props.txSkeleton;

  // Create GroupCell
  const group = getCNftConfigScript(props.config, 'Group');
  const groupCell: Cell = {
    cellOutput: {
      capacity: '0x0',
      lock: props.toLock,
      type: {
        ...group.script,
        args: '0x' + '0'.repeat(64), // Fill 32-byte placeholder
      },
    },
    data: bytes.hexify(
      GroupData.pack({
        name: bytes.bytifyRawString(props.groupData.name),
        description: bytes.bytifyRawString(props.groupData.name),
      }),
    ),
  };

  // Generate Group TypeId (if possible)
  const firstInput = txSkeleton.get('inputs').first();
  const outputIndex = txSkeleton.get('outputs').size;
  if (firstInput !== void 0) {
    groupCell.cellOutput.type!.args = generateTypeId(firstInput, outputIndex);
  }

  // Add to output
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push(correctCellMinimalCapacity(groupCell));
  });

  // Fix output's index to prevent it to be deducted
  txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
    return fixedEntries.push({
      field: 'outputs',
      index: outputIndex,
    });
  });

  // Add Group dependencies
  txSkeleton = addCellDep(txSkeleton, group.cellDep);

  return {
    txSkeleton,
    outputIndex,
  };
}

export function injectGroupIds(props: {
  txSkeleton: helpers.TransactionSkeletonType;
  groupOutputIndices?: number[];
  config: CNftConfig;
}) {
  let txSkeleton = props.txSkeleton;
  const inputs = txSkeleton.get('inputs');
  const firstInput = inputs.get(0);
  if (!firstInput) {
    throw new Error('Cannot generate Group Id because Transaction.inputs[0] does not exist');
  }

  const group = getCNftConfigScript(props.config, 'Group');
  let outputs = txSkeleton.get('outputs');

  const targetIndices: number[] = [];
  if (props.groupOutputIndices) {
    targetIndices.push(...props.groupOutputIndices);
  } else {
    outputs.forEach((output, index) => {
      const outputType = output.cellOutput.type;
      if (outputType && isScriptIdEquals(outputType, group.script)) {
        targetIndices.push(index);
      }
    });
  }

  for (const index of targetIndices) {
    const output = outputs.get(index);
    if (!output) {
      throw new Error(`Cannot generate Group Id because Transaction.outputs[${index}] does not exist`);
    }

    const outputType = output.cellOutput.type;
    if (!outputType || !isScriptIdEquals(outputType, group.script)) {
      throw new Error(`Cannot generate Group Id because Transaction.outputs[${index}] is not a Group cell`);
    }

    output.cellOutput.type!.args = generateTypeId(firstInput, index);
    outputs = outputs.set(index, output);
  }

  return txSkeleton.set('outputs', outputs);
}
