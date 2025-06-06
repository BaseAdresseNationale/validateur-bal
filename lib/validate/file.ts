import { ParseError } from 'papaparse';
import { parse } from './parse';
import { uniq } from 'lodash';
import { ParseFileType, ParseReturn } from './parse/parse.type';

const FATAL_PARSE_ERRORS = new Set([
  'MissingQuotes',
  'UndetectableDelimiter',
  'TooFewFields',
  'TooManyFields',
]);

export enum HumaneLinebreakEnum {
  UNIX = 'Unix',
  WINDOWS = 'Windows',
  MAC = 'Old Mac/BSD',
  INCONNU = 'Inconnu',
}

function humanizeLinebreak(linebreak: string): HumaneLinebreakEnum {
  if (linebreak === '\n') {
    return HumaneLinebreakEnum.UNIX;
  }

  if (linebreak === '\r\n') {
    return HumaneLinebreakEnum.WINDOWS;
  }

  if (linebreak === '\r') {
    return HumaneLinebreakEnum.MAC;
  }

  return HumaneLinebreakEnum.INCONNU;
}

export function validateFile(
  detectedParams: { linebreak: string; encoding: string; delimiter: string },
  { globalErrors }: { globalErrors: Set<string> },
) {
  const humanizedLinebreak = humanizeLinebreak(detectedParams.linebreak);

  const encoding = {
    value: detectedParams.encoding,
    isValid: detectedParams.encoding === 'utf-8',
  };

  if (!encoding.isValid) {
    globalErrors.add('file.encoding.non_standard');
  }

  const delimiter = {
    value: detectedParams.delimiter,
    isValid: detectedParams.delimiter === ';',
  };

  if (!delimiter.isValid) {
    globalErrors.add('file.delimiter.non_standard');
  }

  const linebreak = {
    value: humanizedLinebreak,
    isValid: [HumaneLinebreakEnum.UNIX, HumaneLinebreakEnum.WINDOWS].includes(
      humanizedLinebreak,
    ),
  };

  if (!linebreak.isValid) {
    globalErrors.add('file.linebreak.non_standard');
  }

  return { encoding, delimiter, linebreak };
}

export async function parseFile(
  file: Buffer,
  relaxFieldsDetection: boolean,
): Promise<ParseFileType> {
  const parseOptions = relaxFieldsDetection
    ? { transformHeader: (h) => h.toLowerCase().trim() }
    : {};

  // Must be a Blob for browser or a Buffer for Node.js
  const { meta, errors, data, encoding }: ParseReturn = await parse(
    file,
    parseOptions,
  );

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
