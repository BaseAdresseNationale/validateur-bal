import { errors as Errors14, warnings as Warnings14 } from './1.4';
import { ProfileType } from './profile.type';

const additionalError = new Set([
  // BAN IDS
  'field.id_ban_commune.missing',
  'field.id_ban_toponyme.missing',
  'field.id_ban_adresse.missing',
  // NUMERO
  'numero.not_to_be_zero',
  //TOPONYME
  'field.toponyme.missing',
  'toponyme.valeur_manquante',
  'toponyme.trop_court',
  'toponyme.trop_long',
  'toponyme.caractere_invalide',
]);

const fewerError = new Set(['field.voie_nom.missing']);

const errors: string[] = [
  ...Errors14.filter((alert) => !fewerError.has(alert)),
  ...additionalError,
];

const warnings: string[] = [
  ...Warnings14.filter((alert) => !additionalError.has(alert)),
  'toponyme.casse_incorrecte',
  'toponyme.contient_tiret_bas',
  'toponyme_@@.casse_incorrecte',
  'toponyme_@@.contient_tiret_bas',
  'toponyme_@@.trop_court',
  'toponyme_@@.trop_long',
  'toponyme_@@.caractere_invalide',
];

const infos = [];

const profile: ProfileType = {
  code: '1.5',
  name: 'BAL 1.5 (beta)',
  isUsed: true,
  relax: false,
  errors,
  warnings,
  infos,
  format: '1.5',
};

export default profile;