# Pay fee with capacity margin

## What is `capacity margin`

In a typical CKB transaction, the sender usually pays the transaction fee by collecting additional cells from the sender's address and deducting the fee from the collected cells. 

However, the Spore SDK provides a built-in support of adjusting the capacity margin of cluster/spore cells, which allows the sender to pay fees by a cluster/spore cell's capacity margin, instead of collecting additional cells while transaction's construction.

The usages of capacity margin for spores/clusters:

- **Adjusting capacity margin**

  The sender can put an additional amount of CKBytes as capacity margin into the target cell. For example, if creating a spore requires 200 CKBytes of capacity, the sender can put an extra 1 CKByte into the new spore when creating it.

- **Use capacity margin as fee**

  When transferring a spore/cluster, if the target cell's capacity has enough margins to pay for the transaction fee, the sender can decide whether to use capacity margin as the transaction fee or not.

## Use the feature

### When creating spores/clusters

When creating a spore/cluster, the sender can add additional CKBytes to the new cell's capacity as margin. 

For example, when creating a spore that requires 200 CKB of capacity to be declared in the cell, the sender can put 1 additional CKB into the cell's capacity, so the new spore cell will have 201 CKB of total capacity, and it has 1 CKB of capacity margin can be used in other transactions to pay for transaction fees.

By default, a new spore/cluster will have `1 CKB` (100,000,000 shannons) of additional capacity as margin, to adjust the margin for the new spore/cluster, set the `capacityMargin` prop:

```typescript
import { createSpore } from '@spore-sdk/core';
import { BI } from '@ckb-lumos/lumos';

const result = await createSpore({
  data: NEW_SPORE_DATA,
  toLock: OWNER_LOCK_SCRIPT,
  fromInfos: [OWNER_ADDRESS],
  capacityMargin: BI.from(2_0000_0000), // 2 CKB
});
```

Or set the `capacityMargin` to `0`, so the new spore/cluster will have no margin:

```typescript
import { createSpore } from '@spore-sdk/core';
import { BI } from '@ckb-lumos/lumos';

const result = await createSpore({
  data: NEW_SPORE_DATA,
  toLock: OWNER_LOCK_SCRIPT,
  fromInfos: [OWNER_ADDRESS],
  capacityMargin: BI.from(0), // No capacity margin will be added
});
```

Note that only spores/clusters with capacity margin can be used to pay fees. 
If the sender tries to transfer a spore/cluster with no margin in its capacity, 
the sender has to collect additional cells to pay for the fee.

### When transferring spores/clusters

By default, the Spore SDK will use capacity margin to pay fee when transferring a spore/cluster. As an example, the sender doesn't have to configure anything when transferring a spore:

```typescript
import { transferSpore } from '@spore-sdk/core';
import { BI } from '@ckb-lumos/lumos';

const result = await transferSpore({
  outPoint: LIVE_SPORE_OUTPOINT,
  toLock: RECEIVER_LOCK,
});
```

To disable the feature and use the general method to pay fee instead, set the `useCapacityMarginAsFee` to `false` in the props. Note that disabling the feature also requires the `fromInfos` to be included in the props:

```typescript
import { transferSpore } from '@spore-sdk/core';
import { BI } from '@ckb-lumos/lumos';

const result = await transferSpore({
  outPoint: LIVE_SPORE_OUTPOINT,
  toLock: RECEIVER_LOCK,
  fromInfos: [OWNER_ADDRESS],
  useCapacityMarginAsFee: false,
});
```

## Q & A

### How much capacity margin is enough?

By default, a new spore/cluster has `1 CKB` of additional capacity as margin. To visualize it, let's take this transaction as an example (you can open the link in the browser):

```
https://pudge.explorer.nervos.org/transaction/0x9beeba56006cb77a01d21373d8db9c9bd0371b229c7c8362c2b1b09c67aa9e6e
```

The above transaction transfers a spore from A to B, 
and the transaction fee was `0.00000955 CKB` (955 shannons), let's raise it as `0.00001 CKB` (1,000 shannons).

So if a spore has `1 CKB` (100,000,000 shannons) of additional capacity as margin, let's calculate:

```
100000000 / 1000 = 100,000
```

Based on the above calculation, we estimate that the margin of `1 CKB` is enough to cover the transaction fee by about `100,000` times, which is a lot. 

In conclusion, `1 CKB` is a decent amount of capacity margin, and most of the time you don't have to worry about paying fees.


### What happens if a cell's capacity margin runs out?

This can be seen as a rare condition as if the owner has put a reasonable amount of additional capacity into the cell as margin. However, if it happens, the transaction will fail because the cell has no enough capacity to pay fee, and then the owner should do the following to "fill up the gas":

1. Transfer the cell from the owner to itself
2. Set the `capacityMargin` to add additional capacity as margin
3. Pay the current transaction's fee without using capacity margin

Let's take `transferSpore` as an example:

```typescript
import { transferSpore } from '@spore-sdk/core';
import { BI } from '@ckb-lumos/lumos';

const result = await transferSpore({
  outPoint: LIVE_SPORE_OUTPOINT,
  toLock: OWNER_LOCK_SCRIPT,
  fromInfos: [OWNER_ADDRESS],
  capacityMargin: BI.from(1_0000_0000), // Add 1 CKB as margin, default to 0
  useCapacityMarginAsFee: false, // Disable the feature, default to true
});
```

> Note: When specifying `capacityMargin`, the `useCapacityMarginAsFee` prop cannot be `true` at the same time, otherwise it cannot pass the validation.