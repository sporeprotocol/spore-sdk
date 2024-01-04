import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { getClusterProxyById } from '../api';
import { createClusterAgent, transferClusterAgent, meltClusterAgent } from '../api';
import { signAndSendTransaction, TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';

describe('ClusterAgent', function () {
  const { rpc, config } = TESTNET_ENV;
  const { CHARLIE, ALICE } = TESTNET_ACCOUNTS;

  console.log('CHARLIE:', CHARLIE.lock);
  console.log('ALICE:', ALICE.lock);

  it('Create a ClusterAgent', async () => {
    const clusterProxy = await getClusterProxyById(
      '0xf0688acc6191b9613650bcaee4567d87db07e47bfc6cf556061b785731648b470',
      config,
    );

    console.log('ClusterProxy OutPoint:', clusterProxy.outPoint);

    const { txSkeleton, reference } = await createClusterAgent({
      clusterProxyOutPoint: clusterProxy.outPoint!,
      referenceType: 'cell',
      fromInfos: [CHARLIE.address],
      toLock: ALICE.lock,
      config,
    });

    console.log('ClusterAgent Reference:', reference);

    // Sign and send transaction
    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
  it('Transfer a ClusterAgent', async () => {
    const clusterProxyOutPoint: OutPoint = {
      txHash: '0x72b274e4bf7609a310bf61bd094a7613916fad263e40a0f04dd8533f02e112cb',
      index: '0x1',
    };

    const { txSkeleton } = await transferClusterAgent({
      outPoint: clusterProxyOutPoint,
      fromInfos: [ALICE.address],
      toLock: CHARLIE.lock,
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
  it('Destroy a ClusterAgent', async () => {
    const clusterProxyOutPoint: OutPoint = {
      txHash: '0x074a6a0cf2f720e71146b53133149b14309d48e61e1dc6d8e4d465f103360f2c',
      index: '0x0',
    };

    const { txSkeleton } = await meltClusterAgent({
      outPoint: clusterProxyOutPoint,
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
