import {
  errors as Errors11Strict,
  warnings as Warnings11Strict,
} from './1.1-strict';
import { ProfileType } from './profile.type';

export const errors: string[] = [
  ...Errors11Strict,
  'commune_insee.commune_invalide',
  'commune_deleguee_insee.commune_invalide',
  'cad_parcelles.valeur_invalide',
  'cad_parcelles.pipe_debut_fin',

  'field.commune_insee.missing',
  'field.commune_deleguee_insee.missing',
  'field.commune_deleguee_nom.missing',
  'field.lieudit_complement_nom.missing',
  'field.cad_parcelles.missing',
];

export const warnings: string[] = [...Warnings11Strict];

const profile: ProfileType = {
  code: '1.2-strict',
  name: 'BAL 1.2 Strict',
  isUsed: false,
  relax: false,
  errors,
  warnings,
  format: '1.2',
};

export default profile;
