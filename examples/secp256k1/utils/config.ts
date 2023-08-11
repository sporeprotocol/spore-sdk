import { predefinedSporeConfigs } from '@spore-sdk/core';
import { createWalletByPrivateKey } from './wallet';

/**
 * SporeConfig provides spore/cluster's detailed info like ScriptIds and CellDeps.
 * It is a necessary part for constructing spore/cluster transactions.
 */
export const config = predefinedSporeConfigs.Aggron4;

/**
 * Wallets with default testing accounts for running the examples,
 * feel free to replace them with your own testing accounts.
 */
export const accounts = {
  CHARLIE: createWalletByPrivateKey('0xc153ee57dc8ae3dac3495c828d6f8c3fef6b1d0c74fc31101c064137b3269d6d', config),
  ALICE: createWalletByPrivateKey('0x49aa6d595ac46cc8e1a31b511754dd58f241a7d8a6ad29e83d6b0c1a82399f3d', config),
};