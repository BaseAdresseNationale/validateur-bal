import { ValidateRowType } from '../validate/validate.type';

export function getErrorMissingOrValeurManquante(
  field: string,
  row: ValidateRowType,
) {
  return row.rawValues[field] === undefined
    ? `field.${field}.missing`
    : `${field}.valeur_manquante`;
}
