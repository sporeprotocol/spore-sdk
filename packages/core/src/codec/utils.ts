import { molecule, number } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';

export const ScriptId = molecule.struct(
  {
    codeHash: blockchain.Byte32,
    hashType: blockchain.HashType,
  },
  ['codeHash', 'hashType'],
);

export const ScriptIdOpt = molecule.option(ScriptId);

export const Uint16Opt = molecule.option(number.Uint16LE);
export const Uint64Opt = molecule.option(number.Uint64LE);
