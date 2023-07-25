import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  scripts: {
    Spore: {
      script: {
        codeHash: '0x5018bbe90ab04f5635bdf3762297ca565622d9b21eda8d91c545a72adc6b6c51',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x7c1cbd6da241eb219234bbd138105ccf5a46998efaefd894b009d1fd14b22ba2',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Cluster: {
      script: {
        codeHash: '0x4d54365c46a085a48a087363053c084f103c8168467602876b6b232d24d6c3d3',
        hashType: 'data1',
      },
      cellDep: {
        outPoint: {
          txHash: '0x7c1cbd6da241eb219234bbd138105ccf5a46998efaefd894b009d1fd14b22ba2',
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
