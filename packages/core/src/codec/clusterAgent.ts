import { utils } from '@ckb-lumos/lumos';
import { bytes, BytesLike } from '@ckb-lumos/codec';
import { blockchain, Hash, Script } from '@ckb-lumos/base';

export type RawClusterAgentData = Script;

export function packRawClusterAgentDataToHash(packable: RawClusterAgentData): Hash {
  return utils.computeScriptHash(packable);
}

export function packRawClusterAgentData(packable: RawClusterAgentData): Uint8Array {
  const hash = packRawClusterAgentDataToHash(packable);
  return bytes.bytify(hash);
}

export function unpackToRawClusterAgentData(unpackable: BytesLike): RawClusterAgentData {
  return blockchain.Script.unpack(unpackable);
}
