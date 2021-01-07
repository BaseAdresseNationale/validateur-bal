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
    required: true,
    aliases: ['cle_intero', 'cle_interro'],
    parse: (v, {addError, setAdditionnalValues}) => {
      if (v.toLowerCase() !== v) {
        addError('cle_interop.casse_invalide')
      }

      const splitted = v.split('_')
      if (splitted.length < 3) {
        return addError('cle_interop.structure_invalide')
      }

      const [codeCommune, codeVoie, numeroVoie, ...suffixes] = splitted
      if (!codesCommunesActuelles.includes(codeCommune.toUpperCase())) {
        addError('cle_interop.commune_invalide')
      }

      let codeVoieError = false

      if (codeVoie.length !== 4 || codeVoie.toUpperCase() === 'XXXX' || codeVoie === '0000') {
        addError('cle_interop.voie_invalide')
        codeVoieError = true
      }

      // Clé d'interopérabilité - Numéro de voie
      if (!numeroVoie.match(/^\d+$/)) {
        addError('cle_interop.numero_invalide')
      } else if (numeroVoie.length !== 5) {
        addError('cle_interop.numero_prefixe_manquant')
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

  voie_nom: {required: true, parse: (v, {addError}) => {
    const trimmedValue = v.trim()

    if (!trimmedValue) {
      return addError('voie_nom.valeur_manquante')
    }

    return trimmedValue
  }},

  numero: {required: true, aliases: ['nulmero'], parse: (v, {addError}) => {
    if (!v.match(/^\d+$/)) {
      return addError('numero.type_invalide')
    }

    if (v.startsWith('0')) {
      addError('numero.contient_prefixe')
    }

    return Number.parseInt(v, 10)
  }},

  suffixe: {parse: (v, {addError}) => {
    const trimmedValue = v.trim()

    if (trimmedValue !== v) {
      addError('suffixe.espaces_debut_fin')
    }

    if (!trimmedValue) {
      return null
    }

    if (!trimmedValue.match(/^[\da-z]/i)) {
      return addError('suffixe.debut_invalide')
    }

    return trimmedValue
  }},

  commune_insee: {
    version: '1.2',
    aliases: ['commune_in'],
    parse: (v, {addError}) => {
      const trimmedValue = v.trim()

      if (trimmedValue !== v) {
        addError('commune_insee.espaces_debut_fin')
      }

      if (!codesCommunesActuelles.includes(trimmedValue.toUpperCase())) {
        addError('commune_insee.commune_invalide')
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
    ].map(v => v.normalize())
  },

  x: {aliases: ['x_l93'], parse: (v, {addError}) => {
    if (isValidFloat(v)) {
      return Number.parseFloat(v)
    }

    if (isValidFrenchFloat(v)) {
      addError('x.separateur_decimal_invalide')
      return Number.parseFloat(v.replace(',', '.'))
    }

    addError('x.valeur_invalide')
  }},

  y: {aliases: ['y_l93'], parse: (v, {addError}) => {
    if (isValidFloat(v)) {
      return Number.parseFloat(v)
    }

    if (isValidFrenchFloat(v)) {
      addError('y.separateur_decimal_invalide')
      return Number.parseFloat(v.replace(',', '.'))
    }

    addError('y.valeur_invalide')
  }},

  long: {
    aliases: ['long_wgs84', 'lon'],
    parse: (v, {addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('long.separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('long.valeur_invalide')
    }
  },

  lat: {
    aliases: ['lat_wgs84'],
    parse: (v, {addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('lat.separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('lat.valeur_invalide')
    }
  },

  source: {
    required: true
  },

  date_der_maj: {
    required: true,
    aliases: ['date_der_m', 'dmaj', 'date_maj'],
    parse: (v, {addError}) => {
      if (!v.match(/^(\d{4}-\d{2}-\d{2})$/)) {
        return addError('date_der_maj.date_invalide')
      }

      const parsedDate = parseISO(v)
      if (Number.isNaN(parsedDate.getTime())) {
        return addError('date_der_maj.date_invalide')
      }

      return format(parsedDate, 'yyyy-MM-dd')
    }
  }

}

exports.row = (row, {addError}) => {
  if (row.cle_interop && row.cle_interop.parsedValue && row.numero && row.numero.parsedValue) {
    const {numeroVoie} = row.cle_interop.more
    if (Number.parseInt(numeroVoie, 10) !== row.numero.parsedValue) {
      addError('row.incoherence_numero')
    }
  }

  if (row.numero && row.numero.parsedValue && row.numero.parsedValue !== 99999 && !row.position) {
    addError('row.position_manquante')
  }
}
