/** Run explicitly against an already provisioned, reviewed disposable devnet.
 * No deployment, mining, key import or remote endpoint is performed here. */
import { expect, it } from 'vitest';
import { capture } from './capture';
import { readFileSync } from 'node:fs';
import { BI, Cell, hd, helpers, Indexer, RPC, utils } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { blockchain, OutPoint } from '@ckb-lumos/base';
import { packRawSporeData } from '../packages/core/src/codec';
import { setContentTypeParameters } from '../packages/core/src/helpers/contentType';
import { secp256k1Blake160 } from '@ckb-lumos/lumos/common-scripts';
import { createSpore, transferSpore, meltSpore, createMutant, transferMultipleSpore } from '../packages/core/src/api';
import { SporeConfig, getSporeScript } from '../packages/core/src/config';
import { createV3Config, V3Deployment, checkPlainSporeIntent } from '../packages/core/src/v3';
import { injectCommonCobuildProof } from '../packages/core/src/cobuild/base/witnessLayout';
import { assembleCreateSporeAction } from '../packages/core/src/cobuild/action/spore/createSpore';

it('real SDK → real signatures → devnet: native lifecycle, optional Actions and v2 isolation', async () => {
  if (!process.env.SPORE_V3_DEVNET_MANIFEST) throw new Error('SPORE_V3_DEVNET_MANIFEST is required; no fallback/skip');
  const manifest: {
    baseConfig: SporeConfig;
    deployment: V3Deployment;
    genesisHash: string;
    legacyMutantOutPoint: OutPoint;
    binaries: { Spore: string; Mutant: string; rule: string };
  } = JSON.parse(readFileSync(process.env.SPORE_V3_DEVNET_MANIFEST, 'utf8'));
  const config = createV3Config(manifest.baseConfig, manifest.deployment);
  for (const url of [config.ckbNodeUrl, config.ckbIndexerUrl]) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
      throw new Error('This runner is restricted to local disposable devnets');
    }
  }
  expect(manifest.deployment.contractCommit).toBe('46eaa8b59abe818f27dcfe3c7af0da46698c12f8');
  const rpc = new RPC(config.ckbNodeUrl);
  const indexer = new Indexer(config.ckbIndexerUrl, config.ckbNodeUrl);
  expect(await rpc.getBlockHash('0x0')).toBe(manifest.genesisHash);
  for (const name of ['Spore', 'Mutant'] as const) {
    const entry = manifest.deployment[name];
    const live = await rpc.getLiveCell(entry.cellDep.outPoint, true);
    expect(live.status).toBe('live');
    const data = bytes.hexify(readFileSync(manifest.binaries[name]));
    expect(live.cell!.data.content).toBe(data);
    expect(utils.ckbHash(data)).toBe(entry.script.codeHash);
  }
  // Public test keys: fund only on the disposable devnet, never on a public network.
  const wallet = (byte: string) => {
    const key = '0x' + byte.repeat(32);
    const lock = {
      codeHash: config.lumos.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
      hashType: config.lumos.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
      args: hd.key.privateKeyToBlake160(key),
    };
    return { key, lock, address: helpers.encodeToAddress(lock, { config: config.lumos }) };
  };
  const alice = wallet('2a'),
    bob = wallet('2b');
  const sign = (tx: helpers.TransactionSkeletonType, key: string) => {
    const prepared = secp256k1Blake160.prepareSigningEntries(tx, { config: config.lumos });
    return helpers.sealTransaction(
      prepared,
      prepared
        .get('signingEntries')
        .map((e) => hd.key.signRecoverable(e.message, key))
        .toArray(),
    );
  };
  const committed = async (hash: string) => {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const tx = await rpc.getTransaction(hash);
      if (tx?.txStatus.status === 'rejected') throw new Error(`Rejected transaction ${hash}`);
      if (tx?.txStatus.status === 'committed') {
        const header = await rpc.getHeader(tx.txStatus.blockHash!);
        const tip = await indexer.tip();
        if (BI.from(tip.blockNumber).gte(header!.number)) return;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`Commit/indexer timeout ${hash}`);
  };
  const send = async (tx: helpers.TransactionSkeletonType, key: string, plain = true) => {
    if (plain) checkPlainSporeIntent(tx, config);
    const signed = sign(tx, key);
    await capture(signed, rpc);
    const hash = await rpc.sendTransaction(signed, 'passthrough');
    await committed(hash);
    return hash;
  };
  const reject = async (tx: ReturnType<typeof sign>, code?: number) => {
    await capture(tx, rpc, code, true);
    let error: unknown;
    try {
      await rpc.sendTransaction(tx, 'passthrough');
    } catch (e) {
      error = e;
    }
    expect(error, 'Transaction unexpectedly accepted').toBeDefined();
    const message = String(error);
    expect(message).toMatch(/ValidationFailure|Script.*(?:error|validation)/i);
    if (code !== undefined) expect(message).toMatch(new RegExp(`error code ${code}(?:\\D|$)`));
  };
  const outPoint = (hash: string, index: number) => ({ txHash: hash, index: BI.from(index).toHexString() });
  const noAction = (tx: helpers.TransactionSkeletonType) =>
    expect(tx.get('witnesses').size).toBe(tx.get('inputs').size);
  const make = async (content = '0x030407', mutants?: string[], cfg = config) =>
    createSpore({
      data: {
        contentType: 'application/octet-stream',
        content,
        contentTypeParameters: mutants ? { mutant: mutants } : {},
      },
      toLock: alice.lock,
      fromInfos: [alice.address],
      config: cfg,
    });
  // Native publication invokes `create`; rule execution is proven by a rejecting mint.
  const published = await createMutant({
    data: readFileSync(manifest.binaries.rule),
    toLock: alice.lock,
    fromInfos: [alice.address],
    config,
  });
  const ruleCell = published.txSkeleton.get('outputs').get(published.outputIndex)!;
  expect(ruleCell.cellOutput.type!.hashType).toBe('data2');
  const ruleId = ruleCell.cellOutput.type!.args.slice(0, 66);
  const ruleHash = await send(published.txSkeleton, alice.key, false);
  const invalid = await make('0x030408', [ruleId]);
  await reject(sign(invalid.txSkeleton, alice.key), 93);
  // Bypass builder preflight deliberately: the contract must reject Lua itself.
  const lua = await createMutant({
    data: readFileSync(manifest.binaries.rule),
    toLock: alice.lock,
    fromInfos: [alice.address],
    config,
    updateOutput: (cell) => ({ ...cell, data: '0x72657475726e2030' }),
  });
  await reject(sign(lua.txSkeleton, alice.key), 91);
  for (const mutants of [undefined, [ruleId]]) {
    const minted = await make('0x030407', mutants);
    noAction(minted.txSkeleton);
    if (mutants)
      expect(minted.txSkeleton.get('cellDeps').toArray()).toContainEqual({
        outPoint: outPoint(ruleHash, published.outputIndex),
        depType: 'code',
      });
    const unsigned = helpers.createTransactionFromSkeleton(minted.txSkeleton);
    await reject(unsigned); // real secp Lock rejects missing signature
    await reject(sign(minted.txSkeleton, bob.key)); // wrong signer
    const hash = await send(minted.txSkeleton, alice.key);
    const transferred = await transferSpore({ outPoint: outPoint(hash, minted.outputIndex), toLock: bob.lock, config });
    noAction(transferred.txSkeleton);
    const signed = sign(transferred.txSkeleton, alice.key);
    const tampered = structuredClone(signed);
    tampered.outputs[transferred.outputIndex].lock = alice.lock;
    await reject(tampered);
    const movedHash = await send(transferred.txSkeleton, alice.key);
    const melted = await meltSpore({ outPoint: outPoint(movedHash, transferred.outputIndex), config });
    noAction(melted.txSkeleton);
    const meltedHash = await send(melted.txSkeleton, bob.key);
    const consumed = outPoint(movedHash, transferred.outputIndex);
    const onChainMelt = await rpc.getTransaction(meltedHash);
    expect(onChainMelt!.txStatus.status).toBe('committed');
    expect(
      onChainMelt!.transaction!.inputs.some(
        (input) => input.previousOutput.txHash === consumed.txHash && input.previousOutput.index === consumed.index,
      ),
    ).toBe(true);
    // CKB 0.200 can report a spent output as unknown rather than dead.
    expect((await rpc.getLiveCell(consumed, true)).status).not.toBe('live');
  }
  // Explicit optional Action: check before signing; altered trailing witness fails Lock.
  const optional = await make();
  const cell = optional.txSkeleton.get('outputs').get(optional.outputIndex)!;
  let withAction = injectCommonCobuildProof({
    txSkeleton: optional.txSkeleton,
    actions: assembleCreateSporeAction(cell).actions,
  }).txSkeleton;
  expect(checkPlainSporeIntent(withAction, config).hasAction).toBe(true);
  // Manually appended Action changes fees: reduce existing untyped change before signing.
  const changeIndex = withAction.get('outputs').findIndex((c) => !c.cellOutput.type);
  if (changeIndex < 0) throw new Error('Optional Action fixture needs an untyped change output');
  withAction = withAction.update('outputs', (outputs) =>
    outputs.update(changeIndex, (c) => ({
      ...c!,
      cellOutput: { ...c!.cellOutput, capacity: BI.from(c!.cellOutput.capacity).sub(1_00000000).toHexString() },
    })),
  );
  const signed = sign(withAction, alice.key);
  signed.witnesses[signed.witnesses.length - 1] = '0xff';
  await reject(signed);
  await send(withAction, alice.key);
  // Historical Lua-typed rule Cell cannot be executed by the new Spore binary.
  const legacy = await rpc.getLiveCell(manifest.legacyMutantOutPoint, true);
  expect(legacy.status).toBe('live');
  const legacyType = legacy.cell!.output.type!;
  const legacyScript = getSporeScript(manifest.baseConfig, 'Mutant', legacyType);
  expect(legacyType.hashType).not.toBe('data2');
  const oldRuleMint = await make();
  let legacyPath = oldRuleMint.txSkeleton.update('outputs', (outputs) =>
    outputs.update(oldRuleMint.outputIndex, (cell) => ({
      ...cell!,
      cellOutput: { ...cell!.cellOutput, capacity: BI.from(cell!.cellOutput.capacity).add(200_00000000).toHexString() },
      data: bytes.hexify(
        packRawSporeData({
          contentType: setContentTypeParameters('application/octet-stream', { mutant: [legacyType.args.slice(0, 66)] }),
          content: '0x030407',
        }),
      ),
    })),
  );
  const legacyChange = legacyPath.get('outputs').findIndex((c) => !c.cellOutput.type);
  if (legacyChange < 0) throw new Error('Legacy-path fixture requires change');
  legacyPath = legacyPath.update('outputs', (outputs) =>
    outputs.update(legacyChange, (cell) => ({
      ...cell!,
      cellOutput: { ...cell!.cellOutput, capacity: BI.from(cell!.cellOutput.capacity).sub(201_00000000).toHexString() },
    })),
  );
  legacyPath = legacyPath.update('cellDeps', (deps) =>
    deps.push(legacyScript.cellDep, getSporeScript(manifest.baseConfig, 'Lua').cellDep, {
      outPoint: manifest.legacyMutantOutPoint,
      depType: 'code',
    }),
  );
  await reject(sign(legacyPath, alice.key), 71);
  // Signed but misleading pre-signing intent can pass core validation: wallet must refuse.
  const misleading = await make();
  const actual = misleading.txSkeleton.get('outputs').get(misleading.outputIndex)!;
  const claimed = { ...actual, cellOutput: { ...actual.cellOutput, lock: bob.lock } };
  let badIntent = injectCommonCobuildProof({
    txSkeleton: misleading.txSkeleton,
    actions: assembleCreateSporeAction(claimed).actions,
  }).txSkeleton;
  expect(() => checkPlainSporeIntent(badIntent, config)).toThrow(/Action/);
  const change = badIntent.get('outputs').findIndex((c) => !c.cellOutput.type);
  if (change < 0) throw new Error('Misleading intent fixture requires change');
  badIntent = badIntent.update('outputs', (outputs) =>
    outputs.update(change, (c) => ({
      ...c!,
      cellOutput: { ...c!.cellOutput, capacity: BI.from(c!.cellOutput.capacity).sub(1_00000000).toHexString() },
    })),
  );
  await send(badIntent, alice.key, false); // deliberate core/policy distinction on disposable devnet
  // Historical contracts come from the LOCAL manifest, never public-network outpoints.
  const oldConfig = structuredClone(manifest.baseConfig);
  oldConfig.defaultTags = ['v2', 'preview'];
  const old = await make('0x01', undefined, oldConfig);
  const oldScript = getSporeScript(oldConfig, 'Spore');
  expect(oldScript.behaviors?.cobuild).toBe(true);
  const oldBare = old.txSkeleton.set(
    'witnesses',
    old.txSkeleton.get('witnesses').slice(0, old.txSkeleton.get('inputs').size),
  );
  await reject(sign(oldBare, alice.key)); // v2 still enforces its historical Action
  const oldHash = await send(old.txSkeleton, alice.key);
  const fresh = await make();
  const freshHash = await send(fresh.txSkeleton, alice.key);
  const batch = await transferMultipleSpore({
    outPoints: [outPoint(oldHash, old.outputIndex), outPoint(freshHash, fresh.outputIndex)],
    toLock: bob.lock,
    config,
  });
  expect(batch.txSkeleton.get('cellDeps').toArray()).toContainEqual(oldScript.cellDep);
  expect(batch.txSkeleton.get('cellDeps').toArray()).toContainEqual(manifest.deployment.Spore.cellDep);
  // Mixed versions intentionally have Action only for v2; wallet checks that subset.
  await send(batch.txSkeleton, alice.key);
}, 240000);
