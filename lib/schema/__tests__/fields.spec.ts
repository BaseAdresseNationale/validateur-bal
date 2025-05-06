import { date_der_maj } from '../fields/date_der_maj.field';
import { format } from 'date-fns';

describe('VALIDATE FIELDS', () => {
  describe('date_der_maj', () => {
    it('devrait ajouter une remediation pour une date au format dd/mm/yyyy', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('25/12/2023', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).toHaveBeenCalledWith('2023-12-25');
    });

    it('devrait utiliser la date du jour comme remediation par défaut', () => {
      const addError = jest.fn();
      const setRemediation = jest.fn();

      date_der_maj.parse('date_invalide', { addError, setRemediation });

      expect(addError).toHaveBeenCalledWith('date_invalide');
      expect(setRemediation).toHaveBeenCalledWith(
        format(new Date(), 'yyyy-MM-dd'),
      );
    });
  });
});
