const communes = require('../minicog.json')

const codesCommunesActuelles = new Set(communes.filter(c => !c.chefLieu).map(c => c.code))
const codesCommunesDeleguees = new Set(communes.filter(c => c.chefLieu).map(c => c.code))

const anciensCodesIndex = new Map()
for (const commune of communes) {
  const anciensCodes = commune.anciensCodes || []
  for (const ancienCode of anciensCodes) {
    anciensCodesIndex.set(ancienCode, commune)
  }
}

function isCommune(codeCommune) {
  return isCommuneActuelle(codeCommune) || isCommuneAncienne(codeCommune)
}

function isCommuneAncienne(codeCommune) {
  return anciensCodesIndex.has(codeCommune)
}

function isCommuneActuelle(codeCommune) {
  return codesCommunesActuelles.has(codeCommune)
}

function isCommuneDeleguee(codeCommune) {
  return codesCommunesDeleguees.has(codeCommune)
}

function getCommuneActuelle(codeCommune) {
  return anciensCodesIndex.has(codeCommune)
    ? anciensCodesIndex.get(codeCommune)
    : communes.find(c => c.code === codeCommune && !c.chefLieu)
}

module.exports = {isCommune, isCommuneAncienne, isCommuneActuelle, isCommuneDeleguee, getCommuneActuelle}
