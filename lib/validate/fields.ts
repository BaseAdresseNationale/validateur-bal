/* eslint no-inner-declarations: off */
import Schema from '../schema';
import { allowedRegionalLangs } from '../utils/helpers';

export type NotFoundFieldType = {
  schemaName: string;
  level?: string;
};

export type FieldType = {
  name: string;
  schemaName?: string;
  localizedSchemaName?: string;
  locale?: string;
};

export function computeFields(
  originalFields: string[],
  format: string,
  {
    relaxFieldsDetection,
    globalErrors,
  }: { relaxFieldsDetection: boolean; globalErrors: Set<string> },
): {
  fields;
  notFoundFields: NotFoundFieldType[];
} {
  const fields: FieldType[] = originalFields.map((field) => ({ name: field }));
  const foundFields = new Set<string>();
  const notFoundFields = new Set<string>();

  for (const schemaName of Object.keys(Schema.fields)) {
    // On commence par définir la fonction helper de recherche du nom de champ correspondant
    function findField(field) {
      if (!foundFields.has(schemaName)) {
        const candidate = fields.find((f) => f.name === field && !f.schemaName);
        if (candidate) {
          const exactMatch = schemaName === field;
          candidate.schemaName = schemaName;
          foundFields.add(schemaName);

          if (!exactMatch) {
            globalErrors.add(`field.${schemaName}.fuzzy`);
          }
        }
      }
    }

    // Exact match
    findField(schemaName);

    // Alias match
    if (
      relaxFieldsDetection &&
      !foundFields.has(schemaName) &&
      Schema.fields[schemaName].aliases
    ) {
      for (const alias of Schema.fields[schemaName].aliases) {
        findField(alias);
      }
    }

    // Si le champ n'est pas trouvé on créé des erreurs
    if (
      !foundFields.has(schemaName) &&
      Schema.fields[schemaName].formats.includes(format)
    ) {
      notFoundFields.add(schemaName);
      globalErrors.add(`field.${schemaName}.missing`);
    }

    // On définit la fonction helper de recherche des variantes localisées
    function findLocalizedField(locale) {
      const localizedSchemaName = `${schemaName}_${locale}`;
      if (!foundFields.has(localizedSchemaName)) {
        const candidate = fields.find(
          (f) => f.name === localizedSchemaName && !f.schemaName,
        );
        if (candidate) {
          candidate.schemaName = schemaName;
          candidate.localizedSchemaName = localizedSchemaName;
          candidate.locale = locale;
          foundFields.add(localizedSchemaName);
        }
      }
    }

    // Si le champ a été trouvé et si les variantes localisées sont autorisées, on recherche ces variantes
    if (
      foundFields.has(schemaName) &&
      Schema.fields[schemaName].allowRegionalLang
    ) {
      for (const locale of allowedRegionalLangs) {
        findLocalizedField(locale);
      }
    }
  }
  return {
    fields,
    notFoundFields: Array.from(notFoundFields).map((schemaName) => ({
      schemaName,
    })),
  };
}
