const toBuffer = require('blob-to-buffer')
const {detectBufferEncoding} = require('./detect-encoding')
const {parseCsv} = require('./csv')

const NORMALIZED_TO_BLOB_ENCODINGS = {
  'Latin-1': 'windows-1252',
  'UTF-8': 'utf-8'
}

function getBlobEncoding(encoding) {
  return NORMALIZED_TO_BLOB_ENCODINGS[encoding]
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

async function parse(blob) {
  const encoding = await detectBlobEncoding(blob)
  const blobEncoding = getBlobEncoding(encoding)
  const parseResult = await parseCsv(blob, {encoding: blobEncoding})
  return {...parseResult, encoding}
}

module.exports = {parse}
