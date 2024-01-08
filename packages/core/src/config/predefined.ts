import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster' | 'ClusterProxy' | 'ClusterAgent' | 'Mutant' | 'Lua';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  maxTransactionSize: 500 * 1024, // 500 KB
  scripts: {
    Spore: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x477cf211cc3904e059fa2a870b29090684099b14cdca9badfd95956a7800c417',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xa3d9bea0e4e26088a3d8929138ae08209dbbb547d843bc76ec9fb5b5153b14d3',
              index: '0x0',
            },
            depType: 'code',
          },
        },
        {
          tags: ['v1'],
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
            codeHash: '0xa5b26d4d9336066cedbbf359430864bfaa687113d7207bcf797363b9d2fa65af',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xb463cc2a0e4eb12f188140bb11b07ea4682ed1d6f20b7d1e5ab2868e4105df0d',
              index: '0x0',
            },
            depType: 'code',
          },
        },
        {
          tags: ['v1'],
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
            codeHash: '0xf8d0ec631924ea37e9fce95c97c52a5b37ceb344c32c8a03a494876daa00d574',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xa66de1ec29e765df9d2eb96e103b0664c52f358ed1f01491f791c6d4dec5d932',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    ClusterAgent: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xc3c7f206759b33b5cfcde1ee84f9030059dadb08072a4edd96b39ffd4f16a9f1',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xb6e52b4e96e5e88679657d3b930d1b4b7bf95437cd442ea73d942ee0214320cf',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    Mutant: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x1fe5301fcaa6e2078a09b76d11b5ecea5920c5b0f3ed8ef8c7eb893356bd84bd',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x3b52500e30c892fbcf6be35fd94cb0530822d68d9c389ad0de59c7d86a409561',
              index: '0x0',
            },
            depType: 'code',
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
