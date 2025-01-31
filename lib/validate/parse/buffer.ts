import iconv from "iconv-lite";
import { detectBufferEncoding } from "./detect-encoding";

import { parseCsv } from "./csv";

// Copied from strip-bom package which contains ES6 syntax
function stripBom(str: string): string {
  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  return str.codePointAt(0) === 0xfe_ff ? str.slice(1) : str;
}

function decodeBuffer(buffer: Buffer) {
  const encoding: string = detectBufferEncoding(buffer);
  const decodedString: string = stripBom(iconv.decode(buffer, encoding));
  return { encoding, decodedString };
}

export async function parse(buffer: Buffer, options = {}) {
  const { encoding, decodedString } = decodeBuffer(buffer);
  const { data, errors, meta } = await parseCsv(decodedString, options);
  return { data, errors, meta, encoding };
}
