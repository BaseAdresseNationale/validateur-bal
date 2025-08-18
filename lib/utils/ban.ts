import { ValidateRowType } from '../validate/validate.type';
import { getCodeCommune } from './helpers';

const BAN_API_URL = 'https://plateforme.adresse.data.gouv.fr';

type DistrictBanResponse = {
  status: 'success' | 'error';
  response: { id: string }[];
};

async function fetchDistrictBan(
  communeINSEE: string,
): Promise<DistrictBanResponse> {
  const response = await fetch(
    `${BAN_API_URL}/api/district/cog/${communeINSEE}`,
  );
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message);
  }

  return response.json();
}

async function getCommuneBanIdByCommuneINSEE(
  communeINSEE: string,
): Promise<string> {
  try {
    const res = await fetchDistrictBan(communeINSEE);
    if (res.status === 'success' && res.response) {
      return res.response[0].id;
    }
    return undefined;
  } catch {
    console.error(
      `Impossible de récupèrer le cadastre pour la commune ${communeINSEE}`,
    );
    return undefined;
  }
}

export async function getMapCodeCommuneBanId(
  parsedRows: ValidateRowType[],
): Promise<Record<string, string>> | undefined {
  const indexCommuneBanIds: Record<string, string> = {};

  const codeCommunes = new Set<string>([
    ...parsedRows
      .filter((row) => getCodeCommune(row))
      .map((row) => getCodeCommune(row)),
  ]);
  for (const codeCommune of Array.from(codeCommunes)) {
    const communeBanId = await getCommuneBanIdByCommuneINSEE(codeCommune);
    if (communeBanId) {
      indexCommuneBanIds[codeCommune] = communeBanId;
    }
  }
  return indexCommuneBanIds;
}
