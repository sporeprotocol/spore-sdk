import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BI, Cell, hd, helpers, utils } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { secp256k1Blake160 } from '@ckb-lumos/lumos/common-scripts';
import { predefinedSporeConfigs, getSporeScript, isSporeScriptSupported } from '../packages/core/src/config';
import { createV3Config, checkPlainSporeIntent } from '../packages/core/src/v3';
import { injectNewMutantOutput } from '../packages/core/src/api/joints/mutant/injectNewMutantOutput';
import { injectLiveMutantReferences } from '../packages/core/src/api/joints/mutant/injectLiveMutantReferences';
import { injectNewSporeOutput } from '../packages/core/src/api/joints/spore/injectNewSporeOutput';
import { injectLiveSporeCell } from '../packages/core/src/api/joints/spore/injectLiveSporeCell';
import { packRawMutantArgs, packRawSporeData } from '../packages/core/src/codec';
import { assembleTransferSporeAction } from '../packages/core/src/cobuild/action/spore/transferSpore';
import { injectCommonCobuildProof } from '../packages/core/src/cobuild/base/witnessLayout';
import { getMutantById } from '../packages/core/src/api/joints/mutant/getMutant';
vi.mock('../packages/core/src/api/joints/mutant/getMutant', () => ({ getMutantById: vi.fn() }));
const hash = (n: number) => '0x' + n.toString(16).padStart(2, '0').repeat(32);
const entry = (n: number) => ({
  script: { codeHash: hash(n), hashType: 'data2' as const },
  cellDep: { outPoint: { txHash: hash(n + 10), index: '0x0' }, depType: 'code' as const },
});
const deployment = { contractCommit: '46eaa8b59abe818f27dcfe3c7af0da46698c12f8', Spore: entry(1), Mutant: entry(2) };
const config = createV3Config(predefinedSporeConfigs.Testnet, deployment);
const key = hash(42);
const lock = {
  codeHash: config.lumos.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
  hashType: 'type' as const,
  args: hd.key.privateKeyToBlake160(key),
};
const other = { ...lock, args: '0x' + '11'.repeat(20) };
const input: Cell = {
  cellOutput: { capacity: BI.from(1000_00000000).toHexString(), lock },
  data: '0x',
  outPoint: { txHash: hash(9), index: '0x0' },
};
const skeleton = () => helpers.TransactionSkeleton().update('inputs', (xs) => xs.push(input));
const elf = new Uint8Array(64);
elf.set([127, 69, 76, 70, 2, 1, 1]);
elf.set([2, 0, 243, 0], 16);
const rule: Cell = {
  ...input,
  data: bytes.hexify(elf),
  outPoint: { txHash: hash(8), index: '0x0' },
  cellOutput: {
    ...input.cellOutput,
    type: { ...deployment.Mutant.script, args: bytes.hexify(packRawMutantArgs({ id: hash(7) })) },
  },
};
const spore: Cell = {
  ...input,
  data: bytes.hexify(packRawSporeData({ contentType: 'text/plain', content: '0x01' })),
  cellOutput: { ...input.cellOutput, type: { ...deployment.Spore.script, args: hash(6) } },
};
beforeEach(() => {
  vi.mocked(getMutantById).mockReset();
  vi.mocked(getMutantById).mockResolvedValue(rule);
});
describe('v3 SDK offline interoperability (no VM execution)', () => {
  it('opts in without altering v2 defaults or accepting a legacy identity', () => {
    expect(getSporeScript(config, 'Spore').script).toEqual(deployment.Spore.script);
    expect(getSporeScript(predefinedSporeConfigs.Testnet, 'Spore').tags).toContain('v2');
    const v2 = getSporeScript(config, 'Spore', ['v2', 'preview']);
    expect(getSporeScript(config, 'Spore', v2.script).behaviors?.cobuild).toBe(true);
    expect(() => createV3Config(predefinedSporeConfigs.Testnet, { ...deployment, Spore: v2 })).toThrow();
  });
  it('matches category, code hash and VM hash type exactly', () => {
    expect(isSporeScriptSupported(config, { ...deployment.Spore.script, hashType: 'data1' }, 'Spore')).toBe(false);
    expect(() => getSporeScript(config, 'Spore', { ...deployment.Spore.script, hashType: 'data1' })).toThrow();
    expect(isSporeScriptSupported(config, { codeHash: hash(99), hashType: 'data2' }, 'Spore')).toBe(false);
    expect(isSporeScriptSupported(config, deployment.Mutant.script, 'Spore')).toBe(false);
  });
  it('constructs a native code Cell with no Lua dep and rejects Lua data', () => {
    const result = injectNewMutantOutput({ txSkeleton: skeleton(), data: elf, toLock: lock, config });
    expect(result.txSkeleton.get('cellDeps').toArray()).toEqual([deployment.Mutant.cellDep]);
    expect(result.txSkeleton.get('outputs').first()!.cellOutput.type!.hashType).toBe('data2');
    expect(() =>
      injectNewMutantOutput({ txSkeleton: skeleton(), data: '0x72657475726e2030', toLock: lock, config }),
    ).toThrow(/Lua/);
  });
  it('constructs a Spore mint with native references and payment, no Action', async () => {
    vi.mocked(getMutantById).mockResolvedValue({
      ...rule,
      cellOutput: {
        ...rule.cellOutput,
        type: {
          ...rule.cellOutput.type!,
          args: bytes.hexify(packRawMutantArgs({ id: hash(7), minPayment: 100_00000000 })),
        },
      },
    });
    const result = await injectNewSporeOutput({
      txSkeleton: skeleton(),
      data: { contentType: 'text/plain', content: '0x01', contentTypeParameters: { mutant: [hash(7)] } },
      toLock: lock,
      fromInfos: [],
      config,
    });
    expect(getMutantById).toHaveBeenCalledWith(hash(7), config, 'native-v1');
    expect(result.txSkeleton.get('cellDeps').toArray()).toEqual(
      expect.arrayContaining([
        deployment.Spore.cellDep,
        deployment.Mutant.cellDep,
        { outPoint: rule.outPoint, depType: 'code' },
      ]),
    );
    expect(result.txSkeleton.get('cellDeps').size).toBe(3);
    expect(result.mutantReference?.referenceType).toBe('payment');
    expect(result.txSkeleton.get('witnesses').size).toBe(0);
  });
  it('retains the Lua dependency for historical Mutant construction', () => {
    const result = injectNewMutantOutput({
      txSkeleton: skeleton(),
      data: '0x00',
      toLock: lock,
      config: predefinedSporeConfigs.Testnet,
    });
    expect(result.txSkeleton.get('cellDeps').toArray()).toContainEqual(
      getSporeScript(predefinedSporeConfigs.Testnet, 'Lua').cellDep,
    );
  });
  it('builds transfer and burn inputs with real lock placeholders and exact Spore dep', async () => {
    for (const addOutput of [true, false]) {
      const result = await injectLiveSporeCell({
        txSkeleton: helpers.TransactionSkeleton(),
        cell: spore,
        addOutput,
        config,
      });
      expect(result.txSkeleton.get('outputs').size).toBe(addOutput ? 1 : 0);
      expect(result.txSkeleton.get('cellDeps').toArray()).toContainEqual(deployment.Spore.cellDep);
      expect(result.txSkeleton.get('witnesses').size).toBe(1);
    }
  });
  it('derives recipient from cells and rejects a misleading pre-signing Action', () => {
    const output = { ...spore, cellOutput: { ...spore.cellOutput, lock: other } };
    let tx = helpers
      .TransactionSkeleton()
      .update('inputs', (xs) => xs.push(spore))
      .update('outputs', (xs) => xs.push(output))
      .update('witnesses', (xs) => xs.push('0x'));
    expect(checkPlainSporeIntent(tx, config).hasAction).toBe(false);
    const actions = assembleTransferSporeAction(spore, output).actions;
    expect(
      checkPlainSporeIntent(injectCommonCobuildProof({ txSkeleton: tx, actions }).txSkeleton, config).hasAction,
    ).toBe(true);
    const falseActions = assembleTransferSporeAction(spore, spore).actions;
    expect(() =>
      checkPlainSporeIntent(injectCommonCobuildProof({ txSkeleton: tx, actions: falseActions }).txSkeleton, config),
    ).toThrow(/Action/);
  });
  it('signs after optional Action assembly; trailing witness changes alter the sighash', async () => {
    let tx = (
      await injectLiveSporeCell({ txSkeleton: helpers.TransactionSkeleton(), cell: spore, addOutput: true, config })
    ).txSkeleton;
    const message = (t: typeof tx) =>
      secp256k1Blake160.prepareSigningEntries(t, { config: config.lumos }).get('signingEntries').first()!.message;
    const bare = message(tx);
    const actions = assembleTransferSporeAction(spore, spore).actions;
    tx = injectCommonCobuildProof({ txSkeleton: tx, actions }).txSkeleton;
    const withAction = message(tx);
    expect(withAction).not.toBe(bare);
    const signature = hd.key.signRecoverable(withAction, key);
    expect(hd.key.recoverFromSignature(withAction, signature)).toBe(hd.key.privateToPublic(key));
    tx = tx.update('witnesses', (xs) => xs.set(xs.size - 1, '0xff'));
    expect(message(tx)).not.toBe(withAction);
  });
});
