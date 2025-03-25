import bluebird from 'bluebird';
import { keyBy } from 'lodash';
import Schema from '../schema';
import { FieldsSchema } from '../schema/fields';
import { ErrorType, FieldType, ValidateRowType } from './validate.type';
import { ParsedValues, ParsedValue, ReadValueType } from '../schema/shema.type';

const BAN_API_URL =
  process.env.BAN_API_URL || 'https://plateforme.adresse.data.gouv.fr';

export async function getCommuneBanIdByCodeCommune(
  codeCommune: string,
): Promise<{ id: string }[]> {
  const response = await fetch(
    `${BAN_API_URL}/api/district/cog/${codeCommune}`,
  );
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message);
  }

  return response.json();
}

export async function getCommuneBanIds(
  parsedRows: Record<string, string>[],
): Promise<Record<string, string>> {
  const codeCommunes = new Set<string>();
  const indexCommuneBanIds: Record<string, string> = {};

  for (const r of parsedRows) {
    if (r.commune_insee) {
      codeCommunes.add(r.commune_insee);
    } else if (r.cle_interop) {
      const [codeCommune] = r.cle_interop.split('_');
      codeCommunes.add(codeCommune);
    }
  }
  for (const codeCommune of Array.from(codeCommunes)) {
    const [{ id: communeBanId }] =
      await getCommuneBanIdByCodeCommune(codeCommune);

    indexCommuneBanIds[codeCommune] = communeBanId;
  }
  return indexCommuneBanIds;
}

export async function computeRows(
  parsedRows: Record<string, string>[],
  {
    fields,
    rowsErrors,
    globalErrors,
  }: {
    fields: FieldType[];
    rowsErrors: Set<string>;
    globalErrors: Set<string>;
  },
): Promise<ValidateRowType[]> {
  const indexCommuneBanIds = await getCommuneBanIds(parsedRows);
  const indexedFields: Record<string, FieldType> = keyBy(fields, 'name');
  const computedRows: ValidateRowType[] = await bluebird.map(
    parsedRows,
    async (parsedRow: Record<string, string>, line: number) => {
      const computedRow: ValidateRowType = validateRow(parsedRow, {
        indexedFields,
        indexCommuneBanIds,
        line,
      });
      for (const e of computedRow.errors) {
        rowsErrors.add(e.code);
      }

      return computedRow;
    },
    { concurrency: 4 },
  );

  Schema.rows(
    computedRows,
    {
      addError(code: string) {
        globalErrors.add(code);
      },
    },
    { communeBanIds: Object.values(indexCommuneBanIds) },
  );

  return computedRows;
}

export function readValue(fieldName: string, rawValue: string): ReadValueType {
  if (!(fieldName in Schema.fields)) {
    throw new Error(`Unknown field name: ${fieldName}`);
  }

  const result: ReadValueType = {
    parsedValue: undefined,
    additionalValues: undefined,
    errors: [],
  };

  const fieldSchema: FieldsSchema = Schema.fields[fieldName];

  const trimmedValue = fieldSchema.trim ? rawValue.trim() : rawValue;

  if (fieldSchema.trim && trimmedValue !== rawValue) {
    result.errors.push('espaces_debut_fin');
  }

  if (fieldSchema.required && !trimmedValue) {
    result.errors.push('valeur_manquante');
  } else if (!trimmedValue) {
    // Ne rien faire
  } else if (fieldSchema.parse) {
    result.parsedValue = fieldSchema.parse(trimmedValue, {
      setAdditionnalValues(values) {
        result.additionalValues = values;
      },
      addError(code) {
        result.errors.push(code);
      },
    });
  } else {
    result.parsedValue = trimmedValue;
  }

  return result;
}

export function validateRow(
  row: Record<string, string>,
  {
    indexedFields,
    indexCommuneBanIds,
    line,
  }: {
    indexedFields: Record<string, FieldType>;
    indexCommuneBanIds: Record<string, string>;
    line: number;
  },
): ValidateRowType {
  const rawValues: Record<string, string> = {};
  const parsedValues: ParsedValues = {};
  const remediations: ParsedValues = {};
  const additionalValues: Record<string, any> = {};
  const localizedValues: Record<string, any> = {};
  const errors: ErrorType[] = [];

  Object.keys(row).forEach((fieldName: string) => {
    const rawValue: string = row[fieldName];
    const field: FieldType = indexedFields[fieldName];
    const normalizedFieldName: string =
      field.localizedSchemaName || field.schemaName || fieldName;

    rawValues[normalizedFieldName] = rawValue;

    if (!field.schemaName) {
      return;
    }

    const result: ReadValueType = readValue(field.schemaName, rawValue);

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
  });

  const validateRow: ValidateRowType = {
    rawValues,
    parsedValues,
    remediations,
    additionalValues,
    localizedValues,
    errors,
    line,
  };

  Schema.row(
    validateRow,
    {
      addError(code: string) {
        errors.push({ code: `row.${code}` });
      },
      addRemeditation(field: string, value: ParsedValue) {
        remediations[field] = value;
      },
    },
    {
      indexCommuneBanIds,
    },
  );

  return validateRow;
}
