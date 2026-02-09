import { errors as Errors14, warnings as Warnings14 } from './1.4';
import { ProfileType } from './profile.type';

const additionalError = new Set([
  // BAN IDS
  'field.id_ban_commune.missing',
  'field.id_ban_toponyme.missing',
  'field.id_ban_adresse.missing',
  // NUMERO
  'numero.not_to_be_zero',
]);

const fewerError = new Set(['field.voie_nom.missing']);

const errors: string[] = [
  ...Errors14.filter((alert) => !fewerError.has(alert)),
  ...additionalError,
];

const warnings: string[] = [
  ...Warnings14.filter((alert) => !additionalError.has(alert)),
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
