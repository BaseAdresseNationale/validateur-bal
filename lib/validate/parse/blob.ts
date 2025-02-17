import toBuffer from 'blob-to-buffer';
import { detectBufferEncoding } from './detect-encoding';
import { parseCsv } from './csv';

function detectBlobEncoding(blob) {
  return new Promise((resolve, reject) => {
    toBuffer(blob, (err, buffer) => {
      if (err) {
        return reject(err);
      }

      resolve(detectBufferEncoding(buffer));
    });
  });
}

export async function parse(blob, options = {}) {
  const encoding = await detectBlobEncoding(blob);
  const parseResult = await parseCsv(blob, { ...options, encoding });
  return { ...parseResult, encoding };
}
