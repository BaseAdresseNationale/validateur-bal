const {keyBy} = require('lodash')
const schema = require('../schema')
const {parse} = require('./parse')
const {validateRow} = require('./row')

const profiles = {
  '1.1-strict': require('../profiles/1.1-strict'),
  '1.x-comprehensive': require('../profiles/1.x-comprehensive')
}

async function parseFile(file, options) {
  const parseOptions = options.strict ?
    {} :
    {transformHeader: h => h.toLowerCase().trim()}

  // Must be a Blob for browser or a Buffer for Node.js
  const {meta, errors, data, encoding} = await parse(file, parseOptions)

  return {
    encoding,
    linebreak: meta.linebreak,
    delimiter: meta.delimiter,
    originalFields: meta.fields,
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

function validateFile({linebreak, encoding, delimiter, rows, fields, notFoundFields}) {
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

async function validate(file, options) {
  const profile = profiles['1.x-comprehensive']
  const uniqueErrors = new Set()

  const {encoding, linebreak, delimiter, originalFields, parseErrors, parsedRows} = await parseFile(file, options)
  const {fields, notFoundFields} = computeFields(originalFields, {uniqueErrors, strict: options.strict})
  const {rows} = computeRows(parsedRows, {fields, uniqueErrors})
  const {fileValidation} = validateFile({linebreak, encoding, delimiter, rows, fields, notFoundFields, uniqueErrors})

  const isValid = profile.isValid({fileValidation, fields, notFoundFields, uniqueErrors})

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseErrors,
    fields,
    notFoundFields,
    rows,
    fileValidation,
    isValid,
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

module.exports = (file, options = {}) => {
  return validate(file, options)
}
