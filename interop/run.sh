#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -e node_modules ]; then
  npm ci --prefix interop/tooling --ignore-scripts --no-audit --no-fund
  ln -s interop/tooling/node_modules node_modules
fi
case "${1:-offline}" in
  offline)
    node_modules/.bin/tsc -p interop/tsconfig.json --pretty false
    node_modules/.bin/tsc -p packages/core/tsconfig.build.json --pretty false
    exec node_modules/.bin/vitest run interop/offline.test.ts interop/composed.test.ts interop/lookup.test.ts interop/capture.test.ts --pool=forks --poolOptions.forks.singleFork
    ;;
  devnet)
    : "${SPORE_V3_DEVNET_MANIFEST:?Set a reviewed local devnet manifest first}"
    node_modules/.bin/tsc -p interop/tsconfig.json --pretty false
    exec node_modules/.bin/vitest run interop/devnet.test.ts --pool=forks --poolOptions.forks.singleFork
    ;;
  *) echo 'Usage: interop/run.sh [offline|devnet]' >&2; exit 2;;
esac
