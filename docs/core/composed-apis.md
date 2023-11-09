# Composed API

### createSpore

```typescript
declare function createSpore(props: {
  data: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
  capacityMargin?: BIish;
  updateOutput?(cell: Cell): Cell;
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

- `data`: Specifies the data of the new spore.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the owner of the new spore.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.
- `capacityMargin`: Specifies the capacity margin of the new spore, default to "BI.from(1_0000_0000)".
- `updateOutput`: Specifies a callback function to update the spore output as needed.

**SporeDataProps**

- `contentType`: MIME of the spore's content, for example: "image/jpeg;a=1;b=2".
- `contentTypeParameters`: An object of contentType parameters, usually you can pass extension parameters in here, and the object will be merged into contentType during the process of transaction construction. For example if the contentType is "image/jpeg;a=1", and you've passed "{ b: 2 }" in the contentTypeParameters, later the contentType will be modified to "image/jpeg;ext1=true;ext2=true".
- `content`: The spore's content as bytes, for example if creating a spore where its contentType is "image/jpeg", then its content should be an .jpeg image as bytes.
- `clusterId`: The spore's cluster ID, should be a 32-byte hash if exists.

**Example**

```typescript
import { createSpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await createSpore({
  data: {
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
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
  capacityMargin?: BIish;
  useCapacityMarginAsFee?: boolean;
  updateOutput?(cell: Cell): Cell;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
```

**Props**

- `outPoint`: Specifies a target spore to transfer, which is identified by its index from a specific Transaction.outputs.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the new owner of the spore.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.
- `capacityMargin`: Specifies the capacity margin of the live spore. When "useCapacityMarginAsFee" is true, this prop should not be included in the props.
- `useCapacityMarginAsFee`: Specifies whether to pay fee with the target spore's capacity margin, if not, the transaction is paid with capacity collected from the fromInfos, default to "true".
- `updateOutput`: Specifies a callback function to update the target spore output as needed.

**Example**

```typescript
import { transferSpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await transferSpore({
  outPoint: {
    txHash: '0x76cede56c91f8531df0e3084b3127686c485d08ad8e86ea948417094f3f023f9',
    index: '0x0',
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: RECEIVER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```

### meltSpore

```typescript
declare function meltSpore(props: {
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  config?: SporeConfig;
  changeAddress?: Address;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
}>;
```

**Props**

- `outPoint`: Specifies a target spore to melt, which is identified by its index from a specific Transaction.outputs.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.

**Example**

```typescript
import { meltSpore, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await meltSpore({
  outPoint: {
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
  data: ClusterDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
  capacityMargin?: BIish;
  updateOutput?(cell: Cell): Cell;
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

- `data`: Specifies the data of the new cluster.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `toLock`: Specifies the owner of the new cluster.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.
- `capacityMargin`: Specifies the capacity margin of the new cluster, default to "BI.from(1_0000_0000)".
- `updateOutput`: Specifies a callback function to update the cluster output as needed.

**ClusterDataProps**

- `name`: The name of the new cluster.
- `description`: The description text of the new cluster.

**Example**

```typescript
import { createCluster, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await createCluster({
  data: {
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
  outPoint: OutPoint;
  fromInfos: FromInfo[];
  toLock: Script;
  config?: SporeConfig;
  changeAddress?: Address;
  capacityMargin?: BIish;
  useCapacityMarginAsFee?: boolean;
  updateOutput?(cell: Cell): Cell;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  inputIndex: number;
  outputIndex: number;
}>;
```

**Props**

- `outPoint`: Specifies a target cluster to transfer, which is identified by its index from a specific Transaction.outputs.
- `fromInfos`: Specifies where to collect capacity for transaction construction.
- `config`: Specifies the config of the SDK.
- `changeAddress`: Specifies the change cell's ownership.
- `capacityMargin`: Specifies the capacity margin of the live cluster. When "useCapacityMarginAsFee" is true, this prop should not be included in the props.
- `useCapacityMarginAsFee`: Specifies whether to pay fee with the target cluster cell's capacity margin, if not, the transaction will be paid with capacity collected from the fromInfos, default to "true".
- `updateOutput`: Specifies a callback function to update the target spore output as needed.

**Example**

```typescript
import { transferCluster, predefinedSporeConfigs } from '@spore-sdk/core';

const result = await transferCluster({
  outPoint: {
    txHash: '0xb1f94d7d8e8441bfdf1fc76639d12f4c3c391b8c8a18ed558e299674095290c3',
    index: '0x0',
  },
  fromInfos: [OWNER_ADDRESS],
  toLock: RECEIVER_LOCK_SCRIPT,
  config: predefinedSporeConfigs.Aggron4,
});
```
