import { RPC, Indexer } from '@ckb-lumos/lumos';
import { predefinedSporeConfigs } from '../../config';
import { createTestAccount } from './helpers';

const config = predefinedSporeConfigs.Aggron4;

export const TESTNET_ENV = {
  config,
  rpc: new RPC(config.ckbNodeUrl),
  indexer: new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl),
};

export const TESTNET_ACCOUNTS = {
  CHARLIE: createTestAccount('0xd6013cd867d286ef84cc300ac6546013837df2b06c9f53c83b4c33c2417f6a07', config),
  ALICE: createTestAccount('0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245', config),
};
