import { transferSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE, ALICE } = accounts;

  let { txSkeleton } = await transferSpore({
    sporeOutPoint: {
      txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
      index: '0x0',
    },
    fromInfos: [CHARLIE.address],
    toLock: ALICE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('transferSpore sent, txHash:', hash);
})();
