import cloneDeep from 'lodash/cloneDeep';
import { SporeConfig, SporeScript } from '../config/types';

/** Deployment identities are supplied by the reviewed build/deployment process. */
export interface V3Deployment {
  contractCommit: string;
  Spore: Pick<SporeScript, 'script' | 'cellDep'>;
  Mutant: Pick<SporeScript, 'script' | 'cellDep'>;
}

export function createV3Config(base: SporeConfig, deployment: V3Deployment): SporeConfig {
  if (!/^[0-9a-f]{40}$/.test(deployment.contractCommit)) throw new Error('Pin the contract commit');
  const config = cloneDeep(base);
  for (const name of ['Spore', 'Mutant'] as const) {
    const entry = deployment[name];
    if (
      entry.script.hashType !== 'data2' ||
      entry.cellDep.depType !== 'code' ||
      !/^0x[0-9a-f]{64}$/.test(entry.script.codeHash) ||
      !/^0x[0-9a-f]{64}$/.test(entry.cellDep.outPoint.txHash) ||
      !/^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(entry.cellDep.outPoint.index)
    ) {
      throw new Error(`${name}: expected data2 and a concrete code CellDep`);
    }
    if (
      Object.values(base.scripts).some((category) =>
        category.versions.some((old) => old.script.codeHash === entry.script.codeHash),
      )
    )
      throw new Error(`${name}: v3 must have a new deployment identity`);
    config.scripts[name] = {
      versions: [
        {
          ...cloneDeep(entry),
          tags: ['v3-candidate'],
          behaviors: { mutantRuntime: 'native-v1', cobuild: false, lockProxy: true },
        },
        ...(config.scripts[name]?.versions ?? []),
      ],
    };
  }
  if (deployment.Spore.script.codeHash === deployment.Mutant.script.codeHash) {
    throw new Error('Spore and Mutant must be distinct binaries');
  }
  config.defaultTags = ['v3-candidate'];
  return config;
}
