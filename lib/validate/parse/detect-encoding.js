const chardet = require('chardet')
const fileType = require('file-type')

const CHARDET_TO_NORMALIZED_ENCODINGS = {
  'iso-8859-1': 'windows-1252',
  'iso-8859-15': 'windows-1252',
  'windows-1252': 'windows-1252',
  'utf-8': 'utf-8'
}

function normalizeEncodingName(encoding) {
  const lcEncoding = encoding.toLowerCase()
  if (!(lcEncoding in CHARDET_TO_NORMALIZED_ENCODINGS)) {
    throw new Error('Encoding currently not supported: ' + encoding)
  }

  return CHARDET_TO_NORMALIZED_ENCODINGS[lcEncoding]
}

function detectBufferEncoding(buffer) {
  if (fileType(buffer)) {
    throw new Error('Non-text file cannot be processed')
  }

  const analyseResults = chardet.analyse(buffer)

  if (analyseResults.length === 0) {
    throw new Error('Unable to detect encoding')
  }

  const utf8Result = analyseResults.find(r => r.name === 'UTF-8')

  if (utf8Result && utf8Result.confidence >= 80) {
    return 'utf-8'
  }

  // Pure ASCII
  if (utf8Result && utf8Result.confidence === 10) {
    return 'utf-8'
  }

  return normalizeEncodingName(analyseResults[0].name)
}

module.exports = {normalizeEncodingName, detectBufferEncoding}
