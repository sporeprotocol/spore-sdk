import { Hash, Script } from '@ckb-lumos/base';
import { RPC, Indexer, hd, HexString, helpers } from '@ckb-lumos/lumos';
import { defaultEmptyWitnessArgs, updateWitnessArgs } from '../../helpers';
import { predefinedCNftConfigs } from '../../config';

const config = predefinedCNftConfigs.Aggron4;

export const TESTNET_ENV = {
  config,
  rpc: new RPC(config.ckbNodeUrl),
  indexer: new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl),
};

export const TESTNET_ACCOUNTS = {
  CHARLIE: createTestAccount('0xd6013cd867d286ef84cc300ac6546013837df2b06c9f53c83b4c33c2417f6a07'),
  ALICE: createTestAccount('0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245'),
};

function createTestAccount(privateKey: HexString) {
  const Secp256k1Blake160 = config.lumos.SCRIPTS.SECP256K1_BLAKE160!;

  const lock: Script = {
    codeHash: Secp256k1Blake160.CODE_HASH,
    hashType: Secp256k1Blake160.HASH_TYPE,
    args: hd.key.privateKeyToBlake160(privateKey),
  };
  const address = helpers.encodeToAddress(lock, {
    config: config.lumos,
  });

  function signTransaction(txSkeleton: helpers.TransactionSkeletonType) {
    const signatures = new Map<HexString, Hash>();
    const signingEntries = txSkeleton.get('signingEntries');

    let witnesses = txSkeleton.get('witnesses');
    for (let i = 0; i < signingEntries.size; i++) {
      const entry = signingEntries.get(i)!;
      if (entry.type === 'witness_args_lock') {
        if (!signatures.has(entry.message)) {
          signatures.set(entry.message, signMessage(entry.message));
        }

        const signature = signatures.get(entry.message)!;

        const witness = witnesses.get(entry.index, defaultEmptyWitnessArgs);
        const newWitness = updateWitnessArgs(witness, 'lock', signature);
        witnesses = witnesses.set(entry.index, newWitness);
      }
    }

    return txSkeleton.set('witnesses', witnesses);
  }

  function signMessage(message: HexString): Hash {
    return hd.key.signRecoverable(message, privateKey);
  }

  return {
    lock,
    address,
    signMessage,
    signTransaction,
  };
}
