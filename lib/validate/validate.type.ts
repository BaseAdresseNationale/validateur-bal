import { ParsedValues } from '../schema/shema.type';
import { ErrorLevelEnum } from '../utils/helpers';
import { ParseFileType } from './parse/parse.type';

export const IS_TOPO_NB = '99999';

// VALIDATE ROW

export type ErrorType = {
  code: string;
  schemaName?: string;
};

export type ValidateRowType = {
  rawValues: Record<string, string>;
  parsedValues: ParsedValues;
  remediations: ParsedValues;
  additionalValues: Record<string, any>;
  localizedValues: Record<string, any>;
  errors: ErrorType[];
  line: number;
};

// PREVALIDATE

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

// VALIDATE PROFILE

export type ProfileErrorType = {
  code: string;
  level: ErrorLevelEnum;
};

export type ErrorLevelType = ErrorType & {
  level?: ErrorLevelEnum;
};

export type ValidateRowFullType = Omit<ValidateRowType, 'errors'> & {
  isValid: boolean;
  errors: ErrorLevelType[];
};

export type NotFoundFieldLevelType = NotFoundFieldType & {
  level?: ErrorLevelEnum;
};

export type ValidateType = Omit<PrevalidateType, 'notFoundFields' | 'rows'> & {
  profilErrors: ProfileErrorType[];
  notFoundFields: NotFoundFieldLevelType[];
  rows: ValidateRowFullType[];
};
