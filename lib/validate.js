const Papa = require('papaparse')
const debug = require('debug')('bal:validate')

const {detectBlobEncoding, decodeBuffer, getBlobEncoding} = require('./decode')
const normalize = require('./normalize')
const schema = require('./schema')
const computeSummary = require('./summary')

const PAPA_OPTIONS = {
  skipEmptyLines: true,
  header: true
}

class Validator {
  async validate(file) {
    await this.parseFile(file)
    debug('processing results')
    this.validateFile()
    debug('validating fields')
    this.validateFields()
    debug('validating rows (basic)')
    this.validateRows()
    debug('finished')
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
      normalizedRows: this.normalizedRows,
      validatedRows: this.validatedRows,
      issuesSummary: this.issuesSummary,
      hasErrors: this.hasErrors,
      hasWarnings: this.hasWarnings,
      fileValidation: this.fileValidation,
      isValid: this.isValid
    }
  }

  async parseBlob(blob) {
    debug('detecting encoding')
    const encoding = await detectBlobEncoding(blob)
    debug('parsing')
    const blobEncoding = getBlobEncoding(encoding)
    const parseResult = await parseCSV(blob, {encoding: blobEncoding})
    return {...parseResult, encoding}
  }

  async parseBuffer(buffer) {
    debug('decoding')
    const {encoding, decodedString} = decodeBuffer(buffer)
    debug('parsing')
    const parseResult = await parseCSV(decodedString)
    return {...parseResult, encoding}
  }

  async parseFile(file) {
    if (!isBuffer(file) && !isBlob(file)) {
      throw new Error('Unknown input')
    }

    const {meta, errors, data, encoding} = isBuffer(file) ?
      await this.parseBuffer(file) :
      await this.parseBlob(file)

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
        isValid: encoding === 'UTF-8'
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
      row._errors = []
      row._warnings = []

      Object.keys(schema.fields).forEach(field => {
        // Deal with aliases
        if (field in this.aliasedFields) {
          row[field] = row[this.aliasedFields[field]]
          delete row[this.aliasedFields[field]]
        }

        const rawValue = row[field]
        const def = schema.fields[field]

        if (def.required === 'error' && !rawValue) {
          row[field] = {errors: [`Le champ ${field} est obligatoire`]}
        } else if (def.required === 'warning' && !rawValue) {
          row[field] = {warnings: [`Le champ ${field} est obligatoire`]}
        } else if (!rawValue) {
          row[field] = {}
        } else if (def.parse) {
          row[field] = {rawValue, ...def.parse(rawValue)}
        } else if (def.enum) {
          if (def.enum.includes(rawValue.normalize())) {
            row[field] = {parsedValue: rawValue.normalize(), rawValue}
          } else if (def.enumSeverity === 'warning') {
            row[field] = {rawValue, warnings: [`La valeur du champ ${field} n’est pas autorisée`]}
          } else {
            row[field] = {rawValue, errors: [`La valeur du champ ${field} n’est pas autorisée`]}
          }
        } else {
          row[field] = {rawValue, parsedValue: rawValue}
        }

        if (row[field].errors && row[field].errors.length > 0) {
          row._errors = row._errors.concat(row[field].errors)
        }

        if (row[field].warnings && row[field].warnings.length > 0) {
          row._warnings = row._warnings.concat(row[field].warnings)
        }
      })

      this.unknownFields.forEach(field => {
        row[field] = {rawValue: row[field]}
      })

      const rowLevelResult = schema.row(row)
      row._errors = row._errors.concat(rowLevelResult.errors)
      row._warnings = row._warnings.concat(rowLevelResult.warnings)
      return row
    })

    this.hasWarnings = this.validatedRows.some(row => row._warnings && row._warnings.length > 0)
    this.hasErrors = this.validatedRows.some(row => row._errors && row._errors.length > 0)

    this.rowsWithIssues = this.validatedRows
      .filter(row => (row._errors && row._errors.length > 0) || (row._warnings && row._warnings.length > 0))

    this.normalizedRows = this.validatedRows
      .filter(row => !row._errors || row._errors.length === 0)
      .map(normalize)

    this.issuesSummary = computeSummary(this.rowsWithIssues)
  }

  validateFields() {
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
      if (!matchingFieldFound && schema.fields[expectedField].aliases) {
        schema.fields[expectedField].aliases.forEach(findField)
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

function isBlob(blob) {
  return global.Blob && blob instanceof global.Blob
}

function isBuffer(buffer) {
  return global.Buffer && buffer instanceof global.Buffer
}

function parseCSV(file, options = {}) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...PAPA_OPTIONS,
      ...options,
      complete: res => resolve(res),
      error: err => reject(err)
    })
  })
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

module.exports = file => {
  const validator = new Validator()
  return validator.validate(file)
}
