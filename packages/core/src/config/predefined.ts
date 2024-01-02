import { predefined } from '@ckb-lumos/config-manager';
import { SporeConfig } from './types';

export type PredefinedSporeConfigScriptName = 'Spore' | 'Cluster' | 'ClusterProxy' | 'ClusterAgent' | 'Mutant' | 'Lua';

const TESTNET_SPORE_CONFIG: SporeConfig<PredefinedSporeConfigScriptName> = {
  lumos: predefined.AGGRON4,
  ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
  ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
  maxTransactionSize: 500 * 1024, // 500 KB
  scripts: {
    Spore: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x217b04fe8e4868f57ce581adf3ac24798aa55e15caeae29e50f68998dbd73166',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x84999a8146bb8680c69e9ced430bc034ea15ecf3add5ffba59f248770f1e3ef2',
              index: '0x0',
            },
            depType: 'code',
          },
        },
        {
          tags: ['v1'],
          script: {
            codeHash: '0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    Cluster: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x1dbd4b03f1cf9d27b5359f8e3569efcb848bc71e6f204654509ce67c07bb1fdd',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x91555ebd2bbddf80da141a58220648d6dd3f8c04ba4bb8312d01907165b636ad',
              index: '0x0',
            },
            depType: 'code',
          },
        },
        {
          tags: ['v1'],
          script: {
            codeHash: '0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x49551a20dfe39231e7db49431d26c9c08ceec96a29024eef3acc936deeb2ca76',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    ClusterProxy: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x1cd31b737dba535a7eb72ca89a44ee35c82377af96d999c1f1a09a9ea0eb13d4',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x8886c3e6b1df9ac9301cf39e8ee60c08b58b049b239c7342b1fe46a46a4961a5',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    ClusterAgent: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x19c3121acfceb8740f8395205ea3308caab530455f6a17a86fcbfc9f19d8dde1',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x8f62bf1108aa69e7d83bdc40729c9949a87b88f852c09840775a1c4328daecd8',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    Mutant: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0x2b4ec50a886bd1e697c5223aca624d4ab3793d74d85723c511461da143406482',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0xbb65bb4f6064e85ef8af018b3ab5b283b1feeec39fb6fd1bdc4565411a79c7f9',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
    Lua: {
      versions: [
        {
          tags: ['v2', 'preview'],
          script: {
            codeHash: '0xed08faee8c29b7a7c29bd9d495b4b93cc207bd70ca93f7b356f39c677e7ab0fc',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x8fb7170a58d631250dabd0f323a833f4ad2cfdd0189f45497e62beb8409e7a0c',
              index: '0x0',
            },
            depType: 'code',
          },
        },
      ],
    },
  },
};

export const predefinedSporeConfigs = {
  Aggron4: TESTNET_SPORE_CONFIG,
};
