const iconv = require("iconv-lite");
const { detectBufferEncoding } = require("./detect-encoding");
const { parseCsv } = require("./csv");

// Copied from strip-bom package which contains ES6 syntax
function stripBom(str) {
  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  return str.codePointAt(0) === 0xfe_ff ? str.slice(1) : str;
}

function decodeBuffer(buffer) {
  const encoding = detectBufferEncoding(buffer);
  const decodedString = stripBom(iconv.decode(buffer, encoding));
  return { encoding, decodedString };
}

async function parse(buffer, options = {}) {
  const { encoding, decodedString } = decodeBuffer(buffer);
  const parseResult = await parseCsv(decodedString, options);
  return { ...parseResult, encoding };
}

module.exports = { decodeBuffer, parse };
