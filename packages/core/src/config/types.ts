import { Config } from '@ckb-lumos/config-manager';
import { CellDep } from '@ckb-lumos/base';
import { ScriptId } from '../types';
import { SporeExtension } from '../extension';

export interface SporeConfig<T extends string = string> {
  lumos: Config;
  ckbNodeUrl: string;
  ckbIndexerUrl: string;
  extensions: SporeExtension[];
  scripts: SporeVersionedScripts<T>;
}

export type SporeVersionedScripts<T extends string> = Record<T, SporeVersionedScript>;

export interface SporeVersionedScript extends SporeScript {
  versions?: SporeScript[];
}

export type SporeScripts<T extends string> = Record<T, SporeScript>;

export interface SporeScript {
  script: ScriptId;
  cellDep: CellDep;
}
