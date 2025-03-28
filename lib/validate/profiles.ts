import { ErrorLevelEnum, getErrorLevel } from '../utils/helpers';
import {
  NotFoundFieldType,
  PrevalidateType,
  ProfileErrorType,
  ValidateType,
  ValidateRowType,
  ValidateRowFullType,
  NotFoundFieldLevelType,
} from './validate.type';

function validateProfileRows(
  computedRows: ValidateRowType[],
  profileName: string,
): ValidateRowFullType[] {
  return computedRows.map((row) => {
    const errors = row.errors.map((e) => ({
      ...e,
      level: getErrorLevel(profileName, e.code),
    }));

    const isValid = !errors.some((e) => e.level === ErrorLevelEnum.ERROR);

    return {
      ...row,
      errors,
      isValid,
    };
  });
}

function validateProfileUniqueErrors(
  uniqueErrors: string[],
  profileName: string,
): ProfileErrorType[] {
  return uniqueErrors.map((code) => ({
    code,
    level: getErrorLevel(profileName, code),
  }));
}

function validateProfileNotFoundFields(
  notFoundFields: NotFoundFieldType[],
  profileName: string,
): NotFoundFieldLevelType[] {
  return notFoundFields.map(({ schemaName }) => ({
    schemaName,
    level: getErrorLevel(profileName, `field.${schemaName}.missing`),
  }));
}

export function validateProfile(
  prevalidateResult: PrevalidateType,
  profileName: string,
): ValidateType {
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
