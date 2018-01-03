const jschardet = require('jschardet-french')
const toBuffer = require('blob-to-buffer')
const stripBom = require('strip-bom')

const CHARDET_TO_NORMALIZED_ENCODINGS = {
  'windows-1252': 'Latin-1',
  'utf-8': 'UTF-8'
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

async function detectBlobEncoding(blob) {
  return new Promise((resolve, reject) => {
    toBuffer(blob, (err, buffer) => {
      if (err) {
        return reject(err)
      }
      resolve(detectBufferEncoding(buffer))
    })
  })
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

module.exports = {normalizeEncodingName, detectBufferEncoding, detectBlobEncoding, decodeBuffer}
