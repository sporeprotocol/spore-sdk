# Spore Secp256k1 Examples

The spore secp256k1 examples is a collection of code examples written in TypeScript, intended to help developers understand how to use `@spore-sdk/core` in Node environment to:

- Construct and send transactions of spores/clusters on Testnet (Aggron)
- Use Secp256k1Blake160 lock for transactions

## Run examples

> Please make sure you've met the pre-requirements:  
> `Node.js` >= 18.0.0  
> `PNPM` >= 8.0.0  

### Setup

Let's run the spore secp256k1 examples, but first we need to set up the local environment.

Assuming you've cloned the repo, and your local `spore-sdk` is located at:

```
~/projects/spore-sdk
```

Let's open a terminal, and install dependencies by running the following command:

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

The example code is stored in the [examples/secp256k1/apis](./apis) directory. Feel free to review and change anything you want, treating the examples as your experimental playground or a code sandbox to explore and play around with.

To run an example, for instance if you want to create a spore on-chain, you can run the [apis/createSpore.ts](./apis/createSpore.ts) example in your terminal:

```shell
ts-node apis/createSpore.ts
```

The example should construct and send a transaction that creates a spore on-chain. After sending the transaction, it should return a `Transaction Hash` for you to review the details of the transaction on [CKB Explorer](https://pudge.explorer.nervos.org/).

## Customization

### Update configs

If you have your own testing accounts, or if you want to configure the SporeConfig of the examples, you can go to the [examples/secp256k1/utils/config.ts](./utils/config.ts) file and update it. Inside the `utils/config.ts` file, you can do:

- Replace the default testing private keys with your own
- Update the default SporeConfig as needed

### Use your own accounts

If you want a clean startup environment for testing the functionality of the SDK, you can replace the default testing private keys with you own. Just visit the [examples/secp256k1/utils/config.ts](./utils/config.ts) file and edit the `accounts` variable, which should have two default testing private keys provided.

For those who want to create new private keys for testing purposes, you can follow the steps below to create a new private key and claim some faucet.

**Generate account** 

1. Open the [Generator Tool](https://ckb.tools/generator) website
2. Click the refresh icon on the page to generate a new account
3. Copy and paste the generated account's `Private Key (256-bit)` from the `Private/Public Key` block
4. Replace any of the default testing private keys in the [examples/secp256k1/utils/config.ts](./utils/config.ts) file

**Claim faucet for the new account**

1. Copy the generated account's `Nervos CKB Address` from the `Default Lock (Secp256k1-Blake160) - Testnet` block
2. Open the [Nervos Faucet](https://faucet.nervos.org/) website
3. Paste the address into the address input, and click the `Claim` button
4. Wait for a while until the faucet process is completed