import fields from '../fields';
import { date_der_maj } from '../fields/date_der_maj.field';

describe('VALIDATE FIELDS', () => {
  describe('cle_interop', () => {
    it('cle_interop commune insee inexistante', () => {
      const addError: (error: string) => void = jest.fn();
      const setAdditionnalValues: (add: any) => void = jest.fn();

      fields['cle_interop'].parse('1207A_1111_00001', {
        addError,
        setAdditionnalValues,
      });

      expect(addError).toHaveBeenCalledWith('commune_invalide');
    });

    it('cle_interop commune insee ancienne', () => {
      const addError: (error: string) => void = jest.fn();
      const setAdditionnalValues: (add: any) => void = jest.fn();

      fields['cle_interop'].parse('12076_1111_00001', {
        addError,
        setAdditionnalValues,
      });

      expect(addError).toHaveBeenCalledWith('commune_ancienne');
    });

    it('cle_interop commune good', () => {
      const addError: (error: string) => void = jest.fn();
      const setAdditionnalValues: (add: any) => void = jest.fn();

      fields['cle_interop'].parse('91534_1111_00001', {
        addError,
        setAdditionnalValues,
      });

      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe('numero', () => {
    it('numero over 99999', () => {
      const addError: (error: string) => void = jest.fn();

      fields['numero'].parse('9999999', {
        addError,
      });

      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe('commune_insee', () => {
    it('commune_insee inexistante', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_insee'].parse('1207A', {
        addError,
      });

      expect(addError).toHaveBeenCalledWith('commune_invalide');
    });

    it('commune_insee ancienne', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_insee'].parse('12076', {
        addError,
      });

      expect(addError).toHaveBeenCalledWith('commune_ancienne');
    });

    it('commune_insee commune good', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_insee'].parse('91534', {
        addError,
      });

      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe('commune_nom', () => {
    it('commune_nom majuscule', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_nom'].parse('SACLAY', {
        addError,
      });

      expect(addError).toHaveBeenCalledWith('casse_incorrecte');
    });

    it('commune_nom minuscule', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_nom'].parse('saclay', {
        addError,
      });

      expect(addError).toHaveBeenCalledWith('casse_incorrecte');
    });

    it('commune_nom GOOD', () => {
      const addError: (error: string) => void = jest.fn();

      fields['commune_nom'].parse('Saclay', {
        addError,
      });

      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe('date_der_maj', () => {
    it('devrait ajouter une remediation pour une date au format dd/mm/yyyy', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('25/12/2023', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).toHaveBeenCalledWith({
        errors: ['date_der_maj.date_invalide'],
        value: '2023-12-25',
      });
    });

    it('devrait ajouter une remediation pour une date au format dd/mm/yyyy', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('16 juillet 2023', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).toHaveBeenCalledWith({
        errors: ['date_der_maj.date_invalide'],
        value: '2023-07-16',
      });
    });

    it('devrait utiliser la date du jour comme remediation par défaut', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('date_invalide', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).not.toHaveBeenCalledWith();
    });

    it('devrait utiliser la date du jour comme remediation par défaut', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('12 juillet 1998', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).not.toHaveBeenCalledWith();
    });
  });
});
