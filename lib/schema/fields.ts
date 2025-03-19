import { format, parseISO } from 'date-fns';
import { trim, trimStart, deburr } from 'lodash';

import {
  isCommune,
  isCommuneActuelle,
  isCommuneAncienne,
  isCommuneDeleguee,
} from '../utils/cog';
import { validate as isUuid } from 'uuid';
import { ParsedValue, PositionTypeEnum } from '../validate/validate.type';

export type FieldsSchema = {
  trim: boolean;
  required?: boolean;
  formats?: string[];
  allowRegionalLang?: boolean;
  parse?: (
    value: any,
    {
      addError,
      setAdditionnalValues,
    }: {
      addError: (error: string) => void;
      setAdditionnalValues: (add: any) => void;
    },
  ) => ParsedValue;
};

function isValidFloat(str: string): boolean {
  return Boolean(/^-?(0|[1-9]\d*)(\.\d+)?\d?$/.test(str));
}

function isValidFrenchFloat(str: string): boolean {
  return Boolean(/^-?(0|[1-9]\d*)(,\d+)?\d?$/.test(str));
}

function includesInvalidChar(str: string): boolean {
  return str.includes('�');
}

function getNormalizedEnumValue(value) {
  return deburr(value.normalize())
    .replace(/\W+/g, ' ')
    .trim()
    .toLowerCase()
    .normalize();
}

const enumPositionMap = new Map();

for (const value of Object.values(PositionTypeEnum)) {
  enumPositionMap.set(getNormalizedEnumValue(value), value.normalize());
}

const fields: Record<string, FieldsSchema> = {
  cle_interop: {
    required: true,
    trim: true,
    formats: ['1.1', '1.2', '1.3', '1.4'],
    parse(v, { addError, setAdditionnalValues }) {
      if (v.toLowerCase() !== v) {
        addError('casse_invalide');
      }

      const splitted = v.split('_');

      if (splitted.length < 3) {
        addError('structure_invalide');
        return undefined;
      }

      if (splitted.some((part) => !part)) {
        addError('structure_invalide');
        return undefined;
      }

      const [, codeVoie, numeroVoie, ...suffixes] = splitted;
      const codeCommune = splitted[0].toUpperCase();

      if (!isCommune(codeCommune)) {
        addError('commune_invalide');
      } else if (isCommuneAncienne(codeCommune)) {
        addError('commune_ancienne');
      }

      let codeVoieError = false;

      if (codeVoie.length !== 4) {
        addError('voie_invalide');
        codeVoieError = true;
      } else if (codeVoie.toUpperCase() === 'XXXX' || codeVoie === '0000') {
        addError('voie_non_renseignee');
        codeVoieError = true;
      }

      // Clé d'interopérabilité - Numéro de voie
      if (!/^\d+$/.test(numeroVoie)) {
        addError('numero_invalide');
        return undefined;
      }

      if (numeroVoie.length !== 5) {
        addError('numero_prefixe_manquant');
      }

      setAdditionnalValues({
        codeCommune,
        codeVoie: codeVoieError ? undefined : codeVoie.toUpperCase(),
        numeroVoie: trimStart(numeroVoie, '0'),
        suffixes,
      });

      return [codeCommune, codeVoie, numeroVoie.padStart(5, '0'), ...suffixes]
        .join('_')
        .toLowerCase();
    },
  },
  uid_adresse: {
    trim: true,
    formats: ['1.1', '1.2', '1.3'],
    parse(v, { addError, setAdditionnalValues }) {
      const [uuidCommune] = v.match(/@c:(\S+)/gi) || [];
      const [uuidToponyme] = v.match(/@v:(\S+)/gi) || [];
      const [uuidAdresse] = v.match(/@a:(\S+)/gi) || [];

      const idBanCommune = uuidCommune?.substr(3) || null;
      const idBanToponyme = uuidToponyme?.substr(3) || null;
      const idBanAdresse = uuidAdresse?.substr(3) || null;

      if (
        (idBanCommune && !isUuid(idBanCommune)) ||
        (idBanToponyme && !isUuid(idBanToponyme)) ||
        (idBanAdresse && !isUuid(idBanAdresse))
      ) {
        addError('type_invalide');
        return undefined;
      }

      setAdditionnalValues({
        idBanCommune,
        idBanToponyme,
        idBanAdresse,
      });

      return v;
    },
  },

  id_ban_commune: {
    formats: ['1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!isUuid(v)) {
        addError('type_invalide');
        return undefined;
      }

      return v;
    },
  },

  id_ban_toponyme: {
    formats: ['1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!isUuid(v)) {
        addError('type_invalide');
        return undefined;
      }

      return v;
    },
  },

  id_ban_adresse: {
    formats: ['1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!isUuid(v)) {
        addError('type_invalide');
        return undefined;
      }

      return v;
    },
  },

  voie_nom: {
    required: true,
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    allowRegionalLang: true,
    parse(v, { addError }) {
      if (v.length < 3) {
        addError('trop_court');
        return undefined;
      }

      if (v.length > 200) {
        addError('trop_long');
        return undefined;
      }

      if (includesInvalidChar(v)) {
        addError('caractere_invalide');
        return undefined;
      }

      if (v.includes('_')) {
        addError('contient_tiret_bas');
        v = v.replace(/_/g, ' ');
      }

      if (v.toUpperCase() === v) {
        addError('casse_incorrecte');
      }

      return v;
    },
  },

  lieudit_complement_nom: {
    formats: ['1.2', '1.3', '1.4'],
    trim: true,
    allowRegionalLang: true,
  },

  numero: {
    required: true,
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!/^\d+$/.test(v)) {
        addError('type_invalide');
        return undefined;
      }

      if (v.startsWith('0') && v !== '0') {
        addError('contient_prefixe');
      }

      const n = Number.parseInt(v, 10);

      if (n > 9999 && n !== 99_999) {
        addError('trop_grand');
        return undefined;
      }

      return n;
    },
  },

  suffixe: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!/^[\da-z]/i.test(v)) {
        addError('debut_invalide');
        return undefined;
      }

      if (v.length > 9) {
        addError('trop_long');
        return undefined;
      }

      return v;
    },
  },

  commune_insee: {
    required: true,
    formats: ['1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      const code = v.toUpperCase();

      if (!isCommune(code)) {
        addError('commune_invalide');
        return;
      }

      if (isCommuneAncienne(code)) {
        addError('commune_ancienne');
      }

      return code;
    },
  },

  commune_nom: {
    required: true,
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    allowRegionalLang: true,
  },

  commune_deleguee_insee: {
    formats: ['1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      const code = v.toUpperCase();

      if (!isCommune(code)) {
        addError('commune_invalide');
        return;
      }

      if (!isCommuneDeleguee(code)) {
        if (isCommuneActuelle(code)) {
          addError('commune_actuelle_non_deleguee');
        } else {
          addError('commune_ancienne_non_deleguee');
        }
      }

      return code;
    },
  },

  commune_deleguee_nom: {
    formats: ['1.2', '1.3', '1.4'],
    trim: true,
    allowRegionalLang: true,
  },

  position: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      const normalizedValue = getNormalizedEnumValue(v);

      if (enumPositionMap.has(normalizedValue)) {
        const schemaValue = enumPositionMap.get(normalizedValue);
        if (schemaValue !== v.normalize()) {
          addError('enum_fuzzy');
        }
        return schemaValue;
      } else {
        addError('valeur_invalide');
      }
    },
  },

  x: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v);
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide');
        return Number.parseFloat(v.replace(',', '.'));
      }

      addError('valeur_invalide');
    },
  },

  y: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v);
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide');
        return Number.parseFloat(v.replace(',', '.'));
      }

      addError('valeur_invalide');
    },
  },

  long: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v);
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide');
        return Number.parseFloat(v.replace(',', '.'));
      }

      addError('valeur_invalide');
    },
  },

  lat: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (isValidFloat(v)) {
        return Number.parseFloat(v);
      }

      if (isValidFrenchFloat(v)) {
        addError('separateur_decimal_invalide');
        return Number.parseFloat(v.replace(',', '.'));
      }

      addError('valeur_invalide');
    },
  },

  cad_parcelles: {
    formats: ['1.2', '1.3', '1.4'],
    trim: true,

    parse(v, { addError }) {
      const pTrimmedValue = trim(v, '|');

      if (pTrimmedValue !== v) {
        addError('pipe_debut_fin');
      }

      if (!pTrimmedValue) {
        addError('valeur_invalide');
        return;
      }

      const parcelles: string[] = pTrimmedValue.includes('|')
        ? pTrimmedValue.split('|')
        : [pTrimmedValue];

      if (parcelles.some((p) => p.length !== 14 && p.length !== 15)) {
        addError('valeur_invalide');
        return;
      }

      return parcelles.map((p) =>
        p.length === 14 ? p : p.slice(0, 2) + p.slice(3),
      );
    },
  },

  source: {
    formats: ['1.1', '1.2', '1.3', '1.4'],
    required: true,
    trim: true,
  },

  date_der_maj: {
    required: true,
    formats: ['1.1', '1.2', '1.3', '1.4'],
    trim: true,
    parse(v, { addError }) {
      if (!/^(\d{4}-\d{2}-\d{2})$/.test(v)) {
        addError('date_invalide');
        return undefined;
      }

      const parsedDate = parseISO(v);
      if (Number.isNaN(parsedDate.getTime())) {
        addError('date_invalide');
        return undefined;
      }

      if (parsedDate < new Date('2010-01-01')) {
        addError('date_ancienne');
      }

      if (parsedDate > new Date()) {
        addError('date_future');
        return undefined;
      }

      return format(parsedDate, 'yyyy-MM-dd');
    },
  },

  certification_commune: {
    formats: ['1.3', '1.4'],
    required: false,
    trim: true,
    parse(v, { addError }) {
      if (v === '1') {
        return true;
      }

      if (v === '0') {
        return false;
      }

      addError('valeur_invalide');
      return undefined;
    },
  },
};

export default fields;
