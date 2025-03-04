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
  'row.incoherence_id_ban',
  'row.adresses_required_id_ban',
  'rows.every_line_required_id_ban',
  'uid_adresse.type_invalide',
  'uid_adresse.incoherence_id_ban',
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
