import { resolve } from 'path';
import { readFileSync } from 'fs';
import { createSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

// Get local image file and return an ArrayBuffer
export async function fetchLocalImage(src: string) {
  const buffer = readFileSync(resolve(__dirname, src));
  return new Uint8Array(buffer).buffer;
}

(async function main() {
  const { CHARLIE } = accounts;

  let { txSkeleton } = await createSpore({
    data: {
      contentType: 'image/jpeg',
      content: await fetchLocalImage('../../shared/test.jpg'),
      clusterId: '0x4bb8ccd6dc886da947cbe8ac4d51004c9d5335ae1216fda756ac39e4bf665c22',
    },
    toLock: CHARLIE.lock,
    fromInfos: [CHARLIE.address],
    cluster: {
      updateWitness: '0x',
    },
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createSporeInAcpCluster sent, txHash:', hash);
})();
