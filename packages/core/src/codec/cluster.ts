import { bytes, BytesLike, molecule } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';
import { bufferToRawText } from '../helpers';

export const ClusterData = molecule.table(
  {
    name: blockchain.Bytes,
    description: blockchain.Bytes,
  },
  ['name', 'description'],
);

export interface RawClusterData {
  name: string;
  description: string;
}

export function packRawClusterData(packable: RawClusterData) {
  return ClusterData.pack({
    name: bytes.bytifyRawString(packable.name),
    description: bytes.bytifyRawString(packable.description),
  });
}

export function unpackToRawClusterData(unpackable: BytesLike): RawClusterData {
  const decoded = ClusterData.unpack(unpackable);

  return {
    name: bufferToRawText(decoded.name),
    description: bufferToRawText(decoded.description),
  };
}
