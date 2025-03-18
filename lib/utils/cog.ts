import communes from '../../minicog.json';

type CommuneActuelle = {
  code: string;
  nom: string;
  anciensCodes?: string;
};

const codesCommunesActuelles = new Set<string>(
  communes.filter((c) => !c.chefLieu).map((c) => c.code),
);
const codesCommunesDeleguees = new Set<string>(
  communes.filter((c) => c.chefLieu).map((c) => c.code),
);

const anciensCodesIndex = new Map<string, string>();
for (const commune of communes as CommuneActuelle[]) {
  for (const ancienCode of commune.anciensCodes || []) {
    anciensCodesIndex.set(ancienCode, commune.code);
  }
}

export function isCommuneAncienne(codeCommune: string): boolean {
  return anciensCodesIndex.has(codeCommune);
}

export function isCommuneActuelle(codeCommune: string): boolean {
  return codesCommunesActuelles.has(codeCommune);
}

export function isCommuneDeleguee(codeCommune: string) {
  return codesCommunesDeleguees.has(codeCommune);
}

export function isCommune(codeCommune: string): boolean {
  return isCommuneActuelle(codeCommune) || isCommuneAncienne(codeCommune);
}

export function getCommuneActuelle(codeCommune: string): string {
  return anciensCodesIndex.has(codeCommune)
    ? anciensCodesIndex.get(codeCommune)
    : communes.find((c) => c.code === codeCommune && !c.chefLieu);
}
