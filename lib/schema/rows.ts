import { getVoieNom } from '../utils/helpers';
import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import {
  validateAdresseBanIds,
  validateUseBanIds,
  validateVoieBanIds,
} from './rows/ban_ids';

function validateRowsEmpty(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (rows.length <= 0) {
    addError('empty');
  }
}

function validateComplementIsDeclared(rows: ValidateRowType[]) {
  const complementDeclareds: Set<string> = new Set();

  for (const row of rows) {
    if (row.parsedValues.numero === Number(IS_TOPO_NB)) {
      complementDeclareds.add(getVoieNom(row.parsedValues));
    }
  }
  for (const row of rows) {
    if (
      'lieudit_complement_nom' in row.parsedValues &&
      !complementDeclareds.has(row.parsedValues.lieudit_complement_nom)
    ) {
      row.errors?.push({
        code: 'row.lieudit_complement_nom_not_declared',
      });
    }
  }
}

function validateRows(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
  },
) {
  validateRowsEmpty(rows, { addError });
  validateUseBanIds(rows, { addError, mapCodeCommuneBanId });
  validateVoieBanIds(rows);
  validateAdresseBanIds(rows);
  validateComplementIsDeclared(rows);
}

export default validateRows;
