import { describe, it } from 'vitest';
import { getClusterById, getClusterProxyById } from '../api';
import { createClusterProxy, transferClusterProxy, meltClusterProxy } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('ClusterProxy', function () {
  const { rpc, config } = TESTNET_ENV;
  const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

  console.log('CHARLIE:', CHARLIE.lock);
  console.log('ALICE:', ALICE.lock);

  it('Create a ClusterProxy', async () => {
    const cluster = await getClusterById('0x7d97b472ddaf61678397b9b1d43a70ba0df11d092fcc750b7f219ff0a5812c89', config);
    console.log('Cluster OutPoint:', cluster.outPoint);

    let { txSkeleton, reference } = await createClusterProxy({
      clusterOutPoint: cluster.outPoint!,
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      minPayment: 10,
      config,
    });

    console.log('Cluster Reference:', reference);

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
  it('Transfer a ClusterProxy', async () => {
    const clusterProxyCell = await getClusterProxyById(
      '0x5981b3609c3cd7625a755756193577e153b79b752029d39289cb31df6ed397f4',
      config,
    );

    const { txSkeleton } = await transferClusterProxy({
      outPoint: clusterProxyCell.outPoint!,
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
  it('Destroy a ClusterProxy', async () => {
    const clusterProxyCell = await getClusterProxyById(
      '0x5981b3609c3cd7625a755756193577e153b79b752029d39289cb31df6ed397f4',
      config,
    );

    const { txSkeleton } = await meltClusterProxy({
      outPoint: clusterProxyCell.outPoint!,
      changeAddress: CHARLIE.address,
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
