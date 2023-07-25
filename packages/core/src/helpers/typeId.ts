import { BI, Cell, utils } from '@ckb-lumos/lumos';
import { BIish } from '@ckb-lumos/bi';
import { Hash } from '@ckb-lumos/base';

/**
 * Generate a TypeId based on the first input in Transaction.inputs,
 * and the index of the target cell in Transaction.outputs.
 */
export function generateTypeId(firstInput: Cell, outputIndex: BIish): Hash {
  if (!firstInput.outPoint) {
    throw new Error('Cannot generate TypeId because Transaction.inputs[0] has no OutPoint');
  }

  const script = utils.generateTypeIdScript(
    {
      previousOutput: firstInput.outPoint,
      since: '0x0',
    },
    BI.from(outputIndex).toHexString(),
  );

  return script.args;
}

/**
 * Generate TypeIds for a group of output cells.
 */
export function generateTypeIdGroup(
  firstInput: Cell,
  outputs: Cell[],
  filter: (cell: Cell) => boolean,
): [number, Hash][] {
  const group: [number, Hash][] = [];

  for (let i = 0; i < outputs.length; i++) {
    const isTarget = filter(outputs[i]);
    if (isTarget) {
      const groupIndex = group.length;
      group.push([i, generateTypeId(firstInput, groupIndex)]);
    }
  }

  return group;
}
