const BAN_API_URL = 'https://plateforme.adresse.data.gouv.fr';

export type FantoirVoie = {
  type: string;
  codeTypeVoie: string;
  typeVoie: string;
  codeRivoli: string;
  cleRivoli: string;
  libelleVoie: string;
  voiePrivee: boolean;
  codeMajic: string;
  motDirecteur: string;
  dateAjout: string;
  id: string;
  codeNatureVoie: string;
  natureVoie: string;
  libelleVoieComplet: string;
};

export async function getFantoirVoiesByCommuneINSEE(
  communeINSEE: string,
): Promise<FantoirVoie[]> {
  try {
    const response = await fetch(
      `${BAN_API_URL}/api-fantoir/communes/${communeINSEE}/voies`,
    );
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.message);
    }

    return response.json();
  } catch {
    console.error(
      `Impossible de récupèrer le cadastre pour la commune ${communeINSEE}`,
    );
    return undefined;
  }
}
