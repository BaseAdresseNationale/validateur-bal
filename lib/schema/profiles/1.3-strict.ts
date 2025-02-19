import { Profile } from './profile.interface';
import {
  errors as Errors12Strict,
  warnings as Warnings12Strict,
} from './1.2-strict';

export const errors: string[] = [
  ...Errors12Strict,
  'certification_commune.valeur_invalide',

  'field.certification_commune.missing',
];

export const warnings: string[] = [...Warnings12Strict];

const profile: Profile = {
  code: '1.3-strict',
  name: 'BAL 1.3 Strict',
  isUsed: false,
  relax: false,
  errors,
  warnings,
  format: '1.3',
};

export default profile;
