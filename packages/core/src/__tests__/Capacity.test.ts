import { describe, expect, it } from 'vitest';
import { Cell } from '@ckb-lumos/base';
import { BI, helpers } from '@ckb-lumos/lumos';
import { common } from '@ckb-lumos/common-scripts';
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
});
