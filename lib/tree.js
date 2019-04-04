const {chain, maxBy, uniq, flatten} = require('lodash')

function mergeSet(arrays) {
  return uniq(flatten(arrays))
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function extractRowsAsPositions(rows) {
  return rows.map(row => {
    return {
      _id: generateId(),
      type: row.typePosition,
      coords: row.position,
      dateMAJ: row.dateMAJ,
      source: [row.source]
    }
  })
}

function extractRowsAsNumeros(rows) {
  return chain(rows)
    .groupBy('numeroComplet')
    .mapValues(numeroCompletRows => {
      const [{id, numeroComplet, numero, suffixe}] = numeroCompletRows
      const positions = extractRowsAsPositions(numeroCompletRows)
      return {
        id,
        numeroComplet,
        numero,
        suffixe,
        positions: positions.filter(p => p.coords),
        source: mergeSet(positions.map(e => e.source)),
        dateMAJ: maxBy(positions, e => new Date(e.dateMAJ)).dateMAJ
      }
    })
    .value()
}

function extractRowsAsVoies(rows, withIndexes = true) {
  return chain(rows)
    .groupBy('idVoie')
    .mapValues(voieRows => {
      const [{idVoie, codeVoie, nomVoie}] = voieRows
      const numeros = extractRowsAsNumeros(voieRows, withIndexes)
      const numerosValues = Object.values(numeros)
      const voie = {
        idVoie,
        codeVoie,
        nomVoie,
        source: mergeSet(numerosValues.map(e => e.source)),
        dateMAJ: maxBy(numerosValues, e => new Date(e.dateMAJ)).dateMAJ
      }
      if (Object.keys(numeros).length === 1 && numeros['99999']) {
        if (numeros['99999'].positions.length > 0) {
          voie.position = numeros['99999'].positions[0]
        }

        voie.numerosCount = 0
      } else {
        voie.numeros = withIndexes ? numeros : numerosValues
        voie.numerosCount = Object.keys(numeros).length
      }

      return voie
    })
    .value()
}

function extractRowsAsCommunes(rows, withIndexes = true) {
  return chain(rows)
    .groupBy('codeCommune')
    .mapValues(communeRows => {
      const [{codeCommune, nomCommune}] = communeRows
      const voies = extractRowsAsVoies(communeRows, withIndexes)
      const voiesValues = Object.values(voies)
      return {
        code: codeCommune,
        nom: nomCommune,
        voies: withIndexes ? voies : voiesValues,
        source: mergeSet(voiesValues.map(e => e.source)),
        voiesCount: Object.keys(voies).length,
        numerosCount: voiesValues.reduce((acc, {numerosCount}) => {
          return acc + numerosCount
        }, 0),
        dateMAJ: maxBy(voiesValues, e => new Date(e.dateMAJ)).dateMAJ
      }
    })
    .value()
}

function extractAsTree(rows, withIndexes = true) {
  const communes = extractRowsAsCommunes(rows, withIndexes)
  const communesValues = Object.values(communes)
  const communeMaxDateMAJ = maxBy(communesValues, e => new Date(e.dateMAJ))
  return {
    communes: withIndexes ? communes : communesValues,
    source: mergeSet(communesValues.map(e => e.source)),
    communesCount: Object.keys(communes).length,
    voiesCount: communesValues.reduce((acc, {voiesCount}) => {
      return acc + voiesCount
    }, 0),
    numerosCount: communesValues.reduce((acc, {numerosCount}) => {
      return acc + numerosCount
    }, 0),
    dateMAJ: communeMaxDateMAJ ? communeMaxDateMAJ.dateMAJ : undefined
  }
}

module.exports = {
  mergeSet,
  extractAsTree,
  extractRowsAsCommunes,
  extractRowsAsVoies,
  extractRowsAsNumeros
}
