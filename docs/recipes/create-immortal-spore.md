# Create immortal spores on-chain

## What is immortal

`Immortal` is a Spore Extension that offers the following rules to spores:

1. Immortal extension is enabled for a spore if the spore has a `immortal=true` in its `SporeData.contentType`
2. An immortal spore lives on-chain forever, and cannot be destroyed under any circumstances

To create a spore with the immortal extension enabled, you need to pass the `immortal` parameter to the props of the `createSpore` API when calling it. After successfully creating an immortal spore, any attempt by the owner to destroy it will result in a failed transaction due to verification by the `SporeType` script.

## Create immortal spores

There are two recommended ways to set the `immortal` parameters while creating a spore. Note that both ways are fine and can complete the mission nicely, so choose whichever you prefer.

There are two recommended ways to set the `immortal` parameters when creating a spore. Note that both ways are equally valid and will accomplish the mission successfully, so choose whichever method you prefer.

### Set in the `contentTypeParameters` object

```typescript
import { createSpore } from '@spore-sdk/core';

let { txSkeleton } = await createSpore({
  data: {
    content: JPEG_AS_BYTES,
    contentType: 'image/jpeg',
    contentTypeParameters: {
      immortal: true, // enabling the immortal extension
    },
  },
  fromInfos: [WALLET_ADDRESS],
  toLock: WALLET_LOCK_SCRIPT,
});
```

### Using the `setContentTypeParameters` function

```typescript
import { createSpore, setContentTypeParameters } from '@spore-sdk/core';

let { txSkeleton } = await createSpore({
  data: {
    content: JPEG_AS_BYTES,
    contentType: setContentTypeParameters(
      'image/jpeg', 
      {
        immortal: true, // enabling the immortal extension
      }
    ),
  },
  fromInfos: [WALLET_ADDRESS],
  toLock: WALLET_LOCK_SCRIPT,
});
```