import fields from '../schema/fields';
import profiles from '../schema/profiles';
import {
  ErrorLevelEnum,
  getErrorLevel,
  parseErrorCode,
} from '../utils/helpers';
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
  const format = profiles[profileName].format;
  return computedRows.map((row) => {
    const errors = row.errors
      .filter(({ schemaName }) => {
        return fields[schemaName] === undefined
          ? true
          : fields[schemaName].formats?.includes(format);
      })
      .map((e) => ({
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
  const format = profiles[profileName].format;
  return uniqueErrors
    .filter((code) => {
      const { schemaName } = parseErrorCode(code);
      return schemaName === undefined
        ? true
        : fields[schemaName].formats?.includes(format);
    })
    .map((code) => ({
      code,
      level: getErrorLevel(profileName, code),
    }));
}

function validateProfileNotFoundFields(
  notFoundFields: NotFoundFieldType[],
  profileName: string,
): NotFoundFieldLevelType[] {
  const format = profiles[profileName].format;
  return notFoundFields
    .filter(({ schemaName }) => fields[schemaName].formats.includes(format))
    .map(({ schemaName }) => ({
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
