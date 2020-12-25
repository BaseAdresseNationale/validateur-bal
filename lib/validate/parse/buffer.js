const {decodeBuffer} = require('./decode')
const {parseCsv} = require('./csv')

async function parse(buffer) {
  const {encoding, decodedString} = decodeBuffer(buffer)
  const parseResult = await parseCsv(decodedString)
  return {...parseResult, encoding}
}

module.exports = {parse}
