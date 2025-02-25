import { Profile } from './profile.interface';
import {
  errors as Errors13Relax,
  warnings as Warnings13Relax,
} from './1.3-relax';

const errors: string[] = [...Errors13Relax];

const warnings: string[] = [
  ...Warnings13Relax,
  // BAN IDS
  'field.id_ban_commune.missing',
  'field.id_ban_toponyme.missing',
  'field.id_ban_adresse.missing',
  'id_ban_commune.type_invalide',
  'id_ban_toponyme.type_invalide',
  'id_ban_adresse.type_invalide',
  'row.incoherence_ids_ban',
  'row.id_ban_adresses_required',
  'rows.ids_required_every',
  'uid_adresse.type_invalide',
  'uid_adresse.incoherence_ids_ban',
];

const infos = ['cle_interop.voie_non_renseignee'];

const profile: Profile = {
  code: '1.4-relax',
  name: 'BAL 1.4 Relax (defaut)',
  isUsed: false,
  relax: true,
  errors,
  warnings,
  infos,
  format: '1.4',
};

export default profile;
