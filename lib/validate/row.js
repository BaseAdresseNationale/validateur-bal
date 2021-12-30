const schema = require('../schema')

const {getNormalizedEnumValue} = schema

function getRawValuesObject(row, indexedFields) {
  const rawValues = {}

  for (const originalField of Object.keys(row)) {
    const field = indexedFields[originalField]
    const rawValue = row[originalField]

    if (field && field.schemaName) {
      rawValues[field.schemaName] = rawValue
    } else {
      rawValues[originalField] = rawValue
    }
  }

  return rawValues
}

async function validateRow(row, {line, indexedFields}) {
  const rawValues = getRawValuesObject(row, indexedFields)
  const parsedValues = {}
  const additionalValues = {}
  const errors = []

  await Promise.all(Object.keys(rawValues).map(async fieldName => {
    if (!(fieldName in schema.fields)) {
      return
    }

    const rawValue = rawValues[fieldName]

    const schemaName = fieldName
    const def = schema.fields[schemaName]

    const trimmedValue = def.trim ? rawValue.trim() : rawValue

    if (def.trim && trimmedValue !== rawValue) {
      errors.push({code: `${schemaName}.espaces_debut_fin`, schemaName})
    }

    if (def.required && !trimmedValue) {
      errors.push({code: `${schemaName}.valeur_manquante`, schemaName})
    } else if (!trimmedValue) {
      // Ne rien faire
    } else if (def.parse) {
      parsedValues[fieldName] = await def.parse(trimmedValue, {
        setAdditionnalValues(values) {
          additionalValues[fieldName] = values
        },
        addError(code) {
          errors.push({code: `${schemaName}.${code}`, schemaName})
        }
      })
    } else if (def.enum) {
      const normalizedValue = getNormalizedEnumValue(trimmedValue)
      if (def.enumFuzzyMap.has(normalizedValue)) {
        const schemaValue = def.enumFuzzyMap.get(normalizedValue)
        if (schemaValue !== trimmedValue.normalize()) {
          errors.push({code: `${schemaName}.enum_fuzzy`, schemaName})
        }

        parsedValues[fieldName] = schemaValue
      } else {
        errors.push({code: `${schemaName}.valeur_invalide`, schemaName})
      }
    } else {
      parsedValues[fieldName] = trimmedValue
    }
  }))

  schema.row({rawValues, parsedValues, additionalValues}, {
    addError(code) {
      errors.push({code: `row.${code}`})
    }
  })

  return {rawValues, parsedValues, additionalValues, errors, line}
}

module.exports = {validateRow}
