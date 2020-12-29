const schema = require('../schema')
const {parse} = require('./parse')
const {validateRow} = require('./row')

class Validator {
  async validate(file, options) {
    await this.parseFile(file, options)
    this.validateFile()
    this.validateFields(options)
    this.validateRows()
    this.validateGlobal()
    return {
      parseMeta: this.parseMeta,
      dataValidationErrors: this.dataValidationErrors,
      parseErrors: this.parseErrors,
      knownFields: this.knownFields,
      unknownFields: this.unknownFields,
      aliasedFields: this.aliasedFields,
      notFoundFields: this.notFoundFields,
      rowsWithIssues: this.rowsWithIssues,
      validatedRows: this.validatedRows,
      hasErrors: this.hasErrors,
      hasWarnings: this.hasWarnings,
      fileValidation: this.fileValidation,
      isValid: this.isValid
    }
  }

  async parseFile(file, options) {
    const parseOptions = options.strict ?
      {} :
      {transformHeader: h => h.toLowerCase().trim()}

    // Must be a Blob for browser or a Buffer for Node.js
    const {meta, errors, data, encoding} = await parse(file, parseOptions)

    this.parseMeta = {
      encoding,
      linebreak: meta.linebreak,
      delimiter: meta.delimiter,
      fields: meta.fields,
      rowsCount: data.length
    }
    this.dataValidationErrors = []
    this.parseErrors = errors
    this.parsedRows = data
  }

  validateFile() {
    const {encoding, delimiter, linebreak} = this.parseMeta
    const humanizedLinebreak = humanizeLinebreak(linebreak)

    this.fileValidation = {
      encoding: {
        value: encoding,
        isValid: encoding === 'utf-8'
      },
      delimiter: {
        value: delimiter,
        localName: getDelimiterName(delimiter),
        isValid: delimiter === ';'
      },
      linebreak: {
        value: humanizedLinebreak,
        isValid: ['Unix', 'Windows'].includes(humanizedLinebreak)
      }
    }
  }

  validateRows() {
    this.hasErrors = true
    this.hasWarnings = false

    this.validatedRows = this.parsedRows.map((row, line) => {
      row._line = line + 1
      return validateRow(row, this)
    })

    this.hasWarnings = this.validatedRows.some(row => row._warnings && row._warnings.length > 0)
    this.hasErrors = this.validatedRows.some(row => row._errors && row._errors.length > 0)

    this.rowsWithIssues = this.validatedRows
      .filter(row => (row._errors && row._errors.length > 0) || (row._warnings && row._warnings.length > 0))
  }

  validateFields(options) {
    const knownFields = []
    const unknownFields = [...this.parseMeta.fields]
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

    this.knownFields = knownFields
    this.unknownFields = unknownFields
    this.notFoundFields = notFoundFields
    this.aliasedFields = swap(aliasedFields)
  }

  validateGlobal() {
    const {encoding, delimiter, linebreak} = this.fileValidation
    this.isValid = encoding.isValid &&
      delimiter.isValid &&
      linebreak.isValid &&
      this.notFoundFields.length === 0 &&
      !this.hasWarnings &&
      !this.hasErrors &&
      Object.keys(this.aliasedFields).length === 0
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

function getDelimiterName(delimiter) {
  if (delimiter === ';') {
    return 'point-virgule'
  }

  if (delimiter === ',') {
    return 'virgule'
  }

  if (delimiter === '\t') {
    return 'tabulation'
  }

  if (delimiter === '|') {
    return 'pipe'
  }
}

module.exports = (file, options = {}) => {
  const validator = new Validator()
  return validator.validate(file, options)
}
