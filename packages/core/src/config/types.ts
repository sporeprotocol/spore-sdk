import { Config } from '@ckb-lumos/config-manager';
import { CellDep } from '@ckb-lumos/base';
import { ScriptId } from '../types';

export interface CNftConfig<T extends string = string> {
  lumos: Config;
  ckbNodeUrl: string;
  ckbIndexerUrl: string;
  scripts: CNftConfigScripts<T>;
}

export type CNftConfigScripts<T extends string> = Record<T, CNftConfigScript>;

export interface CNftConfigScript {
  script: ScriptId;
  cellDep: CellDep;
}
