import { PrevalidateType } from '.';
import { ErrorLevelEnum } from '../utils/error-level.enum';
import { getErrorLevel } from '../utils/helpers';
import { NotFoundFieldType } from './fields';
import { ValidateRowType } from './rows';

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

export type ProfileErrorType = {
  code: string;
  level: ErrorLevelEnum;
};

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

export type ValidateProfile = PrevalidateType & {
  profilErrors: ProfileErrorType[];
};

export function validateProfile(
  prevalidateResult: PrevalidateType,
  profileName: string,
): PrevalidateType | ValidateProfile {
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
