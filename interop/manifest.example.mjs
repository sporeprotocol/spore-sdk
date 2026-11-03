// Produce the manifest from REVIEWED LOCAL deployment records; this script does
// not deploy, query a network, invent hashes, or change the SDK's public presets.
// node interop/manifest.example.mjs BASE_CONFIG.json V3_DEPLOYMENT.json \
//   GENESIS_HASH LEGACY_LUA_MUTANT_TX_HASH LEGACY_LUA_MUTANT_INDEX \
//   /absolute/build/spore /absolute/build/spore_extension_rust \
//   /absolute/build/mutant_equipment > /absolute/devnet-manifest.json
import { readFileSync } from 'node:fs';
const [baseFile, deploymentFile, genesisHash, legacyTx, legacyIndex, Spore, Mutant, rule] = process.argv.slice(2);
if (!rule || !/^0x[0-9a-f]{64}$/.test(genesisHash) || !/^0x[0-9a-f]{64}$/.test(legacyTx)) {
  throw new Error('Supply all eight arguments from the local deployment records');
}
console.log(JSON.stringify({baseConfig:JSON.parse(readFileSync(baseFile,'utf8')),
  deployment:JSON.parse(readFileSync(deploymentFile,'utf8')),genesisHash,
  legacyMutantOutPoint:{txHash:legacyTx,index:legacyIndex},binaries:{Spore,Mutant,rule}},null,2));
