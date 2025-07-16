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
        rawValues: {},
      },
      {
        parsedValues: {
          voie_nom: 'paradis',
          numero: 99999,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(errors).toEqual([]);
  });

  it('TEST rows.empty', async () => {
    const errors: string[] = [];
    const rows: any[] = [];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(errors).toContain('empty');
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
        rawValues: {},
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
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
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
        rawValues: {},
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
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
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
        rawValues: {},
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
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(errors).toContain('multi_id_ban_commune');
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
        rawValues: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 2,
        },
        remediations: {},
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(errors).toContain('every_line_required_id_ban');
  });

  it('TEST uuid_adresse every_line_required_id_ban', async () => {
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
        rawValues: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 2,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(errors).toContain('every_line_required_id_ban');
  });

  it('TEST rows.cog_no_match_id_ban_commune', async () => {
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
        rawValues: {},
        errors: [],
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
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': '0246e48c-f33d-433a-8984-034219be842e' },
      cadastreGeoJSON: undefined,
    });
    expect(rows[1].errors).toEqual([
      { code: 'row.cog_no_match_id_ban_commune' },
    ]);
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
        rawValues: {},
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
        rawValues: {},
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
        rawValues: {},
      },
    ];
    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
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

  it('TEST remediation des id_ban manquants avec correspondance voie et numero', async () => {
    const errors: string[] = [];
    const rows: any[] = [
      {
        parsedValues: {
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842e',
          id_ban_adresse: '0246e48c-f33d-433a-8984-034219be842b',
          voie_nom: 'rue du Colombier',
          numero: 1,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          numero: 1,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
      {
        parsedValues: {
          id_ban_toponyme: '0246e48c-f33d-433a-8984-034219be842a',
          voie_nom: 'avenue de la Paix',
          numero: 1,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
      {
        parsedValues: {
          voie_nom: 'avenue de la Paix',
          numero: 3,
          commune_insee: '91534',
        },
        remediations: {},
        rawValues: {},
      },
    ];

    await validateRows(rows, {
      addError: (e: string) => errors.push(e),
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });

    expect(rows[0].parsedValues.id_ban_toponyme).toBe(
      rows[1].remediations.id_ban_toponyme.value,
    );
    expect(rows[2].parsedValues.id_ban_toponyme).toBe(
      rows[3].remediations.id_ban_toponyme.value,
    );

    expect(rows[0].parsedValues.id_ban_adresse).toBe(
      rows[1].remediations.id_ban_adresse.value,
    );
    expect(rows[0].parsedValues.id_ban_adresse).not.toBe(
      rows[2].remediations.id_ban_adresse.value,
    );
    expect(rows[2].remediations.id_ban_adresse.value).not.toBe(
      rows[3].remediations.id_ban_adresse.value,
    );
  });

  it('TEST coord_outlier', async () => {
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
          long: 2.3522,
          lat: 48.8566,
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 2,
          long: 2.353,
          lat: 48.857,
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 3,
          long: 2.354,
          lat: 48.856,
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 4,
          long: 7.2619,
          lat: 43.7102,
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(rows[3].errors).toEqual([{ code: 'row.coord_outlier' }]);
  });

  it('TEST no coord_outlier', async () => {
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
          long: 2.3522,
          lat: 48.8566,
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: undefined,
    });
    expect(rows[0].errors).toEqual([]);
  });

  it('TEST cadastre_outlier', async () => {
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
          long: 7.2619,
          lat: 43.7102,
          cad_parcelles: ['914350000A1089'],
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '914350000A1089',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [2.3522, 48.8566],
                  [2.353, 48.857],
                  [2.354, 48.856],
                  [2.3522, 48.8566],
                ],
              ],
            },
            properties: {},
          },
        ],
      },
    });
    expect(rows[0].errors).toEqual([
      {
        code: 'row.cadastre_outlier',
      },
    ]);
  });

  it('TEST cadastre_no_exist', async () => {
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
          long: 2.3522,
          lat: 48.8566,
          cad_parcelles: ['914350000A1089'],
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '914350000A1080',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [2.3522, 48.8566],
                  [2.353, 48.857],
                  [2.354, 48.856],
                  [2.3522, 48.8566],
                ],
              ],
            },
            properties: {},
          },
        ],
      },
    });
    expect(rows[0].errors).toEqual([
      {
        code: 'row.cadastre_no_exist',
      },
    ]);
  });

  it('TEST no cadastre_outlier and no cadastre_no_exist', async () => {
    const rows: any[] = [
      {
        parsedValues: {
          voie_nom: 'rue du Colombier',
          commune_insee: '91534',
          numero: 1,
          long: 2.3522,
          lat: 48.8566,
          cad_parcelles: ['914350000A1089'],
        },
        remediations: {},
        rawValues: {},
        errors: [],
      },
    ];
    await validateRows(rows, {
      addError: () => {},
      mapCodeCommuneBanId: { '91534': undefined },
      cadastreGeoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '914350000A1089',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [2.3522, 48.8566],
                  [2.353, 48.857],
                  [2.354, 48.856],
                  [2.3522, 48.8566],
                ],
              ],
            },
            properties: {},
          },
        ],
      },
    });
    expect(rows[0].errors).toEqual([]);
  });
});
