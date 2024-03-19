import { resolve } from 'path';
import { RPC, Indexer } from '@ckb-lumos/lumos';
import { getEnvVariable, generateTestConfig, createDefaultLockAccount } from '../helpers';
import { forkSporeConfig } from '../../config';

export const TEST_VARIABLES = {
  network: getEnvVariable('VITE_NETWORK', 'string', 'testnet'),
  configPath: getEnvVariable('VITE_CONFIG_PATH', 'string', '../tmp/config.json'),
  tests: {
    clusterV1: getEnvVariable('VITE_TEST_CLUSTER_V1', 'boolean', false),
  },
  accounts: {
    charlie: getEnvVariable(
      'VITE_ACCOUNT_CHARLIE',
      'string',
      '0xc153ee57dc8ae3dac3495c828d6f8c3fef6b1d0c74fc31101c064137b3269d6d',
    ),
    alice: getEnvVariable(
      'VITE_ACCOUNT_ALICE',
      'string',
      '0x49aa6d595ac46cc8e1a31b511754dd58f241a7d8a6ad29e83d6b0c1a82399f3d',
    ),
  },
};

const config = generateTestConfig(TEST_VARIABLES.network, resolve(__dirname, TEST_VARIABLES.configPath));

export const TEST_ENV = {
  config,
  v1Config: forkSporeConfig(config, {
    defaultTags: ['v1'],
  }),
  rpc: new RPC(config.ckbNodeUrl),
  indexer: new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl),
};

export const TEST_ACCOUNTS = {
  CHARLIE: createDefaultLockAccount('0xc153ee57dc8ae3dac3495c828d6f8c3fef6b1d0c74fc31101c064137b3269d6d', config),
  ALICE: createDefaultLockAccount('0x49aa6d595ac46cc8e1a31b511754dd58f241a7d8a6ad29e83d6b0c1a82399f3d', config),
};
