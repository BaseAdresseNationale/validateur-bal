import validateRows from '../rows';

describe('VALIDATE ROWS', () => {
  it('TEST no errors', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        voie_nom: 'rue du Colombier',
        numero: '1',
        lieudit_complement_nom: 'paradis',
      },
      {
        voie_nom: 'paradis',
        numero: '99999',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST rows.complement_not_declared', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        voie_nom: 'rue du Colombier',
        numero: '1',
        lieudit_complement_nom: 'paradis',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.complement_not_declared');
  });

  it('TEST rows.empty', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.empty');
  });

  it('TEST no ban_ids', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        id_ban_commune: undefined,
        id_ban_toponyme: undefined,
        id_ban_adresse: undefined,
        voie_nom: 'rue du Colombier',
        numero: '1',
      },
      {
        id_ban_commune: undefined,
        id_ban_toponyme: undefined,
        id_ban_adresse: undefined,
        voie_nom: 'rue du Colombier',
        numero: '2',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST no error ban_ids', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
        voie_nom: 'rue du Colombier',
        numero: '1',
      },
      {
        id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_adresse: null,
        voie_nom: 'rue du Colombier',
        numero: '99999',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST rows.multi_id_ban_commune', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
        voie_nom: 'rue du Colombier',
        numero: '1',
      },
      {
        id_ban_commune: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
        id_ban_toponyme: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
        id_ban_adresse: null,
        voie_nom: 'rue du Colombier',
        numero: '99999',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.multi_id_ban_commune');
  });

  it('TEST rows.every_line_required_id_ban', () => {
    const errors: string[] = [];
    const parsedRows: Record<string, string>[] = [
      {
        id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
        id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
        voie_nom: 'rue du Colombier',
        numero: '1',
      },
      {
        voie_nom: 'rue du Colombier',
        numero: '2',
      },
    ];
    validateRows(parsedRows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.every_line_required_id_ban');
  });
});
