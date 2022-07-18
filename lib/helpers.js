const profiles = require('./schema/profiles')

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

module.exports = {getErrorLevel}
