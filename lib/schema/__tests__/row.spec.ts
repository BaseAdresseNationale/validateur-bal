import { format } from 'date-fns';
import validateRow from '../row';
import { RemediationValue } from '../shema.type';

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
      addRemediation: <T>(key: string, value: RemediationValue<T>) =>
        (remediations[key] = value),
      mapCodeCommuneBanId: { '91534': undefined },
    });

    expect(remediations).toEqual({
      commune_insee: {
        errors: ['field.commune_insee.missing'],
        value: '91534',
      },
      commune_nom: {
        errors: ['field.commune_nom.missing'],
        value: 'Saclay',
      },
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
      addRemediation: <T>(key: string, value: RemediationValue<T>) =>
        (remediations[key] = value),
      mapCodeCommuneBanId: { '91534': undefined },
    });

    expect(remediations).toEqual({
      commune_nom: {
        errors: ['field.commune_nom.missing'],
        value: 'Saclay',
      },
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
      addRemediation: <T>(key: string, value: RemediationValue<T>) =>
        (remediations[key] = value),
      mapCodeCommuneBanId: { '91534': undefined },
    });

    expect(remediations).toEqual({
      date_der_maj: {
        errors: ['field.date_der_maj.missing'],
        value: format(new Date(), 'yyyy-MM-dd'),
      },
    });
  });

  describe('code_insee chef lieu', () => {
    it('TEST bad chef lieu', async () => {
      const row: any = {
        parsedValues: {
          commune_insee: '91534',
          commune_nom: 'Saclay',
          commune_deleguee_insee: '12076',
          voie_nom: 'rue du Colombier',
          numero: 1,
          date_der_maj: '2023-12-25',
        },
        rawValues: {},
        remediations: {},
      };

      const addError: (error: string) => void = jest.fn();
      const addRemediation: <T>(
        key: string,
        value: RemediationValue<T>,
      ) => void = jest.fn();

      await validateRow(row, {
        addError,
        addRemediation,
        mapCodeCommuneBanId: { '91534': undefined },
      });

      expect(addError).toHaveBeenCalledWith('chef_lieu_invalide');
    });
    it('TEST no code_delegee_insee', async () => {
      const row: any = {
        parsedValues: {
          commune_insee: '91534',
          commune_nom: 'Saclay',
          voie_nom: 'rue du Colombier',
          numero: 1,
          date_der_maj: '2023-12-25',
        },
        rawValues: {},
        remediations: {},
      };

      const addError: (error: string) => void = jest.fn();
      const addRemediation: <T>(
        key: string,
        value: RemediationValue<T>,
      ) => void = jest.fn();

      await validateRow(row, {
        addError,
        addRemediation,
        mapCodeCommuneBanId: { '91534': undefined },
      });

      expect(addError).not.toHaveBeenCalledWith('chef_lieu_invalide');
    });

    it('TEST code_delegee_insee not chef lieu', async () => {
      const row: any = {
        parsedValues: {
          commune_deleguee_insee: '12076',
          commune_nom: 'Saclay',
          voie_nom: 'rue du Colombier',
          numero: 1,
          date_der_maj: '2023-12-25',
        },
        rawValues: {},
        remediations: {},
      };

      const addError: (error: string) => void = jest.fn();
      const addRemediation: <T>(
        key: string,
        value: RemediationValue<T>,
      ) => void = jest.fn();

      await validateRow(row, {
        addError,
        addRemediation,
        mapCodeCommuneBanId: { '91534': undefined },
      });

      expect(addError).not.toHaveBeenCalledWith('chef_lieu_invalide');
    });

    it('TEST code_delegee_insee not chef lieu', async () => {
      const row: any = {
        parsedValues: {
          commune_insee: '91534',
          commune_deleguee_insee: '12076',
          commune_nom: 'Saclay',
          voie_nom: 'rue du Colombier',
          numero: 1,
          date_der_maj: '2023-12-25',
        },
        rawValues: {},
        remediations: {},
        errors: [{ schemaName: 'commune_deleguee_insee' }],
      };

      const addError: (error: string) => void = jest.fn();
      const addRemediation: <T>(
        key: string,
        value: RemediationValue<T>,
      ) => void = jest.fn();

      await validateRow(row, {
        addError,
        addRemediation,
        mapCodeCommuneBanId: { '91534': undefined },
      });

      expect(addError).not.toHaveBeenCalledWith('chef_lieu_invalide');
    });
  });
});
