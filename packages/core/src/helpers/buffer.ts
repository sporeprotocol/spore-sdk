import { bytes, BytesLike } from '@ckb-lumos/codec';

export function bufferToRawText(source: BytesLike) {
  const buffer = bytes.bytify(source);
  return Buffer.from(buffer).toString();
}
