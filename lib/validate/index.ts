const bluebird = require("bluebird");
const { keyBy, mapValues, uniq } = require("lodash");
const { getErrorLevel } = require("../utils/helpers");
const { computeFields } = require("./fields");
const { validateRow } = require("./row");

import profiles from "../schema/profiles/index";
import { parseFile, ParseFileType, validateFile } from "./file";

async function computeRows(parsedRows, { fields, rowsErrors }) {
  const indexedFields = keyBy(fields, "name");
  const computedRows = await bluebird.map(
    parsedRows,
    async (parsedRow, line) => {
      const computedRow = await validateRow(parsedRow, {
        indexedFields,
        line: line + 1,
      });
      for (const e of computedRow.errors) {
        rowsErrors.add(e.code);
      }

      return computedRow;
    },
    { concurrency: 4 }
  );

  return { rows: computedRows };
}

function checkUseBanIdsEveryRow(parsedRows, { globalErrors }) {
  if (parsedRows.length > 0) {
    const useBanIds = "id_ban_commune" in parsedRows[0];
    for (const row of parsedRows) {
      if (
        (useBanIds && row.id_ban_commune === "") ||
        (!useBanIds &&
          row.id_ban_commune !== undefined &&
          row.id_ban_commune !== "")
      ) {
        globalErrors.add("rows.ids_required_every");
        return;
      }
    }
  }
}

function validateRows(parsedRows, { globalErrors }) {
  if (parsedRows.length <= 0) {
    globalErrors.add("rows.empty");
  }

  checkUseBanIdsEveryRow(parsedRows, { globalErrors });
}

export async function prevalidate(
  file: Buffer,
  format: string,
  relaxFieldsDetection: boolean
): Promise<ParseFileType> {
  const globalErrors = new Set<string>();
  const rowsErrors = new Set<string>();

  const {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    parsedRows,
  } = await parseFile(file, relaxFieldsDetection);

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

  const { fields, notFoundFields } = computeFields(originalFields, format, {
    globalErrors,
    relaxFieldsDetection,
  });
  const { rows } = await computeRows(parsedRows, { fields, rowsErrors });
  const fileValidation = validateFile(
    { linebreak, encoding, delimiter },
    { globalErrors }
  );
  validateRows(parsedRows, { globalErrors });

  const uniqueErrors = new Set([...globalErrors, ...rowsErrors]);

  const profilesValidation = mapValues(profiles, (profile) => {
    const { code, name } = profile;
    const isValid = ![...uniqueErrors].some(
      (e) => getErrorLevel(profile.code, e) === "E"
    );
    return { code, name, isValid };
  });

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    fields,
    notFoundFields,
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
