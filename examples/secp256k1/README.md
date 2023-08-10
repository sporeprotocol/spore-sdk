# Spore Secp256k1 Examples

The spore secp256k1 examples is a collection of code examples written in TypeScript, intended to help developers understand how to use `@spore-sdk/core` in Node environment to:

- Construct and send transactions of spores/clusters on Testnet (Aggron)
- Use Secp256k1Blake160 lock for transactions

## Run examples

> Please make sure you've met the pre-requirements:  
> `Node.js` >= 18.0.0  
> `PNPM` >= 8.0.0  

### Setup environment

To set up the local environment, let's run the following command at the spore-sdk's root directory:

```shell
pnpm i
```

Then run the following command to build local packages:

```shell
pnpm run build:packages
```

And if everything goes well, your local environment is now prepared.

### Run an example

Assuming you've your local environment set up, let's go to the spore secp256k1 examples' directory:

```shell
cd examples/secp256k1
```

The example code is stored in the [examples/secp256k1/apis](./apis) directory. Feel free to review and modify the code, using the examples as your playground or a sandbox to freely experiment.

For instance, if you want to create a spore on-chain, run the [apis/createSpore.ts](./apis/createSpore.ts) example in your terminal:

```shell
ts-node apis/createSpore.ts
```

This example constructs and sends a transaction that creates a spore on-chain. Once the transaction is sent, a `Transaction Hash` should be returned so that you can review the transaction details on [CKB Explorer](https://pudge.explorer.nervos.org/).

## Customization

### Update configs

If you have your own testing accounts, or if you want to configure the SporeConfig of the examples, you can go to the [examples/secp256k1/utils/config.ts](./utils/config.ts) file and update it. Inside the `utils/config.ts` file, you can:

- Replace the default testing private keys with your own
- Update the default SporeConfig as needed

### Use your own accounts

If you want a clean startup environment for testing the functionality of the SDK, you can replace the default testing private keys with you own. Just visit the [examples/secp256k1/utils/config.ts](./utils/config.ts) file and edit the `accounts` variable, where two default private keys are provided for testing.

For those who want to create new private keys for testing, follow the steps below to create a new private key and claim some faucet CKBytes.

**Generate account** 

1. Open the [Generator Tool](https://ckb.tools/generator) website
2. Click the refresh icon (🔄) on the page to generate a new account
3. Copy and paste the generated account's `Private Key (256-bit)` from the `Private/Public Key` block
4. Replace any of the default testing private keys in the [examples/secp256k1/utils/config.ts](./utils/config.ts) file

**Claim faucet CKBytes for the new account**

1. Copy the generated account's `Nervos CKB Address` from the `Default Lock (Secp256k1-Blake160) - Testnet` block
2. Open the [Nervos Faucet](https://faucet.nervos.org/) website
3. Paste the address into the address input, and click the `Claim` button
4. Wait for a while until the faucet process is completed