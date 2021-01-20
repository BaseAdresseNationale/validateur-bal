const {validate} = require('./validate')
const errorLabels = require('./error-labels')
const profiles = require('./profiles')

const endsWithErrorLabels = {}

Object.keys(errorLabels)
  .forEach(c => {
    if (c.includes('*') && c.startsWith('*.')) {
      endsWithErrorLabels[c.slice(2)] = submittedCode => {
        const [value] = submittedCode.split('.')
        return errorLabels[c].replace('{}', value)
      }
    }
  })

function getValidationErrorLabel(code) {
  if (code in errorLabels) {
    return errorLabels[code]
  }

  const endsWithCandidate = Object.keys(endsWithErrorLabels).find(pattern => code.endsWith(pattern))

  if (endsWithCandidate) {
    return endsWithErrorLabels[endsWithCandidate](code)
  }

  return code
}

function getValidationErrorSeverity(code, profileName = '1.2-etalab') {
  const profile = profiles[profileName]

  if (profile.errors.includes(code)) {
    return 'E'
  }

  if (profile.warnings.includes(code)) {
    return 'W'
  }

  return 'I'
}

module.exports = {validate, getValidationErrorLabel, getValidationErrorSeverity}
