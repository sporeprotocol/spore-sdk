import { describe, it } from 'vitest';
import { OutPoint } from '@ckb-lumos/base';
import { bytifyRawString } from '../helpers';
import { unpackToRawSporeData } from '../codec';
import { createSpore, transferSpore, meltSpore, getSporeById } from '../api';
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
        clusterId: '0x1a4482480b9f0ac92d59e4cdcf9fa6d153bf82bc45906dc1b6498ed1485db6e4',
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
    const sporeCell = await getSporeById('0x84f6f5021d6558a322fcb99a866521294048922b9bfabd32346e6c392307e660', config);

    const { txSkeleton } = await transferSpore({
      outPoint: sporeCell.outPoint!,
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
    const sporeCell = await getSporeById('0x8477693d6d030f2eb33cfdace798d79ce46bcd602de1895f0e3f2afe706c0b82', config);

    const { txSkeleton } = await meltSpore({
      outPoint: sporeCell.outPoint!,
      changeAddress: CHARLIE.address,
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

  it('Create a Spore with Cluster, referencing ClusterAgent', async function () {
    const clusterAgentOutPoint: OutPoint = {
      txHash: '0xb4f1fddf639c5f56c49d0e8e7164b056238e75dcd0c39d063a4236148a44fdd4',
      index: '0x1',
    };

    const { txSkeleton, reference } = await createSpore({
      data: {
        contentType: 'text/plain',
        content: bytifyRawString('test spore with cluster'),
        clusterId: '0x1a4482480b9f0ac92d59e4cdcf9fa6d153bf82bc45906dc1b6498ed1485db6e4',
      },
      clusterAgentOutPoint,
      fromInfos: [ALICE.address],
      toLock: CHARLIE.lock,
      config,
    });

    console.log('Spore Reference:', reference);

    // Sign and send transaction
    await signAndSendTransaction({
      account: [ALICE],
      txSkeleton,
      config,
      rpc,
      send: true,
    });
  }, 30000);

  it('Create a Spore with Mutant', async function () {
    const { txSkeleton, outputIndex, reference, mutantReference } = await createSpore({
      data: {
        contentType: 'text/plain',
        content: bytifyRawString('content'),
        contentTypeParameters: {
          mutant: [
            // '0x87a5bad1849ba09237bdd62209b538c3f39b27ba6dceefd040d5f9f71f6adfb5',
            // '0x756fb2d4921f742b317fb8dd5a09bb5ee38a16baef521199d70a587e835fb1ea',
          ],
        },
      },
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    console.log('Spore Reference:', reference);
    console.log('Spore MutantReference:', mutantReference);

    const sporeCell = txSkeleton.get('outputs').get(outputIndex)!;
    const sporeData = unpackToRawSporeData(sporeCell.data);
    console.log('Spore Data:', sporeData);

    const hash = await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 300000);
  it('Create a Spore with Mutant required Cluster', async function () {
    const { txSkeleton, outputIndex, reference, mutantReference } = await createSpore({
      data: {
        contentType: 'text/plain',
        content: bytifyRawString('content'),
        clusterId: '0x',
        contentTypeParameters: {
          mutant: ['0x'],
        },
      },
      fromInfos: [CHARLIE.address],
      toLock: CHARLIE.lock,
      config,
    });

    console.log('Spore Reference:', reference);
    console.log('Spore MutantReference:', mutantReference);

    await signAndSendTransaction({
      account: CHARLIE,
      txSkeleton,
      config,
      rpc,
      send: false,
    });
  }, 30000);
});
