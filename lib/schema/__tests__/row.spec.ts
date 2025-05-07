import { format } from 'date-fns';
import validateRow from '../row';

describe('VALIDATE ROW', () => {
  it('TEST commune_insee dans additionalValues.cle_interop', async () => {
    const remediations: any = {};
    const row: any = {
      additionalValues: {
        cle_interop: {
          codeCommune: '91534',
        },
      },
      parsedValues: {
        cle_interop: 'xxxx',
        voie_nom: 'rue du Colombier',
        numero: 1,
        date_der_maj: '2023-12-25',
      },
      rawValues: {},
      remediations: {},
    };

    await validateRow(row, {
      addError: () => {},
      addRemediation: (key: string, value: string) =>
        (remediations[key] = value),
    });

    expect(remediations).toEqual({
      commune_insee: '91534',
      commune_nom: 'Saclay',
    });
  });
  it('TEST commune_nom avec commune_insee', async () => {
    const remediations: any = {};
    const row: any = {
      parsedValues: {
        commune_insee: '91534',
        voie_nom: 'rue du Colombier',
        numero: 1,
        date_der_maj: '2023-12-25',
      },
      rawValues: {},
      remediations: {},
    };

    await validateRow(row, {
      addError: () => {},
      addRemediation: (key: string, value: string) =>
        (remediations[key] = value),
    });

    expect(remediations).toEqual({
      commune_nom: 'Saclay',
    });
  });

  it('TEST date_der_maj default now', async () => {
    const remediations: any = {};
    const row: any = {
      parsedValues: {
        commune_insee: '91534',
        commune_nom: 'Saclay',
        voie_nom: 'rue du Colombier',
        numero: 1,
      },
      rawValues: {},
      remediations: {},
    };

    await validateRow(row, {
      addError: () => {},
      addRemediation: (key: string, value: string) =>
        (remediations[key] = value),
    });

    expect(remediations).toEqual({
      date_der_maj: format(new Date(), 'yyyy-MM-dd'),
    });
  });
});
