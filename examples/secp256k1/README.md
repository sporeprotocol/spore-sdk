# Spore Secp256k1 Examples

The spore secp256k1 examples is a collection of code examples written in TypeScript, intended to help developers understand how to use `@spore-sdk/core` in Node environment to:

- Construct and send transactions of spores and clusters on Testnet (Aggron)
- Use Secp256k1Blake160 lock to sign transactions

## Run examples

### Setup

Let's run the spore secp256k1 examples, but first we need to set up the local environment. 
Assuming you've cloned the repo, and your local `spore-sdk` is located at:

```typescript
~/projects/spore-sdk
```

Make sure your terminal's location is at the repo's root. 
And then you should install dependencies with `pnpm` by running the following command:

```shell
pnpm i
```

After installed, run the following command to build local packages:

```shell
pnpm run build:packages
```

And if everything goes well, your local environment is now prepared.

### Run an example

Assuming you've your local environment set up, let's go to the spore secp256k1 examples' directory:

```shell
cd examples/secp256k1
```

The example code is stored in the [apis directory](./apis), feel free to review the code or change the data of spore/cluster you want to create on-chain, or even treat the examples as your experimental fields.

To run an example, for instance if you want to create a spore on-chain, you can run the [apis/createSpore.ts](./apis/createSpore.ts) example in your terminal:

```shell
ts-node apis/createSpore.ts
```

The example should construct and send a transaction that creates a spore, and after the sending the transaction, it should return a `Transaction Hash` for you to view the details of the transaction on [CKB Explorer](https://pudge.explorer.nervos.org/).  

## Configurations

If you have your own testing accounts, or if you want to configure the SporeConfig of the examples, you can go to the [utils/config.ts](./utils/config.ts) file and update it. Inside the `utils/config.ts` file, you can do:

- Update the default testing private keys to your own
- Update the SporeConfig as needed