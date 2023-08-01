
# Construct transactions with spore-sdk

## The spore-sdk

As an SDK designed to interact with the Spore Protocol, the primary mission of the spore-sdk is to provide developers with everything necessary to engage with the spores/clusters on-chain. 

In short, what the developers can do with the spore-sdk:

1. Construct spores/clusters transactions
2. Encode and decode the cell data of spores/clusters
3. Build applications and services more easily with helper utilities

So, let's start by peeling off a corner of the spore-sdk. The following instructions will show you how developers can construct a transaction to create a spore on-chain.

## Create transaction

let's take [@spore-examples/secp256k1](../../examples/secp256k1/apis/createSpore.ts) as an example, that if you want to create a spore on-chain, how should you do it with `@spore-sdk/core`. Generally, a transaction is made through the following process:

1. Construct a transaction where the inputs and outputs are filled
2. Sign the transaction using a connected wallet
3. Send the transaction via RPC

The responsibility of the SDK is to cover the first step from above, while the remaining steps are meant to be completed by you, the developer. With that said, let's see how to construct a transaction for creating a spore on-chain:

```typescript
import { createSpore, SporeConfig } from '@spore-sdk/core';

const createSporeResult = await createSpore({
  data: {
    contentType: 'image/jpeg',
    content: JPEG_AS_BYTES,
  },
  fromInfos: [WALLET_ADDRESS],
  toLock: WALLET_LOCK,
});
```

The above `createSpore` function constructs a TransactionSkeleton with inputs and outputs, along with filled placeholders for witnesses. The entire process of the function can be described briefly as follows:

1. Create an empty TransactionSkeleton
2. Create a spore and add to TransactionSkeleton.outputs
3. Collect CKB from `WALLET_ADDRESS` to TransactionSkeleton.inputs
4. Fill a placeholder for each input's corresponding witness (if necessary)
5. Add related cell deps to TransactionSkeleton.cellDeps
6. Update the spore and generate an ID for it

After that, a `createSporeResult` object is returned, which contains:

- `txSkeleton`: A [TransactionSkeleton](https://github.com/ckb-js/lumos/blob/develop/packages/helpers/src/index.ts#L314-L339), which is an immutable object that can be regarded as the context of an unfinished transaction. You can continue updating the content of the TransactionSkeleton until it is ready to be sent to RPC.
- `outputIndex`: The new spore's output index in the TransactionSkeleton.
- `cluster`: An object that specifies the input/output index of the new spore's dependent cluster in the TransactionSkeleton, if it exists.

And this is where the duty of the SDK ends. However, the TransactionSkeleton is not yet completed. It still needs to be signed before it can be sent to RPC.

## Sign transaction

To sign a transaction, it means you should sign for all cells (inputs/outputs) that require ownership verification. In our case, the `createSpore` function normally only needs to validate the collected input cells belonging to the `WALLET_ADDRESS`, from the previous section.

> For how to sign a transaction, refer to: [How to sign transaction](https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction).

> For actual code example of signing transaction, refer to: [examples/secp256k1/utils/wallet.ts](../../examples/secp256k1/utils/wallet.ts).

## Send transaction

After signing the TransactionSkeleton, it is considered complete.
Let's convert the TransactionSkeleton to a Transaction and send it to RPC.

```typescript
import { predefinedSporeConfigs } from '@spore-sdk/core';
import { helpers, RPC } from '@ckb-lumos/lumos';

// Get testnet config
const config = predefinedSporeConfigs.Aggron4;

// Convert TransactionSkeleton to Transaction
const tx = helpers.createTransactionFromSkeleton(txSkeleton);

// Send transaction
const rpc = new RPC(config.ckbNodeUrl);
const hash = await rpc.sendTransaction(tx, 'passthrough');
```

The `hash` variable at the end of the above code block is the final result of the whole process. It represents the `Transaction Hash` of the transaction you just sent, which you can use to query and review the details of the transaction. 

Copy the `hash` and visit the [CKB Explorer (Testnet)](https://pudge.explorer.nervos.org/) website to search for the transaction, in the transaction's details, you should find a cell in the outputs, a spore you just created on-chain. 

> Further, if you want to decode the spores' data and verify its accuracy, you can copy the cell's data and follow the recipe provided to decode it: [Handle spore/cluster data](./handle-cell-data.md).
