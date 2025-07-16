import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import { getCodeCommune } from './row';
import { normalize } from '@ban-team/adresses-util/lib/voies';
import { chain } from 'lodash';
import { v4 as uuid } from 'uuid';

export function getVoieIdentifier({ parsedValues }: ValidateRowType) {
  return `${normalize(parsedValues.voie_nom)}#${parsedValues.commune_deleguee_insee}`;
}

export function getNumeroIdentifier({ parsedValues }: ValidateRowType) {
  return `${parsedValues.numero}#${parsedValues.suffixe}#${parsedValues.voie_nom}#${parsedValues.commune_deleguee_insee}`;
}

function getMapNameVoieBanId(
  parsedRows: ValidateRowType[],
): Record<string, string> {
  return chain(parsedRows)
    .groupBy((row) => getVoieIdentifier(row))
    .mapValues((rows) => {
      const rowWithValue = rows.find(
        (row) =>
          row.parsedValues.id_ban_toponyme ||
          row.additionalValues?.uid_adresse?.idBanToponyme,
      );
      if (rowWithValue) {
        return (
          rowWithValue.parsedValues.id_ban_toponyme ||
          rowWithValue.additionalValues?.uid_adresse?.idBanToponyme
        );
      }
      return uuid();
    })
    .value();
}

function getMapNumeroBanId(
  parsedRows: ValidateRowType[],
): Record<string, string> {
  return chain(parsedRows)
    .filter(({ parsedValues }) => parsedValues.numero !== 99_999)
    .groupBy((row) => getNumeroIdentifier(row))
    .mapValues((rows) => {
      const rowWithValue = rows.find(
        (row) =>
          row.parsedValues.id_ban_adresse ||
          row.additionalValues?.uid_adresse?.idBanAdresse,
      );
      if (rowWithValue) {
        return (
          rowWithValue.parsedValues.id_ban_adresse ||
          rowWithValue.additionalValues?.uid_adresse?.idBanAdresse
        );
      }
      return uuid();
    })
    .value();
}

function validateRowsEmpty(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (rows.length <= 0) {
    addError('empty');
  }
}

function remediationBanIds(
  row: ValidateRowType,
  { idBanCommune, idBanToponyme, idBanAdresse },
  {
    mapCodeCommuneBanId,
    mapNomVoieBanId,
    mapNumeroBanId,
  }: {
    mapCodeCommuneBanId: Record<string, string> | undefined;
    mapNomVoieBanId: Record<string, string>;
    mapNumeroBanId: Record<string, string>;
  },
) {
  const codeCommune = getCodeCommune(row);
  if (!idBanCommune && mapCodeCommuneBanId) {
    row.remediations.id_ban_commune = {
      errors: [
        `field.id_ban_commune.missing`,
        `id_ban_commune.valeur_manquante`,
        'rows.every_line_required_id_ban',
        'row.lack_of_id_ban',
      ],
      value: mapCodeCommuneBanId[codeCommune],
    };
  }
  if (!idBanToponyme) {
    row.remediations.id_ban_toponyme = {
      errors: [
        `field.id_ban_toponyme.missing`,
        `id_ban_toponyme.valeur_manquante`,
        'rows.every_line_required_id_ban',
        'row.lack_of_id_ban',
      ],
      value: mapNomVoieBanId[getVoieIdentifier(row)],
    };
  }
  if (!idBanAdresse && row.parsedValues.numero !== 99_999) {
    row.remediations.id_ban_adresse = {
      errors: [
        `field.id_ban_adresse.missing`,
        `id_ban_adresse.valeur_manquante`,
        'rows.every_line_required_id_ban',
        'row.lack_of_id_ban',
      ],
      value: mapNumeroBanId[getNumeroIdentifier(row)],
    };
  }
}

function getBanIdsFromRow(row: ValidateRowType) {
  return {
    idBanCommune:
      row.parsedValues.id_ban_commune ||
      row.additionalValues?.uid_adresse?.idBanCommune,
    idBanToponyme:
      row.parsedValues.id_ban_toponyme ||
      row.additionalValues?.uid_adresse?.idBanToponyme,
    idBanAdresse:
      row.parsedValues.id_ban_adresse ||
      row.additionalValues?.uid_adresse?.idBanAdresse,
  };
}

async function validateUseBanIds(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
  },
) {
  const mapNomVoieBanId = getMapNameVoieBanId(rows);
  const mapNumeroBanId = getMapNumeroBanId(rows);
  const districtIDs = new Set();
  let balAdresseUseBanId = 0;

  for (const row of rows) {
    const { idBanCommune, idBanToponyme, idBanAdresse } = getBanIdsFromRow(row);
    const numero = row.parsedValues.numero;

    if (
      idBanCommune &&
      idBanToponyme &&
      (idBanAdresse || (!idBanAdresse && numero === Number(IS_TOPO_NB)))
    ) {
      balAdresseUseBanId++;
      districtIDs.add(idBanCommune);
    } else {
      remediationBanIds(
        row,
        { idBanCommune, idBanToponyme, idBanAdresse },
        { mapCodeCommuneBanId, mapNomVoieBanId, mapNumeroBanId },
      );
    }
  }
  if (balAdresseUseBanId === rows.length) {
    // Check district IDs consistency
    if (districtIDs.size > 1) {
      addError('multi_id_ban_commune');
    }
    return true;
  } else if (balAdresseUseBanId > 0) {
    addError('every_line_required_id_ban');
  }
}

async function validateRows(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
  },
) {
  validateRowsEmpty(rows, { addError });
  await validateUseBanIds(rows, { addError, mapCodeCommuneBanId });
}

export default validateRows;
