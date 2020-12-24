const {detectBlobEncoding, getBlobEncoding} = require('../../decode')
const {parseCsv} = require('./csv')

async function parseBlob(blob) {
  const encoding = await detectBlobEncoding(blob)
  const blobEncoding = getBlobEncoding(encoding)
  const parseResult = await parseCsv(blob, {encoding: blobEncoding})
  return {...parseResult, encoding}
}

module.exports = {parseBlob}
