import { blockchain } from '@ckb-lumos/base';
import { molecule } from '@ckb-lumos/codec';

export const SporeData = molecule.table(
  {
    contentType: blockchain.Bytes,
    content: blockchain.Bytes,
    cluster: blockchain.BytesOpt,
  },
  ['contentType', 'content', 'cluster'],
);
