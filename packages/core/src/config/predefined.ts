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
            codeHash: '0x86973384d661ac5aabd581de082b04726d74705fa0f97602faf10089be0a0f85',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x024b39f1e840548a5f4c915ced950a79dbd0c78954290e472c995eb83f72b7cf',
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
            codeHash: '0x3df619d2d3b80b561394c57df504f3f13e1a1e3a0ea6f3f61ad2cc1da5af9911',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x5382cd28be1da97b2e7f2824b68e3e5613441b489031eab7d1346fe4a0b9a0cf',
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
            codeHash: '0xe91ea54245f007c9e0a8cea49e4ae40b4ebdbfa9fa4d52bc942c6772c0094767',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x67b99c9846262cfd459cbbada20d59c16c88d12d80f3841d19e0d5d612830de8',
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
            codeHash: '0x8b9c430c56be8194c4a7796ea88f54e8669f7832e5b6cd6aed5d69b91b9d0c85',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xca7792c1b373afa1a0ff859e202a4ce4dee080c04bc896143fddae2016f69205',
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
            codeHash: '0x6e9a921ae3bfbf132b1380fd35e151806b7b0413291094bdd4bd33ca7baef415',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xe6f6624bf28207aaf9c8e812723da28c27af54f6f262c8a314662dd11079e9f9',
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
