import { transferCluster } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE, ALICE } = accounts;

  let { txSkeleton } = await transferCluster({
    clusterOutPoint: {
      txHash: '0x3d940aed81a5d336c9dfc30ea1c9a7f5c1e34ab6fa07cddbc82868578c9c23a5',
      index: '0x0',
    },
    fromInfos: [CHARLIE.address],
    toLock: ALICE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('transferCluster sent, txHash:', hash);
})();
