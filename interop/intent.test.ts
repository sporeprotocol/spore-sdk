import { expect, it } from 'vitest';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { Cell, helpers } from '@ckb-lumos/lumos';
import { predefinedSporeConfigs, getSporeScript, getSporeScriptByScriptId } from '../packages/core/src/config';
import { createV3Config, checkPlainSporeIntent } from '../packages/core/src/v3';
import { packRawSporeData } from '../packages/core/src/codec';
import { assembleTransferSporeAction } from '../packages/core/src/cobuild/action/spore/transferSpore';
import { injectCommonCobuildProof } from '../packages/core/src/cobuild/base/witnessLayout';
import { WitnessLayout } from '../packages/core/src/cobuild/codec/witnessLayout';

const hash = (n: number) => '0x' + n.toString(16).padStart(2, '0').repeat(32);
const entry = (n: number) => ({
  script: { codeHash: hash(n), hashType: 'data2' as const },
  cellDep: { outPoint: { txHash: hash(n + 10), index: '0x0' }, depType: 'code' as const },
});
const deployment = { contractCommit: '46eaa8b59abe818f27dcfe3c7af0da46698c12f8', Spore: entry(1), Mutant: entry(2) };
const config = createV3Config(predefinedSporeConfigs.Testnet, deployment);
const lock = {
  codeHash: config.lumos.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
  hashType: 'type' as const,
  args: '0x' + '11'.repeat(20),
};
const cell: Cell = {
  cellOutput: { capacity: '0x174876e800', lock, type: { ...deployment.Spore.script, args: hash(7) } },
  data: bytes.hexify(packRawSporeData({ contentType: 'text/plain', content: '0x01' })),
  outPoint: { txHash: hash(8), index: '0x0' },
};
function transfer(legacy = false) {
  const input = legacy
    ? {
        ...cell,
        cellOutput: {
          ...cell.cellOutput,
          type: { ...getSporeScript(config, 'Spore', ['v2', 'preview']).script, args: hash(7) },
        },
      }
    : cell;
  const output = { ...input, cellOutput: { ...input.cellOutput, lock: { ...lock, args: '0x' + '22'.repeat(20) } } };
  return {
    actions: assembleTransferSporeAction(input, output).actions,
    tx: helpers
      .TransactionSkeleton()
      .update('inputs', (xs) =>
        xs.push(input, { ...cell, cellOutput: { capacity: cell.cellOutput.capacity, lock }, data: '0x' }),
      )
      .update('outputs', (xs) => xs.push(output))
      .update('witnesses', (xs) =>
        xs.push(bytes.hexify(blockchain.WitnessArgs.pack({ lock: '0x' + '00'.repeat(65) })), '0x'),
      ),
  };
}
it('accepts padded input slots plus intent and leaves the skeleton unchanged', () => {
  const { tx, actions } = transfer();
  const withAction = injectCommonCobuildProof({ txSkeleton: tx, actions }).txSkeleton;
  const before = withAction.toJS();
  expect(checkPlainSporeIntent(withAction, config).hasAction).toBe(true);
  expect(withAction.toJS()).toEqual(before);
});
it.each([0, 1])('explains incomplete input slots (%i) without silently padding', (count) => {
  const { tx } = transfer();
  const incomplete = tx.update('witnesses', (xs) => xs.slice(0, count));
  const before = incomplete.toJS();
  expect(() => checkPlainSporeIntent(incomplete, config)).toThrow(
    /Incomplete witness layout: provide one witness slot per input/,
  );
  expect(incomplete.toJS()).toEqual(before);
});
it('explains an Action inserted into an unfilled input witness slot', () => {
  const { tx, actions } = transfer();
  const misplaced = injectCommonCobuildProof({
    txSkeleton: tx.update('witnesses', (xs) => xs.slice(0, 1)),
    actions,
  }).txSkeleton;
  expect(() => checkPlainSporeIntent(misplaced, config)).toThrow(/input 1: expected WitnessArgs or 0x/);
});
it('reports the index of a malformed input witness', () => {
  const { tx } = transfer();
  expect(() =>
    checkPlainSporeIntent(
      tx.update('witnesses', (xs) => xs.set(1, '0xff')),
      config,
    ),
  ).toThrow(/input 1: expected WitnessArgs/);
});
it('reports the index and required format of malformed trailing intent', () => {
  const { tx } = transfer();
  expect(() =>
    checkPlainSporeIntent(
      tx.update('witnesses', (xs) => xs.push('0xff')),
      config,
    ),
  ).toThrow(/index 2: expected a CoBuild SighashAll/);
});
it.each(['inputType', 'outputType'] as const)('rejects unsupported %s fields with their input position', (field) => {
  const { tx } = transfer();
  const invalid = tx.update('witnesses', (xs) =>
    xs.set(1, bytes.hexify(blockchain.WitnessArgs.pack({ [field]: '0x01' }))),
  );
  expect(() => checkPlainSporeIntent(invalid, config)).toThrow(/Unsupported input witness fields at input 1/);
});
it('rejects duplicate optional Actions even when each describes a valid transfer', () => {
  const { tx, actions } = transfer();
  const duplicated = injectCommonCobuildProof({ txSkeleton: tx, actions: [...actions, ...actions] }).txSkeleton;
  expect(() => checkPlainSporeIntent(duplicated, config)).toThrow(/Action does not match/);
});
it('keeps a historical required Action mandatory', () => {
  const { tx, actions } = transfer(true);
  expect(() => checkPlainSporeIntent(tx, config)).toThrow(/Historical Spore requires its Action/);
  expect(
    checkPlainSporeIntent(injectCommonCobuildProof({ txSkeleton: tx, actions }).txSkeleton, config).hasAction,
  ).toBe(true);
});
it('rejects custom input Locks and unsupported typed inputs', () => {
  const { tx } = transfer();
  const custom = tx.update('inputs', (xs) =>
    xs.update(1, (c) => ({ ...c!, cellOutput: { ...c!.cellOutput, lock: { ...lock, codeHash: hash(99) } } })),
  );
  expect(() => checkPlainSporeIntent(custom, config)).toThrow(/Unsupported input Lock/);
  const typed = tx.update('inputs', (xs) =>
    xs.update(1, (c) => ({
      ...c!,
      cellOutput: { ...c!.cellOutput, type: { ...deployment.Mutant.script, args: hash(9) } },
    })),
  );
  expect(() => checkPlainSporeIntent(typed, config)).toThrow(/Unsupported typed cell/);
});
it('rejects noncanonical or out-of-range CKB output indices', () => {
  for (const index of ['0x00', '0x100000000', '0x' + 'f'.repeat(64)]) {
    expect(() =>
      createV3Config(predefinedSporeConfigs.Testnet, {
        ...deployment,
        Spore: {
          ...deployment.Spore,
          cellDep: { ...deployment.Spore.cellDep, outPoint: { ...deployment.Spore.cellDep.outPoint, index } },
        },
      }),
    ).toThrow(/concrete code CellDep/);
  }
  expect(
    createV3Config(predefinedSporeConfigs.Testnet, {
      ...deployment,
      Spore: {
        ...deployment.Spore,
        cellDep: {
          ...deployment.Spore.cellDep,
          outPoint: { ...deployment.Spore.cellDep.outPoint, index: '0xffffffff' },
        },
      },
    }).scripts.Spore.versions[0].cellDep.outPoint.index,
  ).toBe('0xffffffff');
});
it('requires explicit legacy category selection instead of inventing v3 Cluster support', () => {
  expect(() => getSporeScript(config, 'Cluster')).toThrow();
  expect(getSporeScript(config, 'Cluster', ['v2', 'preview'])).toEqual(
    getSporeScript(predefinedSporeConfigs.Testnet, 'Cluster', ['v2', 'preview']),
  );
});

it('leaves deployment tags and caller query tags unchanged during lookup', () => {
  const base = structuredClone(predefinedSporeConfigs.Testnet);
  const before = structuredClone(base);
  const tags = ['v2', 'preview'];
  getSporeScript(base, 'Spore', tags);
  expect(base).toEqual(before);
  expect(tags).toEqual(['v2', 'preview']);
  const cfg = createV3Config(base, deployment);
  getSporeScript(cfg, 'Spore');
  expect(base).toEqual(before);
});

it('rejects an unsupported, otherwise well-formed trailing witness kind', () => {
  const { tx } = transfer();
  const extra = bytes.hexify(WitnessLayout.pack({ type: 'SighashAllOnly', value: { seal: '0x' } }));
  expect(() =>
    checkPlainSporeIntent(
      tx.update('witnesses', (xs) => xs.push(extra)),
      config,
    ),
  ).toThrow(/index 2: expected CoBuild SighashAll/);
});

it('keeps full-identity lookups categorized and detached from caller configuration', () => {
  const base = structuredClone(predefinedSporeConfigs.Testnet);
  const before = structuredClone(base);
  const identity = base.scripts.Spore.versions[1].script;
  const selected = getSporeScriptByScriptId(base, 'Spore', identity);
  expect(selected.name).toBe('Spore');
  selected.tags.push('changed');
  selected.cellDep.outPoint.index = '0xff';
  expect(base).toEqual(before);
});
