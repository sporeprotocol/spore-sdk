import { decodeContentType } from '../../helpers';
import { SporeExtension } from '../types';
import { SporeData } from '../../codec';

/**
 * A core extension of Spore NFT, to allow a spore cell to be indestructible on-chain.
 *
 * When setting a spore cell to be "immortal", the spore cell will be indestructible,
 * it cannot be melted, therefore the cell can be lived on the blockchain forever.
 */
export function useImmortal(): SporeExtension {
  return {
    name: 'immortal',
    dataHash: '0x',
    hooks: {
      onCreateSpore(context) {
        const outputs = context.txSkeleton.get('outputs');
        const spore = outputs.get(context.outputIndex);
        if (spore !== void 0) {
          const data = SporeData.unpack(spore.data);
          const contentType = decodeContentType(data.contentType);
          const immortal = contentType.parameters.immortal;
          if (immortal && !isImmortalParameterValid(immortal)) {
            throw new Error(
              `Spore at Transaction.outputs[${context.outputIndex}] has provided invalid param: immortal=${immortal}`,
            );
          }
        }

        return context.txSkeleton;
      },
      onMeltSpore(context) {
        const outputs = context.txSkeleton.get('outputs');
        const spore = outputs.get(context.inputIndex);
        if (spore) {
          const data = SporeData.unpack(spore.data);
          const contentType = decodeContentType(data.contentType);
          if (contentType.parameters.immortal === 'true') {
            throw new Error(
              `Spore at Transaction.inputs[${context.inputIndex}] cannot be melted because it's immortal`,
            );
          }
        }

        return context.txSkeleton;
      },
    },
  };
}

export function isImmortalParameterValid(immortal: unknown) {
  return typeof immortal === 'string' && (immortal === 'true' || immortal === 'false');
}

export function getImmortalParameter() {}
