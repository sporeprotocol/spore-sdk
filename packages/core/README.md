# @spore-sdk/core

The Core SDK of Spore Protocol, based on [Lumos](https://github.com/ckb-js/lumos), provides the following features:

- Functions to encode/decode data of spores/clusters
- Functions to construct transactions around spores and clusters
- Simple helper functions for better transaction construction experience

## Installation

Install via npm:

```shell
npm i @spore-sdk/core
```

Install via pnpm:

```shell
pnpm add @spore-sdk/core
```

Install via yarn:

```shell
yarn add @spore-sdk/core
```

## Recipes

### [Construct transactions with spore-sdk](../../docs/recipes/construct-transaction.md)

### [Create immortal spores on-chain](../../docs/recipes/create-immortal-spore.md)

### [Handle spore/cluster data](../../docs/recipes/handle-cell-data.md)

## Examples

### [@spore-examples/secp256k1](../../examples/secp256k1)

> Provides real code examples to show developers how to construct transactions of spores/clusters, and how to sign for Secp256k1Blake160 inputs.

## Composed API

### createSpore

```typescript
declare function createSpore(props: {
  sporeData: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
  changeAddress?: Address;
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
  clusterId?: HexString;
}
```

**Props**

- `sporeData`: Specifies the data of the new spore.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the owner of the new spore.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.

**SporeDataProps**

- `contentType`: MIME of the spore's content, for example: "image/jpeg;a=1;b=2".
- `contentTypeParameters`: An object of contentType parameters, usually you can pass extension parameters in here, and the object will be merged into contentType during the process of transaction construction. For example if the contentType is "image/jpeg;a=1", and you've passed "{ b: 2 }" in the contentTypeParameters, later the contentType will be modified to "image/jpeg;ext1=true;ext2=true".
- `content`: The spore's content as bytes, for example if creating a spore where its contentType is "image/jpeg", then its content should be an .jpeg image as bytes.
- `clusterId`: The spore's cluster ID, should be a 32-byte hash if exists.

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
  changeAddress?: Address;
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
- `changeAddress`: Specifies the change cell's ownership.

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
declare function destroySpore(props: {
  sporeOutPoint: OutPoint;
  fromInfos: FromInfo[];
  config: SporeConfig;
  changeAddress?: Address;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
}>;
```

**Props**

- `sporeOutPoint`: Specifies a target spore to destroy.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.

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
  changeAddress?: Address;
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
- `changeAddress`: Specifies the change cell's ownership.

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
  changeAddress?: Address;
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
- `changeAddress`: Specifies the change cell's ownership.

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
