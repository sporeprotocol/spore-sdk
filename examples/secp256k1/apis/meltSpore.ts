import { meltSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

(async function main() {
  const { CHARLIE } = accounts;

  let { txSkeleton } = await meltSpore({
    outPoint: {
      txHash: '0x3d940aed81a5d336c9dfc30ea1c9a7f5c1e34ab6fa07cddbc82868578c9c23a5',
      index: '0x1',
    },
    changeAddress: CHARLIE.address,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('meltSpore sent, txHash:', hash);
})();
