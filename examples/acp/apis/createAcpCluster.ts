import { createCluster } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE } = accounts;

  let { txSkeleton } = await createCluster({
    data: {
      name: 'Test acp lock cluster',
      description: 'A public cluster with acp lock',
    },
    toLock: CHARLIE.createAcpLock(),
    fromInfos: [CHARLIE.address],
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createAcpCluster sent, txHash:', hash);
})();
