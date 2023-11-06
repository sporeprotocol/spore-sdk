import { bytes, BytesLike } from '@ckb-lumos/codec';
import parseMultipartMessage, { encodeMultipartMessage } from '@exact-realty/multipart-parser';
import { TDecodedMultipartMessage } from '@exact-realty/multipart-parser/dist/encodeMultipartMessage';
import { TMultipartMessageGenerator } from '@exact-realty/multipart-parser/dist/parseMultipartMessage';
import { TTypedArray } from '@exact-realty/multipart-parser/dist/types';
import { bufferToRawString, bytifyRawString } from './buffer';

export type AsyncableIterable<T> = AsyncIterable<T> | Iterable<T>;

export type ResolvedMultipartContent = {
  headers: Headers;
  body?: Uint8Array | null;
  parts?: ResolvedMultipartContent[] | null;
};

export async function decodeMultipartContent(message: string, boundary: string): Promise<ResolvedMultipartContent[]> {
  const buf = bytifyRawString(replaceNewLineToCRLF(message));
  return decodeMultipartContentFromBytes(buf, boundary);
}

export async function decodeMultipartContentFromBytes(
  buf: BytesLike,
  boundary: string,
): Promise<ResolvedMultipartContent[]> {
  const stream = new Blob([bytes.bytify(buf)]).stream();
  return decodeMultipartContentFromStream(stream, boundary);
}

export async function decodeMultipartContentFromStream<T extends TTypedArray>(
  stream: ReadableStream<T>,
  boundary: string,
): Promise<ResolvedMultipartContent[]> {
  async function parseMimeRecursively(messages: TMultipartMessageGenerator): Promise<ResolvedMultipartContent[]> {
    const chunks: ResolvedMultipartContent[] = [];
    for await (const chunk of messages) {
      if (chunk.parts) {
        const parts = await parseMimeRecursively(chunk.parts);
        chunks.push({
          ...chunk,
          parts,
        });
      } else {
        chunks.push({
          headers: chunk.headers,
          body: chunk.body,
        });
      }
    }

    return chunks;
  }

  return parseMimeRecursively(parseMultipartMessage(stream, boundary));
}

export async function encodeMultipartContent(
  boundary: string,
  msg: AsyncableIterable<TDecodedMultipartMessage>,
): Promise<{ buffer: ArrayBuffer; raw: string }> {
  const encoded = encodeMultipartMessage(boundary, msg);
  return await readArrayBufferStream(encoded);
}

export async function readArrayBufferStream(stream: ReadableStream<ArrayBuffer>): Promise<{
  buffer: ArrayBuffer;
  raw: string;
}> {
  const reader = stream.getReader();
  const buffers: ArrayBuffer[] = [];

  while (true) {
    const chunk = await reader.read();
    if (!chunk.done) {
      buffers.push(chunk.value);
    } else {
      break;
    }
  }

  const buf = await new Blob(buffers).arrayBuffer();

  return {
    buffer: buf,
    raw: bufferToRawString(buf),
  };
}

function replaceNewLineToCRLF(str: string) {
  return str.replace(/\r(?!n)|(?<!\r)\n/g, '\r\n');
}
