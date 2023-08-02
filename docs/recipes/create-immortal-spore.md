# Create immortal spores on-chain

## What is `immortal`

`Immortal` serves as a Spore Extension that offers the following rules:

1. Immortal extension is enabled for a spore if the spore has a `immortal=true` in its `SporeData.contentType`
2. An immortal spore lives on-chain forever, and cannot be destroyed under any circumstances

To create a spore with the immortal extension enabled, you need to pass the `immortal` parameter to the props of the `createSpore` API when calling it. 

Once an immortal spore is successfully created, any attempt from the owner to destroy it will fail due to the verification by the `SporeType` script.

## Create immortal spores

There are two recommended ways to set the `immortal` parameters while creating a spore. Both approaches are equally valid and will successfully achieve the intended result. Feel free to choose the one you prefer.

### Specify in the `contentTypeParameters` object

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

### Use the `setContentTypeParameters` function

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