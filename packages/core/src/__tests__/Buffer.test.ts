import { describe, expect, it } from 'vitest';
import { bufferToRawString, bytifyRawString } from '../helpers';

describe('Buffer', () => {
  it('Encode buffer from raw text', () => {
    const rawStrings = ['image/jpeg;a=1;b=2', '甲/乙;丙=1;丁=2'];

    for (const raw of rawStrings) {
      const encoded = bytifyRawString(raw);
      const decoded = bufferToRawString(encoded);
      expect(decoded).to.eq(raw);
    }
  });
});
