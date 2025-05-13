import Papa from 'papaparse';
import { pick } from 'lodash';
import languesRegionales from '@ban-team/shared-data/langues-regionales.json';
import { FieldType, PrevalidateType, ValidateRowType } from './validate.type';
import { ParsedValues, RemediationsType } from '../schema/shema.type';

const langs = languesRegionales.map(({ code }) => code);

function getIdsBan(
  parsedValues: ParsedValues,
  remediations: RemediationsType,
  additionalValues: Record<string, any>,
) {
  const idBanCommune =
    remediations.id_ban_commune?.value ||
    parsedValues.id_ban_commune ||
    additionalValues?.uid_adresse?.idBanToponyme;
  const idBanToponyme =
    remediations.id_ban_toponyme?.value ||
    parsedValues.id_ban_toponyme ||
    additionalValues?.uid_adresse?.idBanToponyme;
  const idBanAdresse =
    remediations.id_ban_adresse?.value ||
    parsedValues.id_ban_adresse ||
    additionalValues?.uid_adresse?.idBanToponyme;
  return {
    id_ban_commune: idBanCommune,
    id_ban_toponyme: idBanToponyme,
    id_ban_adresse: idBanAdresse,
  };
}

function getMultiLangField(
  fields: FieldType[],
  parsedValues: ParsedValues,
  fieldName: string,
) {
  const fieldMultiLang = fields
    .filter(
      ({ schemaName, locale }) =>
        schemaName === fieldName && langs.includes(locale),
    )
    .map(({ localizedSchemaName }) => localizedSchemaName);

  return pick(parsedValues, fieldMultiLang);
}

function getCsvRow(
  fields: FieldType[],
  { parsedValues, remediations, additionalValues }: ValidateRowType,
): ParsedValues {
  return {
    ...getIdsBan(parsedValues, remediations, additionalValues),
    cle_interop: parsedValues.cle_interop,
    commune_insee:
      remediations.commune_insee?.value || parsedValues.commune_insee,
    commune_nom: remediations.commune_nom?.value || parsedValues.commune_nom,
    ...getMultiLangField(fields, parsedValues, 'commune_nom'),
    commune_deleguee_insee: parsedValues.commune_deleguee_insee,
    commune_deleguee_nom: parsedValues.commune_deleguee_nom,
    ...getMultiLangField(fields, parsedValues, 'commune_deleguee_nom'),
    voie_nom: parsedValues.voie_nom,
    ...getMultiLangField(fields, parsedValues, 'voie_nom'),
    lieudit_complement_nom: parsedValues.lieudit_complement_nom,
    ...getMultiLangField(fields, parsedValues, 'lieudit_complement_nom'),
    numero: parsedValues.numero,
    suffixe: parsedValues.suffixe,
    position: parsedValues.position,
    x: parsedValues.x,
    y: parsedValues.y,
    long: parsedValues.long,
    lat: parsedValues.lat,
    cad_parcelles: parsedValues.cad_parcelles,
    source: parsedValues.source,
    date_der_maj: remediations.date_der_maj?.value || parsedValues.date_der_maj,
    certification_commune: parsedValues.certification_commune,
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
