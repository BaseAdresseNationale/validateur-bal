import communes from '../../minicog.json';

type CommuneActuelle = {
  code: string;
  nom: string;
  anciensCodes?: string;
};

const communeSet = new Set<string>(communes.map(({ code }) => code));

const communeAncienneMap = new Map<string, string>();
const communeChefLieuSet = new Set<string>();
for (const commune of communes as CommuneActuelle[]) {
  if (commune.anciensCodes) {
    for (const ancienCode of commune.anciensCodes || []) {
      communeAncienneMap.set(ancienCode, commune.code);
    }
    communeChefLieuSet.add(commune.code);
  }
}

export function isCommuneAncienne(codeCommune: string) {
  return communeAncienneMap.has(codeCommune);
}

export function isCommune(codeCommune: string): boolean {
  return communeSet.has(codeCommune);
}

export function isCommuneDeleguee(codeCommune: string): boolean {
  return (
    communeAncienneMap.has(codeCommune) || communeChefLieuSet.has(codeCommune)
  );
}

export function getCommuneActuelle(codeCommune: string): string {
  return communeAncienneMap.has(codeCommune)
    ? communeAncienneMap.get(codeCommune)
    : codeCommune;
}
