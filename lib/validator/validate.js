const Papa = require('papaparse')
const debug = require('debug')('bal-validator')

const {detectBlobEncoding, decodeBuffer} = require('../decode')

const schema = require('./schema')

class Validator {

  async validate(file) {
    await this.parseFile(file)
    debug('processing results')
    this.validateFile()
    debug('validating fields')
    this.validateFields()
    debug('validating rows (basic)')
    this.validateRows()
    debug('collecting data from rows')
    this.collectData()
    debug('finished')
    return {
      parseMeta: this.parseMeta,
      dataValidationErrors: this.dataValidationErrors,
      parseErrors: this.parseErrors,
      knownFields: this.knownFields,
      unknownFields: this.unknownFields,
      aliasedFields: this.aliasedFields,
      notFoundFields: this.notFoundFields,
      counts: this.counts,
      rowsWithErrors: this.rowsWithErrors,
      validatedRows: this.validatedRows,
      rowsErrorsCount: this.rowsErrorsCount,
      fileValidation: this.fileValidation
    }
  }

  async parseBlob(blob) {
    debug('detecting encoding')
    const encoding = await detectBlobEncoding(blob)
    debug('parsing')
    const parseResult = await parseCSV(blob, {skipEmptyLines: true, encoding, header: true})
    return Object.assign({}, parseResult, {encoding})
  }

  async parseBuffer(buffer) {
    debug('decoding')
    const {encoding, decodedString} = decodeBuffer(buffer)
    debug('parsing')
    const parseResult = await parseCSV(decodedString, {skipEmptyLines: true, header: true})
    return Object.assign({}, parseResult, {encoding})
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
    this.rowsErrorsCount = 0
    this.validatedRows = this.parsedRows.map((row, line) => {
      row._line = line + 1
      row._errors = []
      Object.keys(schema.fields).forEach(field => {
        // Deal with aliases
        if (field in this.aliasedFields) {
          row[field] = row[this.aliasedFields[field]]
          delete row[this.aliasedFields[field]]
        }

        const rawValue = row[field]
        const def = schema.fields[field]

        if (def.required && !rawValue) {
          row[field] = {errors: [`Le champ ${field} est obligatoire`]}
        } else if (!rawValue) {
          row[field] = {}
        } else if (def.parse) {
          const {parsedValue, more, errors} = def.parse(rawValue)
          row[field] = {parsedValue, rawValue, more, errors}
        } else if (def.enum) {
          if (def.enum.includes(rawValue.normalize())) {
            row[field] = {parsedValue: rawValue.normalize(), rawValue}
          } else {
            row[field] = {rawValue, errors: [`La valeur '${rawValue}' du champ ${field} n’est pas autorisée`]}
          }
        } else {
          row[field] = {rawValue}
        }

        if (row[field].errors && row[field].errors.length > 0) {
          this.rowsErrorsCount += row[field].errors.length
          row._errors = row._errors.concat(row[field].errors)
        }
      })
      const rowLevelErrors = schema.row(row)
      this.rowsErrorsCount += rowLevelErrors.length
      row._errors = row._errors.concat(rowLevelErrors)
      return row
    })

    this.rowsWithErrors = this.validatedRows.filter(row => row._errors && row._errors.length > 0)
  }

  collectData() {
    const communes = new Map()
    const unique = new Set()
    function getCommune(codeCommune) {
      if (!communes.has(codeCommune)) {
        communes.set(codeCommune, {voies: new Set()})
      }
      return communes.get(codeCommune)
    }
    this.validatedRows.forEach(row => {
      if (row.cle_interop && row.cle_interop.rawValue) {
        unique.add(row.cle_interop.rawValue.toLowerCase())
      }
      if (row.cle_interop && row.cle_interop.more && row.cle_interop.more.codeCommune) {
        getCommune(row.cle_interop.more.codeCommune).voies.add(row.cle_interop.more.codeRivoli)
      }
    })
    const codesFantoir = Array.from(communes.keys()).reduce((acc, codeCommune) => {
      const commune = communes.get(codeCommune)
      commune.voies.forEach(codeRivoli => acc.add(`${codeCommune}-${codeRivoli}`))
      return acc
    }, new Set())
    this.counts = {
      communes: communes.size,
      codesFantoir: codesFantoir.size,
      uniqueIds: unique.size
    }
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

function parseCSV(file, options) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, Object.assign({}, options, {
      complete: res => resolve(res),
      error: err => reject(err)
    }))
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
