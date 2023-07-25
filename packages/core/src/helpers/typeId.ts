import { BI, Cell, utils } from '@ckb-lumos/lumos';
import { BIish } from '@ckb-lumos/bi';

/**
 * Generate a TypeId based on the first input in Transaction.inputs,
 * and the index of the target cell in Transaction.outputs.
 */
export function generateTypeId(firstInput: Cell, outputIndex: BIish) {
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
