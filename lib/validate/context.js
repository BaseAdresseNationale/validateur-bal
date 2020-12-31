const {isUndefined} = require('lodash')

function createContext() {
  const internalObj = {
    errors: [],
    warnings: []
  }

  return {
    setRawValue(rawValue) {
      internalObj.rawValue = rawValue
    },

    setParsedValue(parsedValue) {
      if (isUndefined(parsedValue)) {
        return
      }

      internalObj.parsedValue = parsedValue
    },

    setAdditionnalValues(values) {
      internalObj.more = values
    },

    addError(message) {
      internalObj.errors.push(message)
    },

    addWarning(message) {
      internalObj.warnings.push(message)
    },

    toJSON() {
      return internalObj
    }
  }
}

module.exports = createContext
