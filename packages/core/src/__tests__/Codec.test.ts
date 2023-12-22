import { describe, expect, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { BI, HexString } from '@ckb-lumos/lumos';
import { TESTNET_ENV } from './shared';
import { getSporeScript } from '../config';
import { bytifyRawString, isScriptValueEquals } from '../helpers';
import { RawSporeData, packRawSporeData, unpackToRawSporeData } from '../codec';
import { RawClusterData, packRawClusterData, unpackToRawClusterData } from '../codec';
import { RawClusterProxyArgs, packRawClusterProxyArgs, unpackToRawClusterProxyArgs } from '../codec';
import { RawClusterAgentData, packRawClusterAgentDataToHash, unpackToRawClusterAgentData } from '../codec';

interface PackableTest<T> {
  packable: T;
  packed: HexString;
}

describe('Codec', function () {
  const { config } = TESTNET_ENV;

  /**
   * SporeData
   */
  const sporeDataTests: PackableTest<RawSporeData>[] = [
    {
      packable: {
        contentType: 'text/plain',
        content: bytifyRawString('testing plain text'),
        clusterId: '0x21a30f2b2f4927dbd6fd3917990af0dbb868438f44184e84d515f9af84ae4861',
      },
      packed:
        '0x58000000100000001e000000340000000a000000746578742f706c61696e1200000074657374696e6720706c61696e20746578742000000021a30f2b2f4927dbd6fd3917990af0dbb868438f44184e84d515f9af84ae4861',
    },
    {
      packable: {
        contentType: 'text/plain',
        content: bytifyRawString('testing plain text'),
      },
      packed:
        '0x34000000100000001e000000340000000a000000746578742f706c61696e1200000074657374696e6720706c61696e2074657874',
    },
  ];
  it('Pack SporeData', function () {
    for (let i = 0; i < sporeDataTests.length; i++) {
      const test = sporeDataTests[i];
      const packed = packRawSporeData(test.packable);
      const packedHex = bytes.hexify(packed);
      expect(packedHex).eq(test.packed, `SporeData in test #${i} should be packable`);
    }
  });
  it('Unpack SporeData', function () {
    for (let i = 0; i < sporeDataTests.length; i++) {
      const test = sporeDataTests[i];
      const unpacked = unpackToRawSporeData(test.packed);

      // SporeData.content
      expect(bytes.equal(unpacked.content, test.packable.content)).eq(
        true,
        `SporeData.content in test #${i} should be unpackable`,
      );

      // SporeData.contentType
      expect(unpacked.contentType).eq(
        test.packable.contentType,
        `SporeData.contentType in test #${i} should be unpackable`,
      );

      // SporeData.clusterId
      if (test.packable.clusterId !== void 0) {
        expect(unpacked.clusterId).toBeDefined();

        const unpackedClusterId = bytes.bytify(unpacked.clusterId!);
        const packableClusterId = bytes.bytify(test.packable.clusterId!);
        expect(bytes.equal(unpackedClusterId, packableClusterId)).eq(
          true,
          `SporeData.clusterId in test #${i} should be unpackable`,
        );
      } else {
        expect(unpacked.clusterId).toBeUndefined();
      }
    }
  });

  /**
   * ClusterData
   */
  const clusterDataTests: PackableTest<RawClusterData>[] = [
    {
      packable: {
        name: 'cluster name',
        description: 'description of the cluster',
      },
      packed:
        '0x3a0000000c0000001c0000000c000000636c7573746572206e616d651a0000006465736372697074696f6e206f662074686520636c7573746572',
    },
    {
      packable: {
        name: 'cluster name\r\n',
        description: 'description of the cluster\r\n',
      },
      packed:
        '0x3e0000000c0000001e0000000e000000636c7573746572206e616d650d0a1c0000006465736372697074696f6e206f662074686520636c75737465720d0a',
    },
  ];
  it('Pack ClusterData', function () {
    for (let i = 0; i < clusterDataTests.length; i++) {
      const test = clusterDataTests[i];
      const packed = packRawClusterData(test.packable);
      const packedHex = bytes.hexify(packed);
      expect(packedHex).eq(test.packed, `ClusterData in test #${i} should be packable`);
    }
  });
  it('Unpack ClusterData', function () {
    for (let i = 0; i < clusterDataTests.length; i++) {
      const test = clusterDataTests[i];
      const unpacked = unpackToRawClusterData(test.packed);

      // ClusterData.name
      expect(unpacked.name).eq(test.packable.name, `ClusterData.name in test #${i} should be unpackable`);

      // ClusterData.description
      expect(unpacked.description).eq(
        test.packable.description,
        `ClusterData.description in test #${i} should be unpackable`,
      );
    }
  });

  /**
   * ClusterProxyArgs
   */
  const clusterProxyArgsTests: PackableTest<RawClusterProxyArgs>[] = [
    {
      packable: {
        id: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9',
        minPayment: void 0,
      },
      packed: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9',
    },
    {
      packable: {
        id: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9',
        minPayment: BI.from(1),
      },
      packed: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b90100',
    },
    {
      packable: {
        id: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9',
        minPayment: BI.from(65535),
      },
      packed: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9ffff',
    },
  ];
  it('Pack ClusterProxyArgs', function () {
    for (let i = 0; i < clusterProxyArgsTests.length; i++) {
      const test = clusterProxyArgsTests[i];
      const packed = packRawClusterProxyArgs(test.packable);
      const packedHex = bytes.hexify(packed);
      expect(packedHex).eq(test.packed, `ClusterProxyArgs in test #${i} should be packable`);
    }
  });
  it('Unpack ClusterProxyArgs', function () {
    for (let i = 0; i < clusterProxyArgsTests.length; i++) {
      const test = clusterProxyArgsTests[i];
      const unpacked = unpackToRawClusterProxyArgs(test.packed);

      // ClusterProxyArgs.id
      expect(unpacked.id).eq(test.packable.id, `ClusterProxyArgs.id in test #${i} should be unpackable`);

      // ClusterProxyArgs.minPayment
      if (test.packable.minPayment !== void 0) {
        expect(unpacked.minPayment).toBeDefined();
        const minPayment = unpacked.minPayment!.toHexString();
        const expectMinPayment = test.packable.minPayment!.toHexString();
        expect(minPayment).eq(expectMinPayment, `ClusterProxyArgs.minPayment in test #${i} should be unpackable`);
      } else {
        expect(unpacked.minPayment).toBeUndefined();
      }
    }
  });

  /**
   * ClusterAgentData
   */
  const clusterAgentScript = getSporeScript(config, 'ClusterAgent');
  const clusterAgentDataTests: PackableTest<RawClusterAgentData>[] = [
    {
      packable: {
        codeHash: clusterAgentScript.script.codeHash,
        hashType: clusterAgentScript.script.hashType,
        args: '0x8e005ff187895a0ae9288462299b6e43ee349fafdf3bca4a3886285b5439d7b9',
      },
      packed: '0x2abeab67be9a63aa882c369a9cc5b38c5fc2dab59ee0f1b39116f6fa6b7e2d65',
    },
  ];
  it('Pack ClusterAgentData', function () {
    for (let i = 0; i < clusterAgentDataTests.length; i++) {
      const test = clusterAgentDataTests[i];
      const packedHex = packRawClusterAgentDataToHash(test.packable);
      expect(packedHex).eq(test.packed, `ClusterAgentData in test #${i} should be packable`);
    }
  });
  it('Unpack ClusterAgentData', function () {
    for (let i = 0; i < clusterAgentDataTests.length; i++) {
      const test = clusterAgentDataTests[i];
      const unpacked = unpackToRawClusterAgentData(test.packed);
      expect(isScriptValueEquals(unpacked, test.packable)).eq(
        true,
        `ClusterAgentData in test #${i} should be unpackable`,
      );
    }
  });
});
