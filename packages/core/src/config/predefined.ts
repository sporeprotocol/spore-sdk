import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster' | 'ClusterProxy' | 'ClusterAgent';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  maxTransactionSize: 500 * 1024, // 500 KB
  scripts: {
    Spore: {
      script: {
        codeHash: '0x730f1c1b69247f6404112f1f4b943874ae8c61db16df014da696c050f05021fb',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x56f5dbbafccf025c2fde98fda20498dc98245a0a28fce2db190cd24cc3636c6d',
          index: '0x0',
        },
        depType: 'code',
      },
      versions: [
        {
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
      versions: [],
    },
    ClusterProxy: {
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
      versions: [],
    },
    ClusterAgent: {
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
      versions: [],
    },
  },
  extensions: [],
};

export const predefinedSporeConfigs = {
  Aggron4: TESTNET_SPORE_CONFIG,
};
