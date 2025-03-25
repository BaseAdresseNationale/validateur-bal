import validateRows from '../rows';

describe('VALIDATE ROWS', () => {
  it('TEST no errors', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          lieudit_complement_nom: 'paradis',
        },
      },
      {
        parsedValues: {
          voie_nom: 'paradis',
          numero: 99999,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: [],
      },
    );
    expect(errors).toEqual([]);
  });

  it('TEST rows.empty', () => {
    const errors: string[] = [];
    const rows: any[] = [];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: [],
      },
    );
    expect(errors).toContain('rows.empty');
  });

  it('TEST no ban_ids', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '',
          id_ban_toponyme: '',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          numero: 1,
        },
      },
      {
        parsedValues: {
          id_ban_commune: '',
          id_ban_toponyme: '',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          numero: 2,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: [],
      },
    );
    expect(errors).toEqual([]);
  });

  it('TEST no error ban_ids', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          numero: 1,
        },
      },
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          numero: 99999,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: ['0246e48c-f33d-433a-8984-034219be842e'],
      },
    );
    expect(errors).toEqual([]);
  });

  it('TEST rows.multi_id_ban_commune', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          numero: 1,
        },
      },
      {
        parsedValues: {
          id_ban_commune: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
          id_ban_toponyme: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          numero: 99999,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: [
          '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
          '0246e48c-f33d-433a-8984-034219be842e',
        ],
      },
    );
    expect(errors).toContain('rows.multi_id_ban_commune');
  });

  it('TEST rows.every_line_required_id_ban', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          numero: 1,
        },
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 2,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: [],
      },
    );
    expect(errors).toContain('rows.every_line_required_id_ban');
  });

  it('TEST uuid_adresse rows.every_line_required_id_ban', () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        additionalValues: {
          uid_adresse: {
            idBanCommune: '0246e48c-f33d-433a-8984-034219be842e',
            idBanToponyme: '0246e48c-f33d-433a-8984-034219be842e',
            idBanAdresse: '0246e48c-f33d-433a-8984-034219be842e',
          },
        },
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
        },
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 2,
        },
      },
    ];
    validateRows(
      rows,
      {
        addError: (e: string) => errors.push(e),
      },
      {
        communeBanIds: ['0246e48c-f33d-433a-8984-034219be842e'],
      },
    );
    expect(errors).toContain('rows.every_line_required_id_ban');
  });
});
