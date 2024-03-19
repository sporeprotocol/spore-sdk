import { bytes, BytesLike } from '@ckb-lumos/codec/lib';

export function bytifyRawString(text: string): Uint8Array {
  if (typeof window !== 'undefined' && 'TextEncoder' in window) {
    return new TextEncoder().encode(text);
  } else {
    return Uint8Array.from(Buffer.from(text, 'utf-8'));
  }
}

export function bufferToRawString(source: BytesLike): string {
  const buffer = bytes.bytify(source);
  if (typeof window !== 'undefined' && 'TextDecoder' in window) {
    return new TextDecoder().decode(buffer);
  } else {
    return Buffer.from(buffer).toString();
  }
}
