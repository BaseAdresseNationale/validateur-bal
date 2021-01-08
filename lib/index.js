const {validate} = require('./validate')
const errorLabels = require('./error-labels')

function getValidationErrorLabel(code) {
  if (code in errorLabels) {
    return errorLabels[code]
  }

  return code
}

module.exports = {validate, getValidationErrorLabel}
