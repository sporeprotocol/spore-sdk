import { describe, it } from 'vitest';
import { helpers } from '@ckb-lumos/lumos';
import { common } from '@ckb-lumos/common-scripts';
import { TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';
import { createCluster } from '../api';

describe('Cluster', function () {
  it('Create single cluster cell', async function () {
    const { rpc, config } = TESTNET_ENV;
    const { CHARLIE } = TESTNET_ACCOUNTS;

    // Create cluster cell, collect inputs and pay fee
    let { txSkeleton } = await createCluster({
      clusterData: {
        name: 'Testnet Spore 001',
        description: 'This is a cNFT cluster on testnet, just for testing.',
      },
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    // Sign transaction
    txSkeleton = common.prepareSigningEntries(txSkeleton, { config: config.lumos });
    txSkeleton = CHARLIE.signTransaction(txSkeleton);

    // Convert to Transaction
    const tx = helpers.createTransactionFromSkeleton(txSkeleton);
    console.log(JSON.stringify(tx, null, 2));

    // Send transaction
    // const hash = await rpc.sendTransaction(tx, 'passthrough');
    // console.log(hash);
  });
});
