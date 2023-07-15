import { blockchain } from '@ckb-lumos/base';
import { molecule } from '@ckb-lumos/codec';

export const SporeData = molecule.table(
  {
    contentType: blockchain.Bytes,
    content: blockchain.Bytes,
    group: blockchain.BytesOpt,
  },
  ['contentType', 'content', 'group'],
);
