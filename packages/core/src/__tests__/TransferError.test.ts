import { resolve } from 'path';
import { readFileSync } from 'fs';
import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { OutPoint } from '@ckb-lumos/base';
import { bytifyRawString } from '../helpers';
import { transferSpore } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

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
  // it('Create a spore (no cluster)', async function () {
  //     const { rpc, config } = TESTNET_ENV;
  //     const { CHARLIE } = TESTNET_ACCOUNTS;
  //
  //     // Generate local image content
  //     const content = await fetchLocalImage(localImage);
  //
  //     // Create cluster cell, collect inputs and pay fee
  //     let { txSkeleton } = await createSpore({
  //         data: {
  //             contentType: 'image/jpeg',
  //             content: content.arrayBuffer,
  //         },
  //         fromInfos: [CHARLIE.address],
  //         toLock: CHARLIE.lock,
  //         config,
  //     });
  //
  //     // Sign and send transaction
  //     await signAndSendTransaction({
  //         account: CHARLIE,
  //         txSkeleton,
  //         config,
  //         rpc,
  //         send: true,
  //     });
  // }, 30000);

  it('Transfer a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0xa555d44a9e193e39dbc1658f7b968a2eafe0bfe04e9afdbfa2ed44367e1abc27',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferSpore({
      outPoint: outPoint,
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: true,
    });
    // await signAndSendTransaction({
    //     account: CHARLIE,
    //     txSkeleton,
    //     config,
    //     rpc,
    //     send: true,
    // });
  }, 30000);

  it('Transfer a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0xa555d44a9e193e39dbc1658f7b968a2eafe0bfe04e9afdbfa2ed44367e1abc27',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferSpore({
      outPoint: outPoint,
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: true,
    });
  }, 300000);
});
