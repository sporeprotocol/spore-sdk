import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { createSpore, meltSpore, transferSpore } from '../api';
import { fetchLocalImage, signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('Spore', function () {
  it('Create a spore (no cluster)', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Generate local image content
    const content = await fetchLocalImage('./resources/test.jpg', __dirname);

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createSpore({
      data: {
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
      send: false,
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
      outPoint: outPoint,
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
      send: false,
    });
  }, 30000);

  it('Melt a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0x8ef248af053927c04e892c6d1e20eb5c0f112d2fb54777291c136b6ed0f776bd',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await meltSpore({
      outPoint: outPoint,
      changeAddress: ALICE.address,
      config,
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
