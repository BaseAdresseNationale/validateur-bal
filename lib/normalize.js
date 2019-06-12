const {deburr} = require('lodash')

function normalize(validRow) {
  const {codeVoie, codeCommune} = validRow.cle_interop.more
  const nomVoie = validRow.voie_nom.parsedValue
  const numero = validRow.numero.parsedValue
  const suffixe = validRow.suffixe.parsedValue
  const nomCommune = validRow.commune_nom.parsedValue
  const typePosition = validRow.position.parsedValue
  const lon = validRow.long.parsedValue
  const lat = validRow.lat.parsedValue
  const position = typeof lon === 'number' && typeof lat === 'number' ? [lon, lat] : undefined
  const source = validRow.source.parsedValue
  const dateMAJ = validRow.date_der_maj.parsedValue
  const numeroComplet = numero + (suffixe || '')
  const nomVoieSlug = slugifyNomVoie(nomVoie)
  return {
    id: `${codeCommune}-${codeVoie || nomVoieSlug}-${numeroComplet}`,
    idVoie: `${codeCommune}-${codeVoie || nomVoieSlug}`,
    codeVoie: codeVoie || nomVoieSlug,
    nomVoie,
    nomCommune,
    codeCommune,
    numeroComplet,
    numero,
    suffixe,
    typePosition,
    position,
    dateMAJ,
    source
  }
}

function slugifyNomVoie(nomVoie) {
  return deburr(nomVoie).toLowerCase()
    .replace(/[^a-z0-9]/ig, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

module.exports = normalize
