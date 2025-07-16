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

export async function getCommuneBanIdByCommuneINSEE(
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
      `Impossible de récupèrer id_ban_commune pour les communes suivantes : ${communeINSEE}`,
    );
    return undefined;
  }
}
