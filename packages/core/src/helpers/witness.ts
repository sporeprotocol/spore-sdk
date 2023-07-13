import { bytes, BytesLike } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base';

type WitnessArgsObject = Parameters<(typeof blockchain.WitnessArgs)['pack']>[0];
type WitnessArgsKey = keyof WitnessArgsObject;

export const defaultEmptyWitnessArgs = bytes.hexify(blockchain.WitnessArgs.pack({}));

/**
 * Update a property value of a WitnessArgs (in hex).
 */
export function updateWitnessArgs(witness: string | undefined, key: WitnessArgsKey, value: BytesLike) {
  witness = witness && witness !== '0x' ? witness : defaultEmptyWitnessArgs;
  return bytes.hexify(
    blockchain.WitnessArgs.pack({
      ...blockchain.WitnessArgs.unpack(witness),
      [key]: value,
    }),
  );
}
