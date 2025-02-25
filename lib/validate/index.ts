import { mapValues } from 'lodash';

import profiles from '../schema/profiles/index';
import { getErrorLevel } from '../utils/helpers';
import { parseFile, ParseFileType, ValidateFile, validateFile } from './file';
import { computeFields, FieldType, NotFoundFieldType } from './fields';
import { computeRows, ValidateRowType } from './rows';
import { ValidateProfile, validateProfile } from './profiles';

type ProfilesValidationType = {
  code: string;
  name: string;
  isValid: boolean;
};

export type PrevalidateType = ParseFileType & {
  fields?: FieldType[];
  notFoundFields?: NotFoundFieldType[];
  rows?: ValidateRowType[];
  fileValidation?: ValidateFile;
  profilesValidation?: Record<string, ProfilesValidationType>;
  globalErrors?: string[];
  rowsErrors?: string[];
  uniqueErrors?: string[];
};

export async function prevalidate(
  file: Buffer,
  format: string,
  relaxFieldsDetection: boolean,
): Promise<PrevalidateType> {
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

  const fileValidation: ValidateFile = validateFile(
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
): Promise<PrevalidateType | ValidateProfile> {
  const profile = options.profile || '1.3';
  let { relaxFieldsDetection } = options;

  if (options.relaxFieldsDetection === undefined) {
    relaxFieldsDetection = profiles[profile].relax;
  }

  const { format } = profiles[profile];
  const prevalidateResult: PrevalidateType = await prevalidate(
    file,
    format,
    relaxFieldsDetection,
  );
  return validateProfile(prevalidateResult, profile);
}
