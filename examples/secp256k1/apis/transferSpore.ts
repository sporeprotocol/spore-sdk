import { transferSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE, ALICE } = accounts;

  let { txSkeleton } = await transferSpore({
    outPoint: {
      txHash: '0x4655732e3d14d733db61c437d8b714ce500e577e6b68c4b42ac3b668cc72ce1a',
      index: '0x1',
    },
    fromInfos: [CHARLIE.address],
    toLock: ALICE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('transferSpore sent, txHash:', hash);
})();
