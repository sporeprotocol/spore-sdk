# Create immortal spores on-chain

Immortal is a Spore Extension that provides the following features:
- An immortal spore will live on-chain forever and cannot be destroyed 
- Spore Extensions can only be added on a spore on the spore's creation

Immortal is a initial extension that comes with the Spore Protocol, which is why we call it Spore Core Extension. 

If you want to create a spore with immortal extension enabled, you need to pass the `immortal` parameter to the props of the `createSpore` API when calling it:

```typescript
import { createSpore, predefinedSporeConfigs } from '@spore-sdk/core';

let { txSkeleton } = await createSpore({
  data: {
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

From the example, the new spore will be immortal on-chain. Then, if the owner tries to destroy the spore, the transaction will fail when verified by the Spore Type script.