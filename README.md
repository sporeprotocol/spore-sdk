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

## Getting started

Start using spore-sdk with the `spore-first-example`:

https://github.com/sporeprotocol/spore-first-example/blob/0fd0a79fdbfab06c0d11c08011f457986fa85d93/src/index.ts#L4-L20

Follow the recipes to learn and explore the usage of spore-sdk: 

- [Construct transactions with spore-sdk](docs/recipes/construct-transaction.md)

- [Create immortal spores on-chain](docs/recipes/create-immortal-spore.md)

- [Pay fee with capacity margin](docs/recipes/capacity-margin.md)

- [Handle spore/cluster data](docs/recipes/handle-cell-data.md)

- [Configure spore-sdk with SporeConfig](docs/recipes/configure-spore-config.md)

## Packages

### [@spore-sdk/core](./packages/core)

The core library of spore-sdk, providing everything developers need to construct basic and advanced transactions on spores and clusters, and handling [molecule](https://github.com/nervosnetwork/molecule) of spores/clusters from human-readable content to binary, or vice versa.

## Examples

### [Secp256k1Blake160 Sign-all](./examples/secp256k1)

Start with the most commonly used lock in Nervos CKB to:

- Create/transfer clusters with the [Secp256k1Blake160 Sign-all](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_sighash_all.c) lock
- Create/transfer/destroy spores with the [Secp256k1Blake160 Sign-all](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_sighash_all.c) lock

### [Anyone-can-pay](./examples/acp)

[Anyone-can-pay](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md) (ACP) lock can be unlocked by anyone without signature verification and accepts any amount of CKB or UDT payment from the unlocker. 
Use its flexibility to:

- Create public clusters with the [Anyone-can-pay](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md) lock
- Create spores in public clusters with the [Secp256k1Blake160 Sign-all](https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_sighash_all.c) lock

### [Omnilock](./examples/omnilock)

[Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) lock is an interoperable lock script supporting various blockchains (Bitcoin, Ethereum, EOS, etc.) verification methods and extensible for future additions. 
It also offers a regulation compliance module for administrator-controlled token revocation, enabling registered assets like Apple stock on CKB when combined with the RCE (Regulation Compliance Extension). 
Omnilock can be integrated with spore-sdk to:

- Create public clusters with the [Omnilock ACP](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md#anyone-can-pay-mode) lock
- Create spores in public clusters with the [Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) lock

## License

[MIT](./LICENSE) License
