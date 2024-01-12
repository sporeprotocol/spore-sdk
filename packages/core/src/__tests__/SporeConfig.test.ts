import { describe, it } from 'vitest';
import { TESTNET_ENV } from './shared';
import { useImmortal } from '../extension';
import { forkSporeConfig } from '../config';

describe('SporeConfig', function () {
  it('Fork config', function () {
    const { config } = TESTNET_ENV;
    const newConfig = forkSporeConfig(config, {
      scripts: {
        Some: {
          script: {
            codeHash: '',
            hashType: 'type',
          },
          cellDep: {
            outPoint: {
              txHash: '',
              index: '',
            },
            depType: 'code',
          },
        },
      },
      extensions: [useImmortal()],
    });

    console.log(newConfig);
  });
});
