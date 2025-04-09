import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import { getCodeCommune } from './row';
import { normalize } from '@ban-team/adresses-util/lib/voies';
import { chain } from 'lodash';
import { v4 as uuid } from 'uuid';

const BAN_API_URL =
  process.env.BAN_API_URL || 'https://plateforme.adresse.data.gouv.fr';

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

export async function getMapCodeCommuneBanId(
  parsedRows: ValidateRowType[],
): Promise<Record<string, string>> {
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

  for (const codeCommune of Array.from(codeCommunes)) {
    const res = await getCommuneBanIdByCodeCommune(codeCommune);
    if (res.status == 'success' && res.response) {
      indexCommuneBanIds[codeCommune] = res.response[0].id;
    }
  }
  return indexCommuneBanIds;
}

function getMapNameVoieBanId(
  parsedRows: ValidateRowType[],
): Record<string, string> {
  return chain(parsedRows)
    .keyBy(({ parsedValues }) => normalize(parsedValues.voie_nom))
    .map((row) => [
      row.parsedValues.voie_nom,
      row.parsedValues.id_ban_toponyme ||
        row.additionalValues?.uid_adresse?.idBanToponyme ||
        uuid(),
    ])
    .fromPairs()
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
  }: {
    mapCodeCommuneBanId: Record<string, string>;
    mapNomVoieBanId: Record<string, string>;
  },
) {
  const codeCommune = getCodeCommune(row);

  if (!idBanCommune) {
    row.remediations.id_ban_commune = mapCodeCommuneBanId[codeCommune];
  }
  if (!idBanToponyme) {
    row.remediations.id_ban_toponyme =
      mapNomVoieBanId[normalize(row.parsedValues.voie_nom)];
  }
  if (!idBanAdresse && row.parsedValues.numero !== 99_999) {
    row.remediations.id_ban_adresse = uuid();
  }
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
  const districtIDs = new Set();
  let balAdresseUseBanId = 0;

  for (const row of rows) {
    const idBanCommune =
      row.parsedValues.id_ban_commune ||
      row.additionalValues?.uid_adresse?.idBanCommune;
    const idBanToponyme =
      row.parsedValues.id_ban_toponyme ||
      row.additionalValues?.uid_adresse?.idBanToponyme;
    const idBanAdresse =
      row.parsedValues.id_ban_adresse ||
      row.additionalValues?.uid_adresse?.idBanAdresse;
    const numero = row.parsedValues.numero;

    if (
      idBanCommune &&
      idBanToponyme &&
      (idBanAdresse || (!idBanAdresse && numero === Number(IS_TOPO_NB)))
    ) {
      balAdresseUseBanId++;
      districtIDs.add(idBanCommune);
    }
    remediationBanIds(
      row,
      { idBanCommune, idBanToponyme, idBanAdresse },
      { mapCodeCommuneBanId, mapNomVoieBanId },
    );
  }
  if (balAdresseUseBanId === rows.length) {
    // Check district IDs consistency
    if (districtIDs.size > 1) {
      addError('rows.multi_id_ban_commune');
    }
    if (
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
  validateUseBanIds(rows, { addError });
}

export default validateRows;
