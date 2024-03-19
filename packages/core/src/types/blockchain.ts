import { Script } from '@ckb-lumos/base/lib';

export type ScriptId = Omit<Script, 'args'>;
