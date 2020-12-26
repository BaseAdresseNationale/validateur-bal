const jschardet = require('jschardet-french')

const CHARDET_TO_NORMALIZED_ENCODINGS = {
  'windows-1252': 'windows-1252',
  'utf-8': 'utf-8',
  ascii: 'utf-8' // Compat
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

module.exports = {normalizeEncodingName, detectBufferEncoding}
