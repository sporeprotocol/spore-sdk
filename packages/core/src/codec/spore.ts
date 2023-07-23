import { bytes, BytesLike, molecule } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';
import { bufferToRawText } from '../helpers';

export const SporeData = molecule.table(
  {
    contentType: blockchain.Bytes,
    content: blockchain.Bytes,
    cluster: blockchain.BytesOpt,
  },
  ['contentType', 'content', 'cluster'],
);

export interface RawSporeData {
  contentType: string;
  content: Parameters<typeof SporeData.pack>[0]['content'];
  cluster: Parameters<typeof SporeData.pack>[0]['cluster'];
}

export function packRawSporeData(packable: RawSporeData) {
  return SporeData.pack({
    contentType: bytes.bytifyRawString(packable.contentType),
    content: packable.content,
    cluster: packable.cluster,
  });
}

export function unpackToRawSporeData(unpackable: BytesLike): RawSporeData {
  const unpacked = SporeData.unpack(unpackable);
  return {
    ...unpacked,
    contentType: bufferToRawText(unpacked.contentType),
  };
}
