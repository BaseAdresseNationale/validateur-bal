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
  // VERIFIE QUE SI IL Y A id_ban_commune LES BAN IDS SOIT UTILISE SUR TOUTES LES LIGNES
  if (parsedRows.length > 0) {
    const useBanIds = 'id_ban_commune' in parsedRows[0];
    for (const row of parsedRows) {
      if (
        (useBanIds && row.id_ban_commune === '') ||
        (!useBanIds &&
          row.id_ban_commune !== undefined &&
          row.id_ban_commune !== '')
      ) {
        addError('rows.ids_required_every');
        return;
      }
    }
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
    if (row.numero === '99999') {
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
