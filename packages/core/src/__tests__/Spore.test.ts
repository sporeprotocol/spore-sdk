import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { bytifyRawString } from '../helpers';
import { createSpore, transferSpore, meltSpore } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('Spore', function () {
  const { rpc, config } = TESTNET_ENV;
  const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

  console.log('CHARLIE:', CHARLIE.lock);
  console.log('ALICE:', ALICE.lock);

  it('Create a Spore', async function () {
    const { txSkeleton } = await createSpore({
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

  it('Transfer a Spore', async function () {
    const outPoint: OutPoint = {
      txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    const { txSkeleton } = await transferSpore({
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

  it('Melt a Spore', async function () {
    const outPoint: OutPoint = {
      txHash: '0x8ef248af053927c04e892c6d1e20eb5c0f112d2fb54777291c136b6ed0f776bd',
      index: '0x0',
    };

    const { txSkeleton } = await meltSpore({
      outPoint: outPoint,
      changeAddress: ALICE.address,
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

  it('Create a spore with cluster, referencing ClusterAgent', async function () {
    const clusterAgentOutPoint: OutPoint = {
      txHash: '0xa45f6c0c7594416eecbc16cd7fcc20743f14e5936d4ca9ab26765188cd826a10',
      index: '0x1',
    };

    const { txSkeleton, reference } = await createSpore({
      data: {
        contentType: 'text/plain',
        content: bytifyRawString('test spore with cluster'),
        clusterId: '0x0df701ca5798d381b39435475a17d0c4246d367b5263fe5726098d9ff2f056e0',
      },
      clusterAgentOutPoint,
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    console.log('Spore Reference:', reference);

    // Sign and send transaction
    await signAndSendTransaction({
      account: [ALICE, CHARLIE],
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
});
