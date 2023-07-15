import { Config } from '@ckb-lumos/config-manager';
import { CellDep } from '@ckb-lumos/base';
import { ScriptId } from '../types';
import { SporeExtension } from '../extension';

export interface SporeConfig<T extends string = string> {
  lumos: Config;
  ckbNodeUrl: string;
  ckbIndexerUrl: string;
  scripts: SporeConfigScripts<T>;
  extensions: SporeExtension[];
}

export type SporeConfigScripts<T extends string> = Record<T, SporeConfigScript>;

export interface SporeConfigScript {
  script: ScriptId;
  cellDep: CellDep;
}
