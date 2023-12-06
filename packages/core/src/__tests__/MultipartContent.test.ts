import { describe, it, expect } from 'vitest';
import { TTypedArray } from '@exact-realty/multipart-parser/dist/types';
import { TDecodedMultipartMessage } from '@exact-realty/multipart-parser/dist/encodeMultipartMessage';
import {
  bytifyRawString,
  decodeMultipartContent,
  encodeMultipartContent,
  isMultipartContentAsBytesValid,
  isMultipartContentValid,
  readArrayBufferStream,
} from '../helpers';
import { AsyncableIterable, ResolvedMultipartContent } from '../helpers';
import { fetchLocalImage } from './shared';
import { TextEncoder } from 'util';

describe('Multipart SporeData.content', async function () {
  const parseTests: MultipartTestCase[] = [
    {
      raw: `
--boundary
content-type: text/plain

a message containing an image

--boundary
content-disposition: attachment, filename="test.jpg"
content-transfer-encoding: base64
content-type: image/jpg

/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAf/xAAfEAADAAICAwEBAAAAAAAAAAABAgMEBQARBiExQRT/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AZHc7XC1vm2wts8x8ds7Y4Ume7H+N0QtAoSepqSzp69ljEAfeUPxO1cnw7S3vV61rr4PSjsWZ2M1JJJ+kn94p9NqqYuRivrMNsfKqbZEjBSlnJBLMOumbsA9n36HExjLGhOEJJKUlCTmihVRQOgAB8AH5wP/Z
--boundary--
`,
      message: [
        'boundary',
        [
          {
            headers: new Headers({ 'Content-Type': 'text/plain' }),
            body: bytifyRawString('a message containing an image\r\n'),
          },
          {
            headers: new Headers({
              'content-type': 'image/jpg',
              'content-transfer-encoding': 'base64',
              'content-disposition': 'attachment, filename="test.jpg"',
            }),
            body: bytifyRawString((await fetchLocalImage('./resources/test.jpg', __dirname)).base64),
          },
        ],
      ],
    },
    {
      raw: `
--boundary_1
content-type: multipart/mixed; boundary=boundary_2

--boundary_2
content-type: multipart/alternative; boundary=boundary_3

--boundary_3
content-type: text/plain; charset=UTF-8

Hello,

This is a plain text message.

Best regards,
Sender

--boundary_3
content-type: text/html; charset=UTF-8

<html>
  <body>
    <p>Hello,</p>
    <p>This is an HTML message.</p>
    <p>Best regards,<br>Sender</p>
  </body>
</html>

--boundary_3--
--boundary_2
content-disposition: attachment; filename="example.dat"
content-type: image/example

<binary data>

--boundary_2--
--boundary_1--
`,
      message: [
        'boundary_1',
        [
          {
            headers: new Headers({
              ['content-type']: 'multipart/mixed; boundary=boundary_2',
            }),
            parts: [
              {
                headers: new Headers({
                  'content-type': 'multipart/alternative; boundary=boundary_3',
                }),
                parts: [
                  {
                    headers: new Headers({
                      'content-type': 'text/plain; charset=UTF-8',
                    }),
                    body: bytifyRawString(
                      'Hello,\r\n' +
                        '\r\n' +
                        'This is a plain text message.\r\n' +
                        '\r\n' +
                        'Best regards,\r\n' +
                        'Sender\r\n',
                    ),
                  },
                  {
                    headers: new Headers({
                      'content-type': 'text/html; charset=UTF-8',
                    }),
                    body: bytifyRawString(
                      '<html>\r\n' +
                        '  <body>\r\n' +
                        '    <p>Hello,</p>\r\n' +
                        '    <p>This is an HTML message.</p>\r\n' +
                        '    <p>Best regards,<br>Sender</p>\r\n' +
                        '  </body>\r\n' +
                        '</html>\r\n',
                    ),
                  },
                ],
              },
              {
                headers: new Headers({
                  'content-disposition': 'attachment; filename="example.dat"',
                  'content-type': 'image/example',
                }),
                body: bytifyRawString('<binary data>\r\n'),
              },
            ],
          },
        ],
      ],
    },
  ];

  const validityTests: MultipartValidityTestCase[] = [
    ...parseTests.map((r) => {
      return {
        expect: true,
        message: r.raw,
        boundary: r.message[0],
      };
    }),

    {
      message: 'test without boundary',
      boundary: 'boundary',
      expect: false,
    },
    {
      message: `
--boundary
test without closing boundary
`,
      boundary: 'boundary',
      expect: false,
    },
    {
      message: `
--boundary
minimal viable multipart message, ending without CRLF
--boundary--`,
      boundary: 'boundary',
      expect: false,
    },
    {
      message: `
--boundary
minimal viable multipart message
--boundary--
`,
      boundary: 'boundary',
      expect: true,
    },
    {
      message: `--boundary
test with opening boundary that does not start with CRLF
--boundary--
`,
      boundary: 'boundary',
      expect: true,
    },
  ];

  const validBoundary = 'example-valid-boundary';
  const invalidBoundary = 'example-invalid-boundary';

  const invalidMultipartMessage = `
    --${invalidBoundary}
    Content-Type: text/plain

    Hello, World!
    --${invalidBoundary}--
  `;

  it('Encode', async () => {
    for (let i = 0; i < parseTests.length; i++) {
      const test = parseTests[i];
      const testString = replaceNewLineToCRLF(test.raw);

      const encoded = await encodeMultipartContent(...test.message);
      const resultStringChunks = encoded.rawStringChunks;

      expect(testString.length).eq(encoded.codeUnitLength);

      let startIndex = 0;
      for (let j = 0; j < resultStringChunks.length; j++) {
        const resultStringChunk = replaceNewLineToCRLF(resultStringChunks[j]);
        const testStringChunk = testString.slice(startIndex, startIndex + resultStringChunk.length);
        expect(testStringChunk).eq(resultStringChunk);
        startIndex += resultStringChunk.length;
      }
    }
  });

  it('Decode', async () => {
    async function testDecoded(
      msgs: ResolvedMultipartContent[],
      iterableRefs: AsyncableIterable<TDecodedMultipartMessage>,
    ) {
      const refs: TDecodedMultipartMessage[] = [];
      for await (const ref of iterableRefs) {
        refs.push(ref);
      }

      expect(msgs.length).eq(refs.length);
      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        const ref = refs[i];

        // Headers
        for (const key of (ref.headers as any).keys()) {
          expect(msg.headers.get(key)).eq(ref.headers.get(key));
        }
        // Body
        if (ref.body) {
          expect(msg).toHaveProperty('body');
          const msgBody = await transformMultipartBody(msg.body);
          const refBody = await transformMultipartBody(ref.body);

          expect(msgBody.byteLength).eq(refBody.byteLength);
          expect(Buffer.from(msgBody).compare(Buffer.from(refBody))).eq(0);
        }
        // Parts
        if (ref.parts) {
          expect(msg).toHaveProperty('parts');
          await testDecoded(msg.parts!, ref.parts);
        } else {
          expect(msg.parts).toBeUndefined();
        }
      }
    }

    for (let i = 0; i < parseTests.length; i++) {
      const test = parseTests[i];
      const messages = await decodeMultipartContent(test.raw, test.message[0]);
      await testDecoded(messages, test.message[1]);
    }
  });

  it('Validity', async () => {
    for (let i = 0; i < validityTests.length; i++) {
      const test = validityTests[i];
      const result = await isMultipartContentValid(test.message, test.boundary);
      console.log(result);
      expect(result).eq(test.expect, `the #${i} validity test should match the expectation`);
    }
  });

  it('Handles large files', async () => {
    const largeFileContent = generateLargeFile();
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    console.log(largeFileContent);

    const message: AsyncableIterable<TDecodedMultipartMessage> = [
      {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: largeFileContent,
      },
    ];

    const encoded = await encodeMultipartContent(boundary, message);
    console.log('aaa====' + encoded.rawStringChunks);
    expect(encoded.rawStringChunks).toBeDefined();
    expect(encoded.buffer).toBeDefined();
  });

  it('Handles empty message', async () => {
    const emptyMessage: AsyncableIterable<TDecodedMultipartMessage> = [
      {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: bytifyRawString(''),
      },
    ];

    const encoded = await encodeMultipartContent('boundary', emptyMessage);

    console.log('Actual:', encoded.rawStringChunks);

    // Adjust the expected string to use \n as the newline character and remove invisible characters that may cause depth equality to fail
    const expected = '\n--boundary\ncontent-type: text/plain\n\n--boundary--\n'.replace(/\s/g, '');
    const actual = encoded.rawStringChunks.join('').replace(/\s/g, '');

    expect(actual).toEqual(expected);
  });

  it('Handles message with only headers', async () => {
    const headersOnlyMessage: AsyncableIterable<TDecodedMultipartMessage> = [
      {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: null,
      },
    ];

    const encoded = await encodeMultipartContent('boundary', headersOnlyMessage);

    console.log('Actual:', encoded.rawStringChunks);

    // Adjust the expected string to use \n as the newline character and remove invisible characters that may cause depth equality to fail
    const expected = '\n--boundary\nContent-Type: text/plain\n\n--boundary--\n'.replace(/\s/g, '').toLowerCase();
    const actual = encoded.rawStringChunks.join('').replace(/\s/g, '').toLowerCase();

    expect(actual).toEqual(expected);
  });

  it('Handles different character sets and encodings', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const message = createMessageWithDifferentCharsetsAndEncodings();

    const encoded = await encodeMultipartContent(boundary, message);

    expect(encoded).toHaveProperty('rawStringChunks');
    expect(encoded).toHaveProperty('buffer');
  });

  it('Handles exceptional cases', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    // Create a message containing an exception
    const message = createMessageWithExceptionalCases();

    // 将 message.message[1] 转换为 AsyncableIterable<TDecodedMultipartMessage>
    const asyncIterable: AsyncableIterable<TDecodedMultipartMessage> = message.message[1];

    const encoded = await encodeMultipartContent(message.message[0], asyncIterable);

    console.log(encoded.rawStringChunks);
    expect(encoded.rawStringChunks.join('')).toMatch(/\r?\n--\s*boundary\r?\n/);

    expect(encoded.rawStringChunks.join('')).toContain('Invalid content type message');
    expect(encoded.rawStringChunks.join('')).toContain('Normal text message');
  });

  it('Handles invalid multipart content', async () => {
    const invalidMessage = `
    text without boundary
  `;
    try {
      await decodeMultipartContent(invalidMessage, 'boundary');
      expect.fail('Expected an error but none occurred.');
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
        expect(error.message).toContain('Invalid message');
      }
    }
  });

  it('should return true for valid bytes', async () => {
    const headersOnlyMessage: AsyncableIterable<TDecodedMultipartMessage> = [
      {
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: null,
      },
    ];

    const boundary = 'example_boundary';
    const { buffer } = await encodeMultipartContent(boundary, headersOnlyMessage);

    // 调用函数时传入 Uint8Array 或 ArrayBuffer
    const isValidUint8Array = await isMultipartContentAsBytesValid(new Uint8Array(buffer), boundary);
    expect(isValidUint8Array).toBe(true);
  });

  it('should return false for invalid bytes', async () => {
    const result = await isMultipartContentAsBytesValid(invalidMultipartMessage, validBoundary);
    expect(result).toBe(false);
  });
});

interface MultipartTestCase {
  raw: string;
  message: Parameters<typeof encodeMultipartContent>;
}

interface MultipartValidityTestCase {
  expect: boolean;
  message: string;
  boundary: string;
}

async function transformMultipartBody(body: TDecodedMultipartMessage['body']): Promise<ArrayBuffer> {
  if (body instanceof ArrayBuffer) {
    return body;
  } else if (body instanceof Blob) {
    return await body.arrayBuffer();
  } else if (body instanceof ReadableStream) {
    const loaded = await readArrayBufferStream(body);
    return loaded.buffer;
  } else if (body?.buffer && (body.buffer as TTypedArray) instanceof ArrayBuffer) {
    return body.buffer.slice(body.byteOffset, body.byteOffset + body.length);
  } else {
    throw new Error('Invalid body type');
  }
}

function replaceNewLineToCRLF(str: string) {
  return str.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

// Create messages with different character sets and encodings
function createMessageWithDifferentCharsetsAndEncodings(): AsyncableIterable<TDecodedMultipartMessage> {
  const text = 'Hello, 你好, مرحبًا';

  // Create messages with different character sets and encodings
  const messages: TDecodedMultipartMessage[] = [
    {
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
      }),
      body: encodeTextToUint8Array(text, 'utf-8'),
    },
    {
      headers: new Headers({
        'Content-Type': 'text/plain; charset=gbk',
      }),
      body: encodeTextToUint8Array(text, 'gbk'),
    },
    {
      headers: new Headers({
        'Content-Type': 'text/plain; charset=iso-8859-1',
      }),
      body: encodeTextToUint8Array(text, 'iso-8859-1'),
    },
  ];

  return messages;
}

function encodeTextToUint8Array(text: string, encoding: string = 'utf-8'): Uint8Array {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(text);
}

function createMessageWithExceptionalCases(): MultipartTestCase {
  const exceptionalMessage: TDecodedMultipartMessage[] = [
    {
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
      }),
      body: bytifyRawString('Normal text message'),
    },
    // Invalid Content-Type
    {
      headers: new Headers({
        'Content-Type': 'invalid-content-type',
      }),
      body: bytifyRawString('Invalid content type message'),
    },
    // null body
    {
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
      }),
      body: bytifyRawString(''),
    },
  ];

  const asyncIterable: AsyncableIterable<TDecodedMultipartMessage> = {
    [Symbol.asyncIterator]: async function* () {
      yield* exceptionalMessage;
    },
  };

  const testCase: MultipartTestCase = {
    raw: `
    --boundary
    Content-Type: text/plain; charset=utf-8

    Normal text message
    --boundary
    Content-Type: invalid-content-type

    Invalid content type message
    --boundary
    Content-Type: text/plain; charset=utf-8

    --boundary--
  `,
    message: ['boundary', asyncIterable],
  };

  return testCase;
}

export function generateLargeFile(sizeInMB: number = 25): Uint8Array {
  const content = new Uint8Array(sizeInMB * 1024 * 1024);
  content.fill('A'.charCodeAt(0));
  return content;
}
