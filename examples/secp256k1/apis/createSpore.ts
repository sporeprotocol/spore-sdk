import { resolve } from 'path';
import { readFileSync } from 'fs';
import { createSpore } from '@spore-sdk/core';
import { accounts, config } from '../utils/config';

// Get local image file and return a ArrayBuffer
export async function fetchLocalImage(src: string) {
  const buffer = readFileSync(resolve(__dirname, src));
  return new Uint8Array(buffer).buffer;
}

(async function main() {
  const { CHARLIE } = accounts;

  /**
   * The dependent cluster's ID.
   * Note: Cluster is totally optional for a spore.
   *
   * A cluster on-chain (created by CHARLIE): https://pudge.explorer.nervos.org/transaction/0x1b1c11e73413997ed3ca0743c551d543cb454c87ff089cb33b65aaea6d26e215
   * The outputs[0] in the transaction is a testing cluster.
   */
  const clusterId = '0x21a30f2b2f4927dbd6fd3917990af0dbb868438f44184e84d515f9af84ae4861';

  let { txSkeleton } = await createSpore({
    data: {
      // Specify the content's MIME type
      contentType: 'image/jpeg',
      // Extra parameters of contentType
      contentTypeParameters: {
        // Turn on the below option if you want to create an immortal spore
        // immortal: true,
      },
      // Fill in the spore's content as bytes,
      // by default we use the `resources/test.jpg` file as the content of the spore
      content: await fetchLocalImage('../resources/test.jpg'),
      // fill in the spores' belonging cluster's id, totally optional
      clusterId: clusterId,
    },
    fromInfos: [CHARLIE.address],
    toLock: CHARLIE.lock,
    config,
  });

  const hash = await CHARLIE.signAndSendTransaction(txSkeleton);
  console.log('createSpore sent, txHash:', hash);
})();
