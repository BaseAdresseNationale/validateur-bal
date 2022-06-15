const schema = require('../schema')

const {getNormalizedEnumValue} = schema

function buildRawValues(row, indexedFields) {
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

function readValue(fieldName, rawValue) {
  if (!(fieldName in schema.fields)) {
    throw new Error(`Unknown field name: ${fieldName}`)
  }

  const result = {
    parsedValue: undefined,
    additionalValues: undefined,
    errors: []
  }

  const def = schema.fields[fieldName]

  const trimmedValue = def.trim ? rawValue.trim() : rawValue

  if (def.trim && trimmedValue !== rawValue) {
    result.errors.push('espaces_debut_fin')
  }

  if (def.required && !trimmedValue) {
    result.errors.push('valeur_manquante')
  } else if (!trimmedValue) {
    // Ne rien faire
  } else if (def.parse) {
    result.parsedValue = def.parse(trimmedValue, {
      setAdditionnalValues(values) {
        result.additionalValues = values
      },
      addError(code) {
        result.errors.push(code)
      }
    })
  } else if (def.enum) {
    const normalizedValue = getNormalizedEnumValue(trimmedValue)
    if (def.enumFuzzyMap.has(normalizedValue)) {
      const schemaValue = def.enumFuzzyMap.get(normalizedValue)
      if (schemaValue !== trimmedValue.normalize()) {
        result.errors.push('enum_fuzzy')
      }

      result.parsedValue = schemaValue
    } else {
      result.errors.push('valeur_invalide')
    }
  } else {
    result.parsedValue = trimmedValue
  }

  return result
}

async function validateRow(row, {line, indexedFields}) {
  const rawValues = buildRawValues(row, indexedFields)
  const parsedValues = {}
  const additionalValues = {}
  const errors = []

  await Promise.all(Object.keys(rawValues).map(async fieldName => {
    if (!(fieldName in schema.fields)) {
      return
    }

    const result = await readValue(fieldName, rawValues[fieldName])

    for (const error of result.errors) {
      errors.push({code: `${fieldName}.${error}`, schemaName: fieldName})
    }

    if (result.additionalValues) {
      additionalValues[fieldName] = result.additionalValues
    }

    if (result.parsedValue !== undefined) {
      parsedValues[fieldName] = result.parsedValue
    }
  }))

  schema.row({rawValues, parsedValues, additionalValues}, {
    addError(code) {
      errors.push({code: `row.${code}`})
    }
  })

  return {rawValues, parsedValues, additionalValues, errors, line}
}

module.exports = {validateRow, readValue}
