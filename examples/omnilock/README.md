# Spore Omnilock Examples

## Introduction

### What is `Omnilock` lock

[Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) is an interoperable lock script supporting various blockchains (Bitcoin, Ethereum, EOS, etc.) verification methods and extensible for future additions.

It also offers a regulation compliance module for administrator-controlled token revocation, enabling registered assets like Apple stock on CKB when combined with the RCE (Regulation Compliance Extension).

### Featured examples

Spore Omnilock Examples is a collection of code examples where developers can learn how to interact with Omnilock and spore-sdk for various purposes.

In [`/acp`](./acp):
- Create public clusters with the [Omnilock ACP](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md#anyone-can-pay-mode) lock
- Create spores in public clusters with the [Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) lock

## Run examples

> Please make sure you've met the pre-requirements:  
> [`Node.js`](https://nodejs.org/) >= 18.0.0  
> [`PNPM`](https://pnpm.io/) >= 8.0.0

### Setup environment

To set up the local environment, run the following command at the spore-sdk's root directory:

```shell
pnpm i && pnpm run build:packages
```

### Run an example

> The code of the examples is stored in the [examples/omnilock/acp](./acp) directory, feel free to review and modify the code, using the examples as your playground or a sandbox to freely experiment.

Assuming your local environment is set up, and you're at the [examples/omnilock](.) directory, let's run an example to see how things work. For instance, if you want to create a cluster with Omnilock as lock with [anyone-can-pay mode](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md#anyone-can-pay-mode) enabled, run the [examples/omnilock/acp/createAcpCluster.ts](./acp/createAcpCluster.ts) example in your terminal:

```shell
ts-node acp/createAcpCluster.ts
```

This example constructs and sends a transaction that creates a spore on-chain. Once the transaction is sent, a `Transaction Hash` should be returned so that you can review the transaction details on [CKB Explorer](https://pudge.explorer.nervos.org/).

## Customization

### Update configs

If you have your own testing accounts, or if you want to configure the SporeConfig of the examples, you can go to the [examples/omnilock/utils/config.ts](./utils/config.ts) file and update it. Inside the `utils/config.ts` file, you can:

- Replace the default testing accounts with your own
- Modify the default SporeConfig as needed

### Use your own accounts

If you want a clean startup environment for testing the functionality of the spore-sdk, you can replace the default testing accounts with your own accounts. Whether locally or in globally, there has two default testing accounts being used, `CHARLIE` and `ALICE`.

How to replace them:

- Replace locally: For replacing the testing accounts locally (only affects the secp256k1 examples), visit the [examples/omnilock/utils/config.ts](./utils/config.ts) file and edit the `accounts` variable.
- Replace globally: If you want to replace the testing accounts globally (affects all kinds of examples), you can visit the [examples/shared/index.ts](../shared/index.ts) file and edit the `accounts` variable.

### Generate testing accounts

For those who want to create new accounts for testing the examples, you can follow the steps below to create a new private key and claim some faucet CKBytes.

**1. Generate a new account:**

1. Open the [Generator Tool](https://ckb.tools/generator) website
2. Click the refresh icon (🔄) on the page to generate a new account
3. Copy the new account's `Private Key (256-bit)` from the `Private/Public Key` block
4. Replace any of the default testing accounts with the new account

**2. Claim faucet CKBytes for the new account:**

1. Copy the new account's `Nervos CKB Address` from the `Omni Lock (Ethereum) - Testnet` block
2. Open the [Nervos Faucet](https://faucet.nervos.org/) website
3. Paste the address into the address input, and click the `Claim` button
4. Wait for a while until the faucet process is completed