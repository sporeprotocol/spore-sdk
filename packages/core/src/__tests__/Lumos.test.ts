import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';

describe('Lumos', function () {
  it('Encode buffer', function () {
    const hex = bytes.hexify(bytes.bytifyRawString('hello'));
    console.log(hex);
  });
  it('Decode buffer', function () {
    const text = Buffer.from(bytes.bytify('0x68656c6c6f')).toString();
    console.log(text);
  });
});
