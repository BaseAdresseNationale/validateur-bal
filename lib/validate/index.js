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

function validateFile({encoding, delimiter, linebreak}) {
  const humanizedLinebreak = humanizeLinebreak(linebreak)

  return {
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
}

function validateFields(originalFields, options) {
  const knownFields = []
  const unknownFields = [...originalFields]
  const notFoundFields = []
  const aliasedFields = {}

  Object.keys(schema.fields).forEach(expectedField => {
    let matchingFieldFound

    function findField(field) {
      if (!matchingFieldFound) {
        const pos = unknownFields.indexOf(field)
        if (pos >= 0) {
          unknownFields.splice(pos, 1)
          matchingFieldFound = field
        }
      }
    }

    // Exact match
    findField(expectedField)

    // Alias match
    if (!options.strict && !matchingFieldFound && schema.fields[expectedField].aliases) {
      schema.fields[expectedField].aliases.forEach(alias => findField(alias))
    }

    if (matchingFieldFound) {
      knownFields.push(expectedField)
      if (matchingFieldFound !== expectedField) {
        aliasedFields[matchingFieldFound] = expectedField
      }
    } else {
      notFoundFields.push(expectedField)
    }
  })

  return {
    knownFields,
    unknownFields,
    notFoundFields,
    aliasedFields: swap(aliasedFields)
  }
}

function validateRows(parsedRows, {aliasedFields, unknownFields}) {
  const validatedRows = parsedRows.map((row, line) => {
    row._line = line + 1
    return validateRow(row, {aliasedFields, unknownFields})
  })

  return validatedRows
}

function validateGlobal({rows, fileValidation, aliasedFields, notFoundFields}) {
  const {encoding, delimiter, linebreak} = fileValidation
  const isValid = encoding.isValid &&
    delimiter.isValid &&
    linebreak.isValid &&
    notFoundFields.length === 0 &&
    !rows.some(row => row._errors && row._errors.length > 0) &&
    Object.keys(aliasedFields).length === 0

  return {isValid}
}

async function validate(file, options) {
  const {encoding, linebreak, delimiter, originalFields, parseErrors, parsedRows} = await parseFile(file, options)
  const fileValidation = validateFile({encoding, linebreak, delimiter})
  const {knownFields, unknownFields, notFoundFields, aliasedFields} = validateFields(originalFields, options)
  const rows = validateRows(parsedRows, {aliasedFields, unknownFields})
  const {isValid} = validateGlobal({rows, fileValidation, aliasedFields, notFoundFields})

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseErrors,
    knownFields,
    unknownFields,
    aliasedFields,
    notFoundFields,
    rows,
    fileValidation,
    isValid
  }
}

function swap(json) {
  const result = {}
  Object.keys(json).forEach(key => {
    result[json[key]] = key
  })
  return result
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
