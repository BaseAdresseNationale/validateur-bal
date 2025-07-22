import { FeatureCollection } from 'geojson';

const CADASTRE_API_URL = 'https://cadastre.data.gouv.fr/bundler';

type CadastreResponse = {
  status: 'success' | 'error';
  response: FeatureCollection;
};

async function fetchCadastre(communeINSEE: string): Promise<CadastreResponse> {
  const response = await fetch(
    `${CADASTRE_API_URL}/cadastre-etalab/communes/${communeINSEE}/geojson/parcelles`,
  );
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message);
  }

  return response.json();
}

export async function getCommuneCadastreByCommuneINSEE(
  communeINSEE: string,
): Promise<FeatureCollection> {
  try {
    const res = await fetchCadastre(communeINSEE);
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
