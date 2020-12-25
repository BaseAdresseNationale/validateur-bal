const {detectBufferEncoding} = require('./detect-encoding')
const {parseCsv} = require('./csv')

const NORMALIZED_TO_NODEJS_ENCODINGS = {
  'Latin-1': 'latin1',
  'UTF-8': 'utf8'
}

// Copied from strip-bom package which contains ES6 syntax
function stripBom(str) {
  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str
}

function decodeBuffer(buffer) {
  const encoding = detectBufferEncoding(buffer)
  const decodedString = stripBom(buffer.toString(NORMALIZED_TO_NODEJS_ENCODINGS[encoding]))
  return {encoding, decodedString}
}

async function parse(buffer) {
  const {encoding, decodedString} = decodeBuffer(buffer)
  const parseResult = await parseCsv(decodedString)
  return {...parseResult, encoding}
}

module.exports = {decodeBuffer, parse}
