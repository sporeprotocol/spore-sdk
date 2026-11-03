import { expect, it, vi } from 'vitest';
import { Cell, Indexer } from '@ckb-lumos/lumos';
import { createV3Config } from '../packages/core/src/v3';
import { predefinedSporeConfigs, getSporeScript } from '../packages/core/src/config';
import { getMutantById } from '../packages/core/src/api/joints/mutant/getMutant';
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
it('native lookup does not fall back to Lua when the native ID is absent', async () => {
  const hashes: string[] = [];
  const collector = vi.spyOn(Indexer.prototype, 'collector').mockImplementation((query) => {
    hashes.push((query.type as any).codeHash);
    return { collect: async function* () {} } as any;
  });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(getMutantById(hash(7), config, 'native-v1')).rejects.toThrow(/Cannot find/);
    expect(hashes).toEqual([entry(2).script.codeHash]);
    hashes.length = 0;
    await expect(getMutantById(hash(7), config, 'lua')).rejects.toThrow(/Cannot find/);
    expect(hashes).toEqual([getSporeScript(config, 'Mutant', ['v2', 'preview']).script.codeHash]);
  } finally {
    collector.mockRestore();
    log.mockRestore();
  }
});
