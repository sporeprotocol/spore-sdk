/** Disposable local-devnet fixture only. No public presets or wallet secrets. */
import { expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { BI, Cell, hd, helpers, Indexer, RPC, utils } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { secp256k1Blake160 } from '@ckb-lumos/lumos/common-scripts';
import { SporeConfig } from '../packages/core/src/config';
import { injectCapacityAndPayFee } from '../packages/core/src/helpers';
import { createMutant } from '../packages/core/src/api';

it('provisions isolated local v2/v3 code and public fixture keys', async () => {
  const output = process.env.SPORE_V3_LOCAL_RECORDS;
  const v3 = process.env.SPORE_V3_LOCAL_BINARIES;
  const legacy = process.env.SPORE_V3_LEGACY_BINARIES;
  if (!output || !v3 || !legacy) throw new Error('Explicit local record/binary directories required');
  const endpoint = 'http://127.0.0.1:28114';
  const rpc = new RPC(endpoint),
    indexer = new Indexer(endpoint, endpoint);
  const genesis = await rpc.getBlockByNumber('0x0');
  if (!genesis) throw new Error('No local genesis');
  const secp = genesis.transactions[0].outputs[1];
  const lumos = {
    PREFIX: 'ckt',
    SCRIPTS: {
      SECP256K1_BLAKE160: {
        CODE_HASH: utils.computeScriptHash(secp.type!),
        HASH_TYPE: 'type' as const,
        TX_HASH: genesis.transactions[1].hash!,
        INDEX: '0x0',
        DEP_TYPE: 'depGroup' as const,
        SHORT_ID: 0,
      },
    },
  };
  expect(lumos.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH).toBe(
    '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  );
  const key = '0x' + '2a'.repeat(32); // public disposable fixture only
  const lock = {
    codeHash: lumos.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
    hashType: 'type' as const,
    args: hd.key.privateKeyToBlake160(key),
  };
  const address = helpers.encodeToAddress(lock, { config: lumos });
  const config: SporeConfig = {
    lumos,
    ckbNodeUrl: endpoint,
    ckbIndexerUrl: endpoint,
    scripts: {},
    defaultTags: ['v2', 'preview'],
    maxTransactionSize: 500 * 1024,
  };
  const wait = async (hash: string) => {
    const limit = Date.now() + 60000;
    while (Date.now() < limit) {
      const tx = await rpc.getTransaction(hash);
      if (tx?.txStatus.status === 'rejected') throw new Error(`Rejected fixture ${hash}`);
      if (tx?.txStatus.status === 'committed') {
        const header = await rpc.getHeader(tx.txStatus.blockHash!);
        if (BI.from((await indexer.tip()).blockNumber).gte(header!.number)) return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Fixture commit/indexer timeout ${hash}`);
  };
  const send = async (tx: helpers.TransactionSkeletonType) => {
    const prepared = secp256k1Blake160.prepareSigningEntries(tx, { config: lumos });
    const signed = helpers.sealTransaction(
      prepared,
      prepared
        .get('signingEntries')
        .map((e) => hd.key.signRecoverable(e.message, key))
        .toArray(),
    );
    const hash = await rpc.sendTransaction(signed, 'passthrough');
    await wait(hash);
    return hash;
  };
  const records: Record<string, unknown> = {};
  const deploy = async (name: string, file: string, hashType: 'data1' | 'data2') => {
    const content = readFileSync(file),
      data = bytes.hexify(content);
    // Code outputs are kept outside the funding wallet's collector.
    const cell: Cell = {
      cellOutput: { capacity: '0x0', lock: { codeHash: '0x' + '00'.repeat(32), hashType: 'data', args: '0x' } },
      data,
    };
    cell.cellOutput.capacity = helpers.minimalCellCapacityCompatible(cell).add(100_00000000).toHexString();
    let tx = helpers.TransactionSkeleton({ cellProvider: indexer }).update('outputs', (o) => o.push(cell));
    tx = (await injectCapacityAndPayFee({ txSkeleton: tx, fromInfos: [address], config, feeRate: 1000 })).txSkeleton;
    const hash = await send(tx);
    const entry = {
      script: { codeHash: utils.ckbHash(data), hashType },
      cellDep: { outPoint: { txHash: hash, index: '0x0' }, depType: 'code' as const },
    };
    records[name] = {
      ...entry,
      file: resolve(file),
      bytes: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    };
    console.log('deployed', name, hash);
    return entry;
  };
  for (const [name, file] of Object.entries({
    Spore: 'spore',
    Cluster: 'cluster',
    ClusterProxy: 'cluster_proxy',
    ClusterAgent: 'cluster_agent',
    Mutant: 'spore_extension_lua',
    Lua: 'libckblua.so',
  })) {
    const entry = await deploy('legacy-' + name, join(legacy, file), 'data1');
    config.scripts[name] = {
      versions: [
        {
          ...entry,
          tags: ['v2', 'preview'],
          behaviors: {
            cobuild: true,
            lockProxy: true,
            ...(name === 'Mutant' ? { mutantRuntime: 'lua' as const } : {}),
          },
        },
      ],
    };
  }
  const Spore = await deploy('v3-Spore', join(v3, 'spore'), 'data2');
  const Mutant = await deploy('v3-Mutant', join(v3, 'spore_extension_rust'), 'data2');
  const published = await createMutant({
    data: new TextEncoder().encode('assert(true)'),
    toLock: lock,
    fromInfos: [address],
    config,
  });
  const legacyTx = await send(published.txSkeleton);
  const deployment = { contractCommit: '46eaa8b59abe818f27dcfe3c7af0da46698c12f8', Spore, Mutant };
  mkdirSync(output, { recursive: true });
  writeFileSync(
    join(output, 'deployments.json'),
    JSON.stringify({ node: await rpc.localNodeInfo(), genesisHash: genesis.header.hash, contracts: records }, null, 2) +
      '\n',
  );
  writeFileSync(
    join(output, 'devnet-manifest.json'),
    JSON.stringify(
      {
        baseConfig: config,
        deployment,
        genesisHash: genesis.header.hash,
        legacyMutantOutPoint: { txHash: legacyTx, index: BI.from(published.outputIndex).toHexString() },
        binaries: {
          Spore: join(v3, 'spore'),
          Mutant: join(v3, 'spore_extension_rust'),
          rule: join(v3, 'mutant_equipment'),
        },
      },
      null,
      2,
    ) + '\n',
  );
}, 240000);
