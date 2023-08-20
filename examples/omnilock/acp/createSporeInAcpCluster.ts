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
      clusterId: '0x6c7df3eee9af40d4e0f27356e7dcb02a54e33f7d81a40af57d0de1f3856ab750',
    },
    toLock: CHARLIE.lock,
    fromInfos: [CHARLIE.address],
    cluster: {
      capacityMargin:(_cell, margin) => margin.add(1),
      updateWitness: '0x',
    },
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createSporeInAcpCluster sent, txHash:', hash);
})();