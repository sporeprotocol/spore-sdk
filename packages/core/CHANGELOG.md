# @spore-sdk/core

## 0.1.0-beta.13

### Patch Changes

- bc37376: Rename term from "destroy" to "melt", etc. "meltSpore"
- 9f1d792: Rename Joint APIs, from "getXCellByY" to "getXByY", and from "injectXIds" to "injectNewXIds"

## 0.1.0-beta.12

### Patch Changes

- f9d2e61: Fix the utf-8 encoding issue, originally the lumos `bytes.bytifyRawString` method can only handle ascii strings

## 0.1.0-beta.11

### Patch Changes

- e41e791: Fix wrong molecule used in transaction size calculation

## 0.1.0-beta.10

### Patch Changes

- 48a6506: Add Omnilock (ACP) and ACP related examples to show developers how to work with the public clusters
- e88b8e3: Add recipe doc about how to use SporeConfig
- e509567: Add capacity margin and input witness relevant props to improve controllability of cells in the APIs
- 8a35bd3: Add transaction max size limit to createSpore/createCluster APIs

## 0.1.0-beta.9

### Patch Changes

- ca1d6ae: Support capacity margin features in Composed APIs

## 0.1.0-beta.8

### Patch Changes

- 9a10284: Update the testnet predefined scripts

## 0.1.0-beta.7

### Patch Changes

- d382b0d: Support SporeScript with versions

## 0.1.0-beta.6

### Patch Changes

- 64f8dcd: Simplify api prop names, for example from "sporeData" to "data"
- 9fce0be: Provide global SporeConfig apis, allow SporeConfig in composed apis to be optional

## 0.1.0-beta.5

### Patch Changes

- d9e71ee: Remove esm build in sdk

## 0.1.0-beta.4

### Patch Changes

- f352469: Update the script info of cluster/spore

## 0.1.0-beta.3

### Patch Changes

- 1a30c54: Adds a backup in codec tests

## 0.1.0-beta.2

### Patch Changes

- bd7bfe8: Rename SporeData.cluster to SporeData.clusterId

## 0.1.0-beta.1

### Patch Changes

- Fix sdk to build esm and cjs together

## 0.1.0-beta.0

### Minor Changes

- Implementation and docs/examples of Spore Protocol V1
