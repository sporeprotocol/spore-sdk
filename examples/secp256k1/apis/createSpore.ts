import { createSpore, getClusterCellByOutPoint } from '@spore-sdk/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { accounts, config } from '../utils/config';

// Get local image file and return a ArrayBuffer
export async function fetchLocalImage(src: string) {
  const buffer = readFileSync(resolve(__dirname, src));
  return new Uint8Array(buffer).buffer;
}

(async function main() {
  const { CHARLIE } = accounts;

  // Get cluster cell by OutPoint,
  // note that setting cluster for a spore is totally optional
  const cluster = await getClusterCellByOutPoint(
    {
      txHash: '0x174d49d39754b2147bed7b09375b4c746436ee66261de012ecb34ca88a8841a3',
      index: '0x0',
    },
    config
  );

  let { txSkeleton } = await createSpore({
    sporeData: {
      // Specify the content's MIME type
      contentType: 'image/jpeg',
      // Fill in the spore's content as bytes,
      // by default it creates a spore with `test.jpg` (an image) as the content
      content: await fetchLocalImage('../utils/test.jpg'),
      // fill in the spores' belonging cluster's id, optional
      cluster: cluster.cellOutput.type?.args,
    },
    fromInfos: [CHARLIE.address],
    toLock: CHARLIE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createSpore sent, txHash:', hash);
})();
