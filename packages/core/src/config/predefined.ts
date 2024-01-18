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
            codeHash: '0xa32df38d2de1da82cbcb9e4467f8c18479596394eea977e471b75be5fe3e9c67',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xfad85d02822b7ee7c0fe9879c03fcaff695aa7ff2b7a7b740966bf49f47c29c1',
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
            codeHash: '0x5203a3baf931c15a809c4a0bb7041aebb73118281e31e8d104d926b8523977b1',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xa23dbb38208fd50ce99404780a769784c77bd95a32e0af72c3a87de85d0bf1ba',
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
            codeHash: '0x08e5cecab2bbdea9139534a822d46b82929e06f12f00c68343a88a58827cd3db',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x4ca4dcba0f907f054ceace6061f6a143aeea80107eb48fa296d27af63a1714ea',
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
            codeHash: '0x88850ac632eed604f0ad784394004db384d0eea8038a24eee83439687d79343f',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xde33357919460d527abf53ff61881e62e0b3afc5f4fb95b34783b5827e59d82d',
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
