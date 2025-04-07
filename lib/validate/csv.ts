import Papa from 'papaparse';
import languesRegionales from '@ban-team/shared-data/langues-regionales.json';
import { FieldType, PrevalidateType, ValidateRowType } from './validate.type';
import { ParsedValues } from '../schema/shema.type';

function getIdsBan(
  fields: FieldType[],
  parsedValues: ParsedValues,
  remediations: ParsedValues,
) {
  if (
    fields.some(({ schemaName }) => schemaName === 'id_ban_commune') ||
    fields.some(({ schemaName }) => schemaName === 'id_ban_toponyme') ||
    fields.some(({ schemaName }) => schemaName === 'id_ban_adresse')
  ) {
    return {
      id_ban_commune:
        remediations.id_ban_commune || parsedValues.id_ban_commune,
      id_ban_toponyme:
        remediations.id_ban_toponyme || parsedValues.id_ban_toponyme,
      id_ban_adresse:
        remediations.id_ban_adresse || parsedValues.id_ban_adresse,
    };
  } else if (fields.some(({ schemaName }) => schemaName === 'uid_adresse')) {
    let uid_adresse = parsedValues.uid_adresse;
    if (remediations.id_ban_commune) {
      uid_adresse = uid_adresse.concat(` @c:${remediations.id_ban_commune} `);
    }
    if (remediations.id_ban_toponyme) {
      uid_adresse = uid_adresse.concat(` @v:${remediations.id_ban_commune} `);
    }
    if (remediations.id_ban_adresse) {
      uid_adresse = uid_adresse.concat(` @a:${remediations.id_ban_commune} `);
    }
    return { uid_adresse };
  }
  return {};
}

// function getMultiLangField(parsedValues: ParsedValues, fieldName: string) {
//   return Object.fromEntries(
//     Object.entries(parsedValues).filter(([key]) =>
//       languesRegionales.some(({ code }) => key === `${fieldName}_${code}`),
//     ),
//   );
// }

function getCsvRow(
  fields: FieldType[],
  { parsedValues, remediations }: ValidateRowType,
): ParsedValues {
  return {
    ...getIdsBan(fields, parsedValues, remediations),
    cle_interop: remediations.cle_interop || parsedValues.cle_interop,
    commune_insee: remediations.commune_insee || parsedValues.commune_insee,
    commune_nom: remediations.commune_nom || parsedValues.commune_nom,
    // ...getMultiLangField(parsedValues, 'commune_nom'),
    commune_deleguee_insee:
      remediations.commune_deleguee_insee ||
      parsedValues.commune_deleguee_insee,
    commune_deleguee_nom:
      remediations.commune_deleguee_nom || parsedValues.commune_deleguee_nom,
    // ...getMultiLangField(parsedValues, 'commune_deleguee_nom'),
    voie_nom: remediations.voie_nom || parsedValues.voie_nom,
    // ...getMultiLangField(parsedValues, 'voie_nom'),
    lieudit_complement_nom:
      remediations.lieudit_complement_nom ||
      parsedValues.lieudit_complement_nom,
    // ...getMultiLangField(parsedValues, 'lieudit_complement_nom'),
    numero: remediations.numero || parsedValues.numero,
    suffixe: remediations.suffixe || parsedValues.suffixe,
    position: remediations.position || parsedValues.position,
    x: remediations.x || parsedValues.x,
    y: remediations.y || parsedValues.y,
    long: remediations.long || parsedValues.long,
    lat: remediations.lat || parsedValues.lat,
    cad_parcelles: remediations.cad_parcelles || parsedValues.cad_parcelles,
    source: remediations.source || parsedValues.source,
    date_der_maj: remediations.date_der_maj || parsedValues.date_der_maj,
    certification_commune:
      remediations.certification_commune || parsedValues.certification_commune,
  };
}

export function exportCsvBALWithReport({
  rows,
  fields,
}: PrevalidateType): Buffer {
  const csvRows: ParsedValues[] = rows.map((r) => getCsvRow(fields, r));
  const csvData = Papa.unparse(csvRows, { delimiter: ';' });
  return Buffer.from(csvData);
}
