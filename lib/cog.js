const communes = require('../../minicog.json')

const codesCommunes = new Set(communes.map(c => c.code))
const codesCommunesAnciennes = new Set(communes.filter(c => c.chefLieu).map(c => c.code))
const codesCommunesActuelles = new Set(communes.filter(c => !c.chefLieu).map(c => c.code))

function isCommune(codeCommune) {
  return codesCommunes.has(codeCommune)
}

function isCommuneAncienne(codeCommune) {
  return codesCommunesAnciennes.has(codeCommune)
}

function isCommuneActuelle(codeCommune) {
  return codesCommunesActuelles.has(codeCommune)
}

function getCommuneAncienne(codeCommune) {
  return communes.find(c => c.code === codeCommune && c.chefLieu)
}

module.exports = {isCommune, isCommuneAncienne, isCommuneActuelle, getCommuneAncienne}
