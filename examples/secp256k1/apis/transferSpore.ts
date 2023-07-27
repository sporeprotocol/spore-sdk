import { transferSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE, ALICE } = accounts;

  let { txSkeleton } = await transferSpore({
    outPoint: {
      txHash: '0xd7637d80d48afd6b0fe7aae455fbc9259c41a50c7c98fb570d0e86acd2685c54',
      index: '0x1',
    },
    fromInfos: [CHARLIE.address],
    toLock: ALICE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('transferSpore sent, txHash:', hash);
})();
