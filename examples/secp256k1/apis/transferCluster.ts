import { transferCluster } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE } = accounts;

  let { txSkeleton } = await transferCluster({
    clusterOutPoint: {
      txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
      index: '0x0',
    },
    fromInfos: [CHARLIE.address],
    toLock: CHARLIE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('transferCluster sent, txHash:', hash);
})();
