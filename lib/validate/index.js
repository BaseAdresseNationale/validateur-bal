const {keyBy, mapValues, uniq} = require('lodash')
const {computeFields} = require('./fields')
const {parse} = require('./parse')
const {validateRow} = require('./row')
const profiles = require('../profiles')

const FATAL_PARSE_ERRORS = new Set([
  'MissingQuotes',
  'UndetectableDelimiter',
  'TooFewFields',
  'TooManyFields'
])

async function parseFile(file, options) {
  const parseOptions = options.strict ?
    {} :
    {transformHeader: h => h.toLowerCase().trim()}

  // Must be a Blob for browser or a Buffer for Node.js
  const {meta, errors, data, encoding} = await parse(file, parseOptions)

  const errorsKinds = uniq(errors.map(e => e.code))
  const parseOk = !errorsKinds.some(e => FATAL_PARSE_ERRORS.has(e))

  return {
    encoding,
    linebreak: meta.linebreak,
    delimiter: meta.delimiter,
    originalFields: meta.fields,
    parseOk,
    parseErrors: errors,
    parsedRows: data
  }
}

function computeRows(parsedRows, {fields, uniqueErrors}) {
  const indexedFields = keyBy(fields, 'name')
  const validatedRows = parsedRows.map((row, line) => {
    return validateRow(row, {indexedFields, uniqueErrors, line: line + 1})
  })

  return {rows: validatedRows}
}

function validateFile({linebreak, encoding, delimiter}) {
  const humanizedLinebreak = humanizeLinebreak(linebreak)

  const fileValidation = {
    encoding: {
      value: encoding,
      isValid: encoding === 'utf-8'
    },
    delimiter: {
      value: delimiter,
      isValid: delimiter === ';'
    },
    linebreak: {
      value: humanizedLinebreak,
      isValid: ['Unix', 'Windows'].includes(humanizedLinebreak)
    }
  }

  return {fileValidation}
}

async function validate(file, options = {}) {
  const uniqueErrors = new Set()

  const {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows} = await parseFile(file, options)

  if (!parseOk) {
    return {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows}
  }

  const {fields, notFoundFields} = computeFields(originalFields, {uniqueErrors, strict: options.strict})
  const {rows} = computeRows(parsedRows, {fields, uniqueErrors})
  const {fileValidation} = validateFile({linebreak, encoding, delimiter, rows, fields, notFoundFields, uniqueErrors})

  const profilesValidation = mapValues(profiles, profile => {
    return {...profile, isValid: profile.isValid({fileValidation, fields, notFoundFields, uniqueErrors})}
  })

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    fields,
    notFoundFields,
    rows,
    fileValidation,
    profilesValidation,
    uniqueErrors: [...uniqueErrors]
  }
}

function humanizeLinebreak(linebreak) {
  if (linebreak === '\n') {
    return 'Unix'
  }

  if (linebreak === '\r\n') {
    return 'Windows'
  }

  if (linebreak === '\r') {
    return 'Old Mac/BSD'
  }

  return 'Inconnu'
}

module.exports = {validate}
