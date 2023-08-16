<br/>

<p align="center">
  <img src="./docs/assets/readme-banner.webp" alt="Spore SDK">
</p>

<p align="center">
  A <a href="https://github.com/ckb-js/lumos">Lumos</a> based TypeScript SDK to interact with Spore Protocol.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@spore-sdk/core">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/v/@spore-sdk/core?colorA=21262d&colorB=21262d&style=flat">
      <img src="https://img.shields.io/npm/v/@spore-sdk/core?colorA=f6f8fa&colorB=f6f8fa&style=flat" alt="Version">
    </picture>
  </a>
  <a href="https://github.com/sporeprotocol/spore-sdk/blob/main/LICENSE">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/l/@spore-sdk/core?colorA=21262d&colorB=21262d&style=flat">
      <img src="https://img.shields.io/npm/l/@spore-sdk/core?colorA=f6f8fa&colorB=f6f8fa&style=flat" alt="MIT License">
    </picture>
  </a>
  <a href="https://www.npmjs.com/package/@spore-sdk/core">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@spore-sdk/core?colorA=21262d&colorB=21262d&style=flat">
      <img src="https://img.shields.io/npm/dm/@spore-sdk/core?colorA=f6f8fa&colorB=f6f8fa&style=flat" alt="Downloads per month">
    </picture>
  </a>
</p>

## Features

- ⚡ Composed APIs for efficient spores/clusters interactions with minimal time overhead
- 🧩 Joint APIs for building advanced transactions as a fun block-building process
- 🛠️ Utilities for encoding/decoding data of spores/clusters
- 💖 Designed and implemented based on [Lumos](https://github.com/ckb-js/lumos)
- 🎹 Fully written in TypeScript

## Packages

### [@spore-sdk/core](./packages/core)

The core library of the spore-sdk, providing everything developers need to construct basic and advanced transactions on spores and clusters, and handling [molecule](https://github.com/nervosnetwork/molecule) of spores/clusters from human-readable content to binary, or vice versa.

## Examples

### [@spore-examples/secp256k1](./examples/secp256k1) 

Real code examples presenting how to construct basic spore/cluster transactions with the spore-sdk, along with straightforward code showing the process of signing
and unlocking [Secp256k1Blake160](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_sighash_all.c) spores/clusters in a transaction.

## Recipes

### [Construct transactions with spore-sdk](docs/recipes/construct-transaction.md)

### [Create immortal spores on-chain](docs/recipes/create-immortal-spore.md)

### [Pay fee with capacity margin](docs/recipes/capacity-margin.md)
  
### [Handle spore/cluster data](docs/recipes/handle-cell-data.md)

## License

[MIT](./LICENSE) License
