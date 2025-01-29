import { mapValues } from "lodash";

import profiles from "../schema/profiles/index";
import { getErrorLevel } from "../utils/helpers";
import { parseFile, ParseFileType, ValidateFile, validateFile } from "./file";
import { computeFields, FieldType } from "./fields";
import { computeRows, ValidateRowType } from "./rows";

type ProfilesValidationType = {
  code: string;
  name: string;
  isValid: boolean;
};

type PrevalidateType = ParseFileType & {
  fields?: FieldType[];
  notFoundFields?: string[];
  rows?: ValidateRowType[];
  fileValidation?: ValidateFile;
  profilesValidation?: ProfilesValidationType[];
  globalErrors?: string[];
  rowsErrors?: string[];
  uniqueErrors?: string[];
};

export async function prevalidate(
  file: Buffer,
  format: string,
  relaxFieldsDetection: boolean
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
  }: { fields: FieldType[]; notFoundFields: Set<string> } = computeFields(
    originalFields,
    format,
    {
      globalErrors,
      relaxFieldsDetection,
    }
  );

  const rows: ValidateRowType[] = await computeRows(parsedRows, {
    fields,
    rowsErrors,
    globalErrors,
  });

  const fileValidation: ValidateFile = validateFile(
    { linebreak, encoding, delimiter },
    { globalErrors }
  );

  const uniqueErrors = new Set([...globalErrors, ...rowsErrors]);

  const profilesValidation: ProfilesValidationType[] = mapValues(
    profiles,
    (profile) => {
      const { code, name } = profile;
      const isValid = ![...uniqueErrors].some(
        (e) => getErrorLevel(profile.code, e) === "E"
      );
      return { code, name, isValid };
    }
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

function validateProfileRows(computedRows, profileName) {
  return computedRows.map((row) => {
    const errors = row.errors.map((e) => ({
      ...e,
      level: getErrorLevel(profileName, e.code),
    }));

    const isValid = !errors.some((e) => e.level === "E");

    return {
      ...row,
      errors,
      isValid,
    };
  });
}

function validateProfileUniqueErrors(uniqueErrors, profileName) {
  return uniqueErrors.map((code) => ({
    code,
    level: getErrorLevel(profileName, code),
  }));
}

function validateProfileNotFoundFields(notFoundFields, profileName) {
  return notFoundFields.map((f) => ({
    ...f,
    level: getErrorLevel(profileName, `field.${f.schemaName}.missing`),
  }));
}

export function validateProfile(prevalidateResult, profileName) {
  if (!prevalidateResult.parseOk) {
    return prevalidateResult;
  }

  const rows = validateProfileRows(prevalidateResult.rows, profileName);
  const profilErrors = validateProfileUniqueErrors(
    prevalidateResult.uniqueErrors,
    profileName
  );
  const notFoundFields = validateProfileNotFoundFields(
    prevalidateResult.notFoundFields,
    profileName
  );
  return {
    ...prevalidateResult,
    rows,
    notFoundFields,
    profilErrors,
  };
}

export async function validate(
  file: Buffer,
  options: { profile?: string; relaxFieldsDetection?: boolean } = {}
) {
  const profile = options.profile || "1.3";
  let { relaxFieldsDetection } = options;

  if (options.relaxFieldsDetection === undefined) {
    relaxFieldsDetection = profiles[profile].relax;
  }

  const { format } = profiles[profile];
  const prevalidateResult = await prevalidate(
    file,
    format,
    relaxFieldsDetection
  );
  return validateProfile(prevalidateResult, profile);
}
