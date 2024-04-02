const schema = require("../schema");

const { getNormalizedEnumValue } = schema;

async function readValue(fieldName, rawValue) {
  if (!(fieldName in schema.fields)) {
    throw new Error(`Unknown field name: ${fieldName}`);
  }

  const result = {
    parsedValue: undefined,
    additionalValues: undefined,
    errors: [],
  };

  const def = schema.fields[fieldName];

  const trimmedValue = def.trim ? rawValue.trim() : rawValue;

  if (def.trim && trimmedValue !== rawValue) {
    result.errors.push("espaces_debut_fin");
  }

  if (def.required && !trimmedValue) {
    result.errors.push("valeur_manquante");
  } else if (!trimmedValue) {
    // Ne rien faire
  } else if (def.parse) {
    result.parsedValue = await def.parse(trimmedValue, {
      setAdditionnalValues(values) {
        result.additionalValues = values;
      },
      addError(code) {
        result.errors.push(code);
      },
    });
  } else if (def.enum) {
    const normalizedValue = getNormalizedEnumValue(trimmedValue);
    if (def.enumFuzzyMap.has(normalizedValue)) {
      const schemaValue = def.enumFuzzyMap.get(normalizedValue);
      if (schemaValue !== trimmedValue.normalize()) {
        result.errors.push("enum_fuzzy");
      }

      result.parsedValue = schemaValue;
    } else {
      result.errors.push("valeur_invalide");
    }
  } else {
    result.parsedValue = trimmedValue;
  }

  return result;
}

async function validateRow(row, { line, indexedFields }) {
  const rawValues = {};
  const parsedValues = {};
  const additionalValues = {};
  const localizedValues = {};
  const errors = [];

  await Promise.all(
    Object.keys(row).map(async (fieldName) => {
      const rawValue = row[fieldName];
      const field = indexedFields[fieldName];
      const normalizedFieldName =
        field.localizedSchemaName || field.schemaName || fieldName;

      rawValues[normalizedFieldName] = rawValue;

      if (!field.schemaName) {
        return;
      }

      const result = await readValue(field.schemaName, rawValue);

      for (const error of result.errors) {
        errors.push({
          code: `${normalizedFieldName}.${error}`,
          schemaName: fieldName,
        });
      }

      if (result.additionalValues) {
        additionalValues[normalizedFieldName] = result.additionalValues;
      }

      if (result.parsedValue !== undefined) {
        parsedValues[normalizedFieldName] = result.parsedValue;

        if (field.locale) {
          if (!localizedValues[field.schemaName]) {
            localizedValues[field.schemaName] = {};
          }

          localizedValues[field.schemaName][field.locale] = result.parsedValue;
        }
      }
    }),
  );

  schema.row(
    { rawValues, parsedValues, additionalValues, localizedValues },
    {
      addError(code) {
        errors.push({ code: `row.${code}` });
      },
    },
  );

  return {
    rawValues,
    parsedValues,
    additionalValues,
    localizedValues,
    errors,
    line,
  };
}

module.exports = { validateRow, readValue };
