/* eslint no-inner-declarations: off */
const schema = require("../schema");

function getSchemaVersion(schemaName) {
  return schema.fields[schemaName].version || "1.1";
}

function computeFields(
  originalFields,
  format,
  { relaxFieldsDetection, globalErrors },
) {
  const fields = originalFields.map((field) => ({ name: field }));
  const foundFields = new Set();
  const notFoundFields = new Set();

  for (const schemaName of Object.keys(schema.fields)) {
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
      schema.fields[schemaName].aliases
    ) {
      for (const alias of schema.fields[schemaName].aliases) {
        findField(alias);
      }
    }

    // Si le champ n'est pas trouvé on créé des erreurs
    if (
      !foundFields.has(schemaName) &&
      schema.fields[schemaName].formats.includes(format)
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
          candidate.version = getSchemaVersion(schemaName);
          foundFields.add(localizedSchemaName);
        }
      }
    }

    // Si le champ a été trouvé et si les variantes localisées sont autorisées, on recherche ces variantes
    if (foundFields.has(schemaName) && schema.fields[schemaName].allowLocales) {
      for (const locale of schema.allowedLocales) {
        findLocalizedField(locale);
      }
    }
  }

  return {
    fields,

    notFoundFields: [...notFoundFields].map((schemaName) => {
      const schemaVersion = getSchemaVersion(schemaName);
      return { schemaName, schemaVersion };
    }),
  };
}

module.exports = { computeFields };
