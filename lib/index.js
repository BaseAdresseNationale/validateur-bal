const {validate, validateProfile, prevalidate} = require('./validate')
const errorLabels = require('./schema/error-labels')

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

module.exports = {validate, validateProfile, prevalidate, getLabel}
