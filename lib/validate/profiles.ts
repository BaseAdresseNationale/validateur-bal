import { getErrorLevel } from '../utils/helpers';
import {
  NotFoundFieldType,
  PrevalidateType,
  ProfileErrorType,
  ValidateProfileType,
  ValidateRowType,
  ErrorLevelEnum,
} from './validate.type';

function validateProfileRows(
  computedRows: ValidateRowType[],
  profileName: string,
): ValidateRowType[] {
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
): NotFoundFieldType[] {
  return notFoundFields.map(({ schemaName }) => ({
    schemaName,
    level: getErrorLevel(profileName, `field.${schemaName}.missing`),
  }));
}

export function validateProfile(
  prevalidateResult: PrevalidateType,
  profileName: string,
): PrevalidateType | ValidateProfileType {
  if (!prevalidateResult.parseOk) {
    return prevalidateResult;
  }

  const rows = validateProfileRows(prevalidateResult.rows, profileName);
  const profilErrors: ProfileErrorType[] = validateProfileUniqueErrors(
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
