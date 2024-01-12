import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { utils } from '@ckb-lumos/lumos';
import { bytifyRawString } from '../helpers';
import { TESTNET_ENV } from './shared';

describe('Lumos', function () {
  it('Encode buffer', function () {
    const hex = bytes.hexify(bytifyRawString('image/jpeg'));
    console.log(hex);
  });
  it('Decode buffer', function () {
    const text = Buffer.from(bytes.bytify('0x696d6167652f6a706567')).toString();
    console.log(text);
  });
  it('Calculating TypeID', function () {
    const typeId = utils.generateTypeIdScript(
      {
        since: '0x0',
        previousOutput: {
          index: '0x0',
          txHash: '0xb5deeae5f8b159bc9bb1705ee84a3b16ec130e638a4b7b0d7d92c586631f40c6',
        },
      },
      '0x0',
    );

    console.log(typeId.args);
  });
  it('Get code hash by OutPoint', async function () {
    const rpc = TESTNET_ENV.rpc;

    const cell = await rpc.getLiveCell(
      {
        txHash: '0x6d3c79d3e6d0ea6b1d779b98c6572ac594205fb308d5d021b58d8d51a131b7f0',
        index: '0x0',
      },
      true,
    );

    if (cell) {
      console.log(cell.cell.data.hash);
    }
  });
});
