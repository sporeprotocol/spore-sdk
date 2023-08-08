import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  scripts: {
    Spore: {
      script: {
        codeHash: '0xc1a7e2d2bd7e0fa90e2f1121782aa9f71204d1fee3a634bf3b12c61a69ee574f',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0xdc6068c4e5469b8b4e1df23295f87cf2f568c41661cd481e81ae1dd4c8bc3797',
          index: '0x0',
        },
        depType: 'code',
      },
      versions: [],
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
