import { describe, expect, it } from 'vitest';
import { Cell, HashType } from '@ckb-lumos/base';
import { BI, helpers } from '@ckb-lumos/lumos';
import { common } from '@ckb-lumos/common-scripts';
import { Script } from '@ckb-lumos/base';
import { TESTNET_ACCOUNTS, TESTNET_ENV } from './shared';
import {
  getMinFeeRate,
  calculateFeeByTransactionSkeleton,
  createCapacitySnapshotFromTransactionSkeleton,
  injectCapacityAndPayFee,
  returnExceededCapacity,
  payFeeByOutput,
} from '../helpers';

describe('Capacity', function () {
  const { CHARLIE } = TESTNET_ACCOUNTS;
  const { config, rpc, indexer } = TESTNET_ENV;

  it('Normal capacity collection', async () => {
    let txSkeleton = new helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: BI.from(100_0000_0000).toHexString(),
          lock: CHARLIE.lock,
        },
        data: '0x',
      });
    });

    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: 0,
      });
    });

    const injected = await injectCapacityAndPayFee({
      fromInfos: [CHARLIE.address],
      txSkeleton,
      config,
    });

    console.log('aaa===' + CHARLIE.address);

    txSkeleton = injected.txSkeleton;
    const { before: beforeSnap, after: afterSnap } = injected;
    expect(afterSnap.inputsLength - beforeSnap.inputsLength).gte(1, 'should have collected >= 1 input');
    expect(afterSnap.outputsLength - beforeSnap.outputsLength).gte(1, 'should have generated a change cell');

    const feeRate = await getMinFeeRate(rpc);
    const fee = calculateFeeByTransactionSkeleton(txSkeleton, feeRate);
    expect(afterSnap.inputsRemainCapacity.eq(fee)).eq(true, 'should have paid the exact amount of fee');
  }, 30000);

  it('No capacity collection, only returning exceeded capacity', async () => {
    let txSkeleton = new helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    const expectCapacity = BI.from(100_0000_0000).toHexString();
    const collector = indexer.collector({
      lock: CHARLIE.lock,
      outputDataLenRange: ['0x0', '0x1'],
    });

    let collectedCell: Cell | undefined;
    let collectedCapacity: BI | undefined;
    for await (const cell of collector.collect()) {
      collectedCapacity = BI.from(cell.cellOutput.capacity);
      collectedCell = cell;
      break;
    }
    expect(collectedCell).toBeDefined();
    expect(collectedCapacity).toBeDefined();

    // Add cell to inputs and outputs,
    // and then remove the cell from outputs because not needed
    txSkeleton = await common.setupInputCell(txSkeleton, collectedCell!, CHARLIE.address, {
      config: config.lumos,
    });
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.remove(0);
    });
    expect(txSkeleton.get('inputs').size).eq(1, 'should have 1 input');
    expect(txSkeleton.get('outputs').size).eq(0, 'should have 0 output');

    const returned = returnExceededCapacity({
      changeAddress: CHARLIE.address,
      config: config.lumos,
      txSkeleton,
    });

    txSkeleton = returned.txSkeleton;
    expect(returned.returnedChange).eq(true, 'should have returned change');
    expect(returned.createdChangeCell).eq(true, 'should have created a change cell');
    expect(returned.changeCellOutputIndex).eq(0, 'should have created the change cell at index 0');

    const snapshot = createCapacitySnapshotFromTransactionSkeleton(txSkeleton);
    expect(snapshot.outputsCapacity.eq(collectedCapacity!)).eq(
      true,
      'outputs capacity should be equal to collected capacity',
    );
    expect(snapshot.inputsRemainCapacity.eq(0)).eq(true, 'inputs and outputs capacity should be even');

    const feeRate = await getMinFeeRate(rpc);
    const fee = calculateFeeByTransactionSkeleton(txSkeleton, feeRate);
    txSkeleton = await payFeeByOutput({
      outputIndex: 0,
      txSkeleton,
      config,
    });

    const paidSnap = createCapacitySnapshotFromTransactionSkeleton(txSkeleton);
    expect(paidSnap.inputsRemainCapacity.eq(fee)).eq(true, 'should have paid the exact amount of fee');
  });

  it('Handle invalid input data: negative capacity', async () => {
    // Create a txSkeleton with invalid input data, such as a negative capacity value
    let txSkeleton = new helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: BI.from(-100).toHexString(), // negative capacity value
          lock: CHARLIE.lock,
        },
        data: '0x',
      });
    });

    try {
      // Attempt capacity processing and payment charges
      const injected = await injectCapacityAndPayFee({
        fromInfos: [CHARLIE.address],
        txSkeleton,
        config,
      });

      // If the system does not handle invalid data correctly, the following assertion will fail
      expect.fail('Should have thrown an exception for negative capacity.');
    } catch (error: any) {
      // Ensure the system correctly rejects or handles invalid data
      expect((error as Error).message).toContain('Invalid capacity value');
    }
  });

  it('Handle invalid input: invalid lock condition', async () => {
    // Create a txSkeleton containing invalid input data, for example if the locking condition is not met
    let txSkeleton = new helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    const invalidLock: Script = {
      codeHash: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      hashType: 'type',
      args: '0x0123456789abcdef0123456789abcdef01234567',
    };

    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: BI.from(100).toHexString(),
          lock: invalidLock,
        },
        data: '0x',
      });
    });

    try {
      // Attempt capacity processing and payment charges
      const injected = await injectCapacityAndPayFee({
        fromInfos: [CHARLIE.address],
        txSkeleton,
        config,
      });

      // If the system does not handle invalid data correctly, the following assertion will fail
      expect.fail('Should have thrown an exception for invalid lock condition.');
    } catch (error: any) {
      // Ensure the system correctly rejects or handles invalid data
      expect((error as Error).message).toContain('Invalid lock condition');
    }
  });

  it('Handle changing lock script in the transaction', async () => {
    let txSkeleton = new helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: BI.from(100_0000_0000).toHexString(),
          lock: CHARLIE.lock,
        },
        data: '0x',
      });
    });

    txSkeleton = txSkeleton.update('fixedEntries', (fixedEntries) => {
      return fixedEntries.push({
        field: 'outputs',
        index: 0,
      });
    });

    const injected = await injectCapacityAndPayFee({
      fromInfos: [CHARLIE.address],
      txSkeleton,
      config,
    });

    // Get new lock script
    const newLockScript = {
      code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      args: '0x6cd8ae51f91bacd7910126f880138b30ac5d3015',
      hash_type: 'type',
    };

    // Convert new lock script to type unknown
    const newLockScriptUnknown: unknown = newLockScript;

    // Manually create objects conforming to the Script type
    const newLockScriptTyped: Script = {
      codeHash: (newLockScriptUnknown as { code_hash: string }).code_hash,
      args: newLockScript.args,
      hashType: newLockScript.hash_type as HashType,
    };

    // Add a new output, using the new locking script
    txSkeleton = txSkeleton.update('outputs', (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: BI.from(100_0000_0000).toHexString(),
          lock: newLockScriptTyped,
        },
        data: '0x',
      });
    });

    // Attempt capacity processing and payment charges
    try {
      const injectedWithNewLock = await injectCapacityAndPayFee({
        fromInfos: [CHARLIE.address],
        txSkeleton,
        config,
      });

      expect.fail('Lock script exception');
    } catch (error: any) {
      // 输出err
      console.error(error);

      expect((error as Error).message).toContain('Changing lock script is not allowed');
    }
  }, 30000000);
});
