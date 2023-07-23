import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  scripts: {
    Spore: {
      script: {
        codeHash: '0x91173301599129f1c07e6b86b84755938d2f07f066433c49651151bd863a781f',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x812c62476a9e83f4cd0e004bf19606de5ea29c077ccf201beb2ff8c5ee4924c7',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Cluster: {
      script: {
        codeHash: '0xc6b9b2ca67265b9b0eeeac5096a869762143a0195f6ee9efca1b20a17ee1c618',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x812c62476a9e83f4cd0e004bf19606de5ea29c077ccf201beb2ff8c5ee4924c7',
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
