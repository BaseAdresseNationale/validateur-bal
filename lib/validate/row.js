const schema = require('../schema')
const createContext = require('./context')

function validateRow(row, {line, indexedFields, uniqueErrors}) {
  const vRow = {_errors: [], _line: line}

  Object.keys(row).forEach(originalField => {
    const field = indexedFields[originalField]
    const rawValue = row[originalField]

    if (!field.schemaName) {
      if (rawValue) {
        vRow[originalField] = {rawValue}
      }

      return
    }

    const {schemaName} = field
    const def = schema.fields[schemaName]
    const ctx = createContext('field', {uniqueErrors})
    ctx.setRawValue(rawValue)

    if (def.required && !rawValue) {
      ctx.addError(`${schemaName}.valeur_manquante`)
    } else if (!rawValue) {
      // Ne rien faire
    } else if (def.parse) {
      ctx.setParsedValue(def.parse(rawValue, ctx))
    } else if (def.enum) {
      if (def.enum.includes(rawValue.normalize())) {
        ctx.setParsedValue(rawValue.normalize())
      } else {
        ctx.addError(`${schemaName}.valeur_invalide`)
      }
    } else {
      ctx.setParsedValue(rawValue)
    }

    vRow[schemaName] = ctx

    if (vRow[schemaName].errors && vRow[schemaName].errors.length > 0) {
      vRow._errors = vRow._errors.concat(vRow[schemaName].errors)
    }
  })

  const rowLevelResult = createContext('row', {uniqueErrors})
  schema.row(vRow, rowLevelResult)
  vRow._errors = vRow._errors.concat(rowLevelResult.errors)

  return vRow
}

module.exports = {validateRow}
