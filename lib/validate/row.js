const schema = require('../schema')
const createContext = require('./context')

function validateRow(row, {aliasedFields, unknownFields}) {
  row._errors = []
  row._warnings = []

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

    if (def.required === 'error' && !rawValue) {
      ctx.addError(`Le champ ${field} est obligatoire`)
    } else if (def.required === 'warning' && !rawValue) {
      ctx.addWarning(`Le champ ${field} est obligatoire`)
    } else if (!rawValue) {
      // Ne rien faire
    } else if (def.parse) {
      ctx.setParsedValue(def.parse(rawValue, ctx))
    } else if (def.enum) {
      if (def.enum.includes(rawValue.normalize())) {
        ctx.setParsedValue(rawValue.normalize())
      } else if (def.enumSeverity === 'warning') {
        ctx.addWarning(`La valeur du champ ${field} n’est pas autorisée`)
      } else {
        ctx.addError(`La valeur du champ ${field} n’est pas autorisée`)
      }
    } else {
      ctx.setParsedValue(rawValue)
    }

    row[field] = ctx

    if (row[field].errors && row[field].errors.length > 0) {
      row._errors = row._errors.concat(row[field].errors)
    }

    if (row[field].warnings && row[field].warnings.length > 0) {
      row._warnings = row._warnings.concat(row[field].warnings)
    }
  })

  unknownFields.forEach(field => {
    row[field] = {rawValue: row[field]}
  })

  const rowLevelResult = createContext('row')
  schema.row(row, rowLevelResult)
  row._errors = row._errors.concat(rowLevelResult.errors)
  row._warnings = row._warnings.concat(rowLevelResult.warnings)

  return row
}

module.exports = {validateRow}
