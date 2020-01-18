/* eslint camelcase: off */
const parseDate = require('date-fns/parseISO')
const formatDate = require('date-fns/format')
const {trimStart} = require('lodash')

function initResult() {
  return {errors: [], warnings: []}
}

function isValidFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(\.\d+)?\d?$/))
}

function isValidFrenchFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(,\d+)?\d?$/))
}

exports.fields = {

  cle_interop: {
    required: 'error',
    aliases: ['cle_intero', 'CLE_INTEROP', 'CLE_INTERO', 'CLE_INTERRO'],
    parse: v => {
      const r = initResult()

      if (v.toLowerCase() !== v) {
        r.warnings.push('La clé d’interopérabilité doit être en minuscules')
      }

      const splitted = v.split('_')
      if (splitted.length < 3) {
        r.errors.push('La clé d’interopérabilité doit contenir au moins 3 segments')
        return r
      }

      const [codeCommune, codeVoie, numeroVoie, ...suffixes] = splitted
      if (codeCommune.length !== 5) {
        r.errors.push('Clé d’interopérabilité invalide (commune)')
      }

      let codeVoieError = false

      if (codeVoie.length !== 4 || codeVoie.toUpperCase() === 'XXXX' || codeVoie === '0000') {
        r.warnings.push('Clé d’interopérabilité invalide (voie)')
        codeVoieError = true
      }

      // Clé d'interopérabilité - Numéro de voie
      if (!numeroVoie.match(/^\d+$/)) {
        r.errors.push('Clé d’interopérabilité invalide (numéro)')
      } else if (numeroVoie.length !== 5) {
        r.warnings.push('La partie numéro de la clé d’interopérabilité doit contenir 5 caractères')
      }

      r.parsedValue = v
      r.more = {
        codeCommune: codeCommune.toUpperCase(),
        codeVoie: codeVoieError ? undefined : codeVoie.toUpperCase(),
        numeroVoie: trimStart(numeroVoie, '0'),
        suffixes
      }
      return r
    }
  },

  uid_adresse: {aliases: ['uid_adress', 'UID_ADRESSE', 'UID_ADRESS']},

  voie_nom: {required: 'error', aliases: ['VOIE_NOM'], parse: v => {
    const r = initResult()
    const trimmedValue = v.trim()

    if (!trimmedValue) {
      r.errors.push('Le nom de la voie doit contenir au moins un caractère alpha-numérique.')
      return r
    }

    r.parsedValue = trimmedValue
    return r
  }},

  numero: {required: 'error', aliases: ['NUMERO', 'nulmero'], parse: v => {
    const r = initResult()
    if (v === '0') {
      r.errors.push('La valeur du champ numéro ne peut pas être 0')
      return r
    }

    if (!v.match(/^\d+$/)) {
      r.errors.push('La valeur du champ numéro doit être un nombre entier')
      return r
    }

    if (v.startsWith('0')) {
      r.warnings.push('La valeur du champ numéro ne doit pas être préfixée par des zéros')
    }

    r.parsedValue = Number.parseInt(v, 10)
    return r
  }},

  suffixe: {aliases: ['SUFFIXE'], parse: v => {
    const r = initResult()

    const trimmedValue = v.trim()

    if (trimmedValue !== v) {
      r.warnings.push('La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère')
    }

    if (!trimmedValue.match(/^[a-z]/i)) {
      r.errors.push('La valeur du champ suffixe doit commencer par un caractère alphabétique.')
      return trimmedValue
    }

    return trimmedValue
  }},

  commune_nom: {aliases: ['commune_no', 'COMMUNE_NOM', 'COMMUNE_NO']},

  position: {
    aliases: ['POSITION'],
    enum: [
      'délivrance postale',
      'entrée',
      'bâtiment',
      'cage d’escalier',
      'cage d\'escalier',
      'logement',
      'parcelle',
      'segment',
      'service technique'
    ].map(v => v.normalize()),
    enumSeverity: 'warning'
  },

  x: {aliases: ['x_l93', 'X'], parse: v => {
    const r = initResult()
    if (isValidFloat(v)) {
      r.parsedValue = Number.parseFloat(v)
    } else if (isValidFrenchFloat(v)) {
      r.parsedValue = Number.parseFloat(v.replace(',', '.'))
      r.warnings.push('Le séparateur des décimales du champ x doit être le point')
    } else {
      r.errors.push('Impossible d’interpréter la valeur du champ x')
    }

    return r
  }},

  y: {aliases: ['y_l93', 'Y'], parse: v => {
    const r = initResult()
    if (isValidFloat(v)) {
      r.parsedValue = Number.parseFloat(v)
    } else if (isValidFrenchFloat(v)) {
      r.parsedValue = Number.parseFloat(v.replace(',', '.'))
      r.warnings.push('Le séparateur des décimales du champ y doit être le point')
    } else {
      r.errors.push('Impossible d’interpréter la valeur du champ y')
    }
  }},

  long: {
    aliases: ['long_wgs84', 'lon', 'LON', 'LONG'],
    parse: v => {
      const r = initResult()
      if (isValidFloat(v)) {
        r.parsedValue = Number.parseFloat(v)
      } else if (isValidFrenchFloat(v)) {
        r.parsedValue = Number.parseFloat(v.replace(',', '.'))
        r.warnings.push('Le séparateur des décimales du champ long doit être le point')
      } else {
        r.errors.push('Impossible d’interpréter la valeur du champ long')
      }

      return r
    }
  },

  lat: {
    aliases: ['lat_wgs84', 'LAT'],
    parse: v => {
      const r = initResult()
      if (isValidFloat(v)) {
        r.parsedValue = Number.parseFloat(v)
      } else if (isValidFrenchFloat(v)) {
        r.parsedValue = Number.parseFloat(v.replace(',', '.'))
        r.warnings.push('Le séparateur des décimales du champ lat doit être le point')
      } else {
        r.errors.push('Impossible d’interpréter la valeur du champ lat')
      }

      return r
    }
  },

  source: {
    required: 'warning',
    aliases: ['SOURCE']
  },

  date_der_maj: {
    required: 'warning',
    aliases: ['date_der_m', 'DATE_DER_M', 'DATE_DER_MAJ', 'DMAJ'],
    parse: v => {
      const r = initResult()
      if (!v.match(/^(\d{4}-\d{2}-\d{2})$/)) {
        r.warnings.push('Date invalide')
        return r
      }

      const parsedDate = parseDate(v)
      if (Number.isNaN(parsedDate.getTime())) {
        r.warnings.push('Date invalide')
        return r
      }

      r.parsedValue = formatDate(parsedDate, 'yyyy-MM-dd')
      return r
    }
  }

}

exports.row = row => {
  const r = initResult()

  if (row.cle_interop.parsedValue && row.numero.parsedValue) {
    const {numeroVoie} = row.cle_interop.more
    if (parseInt(numeroVoie, 10) !== row.numero.parsedValue) {
      r.errors.push('Le numéro ne correspond pas à la valeur présente dans la clé')
    }
  }

  if (row.numero.parsedValue && row.numero.parsedValue !== 99999 && !('rawValue' in row.position)) {
    r.warnings.push('Position nulle')
  }

  return r
}
