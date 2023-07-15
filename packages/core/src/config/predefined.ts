import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  scripts: {
    Spore: {
      script: {
        codeHash: '0x' + '0'.repeat(62) + '01',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x' + '0'.repeat(62) + '11',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Cluster: {
      script: {
        codeHash: '0x' + '0'.repeat(62) + '02',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x' + '0'.repeat(62) + '22',
          index: '0x0',
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
