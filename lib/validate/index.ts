import { mapValues } from 'lodash';

import profiles from '../schema/profiles/index';
import { getErrorLevel } from '../utils/helpers';
import { parseFile, validateFile } from './file';
import { computeFields } from './fields';
import { computeRows } from './rows';
import { validateProfile } from './profiles';
import {
  FieldType,
  NotFoundFieldType,
  ParseFileType,
  PrevalidateType,
  ProfilesValidationType,
  ValidateFileType,
  ValidateProfileType,
  ValidateRowType,
} from './validate.type';

export async function prevalidate(
  file: Buffer,
  format: string,
  relaxFieldsDetection: boolean,
): Promise<ParseFileType | PrevalidateType> {
  const globalErrors = new Set<string>();
  const rowsErrors = new Set<string>();

  // On parse le fichier avec Papaparse
  const {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    parsedRows,
  }: ParseFileType = await parseFile(file, relaxFieldsDetection);

  if (!parseOk) {
    return {
      encoding,
      linebreak,
      delimiter,
      originalFields,
      parseOk,
      parseErrors,
      parsedRows,
    };
  }

  // On detecte les champ normaux, alias et lang
  const {
    fields,
    notFoundFields,
  }: { fields: FieldType[]; notFoundFields: NotFoundFieldType[] } =
    computeFields(originalFields, format, {
      globalErrors,
    });

  const rows: ValidateRowType[] = await computeRows(parsedRows, {
    fields,
    rowsErrors,
    globalErrors,
  });

  const fileValidation: ValidateFileType = validateFile(
    { linebreak, encoding, delimiter },
    { globalErrors },
  );

  const uniqueErrors = new Set([...globalErrors, ...rowsErrors]);

  const profilesValidation: Record<string, ProfilesValidationType> = mapValues(
    profiles,
    (profile) => {
      const { code, name } = profile;
      const isValid = ![...uniqueErrors].some(
        (e) => getErrorLevel(profile.code, e) === 'E',
      );
      return { code, name, isValid };
    },
  );

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    fields,
    notFoundFields: [...notFoundFields],
    rows,
    fileValidation,
    profilesValidation,
    globalErrors: [...globalErrors],
    rowsErrors: [...rowsErrors],
    uniqueErrors: [...uniqueErrors],
  };
}

export async function validate(
  file: Buffer,
  options: { profile?: string; relaxFieldsDetection?: boolean } = {},
): Promise<ParseFileType | PrevalidateType | ValidateProfileType> {
  const profile = options.profile || '1.3';
  let { relaxFieldsDetection } = options;

  if (options.relaxFieldsDetection === undefined) {
    relaxFieldsDetection = profiles[profile].relax;
  }

  const { format } = profiles[profile];
  const prevalidateResult: PrevalidateType | ParseFileType = await prevalidate(
    file,
    format,
    relaxFieldsDetection,
  );
  return validateProfile(prevalidateResult as PrevalidateType, profile);
}
