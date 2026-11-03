import { expect, it, vi } from 'vitest';
import { BI, Cell, hd, helpers, Indexer } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { createV3Config } from '../packages/core/src/v3';
import { predefinedSporeConfigs, getSporeScript } from '../packages/core/src/config';
import { createSpore } from '../packages/core/src/api/composed/spore/createSpore';
import { transferSpore, transferMultipleSpore } from '../packages/core/src/api/composed/spore/transferSpore';
import { meltSpore } from '../packages/core/src/api/composed/spore/meltSpore';
import { getSporeByOutPoint } from '../packages/core/src/api/joints/spore/getSpore';
import { packRawSporeData } from '../packages/core/src/codec';
import { WitnessLayout } from '../packages/core/src/cobuild/codec/witnessLayout';
vi.mock('../packages/core/src/api/joints/spore/getSpore', () => ({ getSporeByOutPoint: vi.fn() }));
const hash = (n: number) => '0x' + n.toString(16).padStart(2, '0').repeat(32);
const entry = (n: number) => ({
  script: { codeHash: hash(n), hashType: 'data2' as const },
  cellDep: { outPoint: { txHash: hash(n + 10), index: '0x0' }, depType: 'code' as const },
});
const config = createV3Config(predefinedSporeConfigs.Testnet, {
  contractCommit: '46eaa8b59abe818f27dcfe3c7af0da46698c12f8',
  Spore: entry(1),
  Mutant: entry(2),
});
const lock = {
  codeHash: config.lumos.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
  hashType: 'type' as const,
  args: hd.key.privateKeyToBlake160(hash(42)),
};
const address = helpers.encodeToAddress(lock, { config: config.lumos });
const funding: Cell = {
  cellOutput: { capacity: BI.from(100000_00000000).toHexString(), lock },
  data: '0x',
  outPoint: { txHash: hash(99), index: '0x0' },
};
const spore = (n: number, legacy = false): Cell => ({
  ...funding,
  outPoint: { txHash: hash(n), index: '0x0' },
  cellOutput: {
    ...funding.cellOutput,
    type: { ...getSporeScript(config, 'Spore', legacy ? ['v2', 'preview'] : ['v3-candidate']).script, args: hash(n) },
  },
  data: bytes.hexify(packRawSporeData({ contentType: 'text/plain', content: '0x01' })),
});
it('real composed mint/transfer/burn builders produce no v3 Action (mocked cell provider only)', async () => {
  const collector = vi.spyOn(Indexer.prototype, 'collector').mockImplementation(
    () =>
      ({
        collect: async function* () {
          yield funding;
        },
      }) as any,
  );
  try {
    const mint = await createSpore({
      data: { contentType: 'text/plain', content: '0x01' },
      toLock: lock,
      fromInfos: [address],
      config,
      feeRate: 1000,
    });
    expect(mint.txSkeleton.get('outputs').get(mint.outputIndex)!.cellOutput.type!.codeHash).toBe(
      entry(1).script.codeHash,
    );
    expect(mint.txSkeleton.get('witnesses').size).toBe(mint.txSkeleton.get('inputs').size);
    vi.mocked(getSporeByOutPoint).mockResolvedValue(spore(3));
    const transfer = await transferSpore({ outPoint: spore(3).outPoint!, toLock: lock, config, feeRate: 1000 });
    expect(transfer.txSkeleton.get('witnesses').size).toBe(transfer.txSkeleton.get('inputs').size);
    const burn = await meltSpore({ outPoint: spore(3).outPoint!, config, feeRate: 1000 });
    expect(burn.txSkeleton.get('outputs').every((c) => !c.cellOutput.type)).toBe(true);
    expect(burn.txSkeleton.get('witnesses').size).toBe(burn.txSkeleton.get('inputs').size);
  } finally {
    collector.mockRestore();
  }
});
it('mixed batch keeps only v2 Actions and both version dependencies', async () => {
  for (const legacy of [false, true]) {
    vi.mocked(getSporeByOutPoint).mockImplementation(async (point) =>
      spore(point.txHash === hash(4) ? 4 : 5, legacy && point.txHash === hash(4)),
    );
    const batch = await transferMultipleSpore({
      outPoints: [spore(4).outPoint!, spore(5).outPoint!],
      toLock: lock,
      config,
      feeRate: 1000,
    });
    const extras = batch.txSkeleton.get('witnesses').slice(batch.txSkeleton.get('inputs').size).toArray();
    expect(extras.length).toBe(legacy ? 1 : 0);
    if (legacy) {
      const decoded = WitnessLayout.unpack(extras[0]);
      if (decoded.type !== 'SighashAll') throw new Error('wrong witness kind');
      expect(decoded.value.message.actions.length).toBe(1);
      expect(batch.txSkeleton.get('cellDeps').toArray()).toContainEqual(
        getSporeScript(config, 'Spore', ['v2', 'preview']).cellDep,
      );
    }
  }
});
