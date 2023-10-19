<br/>

<p align="center">
  <img src="./docs/assets/readme-banner.webp" alt="Spore SDK">
</p>

<p align="center">
  A TypeScript SDK to interact with Spore Protocol.
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

## Intro

Spore SDK is a Web development kit for integration with [Spore Protocol](https://github.com/sporeprotocol/spore-contract), an asset protocol for valuing on-chain contents, build on top of [CKB](https://github.com/nervosnetwork/ckb).
It leverages the power of [Lumos](https://github.com/ckb-js/lumos) to provide seamless dapp development with Spore.


## Features

- ⚡ Composed APIs for efficient spores/clusters interactions with minimal time overhead
- 🧩 Joint APIs for building advanced transactions as a fun block-building process
- 🛠️ Utilities for encoding/decoding data of spores/clusters
- 🎹 Fully written in TypeScript


## Documentation

For full documentation and instructions, visit [docs.spore.pro](https://docs.spore.pro).


## Getting started

### Create your first spore in Node.js

Follow the step-by-step tutorial to create your first spore: [Creating your first Spore](https://docs.spore.pro/tutorials/create-first-spore).

Or you can run and play with the [spore-first-example](https://github.com/sporeprotocol/spore-first-example) on [StackBlitz](https://stackblitz.com/github/sporeprotocol/spore-first-example?file=src%2Findex.ts&view=editor).

### Follow the recipes

Visit the Spore Docs for more categorized and general [How-to recipes](https://docs.spore.pro/category/how-to).

Or study the following recipes to explore the usage of the SDK:

- [Construct transactions with Spore SDK](docs/recipes/construct-transaction.md)

- [Create immortal spores on-chain](docs/recipes/create-immortal-spore.md)

- [Pay fee with capacity margin](docs/recipes/capacity-margin.md)

- [Handle spore/cluster data](docs/recipes/handle-cell-data.md)

- [Configure Spore SDK](docs/recipes/configure-spore-config.md)

### Building browser env dapps

The Spore SDK is built on top of [Lumos](https://github.com/ckb-js/lumos), an open-source dapp framework for Nervos CKB. Lumos incorporates certain Node-polyfills into its implementation, such as `crypto-browserify` and `buffer`, to provide specific functionalities.

If you intend to use the Spore SDK in a browser environment, it's important to note that you may need to manually add Node-polyfills to your application. This ensures that the Spore SDK functions properly in the browser. For detailed instructions on how to add these polyfills, refer to the Lumos documentation: [CRA, Vite, Webpack or Other](https://lumos-website.vercel.app/recipes/cra-vite-webpack-or-other).

## Development

### Packages & toolchains

- [@spore-sdk/core](./packages/core) - Provides essential tools for constructing basic and advanced transactions on spores and clusters. Additionally, it offers convenient utilities for handling [serialization](https://github.com/nervosnetwork/molecule) of spores/clusters.

### Code references

- [Examples](./docs/resources/examples.md) - Code block examples for implementing basic and specific features.

- [Demos](./docs/resources/demos.md) - Demo applications with full functionality, including seamless integration with wallets.


### APIs

- [Composed APIs](./docs/core/composed-apis.md) - APIs for efficient spores/clusters. interactions with minimal time overhead

- [Joint APIs](./docs/core/joint-apis.md) - APIs for building advanced transactions as a fun block-building process.
 
 
## Community

Reach out to us if you have questions about Spore Protocol:
- Join the community on: [ HaCKBee - Discord](https://discord.gg/9eufnpZZ8P)
- Contact via email at [contact@spore.pro](mailto:contact@spore.pro)

## Contributing

To contribute and assist in enhancing the Spore SDK, we welcome your pull requests:

- `Active Branch` - By default, you can submit pull requests to the `beta` branch.

- `Commit Styling` - Ensure that your commit styling does not conflict with the [existing commits](https://github.com/sporeprotocol/spore-sdk/commits).

- `Clear Information` - Please provide a clear and descriptive title and description for your pull requests.

## License

[MIT](./LICENSE) License
