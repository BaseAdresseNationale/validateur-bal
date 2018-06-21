/* eslint camelcase: off */
const parseDate = require('date-fns/parse')
const formatDate = require('date-fns/format')

exports.fields = {

  cle_interop: {
    required: true,
    aliases: ['cle_intero'],
    parse: v => {
      const errors = []
      if (v.toLowerCase() !== v) {
        errors.push('La clé d’interopérabilité doit être en minuscules')
      }
      const splitted = v.split('_')
      if (splitted.length < 3) {
        errors.push('La clé d’interopérabilité doit contenir au moins 3 segments')
        return {errors, parsedValue: v}
      }
      const [codeCommune, codeVoie, numeroVoie, ...suffixes] = splitted
      if (codeCommune.length !== 5) {
        errors.push('Clé d’interopérabilité invalide (commune)')
      }
      if (codeVoie.length !== 4) {
        errors.push('Clé d’interopérabilité invalide (voie)')
      }
      if (numeroVoie.length !== 5) {
        errors.push('Clé d’interopérabilité invalide (adresse)')
      }
      return {errors, parsedValue: v, more: {codeCommune, codeVoie, numeroVoie, suffixes}}
    }
  },

  uid_adresse: {aliases: ['uid_adress']},

  voie_nom: {required: true},

  numero: {required: true, parse: v => {
    const errors = []
    const parsedValue = Number.parseInt(v, 10)
    if (Number.isNaN(parsedValue)) {
      errors.push('Impossible d’interprêter la valeur du champ numero')
    }
    if (parsedValue === 0) {
      errors.push('La valeur du champ numero ne peut pas être nulle')
    }
    if (parsedValue.toString() !== v) {
      errors.push('La valeur du champ numero doit être un entier')
    }
    return {parsedValue, errors}
  }},

  suffixe: {},

  commune_nom: {aliases: ['commune_no']},

  position: {
    enum: [
      'délivrance postale',
      'entrée',
      'bâtiment',
      'cage d’escalier',
      'logement',
      'parcelle',
      'segment',
      'service technique'
    ].map(v => v.normalize())
  },

  x: {aliases: ['x_l93'], parse: v => {
    const res = {errors: []}
    const parsedValue = Number.parseFloat(v)
    if (Number.isNaN(parsedValue)) {
      res.errors.push('Impossible d’interprêter la valeur du champ x')
      return res
    }
    res.parsedValue = parsedValue
    return res
  }},

  y: {aliases: ['y_l93'], parse: v => {
    const res = {errors: []}
    const parsedValue = Number.parseFloat(v)
    if (Number.isNaN(parsedValue)) {
      res.errors.push('Impossible d’interprêter la valeur du champ y')
      return res
    }
    res.parsedValue = parsedValue
    return res
  }},

  long: {
    aliases: ['long_wgs84'],
    parse: v => {
      const res = {errors: []}
      const parsedValue = Number.parseFloat(v)
      if (Number.isNaN(parsedValue)) {
        res.errors.push('Impossible d’interprêter la valeur du champ long')
        return res
      }
      res.parsedValue = parsedValue
      return res
    }
  },

  lat: {
    aliases: ['lat_wgs84'],
    parse: v => {
      const res = {errors: []}
      const parsedValue = Number.parseFloat(v)
      if (Number.isNaN(parsedValue)) {
        res.errors.push('Impossible d’interprêter la valeur du champ lat')
        return res
      }
      res.parsedValue = parsedValue
      return res
    }
  },

  source: {
    required: true
  },

  date_der_maj: {
    required: true,
    aliases: ['date_der_m'],
    parse: v => {
      const res = {errors: []}
      if (!v.match(/^(\d{4}-\d{2}-\d{2})$/)) {
        res.errors.push('Date invalide')
        return res
      }
      const parsedDate = parseDate(v)
      if (Number.isNaN(parsedDate.getTime())) {
        res.errors.push('Date invalide')
        return res
      }
      res.parsedValue = formatDate(parsedDate, 'YYYY-MM-DD')
      return res
    }
  }

}

exports.row = row => {
  const errors = []

  if (row.cle_interop.parsedValue && row.numero.parsedValue) {
    const {numeroVoie} = row.cle_interop.more
    if (parseInt(numeroVoie, 10) !== row.numero.parsedValue) {
      errors.push('Le numéro ne correspond pas à la valeur présente dans la clé : ' + row.numero.parsedValue)
    }
  }

  if (row.numero.parsedValue && row.numero.parsedValue !== 99999 && !('rawValue' in row.position)) {
    errors.push('Position nulle')
  }

  return errors
}
