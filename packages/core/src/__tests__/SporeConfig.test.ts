import cloneDeep from 'lodash/cloneDeep';
import { describe, expect, it } from 'vitest';
import { TESTNET_ENV } from './shared';
import { forkSporeConfig, getSporeConfigHash, isSporeScriptCategorySupported } from '../config';

describe('SporeConfig', function () {
  it('Hash a SporeConfig', () => {
    const config = cloneDeep(TESTNET_ENV.config);
    const hash1 = getSporeConfigHash(config);

    config.maxTransactionSize = Math.random() * 1000;
    const hash2 = getSporeConfigHash(config);

    expect(hash1).not.eq(hash2, 'Hash should be different after altering the config');
  });
  it('Fork a SporeConfig', function () {
    const { config } = TESTNET_ENV;
    const newConfig = forkSporeConfig(config, {
      scripts: {
        Some: {
          versions: [
            {
              tags: ['latest'],
              script: {
                codeHash: '0x00',
                hashType: 'type',
              },
              cellDep: {
                outPoint: {
                  txHash: '0x00',
                  index: '0x',
                },
                depType: 'code',
              },
            },
          ],
        },
      },
    });

    const categoryExistsInOldConfig = isSporeScriptCategorySupported(config, 'Some');
    expect(categoryExistsInOldConfig).eq(false, 'Old SporeConfig should not have "Some" script');

    const categoryExistsInNewConfig = isSporeScriptCategorySupported(newConfig, 'Some');
    expect(categoryExistsInNewConfig).eq(true, 'New SporeConfig should have "Some" script');
  });
});
