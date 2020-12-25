const jschardet = require('jschardet-french')
const toBuffer = require('blob-to-buffer')

const CHARDET_TO_NORMALIZED_ENCODINGS = {
  'windows-1252': 'Latin-1',
  'utf-8': 'UTF-8',
  ascii: 'UTF-8' // Compat
}

function normalizeEncodingName(encoding) {
  const lcEncoding = encoding.toLowerCase()
  if (!(lcEncoding in CHARDET_TO_NORMALIZED_ENCODINGS)) {
    throw new Error('Encoding currently not supported: ' + encoding)
  }

  return CHARDET_TO_NORMALIZED_ENCODINGS[lcEncoding]
}

function detectBufferEncoding(buffer) {
  const result = jschardet.detect(buffer)
  if (!result || !result.encoding) {
    throw new Error('Unable to detect encoding')
  }

  return normalizeEncodingName(result.encoding)
}

function detectBlobEncoding(blob) {
  return new Promise((resolve, reject) => {
    toBuffer(blob, (err, buffer) => {
      if (err) {
        return reject(err)
      }

      resolve(detectBufferEncoding(buffer))
    })
  })
}

const NORMALIZED_TO_BLOB_ENCODINGS = {
  'Latin-1': 'windows-1252',
  'UTF-8': 'utf-8'
}

function getBlobEncoding(encoding) {
  return NORMALIZED_TO_BLOB_ENCODINGS[encoding]
}

// Copied from strip-bom package which contains ES6 syntax
function stripBom(str) {
  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str
}

const NORMALIZED_TO_NODEJS_ENCODINGS = {
  'Latin-1': 'latin1',
  'UTF-8': 'utf8'
}

function decodeBuffer(buffer) {
  const encoding = detectBufferEncoding(buffer)
  const decodedString = stripBom(buffer.toString(NORMALIZED_TO_NODEJS_ENCODINGS[encoding]))
  return {encoding, decodedString}
}

module.exports = {normalizeEncodingName, detectBufferEncoding, detectBlobEncoding, decodeBuffer, getBlobEncoding}
