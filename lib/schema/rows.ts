import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';

function validateRowsEmpty(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (rows.length <= 0) {
    addError('rows.empty');
  }
}

function validateUseBanIds(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  const districtIDs = new Set();
  let balAdresseUseBanId = 0;

  for (const row of rows) {
    const idBanCommune =
      row.parsedValues.id_ban_commune ||
      row.additionalValues?.uid_adresse?.idBanCommune;
    const idBanToponyme =
      row.parsedValues.id_ban_toponyme ||
      row.additionalValues?.uid_adresse?.idBanToponyme;
    const idBanAdresse =
      row.parsedValues.id_ban_adresse ||
      row.additionalValues?.uid_adresse?.idBanAdresse;
    const numero = row.parsedValues.numero;

    if (
      idBanCommune &&
      idBanToponyme &&
      (idBanAdresse || (!idBanAdresse && numero === Number(IS_TOPO_NB)))
    ) {
      balAdresseUseBanId++;
      districtIDs.add(idBanCommune);
    }
  }

  if (balAdresseUseBanId === rows.length) {
    // Check district IDs consistency
    if (districtIDs.size > 1) {
      addError('rows.multi_id_ban_commune');
    }
    // if (!districtIDs.has(districtID)) {
    //   throw new Error(
    //     `Missing rights - BAL from district ID : \`${districtID}\` (cog : \`${cog}\`) - Cannot be updated`,
    //   );
    // }
    return true;
  } else if (balAdresseUseBanId > 0) {
    addError('rows.every_line_required_id_ban');
  }
}

function validateRows(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  validateRowsEmpty(rows, { addError });
  validateUseBanIds(rows, { addError });
}

export default validateRows;
