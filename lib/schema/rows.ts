const IS_TOPO_NB = '99999';

function validateRowsEmpty(
  parsedRows: Record<string, string>[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (parsedRows.length <= 0) {
    addError('rows.empty');
  }
}

function validateUseBanIds(
  parsedRows: Record<string, string>[],
  { addError }: { addError: (code: string) => void },
) {
  const districtIDs = new Set();
  let balAdresseUseBanId = 0;
  for (const r of parsedRows) {
    const { id_ban_commune, id_ban_toponyme, id_ban_adresse, numero } = r;
    if (
      id_ban_commune &&
      id_ban_toponyme &&
      ((!id_ban_adresse && numero === IS_TOPO_NB) || id_ban_adresse)
    ) {
      balAdresseUseBanId++;
      districtIDs.add(id_ban_commune);
    }
  }

  if (balAdresseUseBanId === parsedRows.length) {
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

function validateComplementIsDeclared(
  parsedRows: Record<string, string>[],
  { addError }: { addError: (code: string) => void },
) {
  const complementFinds: Set<string> = new Set();
  const complementDeclareds: Set<string> = new Set();

  for (const row of parsedRows) {
    if ('lieudit_complement_nom' in row) {
      complementFinds.add(row.lieudit_complement_nom);
    }
    if (row.numero === IS_TOPO_NB) {
      complementDeclareds.add(row.voie_nom);
    }
  }
  for (const complementFind of complementFinds) {
    if (!complementDeclareds.has(complementFind)) {
      addError('rows.complement_not_declared');
    }
  }
}

function validateRows(
  parsedRows: Record<string, string>[],
  { addError }: { addError: (code: string) => void },
) {
  validateRowsEmpty(parsedRows, { addError });
  validateUseBanIds(parsedRows, { addError });
  validateComplementIsDeclared(parsedRows, { addError });
}

export default validateRows;
