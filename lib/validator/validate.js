const {EventEmitter} = require('events')
const Papa = require('papaparse')
const jschardet = require('jschardet-french')
const stripBom = require('strip-bom')

const detectBlobEncoding = require('../util/detect-blob-encoding')

const schema = require('./schema')

class Validator extends EventEmitter {
  constructor() {
    super()
    this.errored = false
    this.ended = false

    this.handleError = this.handleError.bind(this)
  }

  validate(file) {
    setImmediate(() => this.doValidate(file).catch(this.handleError))
  }

  async doValidate(file) {
    await this.parseFile(file)
    this.updateStep('validating fields')
    this.validateFields()
    this.updateStep('validating rows (basic)')
    this.validateRows()
    this.updateStep('collecting data from rows')
    this.collectData()
    this.ended = true
    this.emit('end', {
      parseMeta: this.parseMeta,
      dataValidationErrors: this.dataValidationErrors,
      parseErrors: this.parseErrors,
      knownFields: this.knownFields,
      unknownFields: this.unknownFields,
      aliasedFields: this.aliasedFields,
      notFoundFields: this.notFoundFields,
      counts: this.counts
    })
    this.updateStep('finished')
    console.log('')
    console.log('Terminé !')
    console.log('')
  }

  updateStep(step) {
    this.step = step
    this.emit('step', step)
  }

  async parseBlob(blob) {
    this.updateStep('detecting encoding')
    const {encoding} = await detectBlobEncoding(blob)
    this.updateStep('parsing')
    const parseResult = await parseCSV(blob, {skipEmptyLines: true, encoding, header: true})
    return Object.assign({}, parseResult, {encoding})
  }

  async parseBuffer(buffer) {
    this.updateStep('detecting encoding')
    const {encoding} = jschardet.detect(buffer)
    this.updateStep('parsing')
    const decodedString = stripBom(buffer.toString(encoding))
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

    this.updateStep('processing results')
    this.parseMeta = {
      encoding,
      linebreak: meta.linebreak,
      delimiter: meta.delimiter,
      fields: meta.fields,
      rowsCount: data.length
    }
    console.log('')
    console.log('* Validation de la structure du fichier')
    console.log('')
    console.log(`Encodage : ${encoding} => ${encoding === 'UTF-8' ? 'OK' : 'Pas OK !'}`)
    console.log(`Séparateur de ligne : ${humanizeLinebreak(meta.linebreak)} => ${['\n', '\r\n'].includes(meta.linebreak) ? 'OK' : 'Pas OK'}`)
    console.log(`Séparateur de colonne : ${meta.delimiter} => ${meta.delimiter === ';' ? 'OK' : 'Pas OK'}`)
    this.dataValidationErrors = []
    this.parseErrors = errors
    if (errors.length > 0) {
      console.log('')
      console.log('* Erreurs de lecture du fichier')
      console.log('')
      errors.forEach(err => console.log(err))
    }
    this.rows = data
  }

  validateRows() {
    console.log('')
    this.rows.forEach(row => {
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

        if (row[field].errors) {
          row[field].errors.forEach(err => console.log(`${row.cle_interop.rawValue} ${err}`))
        }
      })
      const errors = schema.row(row)
      if (errors) {
        errors.forEach(err => console.log(`${row.cle_interop.rawValue} ${err}`))
      }
    })
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
    this.rows.forEach(row => {
      if (row.cle_interop) {
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

    console.log('')
    console.log('* Validation du modèle')
    console.log('')
    if (notFoundFields.length === 0) {
      console.log('Tous les champs du modèle ont été trouvés !')
    } else {
      console.log(`/!\\ Les champs suivants n’ont pas été trouvés : ${notFoundFields.join(', ')}`)
    }
    if (unknownFields.length > 0) {
      console.log(`Les champs suivants sont inconnus, ils ont été ignorés : ${unknownFields.join(', ')}`)
    }
    if (Object.keys(aliasedFields).length > 0) {
      Object.keys(aliasedFields).forEach(k => console.log(`/!\\ Le champ ${k} est mal orthographié mais a été pris en compte`))
    }
  }

  handleError(err) {
    if (!this.errored && !this.ended) {
      this.errored = true
      this.ended = true
      this.emit('error', err)
    }
  }
}

module.exports = file => {
  const validator = new Validator()
  validator.validate(file)
  return validator
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

function humanizeLinebreak(linebreak) {
  if (linebreak === '\n') {
    return 'Unix'
  }
  if (linebreak === '\r\n') {
    return 'Windows'
  }
  if (linebreak === '\r') {
    return 'OS9/BSD'
  }
  return 'Inconnu'
}

function parseCSV(file, options) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, Object.assign({}, options, {
      complete: res => resolve(res),
      error: err => reject(err)
    }))
  })
}
