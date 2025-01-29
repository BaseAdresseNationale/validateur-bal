import { ParseError } from "papaparse";
import { parse } from "./parse/buffer";
import { keyBy, mapValues, uniq } from "lodash";

const FATAL_PARSE_ERRORS = new Set([
  "MissingQuotes",
  "UndetectableDelimiter",
  "TooFewFields",
  "TooManyFields",
]);

function humanizeLinebreak(linebreak: string): string {
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

export function validateFile(detectedParams, { globalErrors }) {
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

export type ParseFileType = {
  encoding: string;
  linebreak: string;
  delimiter: string;
  originalFields: string[];
  parseOk: boolean;
  parseErrors: ParseError[];
  parsedRows: Record<string, string>[];
};

export async function parseFile(
  file: Buffer,
  relaxFieldsDetection: boolean
): Promise<ParseFileType> {
  const parseOptions = relaxFieldsDetection
    ? { transformHeader: (h) => h.toLowerCase().trim() }
    : {};

  // Must be a Blob for browser or a Buffer for Node.js
  const { meta, errors, data, encoding } = await parse(file, parseOptions);

  const errorsKinds: string[] = uniq(errors.map((e: ParseError) => e.code));
  const parseOk: boolean = !errorsKinds.some((e) => FATAL_PARSE_ERRORS.has(e));

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
