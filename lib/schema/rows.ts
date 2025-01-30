function validateRows(
  parsedRows: Record<string, string>[],
  { addError }: { addError: (code: string) => void }
) {
  if (parsedRows.length <= 0) {
    addError("rows.empty");
  }

  if (parsedRows.length > 0) {
    const useBanIds = "id_ban_commune" in parsedRows[0];
    for (const row of parsedRows) {
      if (
        (useBanIds && row.id_ban_commune === "") ||
        (!useBanIds &&
          row.id_ban_commune !== undefined &&
          row.id_ban_commune !== "")
      ) {
        addError("rows.ids_required_every");
        return;
      }
    }
  }
}

export default validateRows;
