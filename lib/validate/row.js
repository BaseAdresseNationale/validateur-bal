const schema = require('../schema')

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

  unknownFields.forEach(field => {
    row[field] = {rawValue: row[field]}
  })

  const rowLevelResult = schema.row(row)
  row._errors = row._errors.concat(rowLevelResult.errors)
  row._warnings = row._warnings.concat(rowLevelResult.warnings)

  return row
}

module.exports = {validateRow}
