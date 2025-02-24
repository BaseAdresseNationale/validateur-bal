import toBuffer from 'blob-to-buffer';
import { detectBufferEncoding } from './detect-encoding';
import { parseCsv } from './csv';
import { ParseResult } from 'papaparse';
import { ParseReturn } from './buffer';

function detectBlobEncoding(blob): Promise<string> {
  return new Promise((resolve, reject) => {
    toBuffer(blob, (err, buffer) => {
      if (err) {
        return reject(err);
      }

      resolve(detectBufferEncoding(buffer));
    });
  });
}

export async function parse(blob, options = {}): Promise<ParseReturn> {
  const encoding: string = await detectBlobEncoding(blob);
  const parseResult: ParseResult<Record<string, string>> = await parseCsv(
    blob,
    { ...options, encoding },
  );
  return { ...parseResult, encoding };
}
