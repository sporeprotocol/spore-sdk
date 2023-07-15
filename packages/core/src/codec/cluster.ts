import { molecule } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';

export const ClusterData = molecule.table(
  {
    name: blockchain.Bytes,
    description: blockchain.Bytes,
  },
  ['name', 'description'],
);
