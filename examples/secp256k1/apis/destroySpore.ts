import { destroySpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { ALICE } = accounts;

  let { txSkeleton } = await destroySpore({
    sporeOutPoint: {
      txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
      index: '0x0',
    },
    fromInfos: [ALICE.address],
    config,
  });

  const hash = await ALICE.signAndSendTransaction(txSkeleton);
  console.log('destroySpore sent, txHash:', hash);
})();
