# @spore-sdk/core

This is the Core SDK of Spore Protocol, providing:

- Encoding/Decoding data methods of spores/clusters
- APIs to construct transactions around spores and clusters
- Simple helper methods for better transaction construction experience

The SDK is implemented based on [Lumos](https://github.com/ckb-js/lumos).

## Install

Install via NPM:

```shell
npm i @spore-sdk/core
```

Install via PNPM:

```shell
pnpm add @spore-sdk/core
```

Install via Yarn:

```shell
yarn add @spore-sdk/core
```

## Usages

### Constructing transaction

APIs from the `@spore-sdk/core` are strictly limited to performing a single task, which is constructing transactions without signing them. Let's take an example, if you want to create a spore on-chain, you can use the `createSpore` API:

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

This rule also applies to other APIs in `@spore-sdk/core`, the reasoning behind this is that both `Spore` and `Cluster` are type scripts on Nervos CKB, therefore ownership verifying is not their responsibility by design.

### Making spore immortal

Immortal is a core extension of `Spore`. By enabling the immortal extension on a new spore, the spore will live on-chain forever and cannot be destroyed.

If you want to create a spore with immortal extension enabled, you can pass an `immortal` parameter to the props of the `createSpore` API when creating one:

```typescript
import { createSpore, predefinedSporeConfigs } from '@spore-sdk/core';

let { txSkeleton } = await createSpore({
  sporeData: {
    content: JPEG_AS_BYTES,
    contentType: 'image/jpeg',
    contentTypeParameters: {
      immortal: true, // enabling the immortal extension
    },
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: OWNER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```

Like so, the new spore will be immortal on-chain. Then, if the owner tries to destroy the spore, the transaction will fail when verified by the `Spore` type script.

### Encoding/Decoding data of spore/cluster

On-chain data of spores and clusters are encoded by their own codec: SporeData and ClusterData. To encode or decode them, you can use codec methods provided by the SDK.

**SporeData**

```typescript
import { SporeData } from '@spore-sdk/core';

// Encoding
const sporeData = {
  contentType: 'image/jpeg',
  content: JPEG_AS_BYTES,
};
console.log(SporeData.pack(sporeData));
// 0x...

// Decoding
const sporeDataHex = '0x....';
console.log(SporeData.unpack('0x....'));
// {
//   contentType: '0x...',
//   content: '0x....',
//   cluster: undefined
// }
```

**ClusterData**

```typescript
import { ClusterData } from '@spore-sdk/core';

// Encoding
const clusterData = {
  name: 'cluster name',
  description: 'description of the cluster',
};
console.log(ClusterData.pack(sporeData));
// 0x...

// Decoding
const sporeDataHex = '0x....';
console.log(ClusterData.unpack('0x....'));
// {
//   name: '0x...',
//   desccription: '0x...',
// }
```

### Encoding/Decoding SporeData.contentType

SporeData.contentType is by default, the [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of SporeData.content. A typical SporeData.contentType look like this: `image/jpeg;a=1;b=2`, and it can be decoded into the following parts:

- Type: image
- Subtype: jpeg
- MetaType: image/jpeg
- Parameters: { a: '1', b: '2' }

Encode/decode SporeData.contentType with `@spore-sdk/core`:

```typescript
import { encodeContentType, decodeContentType } from '@spore-sdk/core';

const encoded = encodeContentType({
  type: 'image',
  subtype: 'jpeg',
  parameters: {
    a: 1,
  },
});
console.log(encoded); // image/jpeg;a=1

const decoded = decodeContentType('image/jpeg;a=1;a=2');
console.log(decoded);
// {
//   type: 'image',
//   subtype: 'jpeg',
//   mediaType: 'image/jpeg',
//   parameters: {
//     a: 1,
//   },
// }
```

Modify the parameters of SporeData.contentType:

```typescript
import { setContentTypeParameters } from '@spore-sdk/core';

const contentType = 'image/jpeg;a=1;b=3';
const modified = setContentTypeParameters(contentType, { a: 2 });
console.log(modified); // image/jpeg;a=2;b=3
```

## Composed API

### createSpore

```typescript
declare function createSpore(props: {
  sporeData: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
  cluster?: {
    inputIndex: number;
    outputIndex: number;
  };
}>;

interface SporeDataProps {
  contentType: string;
  contentTypeParameters?: EncodableContentType['parameters'];
  content: BytesLike;
  cluster?: HexString;
}
```

**Props**

- `sporeData`: Specifies the data of the new spore.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the owner of the new spore.
- `config`: Specifies the config of the SDK.

**SporeDataProps**

- `contentType`: MIME of the spore's content, for example: "image/jpeg;a=1;b=2".
- `contentTypeParameters`: An object of contentType parameters, usually you can pass extension parameters in here, and the object will be merged into contentType during the process of transaction construction. For example if the contentType is "image/jpeg;a=1", and you've passed "{ b: 2 }" in the contentTypeParameters, later the contentType will be modified to "image/jpeg;ext1=true;ext2=true".
- `content`: The spore's content as bytes, for example if creating a spore where its contentType is "image/jpeg", then its content should be an .jpeg image as bytes.
- `cluster`: The spore's cluster ID, should be a 32-byte hash if exists.

**Example**

```typescript
import { createSpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await createSpore({
  sporeData: {
    content: JPEG_AS_BYTES,
    contentType: 'image/jpeg',
    contentTypeParameters: {
      ext1: true,
      ext2: 1,
    },
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: OWNER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```

### transferSpore

```typescript
declare function transferSpore(props: {
  sporeOutPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
```

**Props**

- `sporeOutPoint`: Specifies a target spore to transfer.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the new owner of the spore.
- `config`: Specifies the config of the SDK.

**Example**

```typescript
import { transferSpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await transferSpore({
  sporeOutPoint: {
    txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
    index: '0x0',
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: RECEIVER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```

### destroySpore

```typescript
declare function destroySpore(props: { sporeOutPoint: OutPoint; fromInfos: FromInfo[]; config: SporeConfig }): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
}>;
```

**Props**

- `sporeOutPoint`: Specifies a target spore to destroy.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `config`: Specifies the config of the SDK.

**Example**

```typescript
import { destroySpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await destroySpore({
  sporeOutPoint: {
    txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
    index: '0x0',
  },
  fromInfos: [OWNER_ADDRESS],
  config: predefinedSporeConfigs.Aggron4,
});
```

### createCluster

```typescript
declare function createCluster(props: {
  clusterData: ClusterDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}>;

interface ClusterDataProps {
  name: string;
  description: string;
}
```

**Props**

- `clusterData`: Specifies the data of the new cluster.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the owner of the new cluster.
- `config`: Specifies the config of the SDK.

**ClusterDataProps**

- `name`: The name of the new cluster.
- `description`: The description text of the new cluster.

**Example**

```typescript
import { createCluster, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await createCluster({
  clusterData: {
    name: 'Cluster name',
    description: 'Description of the cluster',
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: OWNER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```

### transferCluster

```typescript
declare function transferCluster(props: {
  clusterOutPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
```

**Props**

- `clusterOutPoint`: Specifies a target cluster to destroy.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `config`: Specifies the config of the SDK.

**Example**

```typescript
import { transferCluster, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await transferCluster({
  clusterOutPoint: {
    txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
    index: '0x0',
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: RECEIVER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```
