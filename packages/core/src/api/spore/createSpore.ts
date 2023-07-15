import { helpers, HexString } from '@ckb-lumos/lumos';
import { FromInfo } from '@ckb-lumos/common-scripts';
import { BytesLike } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/base';
import { SporeConfig } from '../../config';
import { EncodableContentType } from '../../helpers/contentType';

export interface SporeDataProps {
  /**
   * Specify the MIME type of the content.
   * An example: type/subtype;param1=value1;param2=value2
   */
  contentType: string;
  /**
   * Additional parameters, adding to the contentType variable.
   */
  contentTypeParameters: EncodableContentType['parameters'];
  /**
   * The content of the NFT as bytes.
   */
  content: BytesLike;
  /**
   * Cluster Id of the spore, optional.
   * It should be a 32-byte hash.
   */
  spore?: HexString;
}

declare function createSpore(props: {
  sporeData: SporeDataProps;
  fromInfos: FromInfo[];
  toLock: Script;
  config: SporeConfig;
}): Promise<{
  txSkeleton: helpers.TransactionSkeletonType;
  outputIndex: number;
}>;
