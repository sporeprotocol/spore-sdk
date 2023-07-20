import { resolve } from 'path';
import { readFileSync } from 'fs';
import { describe, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { OutPoint } from '@ckb-lumos/base';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';
import { createSpore, destroySpore, transferSpore } from '../api';

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
    base64Hex: bytes.hexify(bytes.bytifyRawString(base64)),
  };
}

describe('Spore', function () {
  it('Create a spore (no cluster)', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Generate local image content
    const content = await fetchLocalImage(localImage);

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createSpore({
      sporeData: {
        contentType: 'image/jpeg',
        content: content.arrayBuffer,
      },
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
  }, 30000);

  it('Transfer a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferSpore({
      sporeOutPoint: outPoint,
      fromInfos: [CHARLIE.address],
      toLock: ALICE.lock,
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
  }, 30000);

  it('Destroy a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0x5de6bab0bd205ac00d48e59d8677a7d558511a97886d61a356129a4d718f0691',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await destroySpore({
      sporeOutPoint: outPoint,
      fromInfos: [ALICE.address],
      config,
    });

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
    });
  }, 30000);
});
