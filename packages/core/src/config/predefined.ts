import { predefined } from '@ckb-lumos/config-manager';
import { CNftConfig } from './types';

export type PredefinedCNftConfigScriptName = 'CNft' | 'Group';

const TestnetCNftConfig: CNftConfig<PredefinedCNftConfigScriptName> = {
  scripts: {
    CNft: {
      script: {
        codeHash: '0x' + '0'.repeat(62) + '01',
        hashType: 'type',
      },
      cellDep: {
        outPoint: {
          txHash: '0x' + '0'.repeat(62) + '11',
          index: '0x0',
        },
        depType: 'code',
      },
    },
    Group: {
      script: {
        codeHash: '0x' + '0'.repeat(62) + '02',
        hashType: 'type',
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
};

export const predefinedCNftConfigs = {
  Aggron4: TestnetCNftConfig,
};
