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
          tags: ['v2'],
          script: {
            codeHash: '0xd0d46552fc27b489425bb8f72ea9a371df49c978b27e1e7e8bffe6f9c72560c6',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x42dfa042a0e99a8007376b9880f58d02e5e5659676a359d080ba32b3cd5a703e',
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
          tags: ['v2'],
          script: {
            codeHash: '0x15f835c4ca0b861df38f10d4e95c51ba9cee3c89f178b21e2e28baa67ebd8b42',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xd2074fecae077a6b8e6be04a6809829bbfc003aca6616f00905fc6198aed9c3d',
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
          tags: ['v2'],
          script: {
            codeHash: '0x428457c447f0200e302c3b64f0ee0c165b759e9d3b98118c55710bf2f294a7c2',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xd2074fecae077a6b8e6be04a6809829bbfc003aca6616f00905fc6198aed9c3d',
              index: '0x1',
            },
            depType: 'code',
          },
        },
      ],
    },
    ClusterAgent: {
      versions: [
        {
          tags: ['v2'],
          script: {
            codeHash: '0xe3682566556fa3439c24f7f9f9306abc292c15010943494133d8940d0e05ba32',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x69008e68e680a228b81af12ef2bd7369eb2adac17d1db958d5d36a595e6920e2',
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
          tags: ['v2'],
          script: {
            codeHash: '0xb4d3f207831e2774d310a87571fb0095f5b4af4fa176d8bfaae0191a4d6989c8',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x384b17cf549e261bf55917e6b515e0852a1272c43e6c427201542f333ba37f4b',
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
          tags: ['v2'],
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
