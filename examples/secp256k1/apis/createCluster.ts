import { createCluster } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE } = accounts;

  let { txSkeleton } = await createCluster({
    data: {
      name: 'Test cluster',
      description: 'Description of the cluster',
    },
    fromInfos: [CHARLIE.address],
    toLock: CHARLIE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createCluster sent, txHash:', hash);
})();
