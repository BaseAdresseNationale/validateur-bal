const {decodeBuffer} = require('../../decode')
const {parseCsv} = require('./csv')

async function parseBuffer(buffer) {
  const {encoding, decodedString} = decodeBuffer(buffer)
  const parseResult = await parseCsv(decodedString)
  return {...parseResult, encoding}
}

module.exports = {parseBuffer}
