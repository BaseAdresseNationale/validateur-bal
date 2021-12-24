/* eslint no-inner-declarations: off */
const schema = require('../schema')

function getSchemaVersion(schemaName) {
  return schema.fields[schemaName].version || '1.1'
}

function computeFields(originalFields, {relaxFieldsDetection, globalErrors}) {
  const fields = originalFields.map(field => ({name: field}))
  const foundFields = new Set()
  const notFoundFields = new Set()

  for (const schemaName of Object.keys(schema.fields)) {
    function findField(field) {
      if (!foundFields.has(schemaName)) {
        const candidate = fields.find(f => f.name === field && !f.schemaName)
        if (candidate) {
          const exactMatch = schemaName === field
          candidate.schemaName = schemaName
          candidate.exactMatch = exactMatch
          candidate.version = getSchemaVersion(schemaName)
          foundFields.add(schemaName)

          if (!exactMatch) {
            globalErrors.add(`field.${schemaName}.fuzzy`)
          }
        }
      }
    }

    // Exact match
    findField(schemaName)

    // Alias match
    if (relaxFieldsDetection && !foundFields.has(schemaName) && schema.fields[schemaName].aliases) {
      for (const alias of schema.fields[schemaName].aliases) {
        findField(alias)
      }
    }

    if (!foundFields.has(schemaName)) {
      notFoundFields.add(schemaName)
      globalErrors.add(`field.${schemaName}.missing`)
    }
  }

  return {
    fields,

    notFoundFields: [...notFoundFields].map(schemaName => {
      const schemaVersion = getSchemaVersion(schemaName)
      return {schemaName, schemaVersion}
    })
  }
}

module.exports = {computeFields}
