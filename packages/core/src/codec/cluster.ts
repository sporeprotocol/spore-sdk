import { blockchain } from '@ckb-lumos/base/lib';
import { BytesLike, molecule } from '@ckb-lumos/codec/lib';
import { bytifyRawString, bufferToRawString } from '../helpers';

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
    name: bytifyRawString(packable.name),
    description: bytifyRawString(packable.description),
  });
}

export function unpackToRawClusterData(unpackable: BytesLike): RawClusterData {
  const decoded = ClusterData.unpack(unpackable);

  return {
    name: bufferToRawString(decoded.name),
    description: bufferToRawString(decoded.description),
  };
}
