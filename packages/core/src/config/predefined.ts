import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  scripts: {
    Spore: {
      script: {
        codeHash: '0x9a788c1d3c2132538547c67dc638c7bacb39d131800a3a665dbc3a594c39433b',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0xaeab4bf61cae63e4c75de7c5b62c4b9e42d96b1cd4f1ff3e143390c7c0b391c1',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Cluster: {
      script: {
        codeHash: '0xb0a53ec84dfc7667303c8a3bb0fe3532a65c7f066200ae9ceb1adb051c73595e',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0xaeab4bf61cae63e4c75de7c5b62c4b9e42d96b1cd4f1ff3e143390c7c0b391c1',
          index: '0x1',
        },
        depType: 'code',
      },
    },
  },
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  extensions: [],
};

export const predefinedSporeConfigs = {
  Aggron4: TESTNET_SPORE_CONFIG,
};
