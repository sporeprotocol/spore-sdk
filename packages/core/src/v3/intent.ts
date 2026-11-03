import { blockchain } from '@ckb-lumos/base';
import { Cell, helpers, utils } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { SporeConfig, isSporeScriptSupported, getSporeScript } from '../config';
import { assembleCreateSporeAction } from '../cobuild/action/spore/createSpore';
import { assembleTransferSporeAction } from '../cobuild/action/spore/transferSpore';
import { assembleMeltSporeAction } from '../cobuild/action/spore/meltSpore';
import { WitnessLayout } from '../cobuild/codec/witnessLayout';

/** Minimal wallet policy for plain Spore operations. Fail closed for other typed
 * cells/intent layouts: custom Locks, clusters and rules need their own review.
 * Call on resolved inputs, before preparing signing entries. Absence of Action
 * means render the actual cell delta; it never means absence of authorisation.
 */
export function checkPlainSporeIntent(tx: helpers.TransactionSkeletonType, config: SporeConfig) {
  const standard = config.lumos.SCRIPTS.SECP256K1_BLAKE160;
  for (const cell of tx.get('inputs').toArray()) {
    const lock = cell.cellOutput.lock;
    if (
      !standard ||
      lock.codeHash !== standard.CODE_HASH ||
      lock.hashType !== standard.HASH_TYPE ||
      !/^0x[0-9a-f]{40}$/.test(lock.args)
    )
      throw new Error('Unsupported input Lock in wallet policy');
  }
  for (const witness of tx.get('witnesses').slice(0, tx.get('inputs').size).toArray()) {
    if (witness === '0x') continue;
    const args = blockchain.WitnessArgs.unpack(witness);
    if (args.inputType || args.outputType) throw new Error('Unsupported input witness fields');
  }
  const groups = new Map<string, { input?: Cell; output?: Cell }>();
  for (const side of ['inputs', 'outputs'] as const) {
    for (const cell of tx.get(side).toArray()) {
      const type = cell.cellOutput.type;
      if (!type) continue;
      if (!isSporeScriptSupported(config, type, 'Spore')) throw new Error('Unsupported typed cell in wallet policy');
      const key = utils.computeScriptHash(type);
      const group = groups.get(key) ?? {};
      const field = side === 'inputs' ? 'input' : 'output';
      if (group[field]) throw new Error('Duplicate Spore identity');
      group[field] = cell;
      groups.set(key, group);
    }
  }
  const expected = [...groups.values()].flatMap(({ input, output }) => {
    if (input && output) {
      if (input.data !== output.data) throw new Error('Spore data changed');
      return assembleTransferSporeAction(input, output).actions;
    }
    return input ? assembleMeltSporeAction(input).actions : assembleCreateSporeAction(output).actions;
  });
  let supplied: typeof expected = [];
  for (const witness of tx.get('witnesses').slice(tx.get('inputs').size).toArray()) {
    if (witness === '0x') continue;
    const parsed = WitnessLayout.unpack(witness);
    if (parsed.type !== 'SighashAll') throw new Error('Unsupported extra witness in wallet policy');
    supplied.push(...parsed.value.message.actions);
  }
  const key = (a: (typeof expected)[number]) =>
    [bytes.hexify(a.scriptHash), bytes.hexify(a.scriptInfoHash), bytes.hexify(a.data)].join(':');
  const expectedKeys = new Set(expected.map(key));
  const suppliedKeys = new Set(supplied.map(key));
  if (suppliedKeys.size !== supplied.length || supplied.some((a) => !expectedKeys.has(key(a)))) {
    throw new Error('Action does not match resolved Spore cell delta');
  }
  for (const action of expected) {
    const group = groups.get(action.scriptHash)!;
    const type = (group.input ?? group.output)!.cellOutput.type!;
    if (getSporeScript(config, 'Spore', type).behaviors?.cobuild && !suppliedKeys.has(key(action))) {
      throw new Error('Historical Spore requires its Action');
    }
  }
  return { actions: expected, hasAction: supplied.length > 0 };
}
