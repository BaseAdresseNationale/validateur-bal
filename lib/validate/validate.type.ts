import { ParseError, ParseResult } from 'papaparse';

export const IS_TOPO_NB = '99999';

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

export enum ErrorLevelEnum {
  ERROR = 'E',
  WARNING = 'W',
  INFO = 'I',
}

export type ProfileErrorType = {
  code: string;
  level: ErrorLevelEnum;
};

export type ReadValueType = {
  parsedValue: string | string[] | boolean | number;
  additionalValues: any;
  errors: string[];
};

export type ValidateRowFullType = ValidateRowType & { isValid: boolean };

export type ValidateRowType = {
  rawValues: Record<string, string>;
  parsedValues: Record<string, string | string[] | boolean | number>;
  additionalValues: Record<string, any>;
  localizedValues: Record<string, any>;
  errors: { code: string; schemaName?: string; level?: ErrorLevelEnum }[];
  line: number;
};

export type ProfilesValidationType = {
  code: string;
  name: string;
  isValid: boolean;
};

export type FieldType = {
  name: string;
  schemaName?: string; // voie_nom
  localizedSchemaName?: string; // voie_nom_bre
  locale?: string; // bre
};

export type NotFoundFieldType = {
  schemaName: string;
  level?: string;
};

export type ValueIsValidType = {
  value: string;
  isValid: boolean;
};

export type ValidateFileType = {
  encoding: ValueIsValidType;
  delimiter: ValueIsValidType;
  linebreak: ValueIsValidType;
};

export type PrevalidateType = Omit<ParseFileType, 'parsedRows'> & {
  fields: FieldType[];
  notFoundFields: NotFoundFieldType[];
  rows: ValidateRowType[];
  fileValidation: ValidateFileType;
  profilesValidation: Record<string, ProfilesValidationType>;
  globalErrors: string[];
  rowsErrors: string[];
  uniqueErrors: string[];
};

export type ValidateProfileType = PrevalidateType & {
  profilErrors: ProfileErrorType[];
};
