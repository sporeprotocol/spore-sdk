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
            codeHash: '0x49d12ddc57a6eb4ea57ab4bf4c380c7607a647ea8e83f7499b97e1b9ce894ad0',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x469fb1c7a1003266e2d98e51ce9b5aa19d0c1e39ea667c1f5cd973c0d7da9649',
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
            codeHash: '0x71833e6e8c1326a478762d1f67dd529363fd43696d73df75315eb7aae2bdd31c',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x39b4867ac23373d2f4ffd9c875ffe29fd0f9347e7a9ffc6e1cc453f1921ff25f',
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
            codeHash: '0x98bfdda3000708d2b058e0bd17827b6d3ca21827f059baeea23b228b74c678b3',
            hashType: 'data1',
          },
          cellDep: {
            outPoint: {
              txHash: '0x6d41f6921410c5227c50c8d6b99583a587f6363e917ecd1805d0c592c6560f12',
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
