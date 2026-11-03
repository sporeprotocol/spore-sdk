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
 * Call on resolved final cells with one witness slot per input, before signing.
 * Missing slots must be padded with 0x before appending CoBuild intent.
 * Absence of Action means render the actual cell delta; it never means absence
 * of authorisation. This function validates and never normalizes witnesses.
 */
export function checkPlainSporeIntent(tx: helpers.TransactionSkeletonType, config: SporeConfig) {
  const inputCount = tx.get('inputs').size;
  if (tx.get('witnesses').size < inputCount) {
    throw new Error('Incomplete witness layout: provide one witness slot per input before appending optional intent');
  }
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
  for (const [index, witness] of tx.get('witnesses').slice(0, inputCount).entries()) {
    if (witness === '0x') continue;
    let args: ReturnType<typeof blockchain.WitnessArgs.unpack>;
    try {
      args = blockchain.WitnessArgs.unpack(witness);
    } catch {
      throw new Error(
        `Invalid witness layout at input ${index}: expected WitnessArgs or 0x; append optional intent after all ${inputCount} input slots`,
      );
    }
    if (args.inputType || args.outputType) throw new Error(`Unsupported input witness fields at input ${index}`);
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
  for (const [offset, witness] of tx.get('witnesses').slice(inputCount).entries()) {
    if (witness === '0x') continue;
    const index = inputCount + offset;
    let parsed: ReturnType<typeof WitnessLayout.unpack>;
    try {
      parsed = WitnessLayout.unpack(witness);
    } catch {
      throw new Error(`Invalid optional intent witness at index ${index}: expected a CoBuild SighashAll layout`);
    }
    if (parsed.type !== 'SighashAll')
      throw new Error(`Unsupported extra witness at index ${index}: expected CoBuild SighashAll`);
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
