---
'@spore-sdk/core': minor
---

Add opt-in Spore v3 configuration, native RISC-V Mutant construction and dependency resolution, exact script identity matching, and optional CoBuild intent handling for plain and mixed-version Spore transactions. Keep existing public deployment presets and defaults unchanged. SDK release numbering follows the repository's Changesets process independently of the contract version.

Preserve legacy batch Actions unless a deployment explicitly opts out. Provide indexed witness-layout diagnostics, bound deployment output indices to uint32, avoid mutating configuration/query tags, and isolate interoperability tooling from the checkout's dependency state.
