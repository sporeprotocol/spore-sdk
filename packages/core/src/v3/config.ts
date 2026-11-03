import cloneDeep from 'lodash/cloneDeep';
import { SporeConfig, SporeScript } from '../config/types';

/** Deployment identities supplied by a reviewed build/deployment process.
 * contractCommit is provenance metadata, not an attestation that codeHash was
 * built from that revision. Verify source/binary hashes and live code bytes
 * separately before using a deployment. */
export interface V3Deployment {
  contractCommit: string;
  Spore: Pick<SporeScript, 'script' | 'cellDep'>;
  Mutant: Pick<SporeScript, 'script' | 'cellDep'>;
}

/** Validate configuration shape and identity separation without making RPC
 * calls or certifying deployment provenance. Spore and Mutant are the only v3
 * categories installed; other categories need explicit version selection. */
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
      !/^0x(?:0|[1-9a-f][0-9a-f]{0,7})$/.test(entry.cellDep.outPoint.index)
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
