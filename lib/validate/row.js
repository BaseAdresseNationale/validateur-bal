const schema = require('../schema')
const createContext = require('./context')

const {getNormalizedEnumValue} = schema

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

    const trimmedValue = def.trim ? rawValue.trim() : rawValue

    if (def.trim && trimmedValue !== rawValue) {
      ctx.createError(`${schemaName}.espaces_debut_fin`)
    }

    if (def.required && !trimmedValue) {
      ctx.addError(`${schemaName}.valeur_manquante`)
    } else if (!trimmedValue) {
      // Ne rien faire
    } else if (def.parse) {
      ctx.setParsedValue(def.parse(trimmedValue, ctx))
    } else if (def.enum) {
      const normalizedValue = getNormalizedEnumValue(trimmedValue)
      if (def.enumFuzzyMap.has(normalizedValue)) {
        const schemaValue = def.enumFuzzyMap.get(normalizedValue)
        if (schemaValue !== trimmedValue.normalize()) {
          ctx.addError(`${schemaName}.enum_fuzzy`)
        }

        ctx.setParsedValue(schemaValue)
      } else {
        ctx.addError(`${schemaName}.valeur_invalide`)
      }
    } else {
      ctx.setParsedValue(trimmedValue)
    }

    vRow[schemaName] = ctx.toJSON()

    if (vRow[schemaName].errors) {
      vRow[schemaName].errors.forEach(error => {
        vRow._errors.push({...error, schemaName})
      })
    }
  })

  const rowLevelResult = createContext('row', {uniqueErrors})
  schema.row(vRow, rowLevelResult)

  rowLevelResult.toJSON().errors.forEach(error => {
    vRow._errors.push({...error})
  })

  return vRow
}

module.exports = {validateRow}
