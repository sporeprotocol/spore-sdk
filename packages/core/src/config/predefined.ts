import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  scripts: {
    Spore: {
      script: {
        codeHash: '0x02d8136d628508ad53f67fccca6ae9744e98ee829783e8c30b8891be03d70ed2',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x209a39c4c93f603072cb01866a53d9e7064a1f63d4ba081e91b90b430062187e',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Cluster: {
      script: {
        codeHash: '0x8d2f24b55961808ab81b312e3ea789677e7c11ad7c059bf6b0ca16382bb1818e',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x209a39c4c93f603072cb01866a53d9e7064a1f63d4ba081e91b90b430062187e',
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
