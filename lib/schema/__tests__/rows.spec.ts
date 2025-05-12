import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import validateRows from '../rows';

enableFetchMocks();

describe('VALIDATE ROWS', () => {
  beforeEach(() => {
    fetchMock.doMock(async () => {
      return JSON.stringify({
        status: 'success',
        response: [{ id: '0246e48c-f33d-433a-8984-034219be842e' }],
      });
    });
  });

  it('TEST no errors', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          lieudit_complement_nom: 'paradis',
          commune_insee: '91534',
        },
        remediations: {},
      },
      {
        parsedValues: {
          voie_nom: 'paradis',
          numero: 99999,
          commune_insee: '91534',
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST rows.empty', async () => {
    const errors: string[] = [];
    const rows: any[] = [];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.empty');
  });

  it('TEST no ban_ids', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '',
          id_ban_toponyme: '',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
        },
        remediations: {},
      },
      {
        parsedValues: {
          id_ban_commune: '',
          id_ban_toponyme: '',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 2,
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST no error ban_ids', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
        },
        remediations: {},
      },
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 99999,
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toEqual([]);
  });

  it('TEST rows.multi_id_ban_commune', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
        },
        remediations: {},
      },
      {
        parsedValues: {
          id_ban_commune: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
          id_ban_toponyme: '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
          id_ban_adresse: '',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 99999,
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.multi_id_ban_commune');
  });

  it('TEST rows.every_line_required_id_ban', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_commune: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842e',
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
        },
        remediations: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 2,
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.every_line_required_id_ban');
  });

  it('TEST uuid_adresse rows.every_line_required_id_ban', async () => {
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
          commune_insee: '91534',
        },
        remediations: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 2,
          commune_insee: '91534',
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.every_line_required_id_ban');
  });

  it('TEST rows.cog_no_match_id_ban_commune', async () => {
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
          commune_insee: '91534',
        },
        remediations: {},
      },
      {
        additionalValues: {
          uid_adresse: {
            idBanCommune: '0246e48c-f33d-433a-8984-034219be842a',
            idBanToponyme: '0246e48c-f33d-433a-8984-034219be842e',
            idBanAdresse: '0246e48c-f33d-433a-8984-034219be842e',
          },
        },
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 2,
          commune_insee: '91534',
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });
    expect(errors).toContain('rows.cog_no_match_id_ban_commune');
  });

  it('TEST remediation des id_ban manquants avec changement de commune deleguee', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          commune_insee: '91534',
          commune_deleguee_insee: '91535',
        },
        remediations: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          suffixe: 'A',
          commune_insee: '91534',
          commune_deleguee_insee: '91536',
        },
        remediations: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          suffixe: 'A',
          commune_insee: '91534',
          commune_deleguee_insee: '91536',
        },
        remediations: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
    });

    // Vérification que les remediations contiennent les id_ban
    expect(rows[0].remediations).toHaveProperty('id_ban_commune');
    expect(rows[0].remediations).toHaveProperty('id_ban_toponyme');
    expect(rows[0].remediations).toHaveProperty('id_ban_adresse');

    expect(rows[1].remediations).toHaveProperty('id_ban_commune');
    expect(rows[1].remediations).toHaveProperty('id_ban_toponyme');
    expect(rows[1].remediations).toHaveProperty('id_ban_adresse');

    expect(rows[2].remediations).toHaveProperty('id_ban_commune');
    expect(rows[2].remediations).toHaveProperty('id_ban_toponyme');
    expect(rows[2].remediations).toHaveProperty('id_ban_adresse');

    // Check reconnaissance des commune_deleguee
    expect(rows[0].remediations.id_ban_toponyme.value).not.toBe(
      rows[1].remediations.id_ban_toponyme.value,
    );
    expect(rows[1].remediations.id_ban_toponyme.value).toBe(
      rows[2].remediations.id_ban_toponyme.value,
    );

    expect(rows[0].remediations.id_ban_adresse.value).not.toBe(
      rows[1].remediations.id_ban_adresse.value,
    );
    expect(rows[1].remediations.id_ban_adresse.value).toBe(
      rows[2].remediations.id_ban_adresse.value,
    );
  });
});
