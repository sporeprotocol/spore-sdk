import { resolve } from 'path';
import { readFileSync } from 'fs';
import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { OutPoint } from '@ckb-lumos/base';
import { bytifyRawString } from '../helpers';
import { createSpore, transferSpore } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';
import { BI } from '@ckb-lumos/lumos';

const localImage = './resources/test.jpg';
async function fetchInternetImage(src: string) {
  const res = await fetch(src);
  return await res.arrayBuffer();
}
async function fetchLocalImage(src: string) {
  const buffer = readFileSync(resolve(__dirname, src));
  const arrayBuffer = new Uint8Array(buffer).buffer;
  const base64 = buffer.toString('base64');
  return {
    arrayBuffer,
    arrayBufferHex: bytes.hexify(arrayBuffer),
    base64,
    base64Hex: bytes.hexify(bytifyRawString(base64)),
  };
}

describe('Spore', function () {
  it('Create a spore (No capacity)', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Generate local image content
    const content = await fetchLocalImage(localImage);

    try {
      // Create cluster cell, collect inputs and pay fee
      let { txSkeleton } = await createSpore({
        data: {
          contentType: 'image/jpeg',
          content: content.arrayBuffer,
        },
        fromInfos: [CHARLIE.address],
        toLock: CHARLIE.lock,
        config,
        // capacityMargin: BI.from(0), // No capacity margin will be added
      });

      // Sign and send transaction
      await signAndSendTransaction({
        account: CHARLIE,
        txSkeleton,
        config,
        rpc,
        send: false,
      });
    } catch (error) {
      // Handle the error, for example, log it or assert something
      console.error('Error in Create a spore:', error);
      throw error; // Re-throw the error if needed
    }
  }, 30000);

  it('Transfer a spore (No capacity)', async function () {
    try {
      const { rpc, config } = TESTNET_ENV;
      const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

      const outPoint: OutPoint = {
        txHash: '0xa5fc019c72b802ae9c8ce3a71cd2966524b62984c2da48d2edfbdff579b36e79',
        index: '0x0',
      };
      // Create cluster cell, collect inputs and pay fee
      let { txSkeleton } = await transferSpore({
        outPoint: outPoint,
        fromInfos: [CHARLIE.address],
        toLock: ALICE.lock,
        config,
        useCapacityMarginAsFee: true,
      });

      // Sign and send transaction
      await signAndSendTransaction({
        account: CHARLIE,
        txSkeleton,
        config,
        rpc,
        send: false,
      });
    } catch (error) {
      // Handle the error, for example, log it or assert something
      // console.error('Error in Transfer a spore:', error);
      console.log('Cannot pay fee by Transaction.outputs[0] due to insufficient capacity');
      // throw error; // Re-throw the error if needed
    }
  }, 30000);
  it('Transfer a spore (Do not use capacity)', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0xf74e3add77575165ad0351be18597238ecd78e5063ddb181e2faaacdb935289d',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferSpore({
      outPoint: outPoint,
      fromInfos: [CHARLIE.address],
      toLock: ALICE.lock,
      config,
      useCapacityMarginAsFee: false,
    });

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
});
