import { flatten } from 'lodash';
import communes from '../../minicog.json';

export type CommuneMiniCOG = {
  code: string;
  nom: string;
  chefLieu?: string;
  anciensCodes?: string[];
};

const communesIndex: Record<string, CommuneMiniCOG> = communes.reduce(
  (acc, commune) => {
    if (!acc[commune.code] || commune.anciensCodes?.length > 0) {
      acc[commune.code] = commune;
    }

    return acc;
  },
  {} as Record<string, CommuneMiniCOG>,
);

const codesCommunesActuelles = new Set(
  communes.filter((c) => !c.chefLieu).map((c) => c.code),
);

const codesCommunesAnciennes = new Set(
  flatten(communes.map((c) => c.anciensCodes || [])),
);

export function isCommuneActuelle(codeCommune: string): boolean {
  return codesCommunesActuelles.has(codeCommune);
}

export function isCommuneAncienne(codeCommune: string): boolean {
  return codesCommunesAnciennes.has(codeCommune);
}

export function getCommune(codeCommune: string): CommuneMiniCOG {
  return communesIndex[codeCommune];
}
