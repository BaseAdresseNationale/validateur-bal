/* eslint camelcase: off */
const {format, parseISO} = require('date-fns')
const {trimStart, chain} = require('lodash')
const communes = require('../minicog.json')

const codesCommunesActuelles = chain(communes).filter(c => !c.chefLieu).map('code').uniq().value()

function isValidFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(\.\d+)?\d?$/))
}

function isValidFrenchFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(,\d+)?\d?$/))
}

exports.fields = {

  cle_interop: {
    required: 'error',
    aliases: ['cle_intero', 'cle_interro'],
    parse: (v, {addWarning, addError, setAdditionnalValues}) => {
      if (v.toLowerCase() !== v) {
        addWarning('La clé d’interopérabilité doit être en minuscules')
      }

      const splitted = v.split('_')
      if (splitted.length < 3) {
        return addError('La clé d’interopérabilité doit contenir au moins 3 segments')
      }

      const [codeCommune, codeVoie, numeroVoie, ...suffixes] = splitted
      if (!codesCommunesActuelles.includes(codeCommune.toUpperCase())) {
        addError('Clé d’interopérabilité invalide (commune)')
      }

      let codeVoieError = false

      if (codeVoie.length !== 4 || codeVoie.toUpperCase() === 'XXXX' || codeVoie === '0000') {
        addWarning('Clé d’interopérabilité invalide (voie)')
        codeVoieError = true
      }

      // Clé d'interopérabilité - Numéro de voie
      if (!numeroVoie.match(/^\d+$/)) {
        addError('Clé d’interopérabilité invalide (numéro)')
      } else if (numeroVoie.length !== 5) {
        addWarning('La partie numéro de la clé d’interopérabilité doit contenir 5 caractères')
      }

      setAdditionnalValues({
        codeCommune: codeCommune.toUpperCase(),
        codeVoie: codeVoieError ? undefined : codeVoie.toUpperCase(),
        numeroVoie: trimStart(numeroVoie, '0'),
        suffixes
      })

      return v
    }
  },

  uid_adresse: {aliases: ['uid_adress']},

  voie_nom: {required: 'error', parse: (v, {addError}) => {
    const trimmedValue = v.trim()

    if (!trimmedValue) {
      return addError('Le nom de la voie doit contenir au moins un caractère alpha-numérique.')
    }

    return trimmedValue
  }},

  numero: {required: 'error', aliases: ['nulmero'], parse: (v, {addError, addWarning}) => {
    if (!v.match(/^\d+$/)) {
      return addError('La valeur du champ numéro doit être un nombre entier')
    }

    if (v.startsWith('0')) {
      addWarning('La valeur du champ numéro ne doit pas être préfixée par des zéros')
    }

    return Number.parseInt(v, 10)
  }},

  suffixe: {parse: (v, {addWarning, addError}) => {
    const trimmedValue = v.trim()

    if (trimmedValue !== v) {
      addWarning('La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère')
    }

    if (!trimmedValue.match(/^[\da-z]/i)) {
      return addError('La valeur du champ suffixe doit commencer par un caractère alphanumérique.')
    }

    return trimmedValue
  }},

  commune_insee: {
    aliases: ['commune_in'],
    parse: (v, {addWarning, addError}) => {
      const trimmedValue = v.trim()

      if (trimmedValue !== v) {
        addWarning('La valeur du champ commune_insee ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère')
      }

      if (!codesCommunesActuelles.includes(trimmedValue.toUpperCase())) {
        addError('Le code INSEE de la commune n’est pas un code valide de commune actuelle.')
        return
      }

      return trimmedValue
    }
  },

  commune_nom: {aliases: ['commune_no']},

  position: {
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

  x: {aliases: ['x_l93'], parse: (v, {addWarning, addError}) => {
    if (isValidFloat(v)) {
      return Number.parseFloat(v)
    }

    if (isValidFrenchFloat(v)) {
      addWarning('Le séparateur des décimales du champ x doit être le point')
      return Number.parseFloat(v.replace(',', '.'))
    }

    addError('Impossible d’interpréter la valeur du champ x')
  }},

  y: {aliases: ['y_l93'], parse: (v, {addWarning, addError}) => {
    if (isValidFloat(v)) {
      return Number.parseFloat(v)
    }

    if (isValidFrenchFloat(v)) {
      addWarning('Le séparateur des décimales du champ y doit être le point')
      return Number.parseFloat(v.replace(',', '.'))
    }

    addError('Impossible d’interpréter la valeur du champ y')
  }},

  long: {
    aliases: ['long_wgs84', 'lon'],
    parse: (v, {addWarning, addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addWarning('Le séparateur des décimales du champ long doit être le point')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('Impossible d’interpréter la valeur du champ long')
    }
  },

  lat: {
    aliases: ['lat_wgs84'],
    parse: (v, {addWarning, addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addWarning('Le séparateur des décimales du champ lat doit être le point')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('Impossible d’interpréter la valeur du champ lat')
    }
  },

  source: {
    required: 'warning'
  },

  date_der_maj: {
    required: 'warning',
    aliases: ['date_der_m', 'dmaj', 'date_maj'],
    parse: (v, {addWarning}) => {
      if (!v.match(/^(\d{4}-\d{2}-\d{2})$/)) {
        return addWarning('Date invalide')
      }

      const parsedDate = parseISO(v)
      if (Number.isNaN(parsedDate.getTime())) {
        return addWarning('Date invalide')
      }

      return format(parsedDate, 'yyyy-MM-dd')
    }
  }

}

exports.row = (row, {addWarning, addError}) => {
  if (row.cle_interop.parsedValue && row.numero.parsedValue) {
    const {numeroVoie} = row.cle_interop.more
    if (Number.parseInt(numeroVoie, 10) !== row.numero.parsedValue) {
      addError('Le numéro ne correspond pas à la valeur présente dans la clé')
    }
  }

  if (row.numero.parsedValue && row.numero.parsedValue !== 99999 && !('rawValue' in row.position)) {
    addWarning('Position nulle')
  }
}
