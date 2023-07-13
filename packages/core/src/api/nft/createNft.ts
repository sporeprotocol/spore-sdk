import { helpers, HexString } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BytesLike } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/base';
import { CNftConfig } from '../../config';

export interface CNftDataProps {
  /**
   * Specify the MIME type of the content.
   * Its format is like this: type/subtype;param1=value1;param2=value2
   */
  contentType: string;
  /**
   * The content of the NFT as bytes.
   */
  content: BytesLike;
  /**
   * Optional group id of the NFT.
   * It should be a 32-byte hash.
   */
  group?: HexString;
}

declare function createNft(props: {
  nftData: CNftDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: CNftConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}>;
