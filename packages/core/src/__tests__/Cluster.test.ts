import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { createCluster, transferCluster } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('Cluster', function () {
  it('Create a cluster', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createCluster({
      clusterData: {
        name: 'Testnet Spore 002',
        description: 'This is a cluster, just for testing.',
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

  it('Transfer a cluster', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferCluster({
      clusterOutPoint: outPoint,
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
});
