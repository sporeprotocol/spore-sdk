import { describe, expect, it } from 'vitest';
import { bytes } from '@ckb-lumos/codec';
import { HexString } from '@ckb-lumos/lumos';
import { bytifyRawString } from '../helpers';
import { RawSporeData, packRawSporeData, unpackToRawSporeData } from '../codec';
import { RawClusterData, packRawClusterData, unpackToRawClusterData } from '../codec';

interface PackableTest<T> {
  packable: T;
  packed: HexString;
}

describe('Codec', function () {
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

      console.log(unpacked);
      expect(bytes.equal(unpacked.content, test.packable.content)).eq(
        true,
        `SporeData.content in test #${i} should be unpackable`,
      );
      expect(unpacked.contentType).eq(
        test.packable.contentType,
        `SporeData.contentType in test #${i} should be unpackable`,
      );
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
      console.log([unpacked.name, test.packable.name]);
      expect(unpacked.name).eq(test.packable.name, `ClusterData.name in test #${i} should be unpackable`);
      expect(unpacked.description).eq(
        test.packable.description,
        `ClusterData.description in test #${i} should be unpackable`,
      );
    }
  });
});
