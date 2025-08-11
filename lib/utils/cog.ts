import { flatten, keyBy } from 'lodash';
import communes from '../../minicog.json';

export type CommuneMiniCOG = {
  code: string;
  nom: string;
  anciensCodes?: string[];
};

const communesIndex: Record<string, CommuneMiniCOG> = keyBy(communes, 'code');

const codesCommunesActuelles = new Set(Object.keys(communesIndex));

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
