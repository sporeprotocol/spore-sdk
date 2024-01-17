import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster' | 'ClusterProxy' | 'ClusterAgent' | 'Mutant' | 'Lua';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  maxTransactionSize: 500 * 1024, // 500 KB
  defaultTags: ['v2'],
  scripts: {
    Spore: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xfd2dc714c4d4cb81e8621e5c124465a048d06551b467f58eaa64041dd322cf81',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x4d75c3201b06d9d4e4058468abb2b5d9aebacd4b065f6a855b4cbc2f23dfb87f',
              index: '0x0',
            },
            depType: 'code',
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
        {
          tags: ['v1', 'latest'],
          script: {
            codeHash: '0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    Cluster: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x372b7c11d7b688e02d9c2b7604fbdf0dc898a0f6741854ea6c65d41f8ef4a64e',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x4072aa8ef8794cc8e70ae57c1dd29d2a343bc7f0cd6b13ce30ae6cd7d5b6a7d9',
              index: '0x0',
            },
            depType: 'code',
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
        {
          tags: ['v1', 'latest'],
          script: {
            codeHash: '0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x49551a20dfe39231e7db49431d26c9c08ceec96a29024eef3acc936deeb2ca76',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    ClusterProxy: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xfc1fbe95e7fb5be520f1adb2bdbd1529422613b02254ff01fd0f30604861ae36',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xbb0960de5c1960b57babd4cf4f468ac27572d24ef51dba8a2719f31dcebbc88f',
              index: '0x0',
            },
            depType: 'code',
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
      ],
    },
    ClusterAgent: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xa170fc93235213e90214e4273bb283e7979bf6477f70b4f2319d3777ec36235c',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x4951fba8ae56d10c409221e412b5b5457da8b23e92b1fab8c627f609a4f53929',
              index: '0x0',
            },
            depType: 'code',
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
      ],
    },
    Mutant: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x94a9b875911ace20f1f0d063a26495d14e4b04e32fd218261bb747f34e71ae47',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xc4a70f8569649f63ca96ca8d2863f57403d5a6bf03c0b831b6400d0e5dc7dc36',
              index: '0x0',
            },
            depType: 'code',
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
      ],
    },
    Lua: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xed08faee8c29b7a7c29bd9d495b4b93cc207bd70ca93f7b356f39c677e7ab0fc',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x8fb7170a58d631250dabd0f323a833f4ad2cfdd0189f45497e62beb8409e7a0c',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
  },
};

export const predefinedSporeConfigs = {
  Aggron4: TESTNET_SPORE_CONFIG,
};
