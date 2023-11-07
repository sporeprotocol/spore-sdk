import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  maxTransactionSize: 500 * 1024, // 500 KB
  scripts: {
    Spore: {
      script: {
        codeHash: '0xf8dd8ff57eb07a78f213b43665fc0f32313acd32f8596f84faa8a01d20d0805f',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x33042bd2a214d8698939cd5cb1f9d83ab8dfd0b8ef4ddfc21e9fd4a76174576e',
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
  },
  extensions: [],
};

export const predefinedSporeConfigs = {
  Aggron4: TESTNET_SPORE_CONFIG,
};
