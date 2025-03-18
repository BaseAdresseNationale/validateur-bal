import { readValue } from '../../validate/rows';

describe('SHEMA TEST', () => {
  it('validate suffixe', () => {
    const result = readValue('suffixe', 'ter');
    expect(result.parsedValue).toBe('ter');
    expect(result.errors).toEqual([]);
  });

  it('validate suffixe / debut_invalide', () => {
    const result = readValue('suffixe', '.');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['debut_invalide']);
  });

  it('validate suffixe / trop_long', () => {
    const result = readValue('suffixe', 'azertyuiopazertyuiop');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['trop_long']);
  });

  it('validate cad_parcelles', () => {
    const result = readValue('cad_parcelles', '12345000AA0001');
    expect(result.parsedValue).toEqual(['12345000AA0001']);
    expect(result.errors).toEqual([]);
  });

  it('validate cad_parcelles / multiple', () => {
    const result = readValue('cad_parcelles', '12345000AA0001|12345000AA0002');
    expect(result.parsedValue).toEqual(['12345000AA0001', '12345000AA0002']);
    expect(result.errors).toEqual([]);
  });

  it('validate certification_commune / 1', () => {
    const result = readValue('certification_commune', '1');
    expect(result.parsedValue).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validate certification_commune / 0', () => {
    const result = readValue('certification_commune', '0');
    expect(result.parsedValue).toBe(false);
    expect(result.errors).toEqual([]);
  });

  it('validate certification_commune / valeur_invalide', () => {
    const result = readValue('certification_commune', 'toto');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['valeur_invalide']);
  });

  it('validate date_der_maj / date ancienne', () => {
    const result = readValue('date_der_maj', '2000-01-01');
    expect(result.parsedValue).toBe('2000-01-01');
    expect(result.errors).toEqual(['date_ancienne']);
  });

  it('validate date_der_maj / date future', () => {
    const result = readValue('date_der_maj', '2050-01-01');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['date_future']);
  });

  it('validate voie_nom / trop_court', () => {
    const result = readValue('voie_nom', 'Aa');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['trop_court']);
  });

  it('validate voie_nom / trop_long', () => {
    const result = readValue(
      'voie_nom',
      'Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf',
    );
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['trop_long']);
  });

  it('validate voie_nom / casse_incorrecte', () => {
    const result = readValue('voie_nom', 'ALLEE DES RUISSEAUX');
    expect(result.parsedValue).toBe('ALLEE DES RUISSEAUX');
    expect(result.errors).toEqual(['casse_incorrecte']);
  });

  it('validate voie_nom / caractere_invalide', () => {
    const result = readValue('voie_nom', 'All�e des roses');
    expect(result.parsedValue).toBe(undefined);
    expect(result.errors).toEqual(['caractere_invalide']);
  });

  it('validate voie_nom / contient_tiret_bas', () => {
    const result = readValue('voie_nom', 'Allée_des_roseaux');
    expect(result.parsedValue).toBe('Allée des roseaux');
    expect(result.errors).toEqual(['contient_tiret_bas']);
  });
});
