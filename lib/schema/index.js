/* eslint camelcase: off */
const {format, parseISO} = require('date-fns')
const {trim, trimStart, deburr} = require('lodash')
const proj = require('@etalab/project-legal')
const {isCommune, isCommuneActuelle, isCommuneDeleguee, isCommuneAncienne, getCommuneActuelle} = require('../cog')

function isValidFloat(str) {
  return Boolean(/^-?(0|[1-9]\d*)(\.\d+)?\d?$/.test(str))
}

function isValidFrenchFloat(str) {
  return Boolean(/^-?(0|[1-9]\d*)(,\d+)?\d?$/.test(str))
}

function includesInvalidChar(str) {
  return str.includes('�')
}

exports.fields = {

  cle_interop: {
    required: true,
    trim: true,
    aliases: ['cle_intero', 'cle_interro'],
    parse(v, {addError, setAdditionnalValues}) {
      if (v.toLowerCase() !== v) {
        addError('casse_invalide')
      }

      const splitted = v.split('_')

      if (splitted.length < 3) {
        return addError('structure_invalide')
      }

      if (splitted.some(part => !part)) {
        return addError('structure_invalide')
      }

      const [, codeVoie, numeroVoie, ...suffixes] = splitted
      const codeCommune = splitted[0].toUpperCase()

      if (!isCommune(codeCommune)) {
        addError('commune_invalide')
      } else if (isCommuneAncienne(codeCommune)) {
        addError('commune_ancienne')
      }

      let codeVoieError = false

      if (codeVoie.length !== 4) {
        addError('voie_invalide')
        codeVoieError = true
      } else if (codeVoie.toUpperCase() === 'XXXX' || codeVoie === '0000') {
        addError('voie_non_renseignee')
        codeVoieError = true
      }

      // Clé d'interopérabilité - Numéro de voie
      if (!/^\d+$/.test(numeroVoie)) {
        return addError('numero_invalide')
      }

      if (numeroVoie.length !== 5) {
        addError('numero_prefixe_manquant')
      }

      setAdditionnalValues({
        codeCommune,
        codeVoie: codeVoieError ? undefined : codeVoie.toUpperCase(),
        numeroVoie: trimStart(numeroVoie, '0'),
        suffixes
      })

      return [codeCommune, codeVoie, numeroVoie.padStart(5, '0'), ...suffixes].join('_').toLowerCase()
    }
  },

  uid_adresse: {
    trim: true,
    aliases: ['uid_adress']
  },

  voie_nom: {
    required: true,
    trim: true,
    parse(v, {addError}) {
      if (v.length < 3) {
        return addError('trop_court')
      }

      if (v.length > 200) {
        return addError('trop_long')
      }

      if (includesInvalidChar(v)) {
        return addError('caractere_invalide')
      }

      if (v.includes('_')) {
        addError('contient_tiret_bas')
        v = v.replace(/_/g, ' ')
      }

      if (v.toUpperCase() === v) {
        addError('casse_incorrecte')
      }

      return v
    }
  },

  lieudit_complement_nom: {
    version: '1.2',
    trim: true,
    aliases: ['lieudit_co']
  },

  numero: {
    required: true,
    trim: true,
    aliases: ['nulmero'],
    parse(v, {addError}) {
      if (!/^\d+$/.test(v)) {
        return addError('type_invalide')
      }

      if (v.startsWith('0' && v !== '0')) {
        addError('contient_prefixe')
      }

      const n = Number.parseInt(v, 10)

      if (n > 9999 && n !== 99_999) {
        return addError('trop_grand')
      }

      return n
    }
  },

  suffixe: {
    trim: true,
    parse(v, {addError}) {
      if (!/^[\da-z]/i.test(v)) {
        return addError('debut_invalide')
      }

      if (v.length > 9) {
        return addError('trop_long')
      }

      return v
    }
  },

  commune_insee: {
    version: '1.2',
    required: true,
    trim: true,
    aliases: ['commune_in'],
    parse(v, {addError}) {
      const code = v.toUpperCase()

      if (!isCommune(code)) {
        addError('commune_invalide')
        return
      }

      if (isCommuneAncienne(code)) {
        addError('commune_ancienne')
      }

      return code
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
    parse(v, {addError}) {
      const code = v.toUpperCase()

      if (!isCommune(code)) {
        addError('commune_invalide')
        return
      }

      if (!isCommuneDeleguee(code)) {
        if (isCommuneActuelle(code)) {
          addError('commune_actuelle_non_deleguee')
        } else {
          addError('commune_ancienne_non_deleguee')
        }
      }

      return code
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
    parse(v, {addError}) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('valeur_invalide')
    }
  },

  y: {
    aliases: ['y_l93'],
    trim: true,
    parse(v, {addError}) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('valeur_invalide')
    }
  },

  long: {
    aliases: ['long_wgs84', 'lon'],
    trim: true,
    parse(v, {addError}) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('valeur_invalide')
    }
  },

  lat: {
    aliases: ['lat_wgs84'],
    trim: true,
    parse(v, {addError}) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v)
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide')
        return Number.parseFloat(v.replace(',', '.'))
      }

      addError('valeur_invalide')
    }
  },

  cad_parcelles: {
    version: '1.2',
    aliases: ['cad_parcel'],
    trim: true,

    parse(v, {addError}) {
      const pTrimmedValue = trim(v, '|')

      if (pTrimmedValue !== v) {
        addError('pipe_debut_fin')
      }

      if (!pTrimmedValue) {
        addError('valeur_invalide')
        return
      }

      const parcelles = pTrimmedValue.includes('|') ? pTrimmedValue.split('|') : [pTrimmedValue]

      if (parcelles.some(p => p.length !== 14 && p.length !== 15)) {
        addError('valeur_invalide')
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
    parse(v, {addError}) {
      if (!/^(\d{4}-\d{2}-\d{2})$/.test(v)) {
        return addError('date_invalide')
      }

      const parsedDate = parseISO(v)
      if (Number.isNaN(parsedDate.getTime())) {
        return addError('date_invalide')
      }

      if (parsedDate < new Date('2010-01-01')) {
        addError('date_ancienne')
      }

      if (parsedDate > new Date()) {
        return addError('date_future')
      }

      return format(parsedDate, 'yyyy-MM-dd')
    }
  },

  certification_commune: {
    version: '1.3',
    required: false,
    trim: true,
    aliases: ['certification_adresse'],
    parse(v, {addError}) {
      if (v === '1') {
        return true
      }

      if (v === '0') {
        return false
      }

      return addError('valeur_invalide')
    }
  }

}

function getNormalizedEnumValue(value) {
  return deburr(value.normalize()).replace(/\W+/g, ' ').trim().toLowerCase().normalize()
}

const enumFuzzyMap = new Map()

for (const value of exports.fields.position.enum) {
  enumFuzzyMap.set(getNormalizedEnumValue(value), value.normalize())
}

exports.fields.position.enumFuzzyMap = enumFuzzyMap

exports.getNormalizedEnumValue = getNormalizedEnumValue

function harmlessProj(coordinates) {
  try {
    return proj(coordinates)
  } catch {}
}

exports.row = (row, {addError}) => {
  if (row.parsedValues.cle_interop && row.parsedValues.numero) {
    const {numeroVoie} = row.additionalValues.cle_interop
    if (Number.parseInt(numeroVoie, 10) !== row.parsedValues.numero) {
      addError('incoherence_numero')
    }
  }

  if (!row.parsedValues.cle_interop && !row.parsedValues.commune_insee) {
    addError('commune_manquante')
  }

  if (row.parsedValues.numero && row.parsedValues.numero !== 99_999 && !row.rawValues.position) {
    addError('position_manquante')
  }

  if (row.parsedValues.numero && row.parsedValues.numero !== 99_999 && (!row.rawValues.long || !row.rawValues.lat)) {
    addError('longlat_vides')
  }

  // Has full geo part in parsed values ?
  if (['long', 'lat', 'x', 'y'].every(geopart => geopart in row.parsedValues)) {
    const {long, lat, x, y} = row.parsedValues
    const projectedCoordInMeters = harmlessProj([long, lat])
    if (projectedCoordInMeters) {
      const distance = Math.sqrt(((x - projectedCoordInMeters[0]) ** 2) + ((y - projectedCoordInMeters[1]) ** 2))
      const tolerance = 10

      if (distance > tolerance) {
        addError('longlat_xy_incoherents')
      }
    } else {
      // Not in France or error
      addError('longlat_invalides')
    }
  }

  if (row.parsedValues.numero === undefined || !row.parsedValues.voie_nom) {
    addError('adresse_incomplete')
  }

  if (row.parsedValues.commune_deleguee_insee && row.parsedValues.commune_insee) {
    const codeCommune = row.parsedValues.commune_insee
    const codeAncienneCommune = row.parsedValues.commune_deleguee_insee
    const communeActuelle = getCommuneActuelle(codeAncienneCommune)

    if (communeActuelle && communeActuelle.code !== codeCommune) {
      addError('chef_lieu_invalide')
    }
  }
}
