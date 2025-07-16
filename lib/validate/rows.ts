import bluebird from 'bluebird';
import { keyBy } from 'lodash';
import Schema from '../schema';
import { FieldsSchema } from '../schema/fields';
import { ErrorType, FieldType, ValidateRowType } from './validate.type';
import {
  ParsedValues,
  ReadValueType,
  RemediationsType,
  RemediationValue,
} from '../schema/shema.type';
import { getCommuneBanIdByCommuneINSEE } from '../utils/ban';
import { getCommuneCadastreByCommuneINSEE } from '../utils/cadastre';

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
  const indexedFields: Record<string, FieldType> = keyBy(fields, 'name');
  const mapCodeCommuneBanId: Record<string, string> = {};

  const computedRows: ValidateRowType[] = await bluebird.map(
    parsedRows,
    async (parsedRow: Record<string, string>, line: number) => {
      const computedRow: ValidateRowType = await validateRow(parsedRow, {
        indexedFields,
        line,
        mapCodeCommuneBanId,
      });
      for (const e of computedRow.errors) {
        rowsErrors.add(e.code);
      }

      return computedRow;
    },
    { concurrency: 4 },
  );

  let cadastreGeoJSON = undefined;
  if (Object.keys(mapCodeCommuneBanId).length <= 1) {
    cadastreGeoJSON = await getCommuneCadastreByCommuneINSEE(
      Object.keys(mapCodeCommuneBanId)[0],
    );
  }

  Schema.rows(computedRows, {
    addError(code: string) {
      globalErrors.add(`rows.${code}`);
    },
    mapCodeCommuneBanId,
    cadastreGeoJSON,
  });

  return computedRows;
}

export function readValue(fieldName: string, rawValue: string): ReadValueType {
  if (!(fieldName in Schema.fields)) {
    throw new Error(`Unknown field name: ${fieldName}`);
  }

  const result: ReadValueType = {
    parsedValue: undefined,
    additionalValues: undefined,
    remediation: undefined,
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
      addError(code: string) {
        result.errors.push(code);
      },
      setRemediation<T>(value: RemediationValue<T>) {
        result.remediation = value;
      },
    });
  } else {
    result.parsedValue = trimmedValue;
  }

  return result;
}

export async function validateRow(
  row: Record<string, string>,
  {
    indexedFields,
    line,
    mapCodeCommuneBanId,
  }: {
    indexedFields: Record<string, FieldType>;
    line: number;
    mapCodeCommuneBanId: Record<string, string>;
  },
): Promise<ValidateRowType> {
  const rawValues: Record<string, string> = {};
  const parsedValues: ParsedValues = {};
  const remediations: RemediationsType = {};
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

    if (result.remediation) {
      remediations[normalizedFieldName] = result.remediation;
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

  // ON RECUPERE L'UUID DISTRICT BAN
  const communeINSEE =
    parsedValues.commune_insee || additionalValues?.cle_interop?.codeCommune;
  if (!Object.keys(mapCodeCommuneBanId).includes(communeINSEE)) {
    mapCodeCommuneBanId[communeINSEE] =
      await getCommuneBanIdByCommuneINSEE(communeINSEE);
  }

  Schema.row(validateRow, {
    addError(code: string) {
      errors.push({ code: `row.${code}` });
    },
    addRemediation<T>(key: string, value: RemediationValue<T>) {
      remediations[key] = value;
    },
    mapCodeCommuneBanId,
  });

  return validateRow;
}
