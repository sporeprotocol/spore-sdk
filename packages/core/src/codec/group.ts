import { molecule } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';

export const GroupData = molecule.table(
  {
    name: blockchain.Bytes,
    description: blockchain.Bytes,
  },
  ['name', 'description'],
);
