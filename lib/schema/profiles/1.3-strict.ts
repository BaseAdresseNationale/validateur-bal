import {
  errors as Errors12Strict,
  warnings as Warnings12Strict,
} from './1.2-strict';
import { ProfileType } from './profile.type';

export const errors: string[] = [
  ...Errors12Strict,
  'certification_commune.valeur_invalide',

  'field.certification_commune.missing',
];

export const warnings: string[] = [...Warnings12Strict];

const profile: ProfileType = {
  code: '1.3-strict',
  name: 'BAL 1.3 Strict',
  isUsed: false,
  relax: false,
  errors,
  warnings,
  format: '1.3',
};

export default profile;
