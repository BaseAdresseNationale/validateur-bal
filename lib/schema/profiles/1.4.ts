import { errors as Errors13, warnings as Warnings13 } from './1.3';
import { ProfileType } from './profile.type';

const errors: string[] = [
  ...Errors13,
  // BAN IDS
  'id_ban_commune.type_invalide',
  'id_ban_toponyme.type_invalide',
  'id_ban_adresse.type_invalide',
  'uid_adresse.type_invalide',
  'row.lack_of_id_ban',
  'rows.multi_id_ban_commune',
  'rows.cog_no_match_id_ban_commune',
  'rows.every_line_required_id_ban',
];

const warnings: string[] = [
  ...Warnings13,
  // BAN IDS
  'field.id_ban_commune.missing',
  'field.id_ban_toponyme.missing',
  'field.id_ban_adresse.missing',
];

const infos = ['cle_interop.voie_non_renseignee'];

const profile: ProfileType = {
  code: '1.4',
  name: 'BAL 1.4 (defaut)',
  isUsed: true,
  relax: false,
  errors,
  warnings,
  infos,
  format: '1.4',
};

export default profile;
