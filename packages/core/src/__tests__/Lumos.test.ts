import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec/lib';
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
        txHash: '0x0a857751861a9e9b671bcc37507690a0501b997e400a06bfb613048d258b9439',
        index: '0x1',
      },
      true,
    );

    if (cell) {
      console.log(cell.cell?.data.hash);
    }
  });
});
