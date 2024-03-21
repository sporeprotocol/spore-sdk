import { BIish, BI } from '@ckb-lumos/bi';
import { blockchain, Hash } from '@ckb-lumos/base';
import { BytesLike, createBytesCodec } from '@ckb-lumos/codec';
import { Uint8Opt } from './utils';

export interface PackableMutantArgs {
  id: BytesLike;
  minPayment?: BIish;
}

export interface RawMutantArgs {
  id: Hash;
  minPayment?: BI;
}

export const MutantArgs = createBytesCodec({
  pack(packable: PackableMutantArgs): Uint8Array {
    const id = blockchain.Byte32.pack(packable.id);
    const minPayment = Uint8Opt.pack(packable.minPayment);

    const composed = new Uint8Array(id.length + minPayment.length);
    composed.set(id, 0);
    composed.set(minPayment, id.length);

    return composed;
  },
  unpack(unpackable: Uint8Array): RawMutantArgs {
    const id = blockchain.Byte32.unpack(unpackable.slice(0, 32));
    const minPayment = Uint8Opt.unpack(unpackable.slice(32, 33));
    return {
      id,
      minPayment: typeof minPayment === 'number' ? BI.from(minPayment) : void 0,
    };
  },
});

export function packRawMutantArgs(packable: PackableMutantArgs): Uint8Array {
  return MutantArgs.pack(packable);
}

export function unpackToRawMutantArgs(unpackable: BytesLike): RawMutantArgs {
  return MutantArgs.unpack(unpackable);
}
