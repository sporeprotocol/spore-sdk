import { molecule } from '@ckb-lumos/codec/lib';
import { blockchain } from '@ckb-lumos/base/lib';

export const ScriptId = molecule.struct(
  {
    codeHash: blockchain.Byte32,
    hashType: blockchain.HashType,
  },
  ['codeHash', 'hashType'],
);

export const ScriptIdOpt = molecule.option(ScriptId);
