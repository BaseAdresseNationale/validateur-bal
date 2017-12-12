const jschardet = require('jschardet-french')
const toBuffer = require('blob-to-buffer')

function detectBlobEncoding(blob) {
  return new Promise((resolve, reject) => {
    toBuffer(blob, (err, buffer) => {
      if (err) {
        return reject(err)
      }
      resolve(jschardet.detect(buffer))
    })
  })
}

module.exports = detectBlobEncoding
