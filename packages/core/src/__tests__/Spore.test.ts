import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { bytifyRawString } from '../helpers';
import { createSpore, transferSpore, meltSpore } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('Spore', function () {
  it('Create a spore', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createSpore({
      data: {
        contentType: 'text/plain',
        content: bytifyRawString('test spore with cluster'),
        clusterId: '0x0df701ca5798d381b39435475a17d0c4246d367b5263fe5726098d9ff2f056e0',
      },
      toLock: CHARLIE.lock,
      fromInfos: [CHARLIE.address],
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
    const { ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await meltSpore({
      outPoint: outPoint,
      fromInfos: [ALICE.address],
      config,
    });

    // Sign and send transaction
    await signAndSendTransaction({
      account: ALICE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
});
