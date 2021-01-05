const {isUndefined} = require('lodash')

function createContext() {
  const internalObj = {
    errors: []
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

    addError(code) {
      internalObj.errors.push(code)
    },

    toJSON() {
      return internalObj
    }
  }
}

module.exports = createContext
