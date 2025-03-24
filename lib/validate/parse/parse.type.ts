import { ParseError, ParseResult } from 'papaparse';

export type ParseReturn = ParseResult<Record<string, string>> & {
  encoding: string;
};

export type ParseFileType = {
  encoding: string;
  linebreak: string;
  delimiter: string;
  originalFields: string[];
  parseOk: boolean;
  parseErrors: ParseError[];
  parsedRows: Record<string, string>[];
};
