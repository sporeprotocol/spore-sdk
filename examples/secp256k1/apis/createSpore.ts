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

  /**
   * The dependent cluster's ID for the new spore.
   *
   * Note: Cluster is totally optional for a spore,
   * only specify it when you're creating a spore in that cluster.
   *
   * An on-chain cluster example, the outputs[0] in the transaction (created by CHARLIE):
   * https://pudge.explorer.nervos.org/transaction/0x1b1c11e73413997ed3ca0743c551d543cb454c87ff089cb33b65aaea6d26e215
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
      // Fill in the spore's content as binary bytes,
      // and by default, we use the `examples/shared/test.jpg` file as the content of the spore
      content: await fetchLocalImage('../../shared/test.jpg'),
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
