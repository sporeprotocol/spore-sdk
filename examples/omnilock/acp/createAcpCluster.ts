import { createCluster } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';
import { createOmnilockAcpArgs } from '../utils/wallet';

(async function main() {
  const { CHARLIE } = accounts;

  // Requiring 1 shannon (10^0) as the minimal payment (the udt part can be ignored)
  const omnilockArgs = createOmnilockAcpArgs(0, 0);

  let { txSkeleton } = await createCluster({
    data: {
      name: 'Test omnilock acp cluster',
      description: 'An public cluster with omnilock',
    },
    toLock: CHARLIE.createLock(omnilockArgs),
    fromInfos: [CHARLIE.address],
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createAcpCluster sent, txHash:', hash);
})();
