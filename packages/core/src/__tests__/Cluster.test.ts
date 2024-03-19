import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base/lib';
import { createCluster, getClusterById, transferCluster } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('Cluster', function () {
  it('Create a cluster', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createCluster({
      data: {
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
      send: false,
    });
  }, 50000);

  it('Transfer a cluster', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

    const outPoint: OutPoint = {
      txHash: '0x0a9da05931f4e3381545431ed4ea8459ca4edcc33ca8f5797bf30ad3e83dce5b',
      index: '0x0',
    };

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await transferCluster({
      outPoint: outPoint!!,
      fromInfos: [CHARLIE.address],
      toLock: ALICE.lock,
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
