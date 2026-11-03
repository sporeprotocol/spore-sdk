# Spore v3 interoperability candidate

This SDK adaptation is reviewed separately from the contract PRs, using these immutable source revisions:

- contracts `a19q3/spore-contract@46eaa8b59abe818f27dcfe3c7af0da46698c12f8`
- SDK `sporeprotocol/spore-sdk@5e5d886e49bfbd78253e9c14fd8baebccb488a81` (`beta`, package `0.2.2-alpha.2`)

This SDK change has not been published as a package or deployed on a public
network. A disposable local
devnet was provisioned for acceptance on 2026-11-03. The contract replay addition
is a test only; no consensus contract source was changed in #75 or #76.

## Run the verified SDK tests

From the SDK repository root:

```sh
./interop/run.sh offline
```

On a clean checkout the runner installs the separate, npm-locked tooling set
without lifecycle scripts. It leaves the upstream pnpm lockfile unchanged.
If `node_modules` already exists, it uses that installation; remove/reconcile an
incompatible installation yourself rather than overwriting it. Independently reproduced with Node
22.23.1, Lumos `0.24.0-next.1`, Vitest `1.4.0`, TypeScript `5.3.2`.

Result: **12 tests passed**; the core build and isolated interoperability-suite
typecheck passed. These tests run actual SDK code and actual Lumos signing/hash
code. Cell-provider/RPC data are substituted. They do not execute CKB scripts.

## Concrete compatibility gaps and changes

| Gap in the pinned SDK                                                                                                                                                                  | Minimal adaptation                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public presets describe old deployments; default tags choose v2 preview on testnet.                                                                                                    | `createV3Config(base, deployment)` explicitly selects `v3-candidate`; requires concrete new hashes/outpoints and `data2`, retains all old versions, changes no public preset.                                                                                                 |
| `getSporeScriptByScriptId` and `isSporeScriptSupported` use only code hash; the cache can overwrite identities with a different hash type. Unknown hashes can dereference `undefined`. | Select by category + code hash + hash type directly from versions; guard the legacy cache lookup. The low-level public code-hash-only helper remains code-hash-only; application code should use the full-identity APIs.                                                      |
| `injectNewMutantOutput` always loads Lua and accepts Lua source as code data.                                                                                                          | Explicit `mutantRuntime: native-v1`; no Lua CellDep; ELF preflight matching the contract header/size limits. VM execution remains authoritative. Historical entries without this field still use Lua.                                                                         |
| Mint references add the default Mutant/Lua deps rather than the found Cell's deployment; transfer/burn similarly use default Mutant identity.                                          | Choose dependencies from the actual rule Cell. Pass the owning Spore's runtime to ID lookup; native lookup cannot fall back to a legacy Lua category. Preserve the rule Cell itself as a `code` CellDep.                                                                      |
| Batch transfer unconditionally emits Actions for all Spore versions.                                                                                                                   | Emit only the Actions requested by each input deployment; emit none for a pure v3 batch, retain v2 Actions and both dependencies in mixed batches.                                                                                                                            |
| Ordinary create/transfer/melt already inspect `behaviors.cobuild`.                                                                                                                     | Reuse those builders with `cobuild:false`; retain normal `WitnessArgs`, signature placeholders, Lock deps, capacity accounting and fee calculation.                                                                                                                           |
| No wallet semantic check ties optional Actions to actual cells. Signatures authenticate the final transaction, including potentially misleading pre-signing intent.                    | `checkPlainSporeIntent` derives mint/transfer/melt from resolved cells and compares supplied Actions, including recipient and script-info hash. Reject duplicate/unknown/misleading Actions; require Actions for historical entries. Missing optional v3 Actions are allowed. |

`mutantRuntime` describes the interpreter used by a particular deployment; it is
not inferred from package semver. The new candidate contracts are `0.3.0-alpha.1`,
whereas the SDK remains `0.2.2-alpha.2` in this patch. Publishing a new SDK version
and changing advertised defaults require separate review. There are no invented
v3 mainnet/testnet addresses and no reuse of the old binary hashes.

For native Mutants the published data are RISC-V ELF bytes. `createMutant` invokes
the code's `create` ABI path in the contract; references invoke mint/transfer/burn
using `spore-mutant-v1`. There is no receipt witness to generate. Preserve the
original immutable code, type args (32 or 40 bytes) and ID. Rule transfer retains
that binding; do not present rewriting or burning native code as supported UI
operations. The existing `transferMutant.minPayment` option cannot migrate a
native type identity merely by changing args; such a change requires a distinct
publication and explicit referencing assets.

## Wallet integration boundary

Run `checkPlainSporeIntent` on fully resolved final cells, display its derived
cell delta, obtain the user's transaction authorisation, then prepare signing
entries, sign, and submit that exact serialisation. All fee/change and witness
assembly must precede signing. Adding/removing an Action afterwards requires
rebuilding signing entries and signing again.

The helper supports ordinary Spore operations with standard secp256k1 input
Locks, including mixed-version Actions. It rejects other typed input/output
cells, custom input Locks, unsupported extra witness layouts and input/output
witness fields. It is not a general wallet approval engine. It does not enforce a
game's authorisation policy, interpret arbitrary rule code, or decide that a burn
is desirable. The UI must show the actual delta even when no Action is supplied.
No JoyID/CCC/hardware-wallet integration has been run or claimed.

## Devnet acceptance (verified locally on 2026-11-03)

Run only against an already provisioned, reviewed disposable devnet with a
Meepo/CKB-VM V2-capable node, indexer and automatic local block production. This
suite itself neither deploys nor starts these services. The separate
`provision-local.test.ts` fixture publishes binaries and a historical Lua rule
only to the explicitly configured local node on port 28114. The verified run
used CKB 0.200.0, its built-in indexer, Dummy mining, public fixture keys and a
fresh genesis with untyped fixture funding. Historical contracts were built
from `9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999`; v3 binaries were built from the
pinned integration source. These are local deployment identities, not public
network presets.

Required local material:

1. Full `SporeConfig` JSON for the **local** historical deployments and standard
   secp Lock, including old Spore/Mutant/Lua CellDeps. Preserve v2 `preview` tags
   and `cobuild:true`. Do not supply public testnet presets to a devnet.
2. The v3 deployment JSON, matching `V3Deployment` in `src/v3/config.ts`:
   `contractCommit`, `Spore:{script:{codeHash,hashType},cellDep:{outPoint,depType}}`
   and the same shape for `Mutant`. Both use `data2` and `code`. Build in the
   repository's prescribed dependency order. Cross-pinned hashes are build
   outputs, not interchangeable binaries.
3. The local genesis hash and a live, historical Lua-typed rule Cell outpoint.
4. Absolute paths to the reviewed `spore`, `spore_extension_rust` and existing
   `mutant_equipment` binaries from the pinned integration build.
5. Enough untyped capacity under the public test key `[0x2a;32]` to publish the ELF
   and run all transactions, plus change. Bob is `[0x2b;32]`. These are disposable
   fixture keys. No environment secret or production wallet is used.

`manifest.example.mjs` assembles that material without contacting a network.
The runner permits only local HTTP endpoints, pins the contract commit and
checks genesis, live code cells, exact binary bytes and CKB data hashes before
running the lifecycle. Missing setup fails; there is no skip or testnet fallback.

```sh
export SPORE_V3_DEVNET_MANIFEST=/absolute/devnet-manifest.json
# New path for each full run; the capture file is append-only.
export SPORE_V3_VM_CAPTURE=/absolute/spore-v3-sdk-transactions.jsonl
./interop/run.sh devnet
```

The single sequential devnet acceptance case exercises:

- publish `mutant_equipment` with the SDK; valid `[3,4,7]` vs rejected `[3,4,8]`
  proves native execution, not just ELF storage (expected error 93);
- plain and native-rule Spore mint → transfer Alice to Bob → melt, all without
  Action; actual secp signatures, missing/wrong signatures, recipient tampering;
- Lua source smuggled past SDK preflight rejected on native publication (91);
  historical Lua-typed dependencies rejected by v3 Spore (71);
- matching optional Action accepted, trailing-witness tampering after signing
  rejected; a deliberately misleading Action rejected by wallet policy although
  a correctly signed transaction can pass v3 core validation;
- historical v2 mint still requires its Action; a mixed v2/v3 batch keeps both
  code dependencies and only the required v2 Action.

Extra Action/dependency fixtures reserve capacity and additional fees before
signing so an underpaid fee cannot masquerade as the intended script failure.
Negative submissions must report script validation failure; a network exception
is not counted as a pass. The sequential suite passed with **23 transactions:
12 accepted/committed and 11 expected script rejections**. One initial fixture
assertion was corrected: a spent Cell can be reported as `unknown` by CKB
0.200.0. The assertion now verifies the committed melt actually consumes the
specific outpoint and that the outpoint is no longer live.
Historical Lua rejection on **transfer and burn**, the full native ABI/error
matrix, lock failures and old VM rejection already have source-level fixture
coverage in `tests/src/tests/{mutant_rust,cobuild_decoupling}.rs`; those existing
results are not counted as newly executed SDK tests.

## Exact SDK bytes → existing CKB-VM fixture harness (verified locally)

`capture.ts` records the SDK's packed transaction and every resolved input,
code dependency and expanded dep-group member **before submission**. It is
opt-in and stores no private key. The new contract test replays these bytes with
`Context::verify_tx` without rebuilding witnesses, re-signing or substituting
always-success Locks. Its file-format/dep-group capture test passed locally. The Rust replay then
passed all **23 cases: 12 accepted and 11 rejected**, including exact error codes
71, 91 and 93 where specified. Negative cases must be script validation failures,
not unresolved cells or unrelated harness errors.

Apply the accompanying contract-test patch, then run from the contract repo:

```sh
SPORE_V3_VM_CAPTURE=/absolute/spore-v3-sdk-transactions.jsonl \
  cargo test --locked --manifest-path tests/Cargo.toml \
  sdk_captured_transactions_replay_in_ckb_vm -- --ignored --nocapture
```

This replay needs the captured bytes but no RPC, indexer or devnet. It verifies
scripts, not pool fee policy, capacity conservation, indexer convergence or
commitment. Those require the actual node flow. Without a capture it fails when
explicitly invoked; it does not turn existing hand-built Rust transactions into
claimed SDK evidence.

## Evidence and remaining review scope

Local verification on 2026-11-03:

| Check                             | Result                                         |
| --------------------------------- | ---------------------------------------------- |
| Interoperability offline suite    | 12 passed                                      |
| Existing SDK SporeConfig tests    | 5 passed                                       |
| Core build and isolated typecheck | Passed                                         |
| Local devnet lifecycle suite      | 1 sequential test passed; 23 transaction cases |
| Exact-byte Rust replay            | 1 test passed; 23 transaction cases            |

The contract integration branch stores the compressed exact capture and its
checksums under `tests/fixtures/sdk-interop`. See its
[SDK interoperability report](https://github.com/a19q3/spore-contract/blob/codex/spore-v3-integration/docs/SDK_INTEROP.md)
for source/binary provenance, the local genesis, reconstruction commands and
limits. Replaying a recorded capture verifies the recorded binaries; a future
contract revision must regenerate its own deployment and capture.

This is evidence for the standard secp Lock, ordinary Spore operations, native
Mutants, optional intent and mixed historical/v3 batches. It does not establish
all wallet, Cluster, arbitrary-rule or public-network compatibility. No
JoyID/CCC/hardware-wallet flow was run. SDK semver/public defaults and release
readiness remain subject to the separate SDK review. #75 and #76 keep their
original contract review scope.
