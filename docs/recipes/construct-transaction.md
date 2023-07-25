
# Construct transactions with spore-sdk

## Create a spore

The main exporting of the `@spore-sdk/core` package, are called Composed API. They are strictly designed to perform a single task, which is to construct transactions of spores/clusters but without signing them.

Let's take an example, that if you want to create a spore on-chain, how should you do it:

```typescript
import { createSpore, SporeConfig } from '@spore-sdk/core';
import { helpers, RPC } from '@ckb-lumos/lumos';

// Assuming there has a Wallet type to handle signing businesses
import { Wallet } from './app';

async function createSampleSporeWithWallet(wallet: Wallet, config: SporeConfig) {
  // The function does the following things:
  // 1. Generate a new spore in Transaction.outputs
  // 2. Collect needed capacity in Transaction.inputs
  // 3. Generate an ID for the new spore
  // 4. Pay fee in Transaction.outputs
  let { txSkeleton } = await createSpore({
    sporeData: {
      contentType: 'image/jpeg',
      content: JPEG_AS_BYTES,
    },
    fromInfos: [wallet.address],
    toLock: wallet.lockScript,
    config,
  });

  // The signing process should do:
  // 1. Sign the transaction
  // 2. Update signatures to Transaction.witnesses
  // 3. Convert TransactionSkeleton to Transaction
  const tx = await wallet.signTransaction(txSkeleton);

  // Send transaction
  const rpc = new RPC(config.ckbNodeUrl);
  return rpc.sendTransaction(tx, 'passthrough');
}
```

From the above code example, you can see that after the `createSpore` API is processed, the returned transaction is not yet completed. The developer still needs to sign the transaction and fill the Transaction's witnesses.

This rule also applies to other Composed APIs in `@spore-sdk/core`, the reasoning behind this is that both `Spore` and `Cluster` are type scripts, and ownership verifying is not their responsibility. We're trying to make Composed APIs single-responsibility so they scale better.

## Code examples

If you need real code examples of how to use `@spore-sdk/core` in Node environment, please check [@spore-examples/secp256k1](../../examples/secp256k1) and maybe run some examples in it, to better understand how it all works.