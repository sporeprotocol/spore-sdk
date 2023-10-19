# @spore-sdk/core

## Features

- ⚡ Composed APIs for efficient spores/clusters interactions with minimal time overhead
- 🧩 Joint APIs for building advanced transactions as a fun block-building process
- 🛠️ Utilities for encoding/decoding data of spores/clusters
- 🎹 Fully written in TypeScript

## Installation

Install `@spore-sdk/core` as a dependency using any package manager, such as `npm`:

```shell
npm install @spore-sdk/core
```

## Getting started

### Create your first spore in Node.js

Follow the step-by-step tutorial to create your first spore: [Creating your first Spore](https://docs.spore.pro/tutorials/create-first-spore).

Or you can run and play with the [spore-first-example](https://github.com/sporeprotocol/spore-first-example) on [StackBlitz](https://stackblitz.com/github/sporeprotocol/spore-first-example?file=src%2Findex.ts&view=editor).

### Follow the recipes

Explore the categorized recipes section in the Spore Docs for detailed instructions: [How-to recipes](https://docs.spore.pro/category/how-to).

Or study the following recipes to explore the usage of the SDK:

- [Construct transactions with Spore SDK](../../docs/recipes/construct-transaction.md)

- [Create immortal spores on-chain](../../docs/recipes/create-immortal-spore.md)

- [Pay fee with capacity margin](../../docs/recipes/capacity-margin.md)

- [Handle spore/cluster data](../../docs/recipes/handle-cell-data.md)

- [Configure Spore SDK](../../docs/recipes/configure-spore-config.md)

### Building browser env dapps

The Spore SDK is built on top of [Lumos](https://github.com/ckb-js/lumos), an open-source dapp framework for Nervos CKB. Lumos incorporates certain Node-polyfills into its implementation, such as `crypto-browserify` and `buffer`, to provide specific functionalities.

If you intend to use the Spore SDK in a browser environment, it's important to note that you may need to manually add Node-polyfills to your application. This ensures that the Spore SDK functions properly in the browser. For detailed instructions on how to add these polyfills, refer to the Lumos documentation: [CRA, Vite, Webpack or Other](https://lumos-website.vercel.app/recipes/cra-vite-webpack-or-other).

## Resources

- [Examples](../../docs/resources/examples.md) - Code block examples for implementing basic and specific features.
- [Demos](../../docs/resources/demos.md) - Demo applications with full functionality, including seamless integration with wallets.

## API

- [Composed APIs](../../docs/core/composed-apis.md) - APIs for efficient spores/clusters. interactions with minimal time overhead
- [Joint APIs](../../docs/core/joint-apis.md) - APIs for building advanced transactions as a fun block-building process.

## License

[MIT](../../LICENSE) License
