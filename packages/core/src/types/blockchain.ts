import { Script } from '@ckb-lumos/base';

export type ScriptId = Omit<Script, 'args'>;
