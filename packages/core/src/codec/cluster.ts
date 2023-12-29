import { blockchain, Hash } from '@ckb-lumos/base';
import { BytesLike, molecule } from '@ckb-lumos/codec';
import { bytifyRawString, bufferToRawString } from '../helpers';

export const ClusterDataV2 = molecule.table(
  {
    name: blockchain.Bytes,
    description: blockchain.Bytes,
    mutantId: blockchain.BytesOpt,
  },
  ['name', 'description', 'mutantId'],
);

export const ClusterDataV1 = molecule.table(
  {
    name: blockchain.Bytes,
    description: blockchain.Bytes,
  },
  ['name', 'description'],
);

export interface RawClusterData {
  name: string;
  description: string;
  mutantId?: Hash;
}

export function packRawClusterData(packable: RawClusterData): Uint8Array {
  return ClusterDataV2.pack({
    name: bytifyRawString(packable.name),
    description: bytifyRawString(packable.description),
    mutantId: packable.mutantId,
  });
}

export function unpackToRawClusterData(unpackable: BytesLike): RawClusterData {
  try {
    const decoded = ClusterDataV2.unpack(unpackable);
    return {
      name: bufferToRawString(decoded.name),
      description: bufferToRawString(decoded.description),
      mutantId: decoded.mutantId,
    };
  } catch {
    const decoded = ClusterDataV1.unpack(unpackable);
    return {
      name: bufferToRawString(decoded.name),
      description: bufferToRawString(decoded.description),
    };
  }
}
