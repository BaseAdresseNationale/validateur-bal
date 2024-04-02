const bluebird = require("bluebird");
const { keyBy, mapValues, uniq } = require("lodash");
const { getErrorLevel } = require("../helpers");
const profiles = require("../schema/profiles");
const { computeFields } = require("./fields");
const { parse } = require("./parse");
const { validateRow } = require("./row");

const FATAL_PARSE_ERRORS = new Set([
  "MissingQuotes",
  "UndetectableDelimiter",
  "TooFewFields",
  "TooManyFields",
]);

async function parseFile(file, relaxFieldsDetection) {
  const parseOptions = relaxFieldsDetection
    ? { transformHeader: (h) => h.toLowerCase().trim() }
    : {};

  // Must be a Blob for browser or a Buffer for Node.js
  const { meta, errors, data, encoding } = await parse(file, parseOptions);

  const errorsKinds = uniq(errors.map((e) => e.code));
  const parseOk = !errorsKinds.some((e) => FATAL_PARSE_ERRORS.has(e));

  return {
    encoding,
    linebreak: meta.linebreak,
    delimiter: meta.delimiter,
    originalFields: meta.fields,
    parseOk,
    parseErrors: errors,
    parsedRows: data,
  };
}

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
    { concurrency: 4 },
  );

  return { rows: computedRows };
}

function validateFile(detectedParams, { globalErrors }) {
  const humanizedLinebreak = humanizeLinebreak(detectedParams.linebreak);

  const encoding = {
    value: detectedParams.encoding,
    isValid: detectedParams.encoding === "utf-8",
  };

  if (!encoding.isValid) {
    globalErrors.add("file.encoding.non_standard");
  }

  const delimiter = {
    value: detectedParams.delimiter,
    isValid: detectedParams.delimiter === ";",
  };

  if (!delimiter.isValid) {
    globalErrors.add("file.delimiter.non_standard");
  }

  const linebreak = {
    value: humanizedLinebreak,
    isValid: ["Unix", "Windows"].includes(humanizedLinebreak),
  };

  if (!linebreak.isValid) {
    globalErrors.add("file.linebreak.non_standard");
  }

  return { encoding, delimiter, linebreak };
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

async function prevalidate(file, format, relaxFieldsDetection) {
  const globalErrors = new Set();
  const rowsErrors = new Set();

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
    { globalErrors },
  );
  validateRows(parsedRows, { globalErrors });

  const uniqueErrors = new Set([...globalErrors, ...rowsErrors]);

  const profilesValidation = mapValues(profiles, (profile) => {
    const { code, name } = profile;
    const isValid = ![...uniqueErrors].some(
      (e) => getErrorLevel(profile.code, e) === "E",
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

function validateProfile(prevalidateResult, profileName) {
  if (!prevalidateResult.parseOk) {
    return prevalidateResult;
  }

  const rows = validateProfileRows(prevalidateResult.rows, profileName);
  const profilErrors = validateProfileUniqueErrors(
    prevalidateResult.uniqueErrors,
    profileName,
  );
  const notFoundFields = validateProfileNotFoundFields(
    prevalidateResult.notFoundFields,
    profileName,
  );
  return {
    ...prevalidateResult,
    rows,
    notFoundFields,
    profilErrors,
  };
}

async function validate(file, options = {}) {
  const profile = options.profile || "1.3";
  let { relaxFieldsDetection } = options;

  if (options.relaxFieldsDetection === undefined) {
    relaxFieldsDetection = profiles[profile].relax;
  }

  const { format } = profiles[profile];
  const prevalidateResult = await prevalidate(
    file,
    format,
    relaxFieldsDetection,
  );
  return validateProfile(prevalidateResult, profile);
}

function humanizeLinebreak(linebreak) {
  if (linebreak === "\n") {
    return "Unix";
  }

  if (linebreak === "\r\n") {
    return "Windows";
  }

  if (linebreak === "\r") {
    return "Old Mac/BSD";
  }

  return "Inconnu";
}

module.exports = { validate, validateProfile };
