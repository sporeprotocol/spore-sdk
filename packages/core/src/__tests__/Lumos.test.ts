import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { utils } from '@ckb-lumos/lumos';

describe('Lumos', function () {
  it('Encode buffer', function () {
    const hex = bytes.hexify(bytes.bytifyRawString('image/jpeg'));
    console.log(hex);
  });
  it('Decode buffer', function () {
    const text = Buffer.from(bytes.bytify('0x696d6167652f6a706567')).toString();
    console.log(text);
  });
  it('Calculating TypeID', function () {
    const typeId = utils.generateTypeIdScript(
      {
        previousOutput: {
          txHash: '0xaeab4bf61cae63e4c75de7c5b62c4b9e42d96b1cd4f1ff3e143390c7c0b391c1',
          index: '0x2',
        },
        since: '0x0',
      },
      '0x1',
    );

    console.log(typeId.args);
  });
});
