const profiles = require('./schema/profiles')
const errorLabels = require('./schema/error-labels')

function getErrorLevel(profileName, code) {
  const profile = profiles[profileName]

  if (profile.errors.includes(code)) {
    return 'E'
  }

  if (profile.warnings.includes(code)) {
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
  if (code in errorLabels) {
    return errorLabels[code]
  }

  const endsWithCandidate = Object.keys(endsWithErrorLabels).find(pattern => code.endsWith(pattern))

  if (endsWithCandidate) {
    return endsWithErrorLabels[endsWithCandidate](code)
  }

  return code
}

module.exports = {getErrorLevel, getLabel}
