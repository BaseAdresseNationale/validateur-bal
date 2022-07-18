const profiles = require('./schema/profiles')
const errorLabels = require('./schema/error-labels')
const {fields, allowedLocales} = require('./schema')

function parseLocalizedField(fieldName) {
  const locale = allowedLocales.find(l => fieldName.endsWith('_' + l))

  if (!locale) {
    return
  }

  const schemaName = fieldName.slice(0, -(locale.length + 1))
  if (fields[schemaName] && fields[schemaName].allowLocales) {
    return {locale, schemaName}
  }
}

function parseErrorCode(code) {
  const parts = code.split('.')

  if (parts[0] === 'file') {
    return {prefix: 'file', code}
  }

  if (parts[0] === 'row') {
    return {prefix: 'row', code}
  }

  if (parts[0] === 'field') {
    return {prefix: 'field', code}
  }

  const fieldName = parts[0]
  const fieldError = parts[1]

  const localizedField = parseLocalizedField(fieldName)

  if (localizedField) {
    return {fieldName, fieldError, ...localizedField}
  }

  if (!fields[fieldName]) {
    throw new Error('Unknown fieldName: ' + fieldName)
  }

  return {schemaName: fieldName, fieldError}
}

function getErrorLevel(profileName, code) {
  const profile = profiles[profileName]
  const {schemaName, locale, fieldError} = parseErrorCode(code)
  const codeToCompare = locale ? `${schemaName}_@@.${fieldError}` : code

  if (profile.errors.includes(codeToCompare)) {
    return 'E'
  }

  if (profile.warnings.includes(codeToCompare)) {
    return 'W'
  }

  return 'I'
}

const endsWithErrorLabels = {}

for (const c of Object.keys(errorLabels)) {
  if (c.includes('*') && c.startsWith('*.')) {
    endsWithErrorLabels[c.slice(2)] = submittedCode => {
      const [value] = submittedCode.split('.')
      return errorLabels[c].replace('{}', value)
    }
  }
}

function getLabel(code) {
  const {schemaName, locale, fieldError} = parseErrorCode(code)
  const codeToUser = locale ? `${schemaName}.${fieldError}` : code

  if (codeToUser in errorLabels) {
    return errorLabels[codeToUser] + (locale ? ` [${locale}]` : '')
  }

  const endsWithCandidate = Object.keys(endsWithErrorLabels).find(pattern => codeToUser.endsWith(pattern))

  if (endsWithCandidate) {
    return endsWithErrorLabels[endsWithCandidate](codeToUser)
  }

  return code
}

module.exports = {getErrorLevel, getLabel, parseLocalizedField, parseErrorCode}
