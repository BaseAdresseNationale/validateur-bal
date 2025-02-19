import {
  parseLocalizedField,
  parseErrorCode,
  getLabel,
  getErrorLevel,
} from '../helpers';

describe('HELPERS TEST', () => {
  it('parseLocalizedField', () => {
    expect(parseLocalizedField('voie_nom')).toBe(undefined);
    expect(parseLocalizedField('voie_nom_bre')).toEqual({
      schemaName: 'voie_nom',
      locale: 'bre',
    });
  });

  it('parseErrorCode', () => {
    expect(parseErrorCode('voie_nom.trop_long')).toEqual({
      schemaName: 'voie_nom',
      fieldError: 'trop_long',
    });
    expect(parseErrorCode('voie_nom_bre.trop_long')).toEqual({
      schemaName: 'voie_nom',
      locale: 'bre',
      fieldName: 'voie_nom_bre',
      fieldError: 'trop_long',
    });
  });

  it('getLabel', () => {
    expect(getLabel('voie_nom.trop_court')).toBe(
      'Le nom de la voie est trop court (3 caractères minimum)',
    );
    expect(getLabel('voie_nom_bre.trop_court')).toBe(
      'Le nom de la voie est trop court (3 caractères minimum) [bre]',
    );
    expect(() => getLabel('voie_nom_toto.trop_court')).toThrow(
      Error('Unknown fieldName: voie_nom_toto'),
    );
  });

  it('getErrorLevel', () => {
    expect(getErrorLevel('1.3-relax', 'voie_nom.trop_court')).toBe('E');
    expect(getErrorLevel('1.3-relax', 'voie_nom_bre.trop_court')).toBe('W');
  });
});
