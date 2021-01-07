const {keyBy} = require('lodash')
const schema = require('../schema')
const {parse} = require('./parse')
const {validateRow} = require('./row')

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

function validateFields(originalFields, options) {
  const fields = originalFields.map(field => ({name: field}))
  const foundFields = new Set()
  const notFoundFields = new Set()

  Object.keys(schema.fields).forEach(schemaName => {
    function findField(field) {
      if (!foundFields.has(schemaName)) {
        const candidate = fields.find(f => f.name === field && !f.schemaName)
        if (candidate) {
          candidate.schemaName = schemaName
          foundFields.add(schemaName)
        }
      }
    }

    // Exact match
    findField(schemaName)

    // Alias match
    if (!options.strict && !foundFields.has(schemaName) && schema.fields[schemaName].aliases) {
      schema.fields[schemaName].aliases.forEach(alias => findField(alias))
    }

    if (!foundFields.has(schemaName)) {
      notFoundFields.add(schemaName)
    }
  })

  return {
    fields,
    notFoundFields
  }
}

function validateRows(parsedRows, {fields}) {
  const indexedFields = keyBy(fields, 'name')
  const validatedRows = parsedRows.map((row, line) => {
    return validateRow(row, {indexedFields, line: line + 1})
  })

  return validatedRows
}

function validateGlobal({linebreak, encoding, delimiter, rows, fields, notFoundFields}) {
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

  const isValid = fileValidation.encoding.isValid &&
    fileValidation.delimiter.isValid &&
    fileValidation.linebreak.isValid &&
    notFoundFields.size === 0 &&
    !rows.some(row => row._errors && row._errors.length > 0) &&
    fields.filter(f => f.schemaName && f.schemaName !== f.name)

  return {isValid, fileValidation}
}

async function validate(file, options) {
  const {encoding, linebreak, delimiter, originalFields, parseErrors, parsedRows} = await parseFile(file, options)
  const {fields, notFoundFields} = validateFields(originalFields, options)
  const rows = validateRows(parsedRows, {fields})
  const {isValid, fileValidation} = validateGlobal({linebreak, encoding, delimiter, rows, fields, notFoundFields})

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
    isValid
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
