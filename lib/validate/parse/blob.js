const toBuffer = require('blob-to-buffer')
const {detectBufferEncoding} = require('./detect-encoding')
const {parseCsv} = require('./csv')

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
  const parseResult = await parseCsv(blob, {encoding})
  return {...parseResult, encoding}
}

module.exports = {parse}
