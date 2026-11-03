#!/usr/bin/env node
// Install and execute the pinned toolchain in a disposable workspace. Never
// create, replace or reuse the checkout's root node_modules or build outputs.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'offline';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = {
  offline: [],
  devnet: ['SPORE_V3_DEVNET_MANIFEST'],
  provision: ['SPORE_V3_LOCAL_RECORDS', 'SPORE_V3_LOCAL_BINARIES', 'SPORE_V3_LEGACY_BINARIES'],
};
if (!Object.hasOwn(required, mode) || process.argv.length > 3) {
  console.error('Usage: interop/run.sh [offline|devnet|provision]');
  process.exit(2);
}
for (const name of required[mode]) {
  if (!process.env[name]) {
    console.error(`${name} is required for ${mode}; no network fallback or skip`);
    process.exit(2);
  }
}
const env = { ...process.env };
for (const name of ['SPORE_V3_DEVNET_MANIFEST', 'SPORE_V3_VM_CAPTURE', ...required.provision]) {
  if (env[name]) env[name] = resolve(env[name]);
}
if (mode === 'offline') {
  // The legacy pure-unit fixtures otherwise inherit unrelated wallet/network
  // settings from the invoking shell. These selected files make no RPC calls.
  for (const name of [
    'VITE_NETWORK',
    'VITE_CONFIG_PATH',
    'VITE_ACCOUNT_ALICE',
    'VITE_ACCOUNT_BOB',
    'VITE_ACCOUNT_CHARLIE',
  ]) {
    delete env[name];
  }
}
const workspace = mkdtempSync(join(tmpdir(), 'spore-v3-interop-'));
let child;
let interrupted;
const signals = ['SIGINT', 'SIGTERM'];
const handlers = signals.map((signal) => {
  const handler = () => {
    interrupted = signal;
    process.exitCode = signal === 'SIGINT' ? 130 : 143;
    child?.kill(signal);
  };
  process.on(signal, handler);
  return handler;
});
async function run(command, args, shell = false) {
  if (interrupted) throw new Error(`Interrupted by ${interrupted}`);
  await new Promise((done, fail) => {
    child = spawn(command, args, { cwd: workspace, env, stdio: 'inherit', shell });
    child.once('error', (error) => {
      child = undefined;
      fail(error);
    });
    child.once('exit', (code, signal) => {
      child = undefined;
      if (code === 0 && !interrupted) done();
      else {
        process.exitCode = interrupted === 'SIGINT' ? 130 : interrupted === 'SIGTERM' ? 143 : code || 1;
        fail(new Error(`${command} failed (${signal ?? code ?? interrupted})`));
      }
    });
  });
}
try {
  cpSync(join(root, 'tsconfig.json'), join(workspace, 'tsconfig.json'));
  mkdirSync(join(workspace, 'packages/core'), { recursive: true });
  cpSync(join(root, 'packages/core/src'), join(workspace, 'packages/core/src'), { recursive: true });
  for (const file of ['package.json', 'tsconfig.json', 'tsconfig.build.json']) {
    cpSync(join(root, 'packages/core', file), join(workspace, 'packages/core', file));
  }
  mkdirSync(join(workspace, 'interop'));
  for (const file of readdirSync(join(root, 'interop'))) {
    if (/\.(ts|json)$/.test(file)) cpSync(join(root, 'interop', file), join(workspace, 'interop', file));
  }
  for (const file of ['package.json', 'package-lock.json']) {
    cpSync(join(root, 'interop/tooling', file), join(workspace, file));
  }
  await run(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['ci', '--ignore-scripts', '--no-audit', '--no-fund'],
    process.platform === 'win32',
  );
  const tsc = join(workspace, 'node_modules/typescript/bin/tsc');
  await run(process.execPath, [tsc, '-p', 'interop/tsconfig.json', '--pretty', 'false']);
  const tests =
    mode === 'offline'
      ? [
          'interop/offline.test.ts',
          'interop/composed.test.ts',
          'interop/lookup.test.ts',
          'interop/capture.test.ts',
          'interop/intent.test.ts',
          'packages/core/src/__tests__/SporeConfig.test.ts',
          'packages/core/src/__tests__/Codec.test.ts',
          'packages/core/src/__tests__/ContentType.test.ts',
        ]
      : [`interop/${mode === 'devnet' ? 'devnet' : 'provision-local'}.test.ts`];
  if (mode === 'offline') {
    await run(process.execPath, [tsc, '-p', 'packages/core/tsconfig.build.json', '--pretty', 'false']);
    await run(process.execPath, [
      '-e',
      "const sdk = require('./packages/core/lib'); for (const name of ['createV3Config', 'checkPlainSporeIntent']) { if (typeof sdk[name] !== 'function') throw new Error('Missing CommonJS SDK export: ' + name); } console.log('CommonJS SDK entrypoint: v3 exports available');",
    ]);
  }
  await run(process.execPath, [
    join(workspace, 'node_modules/vitest/vitest.mjs'),
    'run',
    ...tests,
    '--pool=forks',
    '--poolOptions.forks.singleFork',
  ]);
} catch (error) {
  console.error(error.message);
  process.exitCode ||= 1;
} finally {
  signals.forEach((signal, index) => process.off(signal, handlers[index]));
  rmSync(workspace, { recursive: true, force: true });
}
