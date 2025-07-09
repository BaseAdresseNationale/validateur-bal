import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import { getCodeCommune } from './row';
import { normalize } from '@ban-team/adresses-util/lib/voies';
import { chain } from 'lodash';
import { v4 as uuid } from 'uuid';

const BAN_API_URL = 'https://plateforme.adresse.data.gouv.fr';

type DistrictBanResponse = {
  status: 'success' | 'error';
  response: { id: string }[];
};

export async function getCommuneBanIdByCodeCommune(
  codeCommune: string,
): Promise<DistrictBanResponse> {
  const response = await fetch(
    `${BAN_API_URL}/api/district/cog/${codeCommune}`,
  );
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message);
  }

  return response.json();
}

export function getVoieIdentifier({ parsedValues }: ValidateRowType) {
  return `${normalize(parsedValues.voie_nom)}#${parsedValues.commune_deleguee_insee}`;
}

export function getNumeroIdentifier({ parsedValues }: ValidateRowType) {
  return `${parsedValues.numero}#${parsedValues.suffixe}#${parsedValues.commune_deleguee_insee}#${parsedValues.voie_nom}`;
}

export async function getMapCodeCommuneBanId(
  parsedRows: ValidateRowType[],
): Promise<Record<string, string>> | undefined {
  const indexCommuneBanIds: Record<string, string> = {};

  const codeCommunes = new Set<string>([
    ...parsedRows
      .filter(
        ({ parsedValues, additionalValues }) =>
          parsedValues.commune_insee ||
          additionalValues?.cle_interop?.codeCommune,
      )
      .map(
        ({ parsedValues, additionalValues }) =>
          parsedValues.commune_insee ||
          additionalValues?.cle_interop?.codeCommune,
      ),
  ]);
  try {
    for (const codeCommune of Array.from(codeCommunes)) {
      const res = await getCommuneBanIdByCodeCommune(codeCommune);
      if (res.status == 'success' && res.response) {
        indexCommuneBanIds[codeCommune] = res.response[0].id;
      }
    }
  } catch {
    console.error(
      `Impossible de récupèrer id_ban_commune pour les communes suivantes : ${Array.from(codeCommunes).join(', ')}`,
    );
    return undefined;
  }
  return indexCommuneBanIds;
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
    addError('rows.empty');
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
  }: {
    addError: (code: string) => void;
  },
) {
  const mapCodeCommuneBanId = await getMapCodeCommuneBanId(rows);
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
      addError('rows.multi_id_ban_commune');
    }
    if (
      mapCodeCommuneBanId &&
      !Array.from(districtIDs).every((districtID: string) =>
        Object.values(mapCodeCommuneBanId).includes(districtID),
      )
    ) {
      addError('rows.cog_no_match_id_ban_commune');
    }
    return true;
  } else if (balAdresseUseBanId > 0) {
    addError('rows.every_line_required_id_ban');
  }
}

async function validateRows(
  rows: ValidateRowType[],
  {
    addError,
  }: {
    addError: (code: string) => void;
  },
) {
  validateRowsEmpty(rows, { addError });
  await validateUseBanIds(rows, { addError });
}

export default validateRows;
