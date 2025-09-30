import { validate, prevalidate, autofix } from './validate';
import { validateProfile } from './validate/profiles';
import { readValue, validateRowWithMinimalFields } from './validate/rows';
import { getErrorLevel, getLabel, ErrorLevelEnum } from './utils/helpers';
import profiles from './schema/profiles';
import { PositionTypeEnum } from './schema/shema.type';

export {
  validate as validateFile,
  validateRowWithMinimalFields as validateRow,
  readValue as validateField,
  validateProfile,
  autofix,
  prevalidate,
  getLabel,
  getErrorLevel,
  profiles,
  ErrorLevelEnum,
  PositionTypeEnum,
};

export type { ParseFileType } from './validate/parse/parse.type';

export type {
  ProfilesValidationType,
  FieldType,
  ValueIsValidType,
  ValidateFileType,
  PrevalidateType,
  ProfileErrorType,
  ErrorLevelType,
  ValidateRowFullType,
  NotFoundFieldLevelType,
  ValidateType,
} from './validate/validate.type';

export type {
  ParsedValue,
  ReadValueType,
  ParsedValues,
} from './schema/shema.type';

export type { ProfileType } from './schema/profiles/profile.type';
