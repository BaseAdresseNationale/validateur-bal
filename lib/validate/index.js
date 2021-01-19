const {keyBy, mapValues, uniq} = require('lodash')
const schema = require('../schema')
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

function getSchemaVersion(schemaName) {
  return schema.fields[schemaName].version || '1.1'
}

function computeFields(originalFields, {strict, uniqueErrors}) {
  const fields = originalFields.map(field => ({name: field}))
  const foundFields = new Set()
  const notFoundFields = new Set()

  Object.keys(schema.fields).forEach(schemaName => {
    function findField(field) {
      if (!foundFields.has(schemaName)) {
        const candidate = fields.find(f => f.name === field && !f.schemaName)
        if (candidate) {
          const exactMatch = schemaName === field
          candidate.schemaName = schemaName
          candidate.exactMatch = exactMatch
          candidate.version = getSchemaVersion(schemaName)
          foundFields.add(schemaName)

          if (!exactMatch) {
            uniqueErrors.add(`field.${schemaName}.fuzzy`)
          }
        }
      }
    }

    // Exact match
    findField(schemaName)

    // Alias match
    if (!strict && !foundFields.has(schemaName) && schema.fields[schemaName].aliases) {
      schema.fields[schemaName].aliases.forEach(alias => findField(alias))
    }

    if (!foundFields.has(schemaName)) {
      notFoundFields.add(schemaName)
      uniqueErrors.add(`field.${schemaName}.missing`)
    }
  })

  return {
    fields,

    notFoundFields: [...notFoundFields].map(schemaName => {
      const schemaVersion = getSchemaVersion(schemaName)
      return {schemaName, schemaVersion}
    })
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
