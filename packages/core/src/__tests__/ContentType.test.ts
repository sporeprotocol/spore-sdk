import { describe, it, expect } from 'vitest';
import { encodeContentType, decodeContentType, DecodedContentType } from '../helpers/contentType';

describe('ContentType', function () {
  it('Decode normal MIME', function () {
    const t = decodeContentType('image/svg+xml;q=";";q=0.8');

    expect(t.type).toEqual('image');
    expect(t.subtype).toEqual('svg+xml');
    expect(t.mediaType).toEqual('image/svg+xml');
    expect(t.parameters.q).toEqual(';');
  });
  it('Decode non-existing MIME', function () {
    const t = decodeContentType('a/b;c=1;d=2');

    expect(t.type).toEqual('a');
    expect(t.subtype).toEqual('b');
    expect(t.mediaType).toEqual('a/b');
    expect(t.parameters.c).toEqual('1');
    expect(t.parameters.d).toEqual('2');
  });
  it('Decode invalid MIME', function () {
    const errorMimes: string[] = ['plain/;', 'text', ';', '-', 'plain/', 'plain/test;;test=;'];

    for (const mime of errorMimes) {
      let decoded: DecodedContentType | undefined;
      try {
        decoded = decodeContentType(mime);
      } catch {
        // Expect error while decoding
      }

      if (decoded) {
        console.log(decoded);
        throw new Error(`"${mime}" was decoded when it shouldn't be`);
      }
    }
  });

  it('Encode normal MIME', function () {
    const t = encodeContentType({
      type: 'image',
      subtype: 'svg+xml',
      parameters: {
        q: 0.9,
      },
    });

    expect(t).toEqual('image/svg+xml;q=0.9');
  });
  /*it('Encode invalid parameters', function() {
    const errorEncodables: EncodableContentType[] = [
      {
        type: 'image',
        subtype: 'svg+xml',
        parameters: {
          q: ';',
        },
      }
    ];

    for (const encodable of errorEncodables) {
      console.log(encodeContentType(encodable));
      // const t = () => encodeContentType(encodable);
      // expect(t).toThrow('Cannot encode ContentType');
    }
  });*/
});
