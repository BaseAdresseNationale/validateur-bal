const schema = require('../schema')
const createContext = require('./context')

function validateRow(row, {aliasedFields, unknownFields}) {
  row._errors = []

  Object.keys(schema.fields).forEach(field => {
    // Deal with aliases
    if (field in aliasedFields) {
      row[field] = row[aliasedFields[field]]
      delete row[aliasedFields[field]]
    }

    const rawValue = row[field]
    const def = schema.fields[field]

    const ctx = createContext('field')
    ctx.setRawValue(rawValue)

    if (def.required && !rawValue) {
      ctx.addError(`${field}.valeur_manquante`)
    } else if (!rawValue) {
      // Ne rien faire
    } else if (def.parse) {
      ctx.setParsedValue(def.parse(rawValue, ctx))
    } else if (def.enum) {
      if (def.enum.includes(rawValue.normalize())) {
        ctx.setParsedValue(rawValue.normalize())
      } else {
        ctx.addError(`${field}.valeur_invalide`)
      }
    } else {
      ctx.setParsedValue(rawValue)
    }

    row[field] = ctx

    if (row[field].errors && row[field].errors.length > 0) {
      row._errors = row._errors.concat(row[field].errors)
    }
  })

  unknownFields.forEach(field => {
    row[field] = {rawValue: row[field]}
  })

  const rowLevelResult = createContext('row')
  schema.row(row, rowLevelResult)
  row._errors = row._errors.concat(rowLevelResult.errors)

  return row
}

module.exports = {validateRow}
