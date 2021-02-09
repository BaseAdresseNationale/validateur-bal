/* eslint camelcase: off */
const {format, parseISO} = require('date-fns')
const {trimStart, deburr} = require('lodash')
const communes = require('../../minicog.json')

const codesCommunes = new Set(communes.map(c => c.code))
const communesAnciennes = new Set(communes.filter(c => c.chefLieu).map(c => c.code))
const codesCommunesActuelles = new Set(communes.filter(c => !c.chefLieu).map(c => c.code))

function isValidFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(\.\d+)?\d?$/))
}

function isValidFrenchFloat(str) {
  return Boolean(str.match(/^-?(0|[1-9]\d*)(,\d+)?\d?$/))
}

exports.fields = {

  cle_interop: {
    required: true,
    trim: true,
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
      if (!codesCommunes.has(codeCommune.toUpperCase())) {
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

  uid_adresse: {
    trim: true,
    aliases: ['uid_adress']
  },

  voie_nom: {
    required: true,
    trim: true
  },

  lieudit_complement_nom: {
    trim: true,
    aliases: ['lieudit_co']
  },

  numero: {
    required: true,
    trim: true,
    aliases: ['nulmero'],
    parse: (v, {addError}) => {
      if (!v.match(/^\d+$/)) {
        return addError('numero.type_invalide')
      }

      if (v.startsWith('0' && v !== '0')) {
        addError('numero.contient_prefixe')
      }

      return Number.parseInt(v, 10)
    }
  },

  suffixe: {
    trim: true,
    parse: (v, {addError}) => {
      if (!v.match(/^[\da-z]/i)) {
        return addError('suffixe.debut_invalide')
      }

      return v
    }
  },

  commune_insee: {
    version: '1.2',
    required: true,
    trim: true,
    aliases: ['commune_in'],
    parse: (v, {addError}) => {
      if (!codesCommunesActuelles.has(v.toUpperCase())) {
        addError('commune_insee.commune_invalide')
        return
      }

      return v
    }
  },

  commune_nom: {
    required: true,
    trim: true,
    aliases: ['commune_no']
  },

  commune_deleguee_insee: {
    version: '1.2',
    trim: true,
    parse: (v, {addError}) => {
      if (!communesAnciennes.has(v.toUpperCase())) {
        addError('commune_deleguee_insee.commune_invalide')
        return
      }

      return v
    }
  },

  commune_deleguee_nom: {
    version: '1.2',
    trim: true
  },

  position: {
    trim: true,
    enum: [
      'délivrance postale',
      'entrée',
      'bâtiment',
      'cage d’escalier',
      'logement',
      'parcelle',
      'segment',
      'service technique'
    ]
  },

  x: {
    aliases: ['x_l93'],
    trim: true,
    parse: (v, {addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('x.separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('x.valeur_invalide')
    }
  },

  y: {
    aliases: ['y_l93'],
    trim: true,
    parse: (v, {addError}) => {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('y.separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('y.valeur_invalide')
    }
  },

  long: {
    aliases: ['long_wgs84', 'lon'],
    trim: true,
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
    trim: true,
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

  cad_parcelles: {
    version: '1.2',
    aliases: ['cad_parcel'],
    trim: true,

    parse(v, {addError}) {
      const parcelles = v.split('|')

      if (parcelles.some(p => p.length !== 14 || p.length !== 15)) {
        addError('cad_parcelles.valeur_invalide')
        return
      }

      return parcelles.map(p => p.length === 14 ? p : p.slice(0, 2) + p.slice(3))
    }
  },

  source: {
    required: true,
    trim: true
  },

  date_der_maj: {
    required: true,
    trim: true,
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

function getNormalizedEnumValue(value) {
  return deburr(value.normalize()).replace(/\W+/g, ' ').trim().toLowerCase().normalize()
}

exports.fields.position.enumFuzzyMap = exports.fields.position.enum.reduce((map, value) => {
  map.set(getNormalizedEnumValue(value), value.normalize())
  return map
}, new Map())

exports.getNormalizedEnumValue = getNormalizedEnumValue

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

  if (row.commune_deleguee_insee && row.commune_deleguee_insee.parsedValue && row.commune_insee && row.commune_insee.parsedValue) {
    const codeCommune = row.commune_insee.parsedValue
    const codeAncienneCommune = row.commune_deleguee_insee.parsedValue
    const ancienneCommune = communes.find(c => c.code === codeAncienneCommune && c.chefLieu)
    if (ancienneCommune && ancienneCommune.chefLieu !== codeCommune) {
      addError('row.chef_lieu_invalide')
    }
  }
}
