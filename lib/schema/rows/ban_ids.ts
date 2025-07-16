import { IS_TOPO_NB, ValidateRowType } from '../../validate/validate.type';
import { chain } from 'lodash';
import { v4 as uuid } from 'uuid';
import {
  getCodeCommune,
  getNumeroIdentifier,
  getVoieIdentifier,
} from '../../utils/helpers';

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

function getErrorIdBanCorrected(field: string): string[] {
  return [
    `field.${field}.missing`,
    `id_ban_${field}.valeur_manquante`,
    'row.lack_of_id_ban',
    'rows.every_line_required_id_ban',
  ];
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
      errors: getErrorIdBanCorrected('id_ban_commune'),
      value: mapCodeCommuneBanId[codeCommune],
    };
  }
  if (!idBanToponyme) {
    row.remediations.id_ban_toponyme = {
      errors: getErrorIdBanCorrected('id_ban_toponyme'),
      value: mapNomVoieBanId[getVoieIdentifier(row)],
    };
  }
  if (!idBanAdresse && row.parsedValues.numero !== 99_999) {
    row.remediations.id_ban_adresse = {
      errors: getErrorIdBanCorrected('id_ban_adresse'),
      value: mapNumeroBanId[getNumeroIdentifier(row)],
    };
  }
}

function getIdBanCommune(row: ValidateRowType): string {
  return (
    row.parsedValues.id_ban_commune ||
    row.additionalValues?.uid_adresse?.idBanCommune
  );
}

function getIdBanToponyme(row: ValidateRowType): string {
  return (
    row.parsedValues.id_ban_toponyme ||
    row.additionalValues?.uid_adresse?.idBanToponyme
  );
}

function getIdBanAdresse(row: ValidateRowType): string {
  return (
    row.parsedValues.id_ban_adresse ||
    row.additionalValues?.uid_adresse?.idBanAdresse
  );
}

function getBanIdsFromRow(row: ValidateRowType) {
  return {
    idBanCommune: getIdBanCommune(row),
    idBanToponyme: getIdBanToponyme(row),
    idBanAdresse: getIdBanAdresse(row),
  };
}

export function validateUseBanIds(
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

    // On verifie que l'idBanCommune correspond bien a celui délivré par l'api BAN
    const communeInsee = getCodeCommune(row);
    if (
      idBanCommune &&
      mapCodeCommuneBanId[communeInsee] &&
      mapCodeCommuneBanId[communeInsee] !== idBanCommune
    ) {
      row.errors?.push({
        code: 'row.cog_no_match_id_ban_commune',
      });
    }

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

export function validateVoieBanIds(rows: ValidateRowType[]) {
  // On regarde si les voie_nom sont les mêmes lorsque les id_ban_toponyme sont identique
  const rowsByIdBanToponymes = chain(rows)
    .groupBy((row) => getIdBanToponyme(row))
    .value();

  for (const toponyme of Object.keys(rowsByIdBanToponymes)) {
    const rowsByIdBanToponyme = rowsByIdBanToponymes[toponyme];
    // Vérifier que toutes les lignes avec le même id_ban_toponyme ont le même voie_nom
    const voieNoms = new Set(
      rowsByIdBanToponyme.map((row) => row.parsedValues.voie_nom),
    );
    if (voieNoms.size > 1) {
      for (const row of rowsByIdBanToponyme) {
        row.errors?.push({
          code: 'row.different_voie_nom_with_same_id_ban_toponyme',
        });
      }
    }
  }
  // On regarde si les id_ban_toponyme sont les mêmes lorsque les voie_nom et commune_deleguee_insee sont identique
  const rowsByVoies = chain(rows)
    .groupBy((row) => getVoieIdentifier(row))
    .value();
  for (const voieId of Object.keys(rowsByVoies)) {
    const rowsByVoie = rowsByVoies[voieId];
    // Vérifier que toutes les lignes avec le même id_ban_toponyme ont le même voie_nom
    const idBanToponymes = new Set(
      rowsByVoie.map((row) => row.parsedValues.voie_nom),
    );
    if (idBanToponymes.size > 1) {
      for (const row of rowsByVoies) {
        row.errors?.push({
          code: 'row.different_id_ban_toponyme_with_same_voie_nom',
        });
      }
    }
  }
}
