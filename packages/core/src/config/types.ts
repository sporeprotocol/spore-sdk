import { Config } from '@ckb-lumos/config-manager';
import { CellDep } from '@ckb-lumos/base';
import { ScriptId } from '../types';
import { ClusterDataVersion } from '../codec';
import { HexString, Script } from '@ckb-lumos/lumos';

export interface SporeConfig<T extends string = string> {
  lumos: Config;
  ckbNodeUrl: string;
  ckbIndexerUrl: string;
  maxTransactionSize?: number;
  defaultTags?: string[];
  scripts: SporeScriptCategories<T>;
}

export type SporeScriptCategories<T extends string> = Record<T, SporeScriptCategory>;

export interface SporeScriptCategory {
  versions: SporeScript[];
}

export interface SporeVersionedScript extends SporeScript {
  versions?: SporeScript[];
}

export type SporeScripts<T extends string> = Record<T, SporeScript>;

export interface SporeScript {
  tags: string[];
  script: ScriptId;
  cellDep: CellDep;
  behaviors?: SporeScriptBehaviors;
}

export interface SporeScriptBehaviors {
  /** Native rules execute cell data with spore-mutant-v1 on CKB-VM V2. */
  mutantRuntime?: 'native-v1' | 'lua';
  lockProxy?: boolean;
  /** True requires intent; false explicitly opts out. Legacy batch builders
   * retain their historical Action behavior when this flag is absent. */
  cobuild?: boolean;
  clusterDataVersion?: ClusterDataVersion;
  dynamicCelldep?: Script;
}
