import { describe, it, assert, expect } from 'vitest';
import MimeType from 'whatwg-mimetype';
// @ts-ignore
import encodeMime from 'whatwg-mimetype/lib/parser';
// @ts-ignore
import decodeMime from 'whatwg-mimetype/lib/serializer';

describe('MIME', function () {
  it('Encode', function () {
    const t = encodeMime('image/svg+xml;q=0.9,/;q=0.8');
    console.log(t);
  });
  it('Encode non-existing MIME', function () {
    const t = encodeMime('a/b;c=1;d=2');

    expect(t.type).toEqual('a');
    expect(t.subtype).toEqual('b');
    expect(t.parameters.get('c')).toEqual('1');
    expect(t.parameters.get('d')).toEqual('2');
  });
  it('Encode invalid MIME', function () {
    const errorMimes: string[] = ['plain/;', 'text', ';', '-', 'plain/', 'plain/test;;test=;'];

    for (const mime of errorMimes) {
      try {
        const encoded = new MimeType(mime);
        assert(mime !== encoded.toString(), 'should not equals');
      } catch {
        // Cannot encode, which is expected
      }
    }
  });

  it('Decode', function () {
    const t = decodeMime({
      type: 'image',
      subtype: 'svg+xml',
      parameters: Object.entries({
        q: 0.9,
      }),
    });

    expect(t).toEqual('image/svg+xml;q=0.9');
  });
  it('Decode invalid parameters', function () {
    const t = decodeMime({
      type: 'image',
      subtype: 'svg+xml',
      parameters: Object.entries({
        q: ' ',
      }),
    });

    console.log(t);
  });
});
