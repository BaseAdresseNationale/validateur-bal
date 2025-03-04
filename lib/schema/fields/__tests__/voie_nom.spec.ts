/* eslint camelcase: off */

import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';

import { parseVoieNom } from '../voie_nom';

describe('PARSE voie_nom', () => {
  it('without error', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Rue de la Mouche', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });

    expect(errors).toEqual([]);
    expect(remed).toBeUndefined();
    expect(res).toBe('Rue de la Mouche');
  });

  it('trop_court', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Ru', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['trop_court']);
    expect(remed).toBeUndefined();
    expect(res).toBeUndefined();
  });

  it('trop_long', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom(
      `RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd
      RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd
      RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd
      RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd
      RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd
      RuRu sf sdvsd vhsd lvuhsdluhbsqmovhmoshid vqsd bRuRu sf sdvsd`,
      {
        addError: (e: string) => errors.push(e),
        setRemediation: (r: any) => (remed = r),
      },
    );
    expect(errors).toEqual(['trop_long']);
    expect(remed).toBeUndefined();
    expect(res).toBeUndefined();
  });

  it('caractere_invalide', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('�Rue', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['caractere_invalide']);
    expect(remed).toBeUndefined();
    expect(res).toBeUndefined();
  });

  it('bad_caractere_start_end', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom("' - Rue -'", {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['bad_caractere_start_end']);
    expect(res).toBe("' - Rue -'");
    expect(remed).toBe('Rue');
  });

  it('ponctuation_invalide', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Rue (de la Gare)', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['ponctuation_invalide']);
    expect(res).toBe('Rue (de la Gare)');
    expect(remed).toBe('Rue de la Gare');
  });

  it('ponctuation_invalide', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Rue  de la Gare', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['multi_space_caractere']);
    expect(res).toBe('Rue  de la Gare');
    expect(remed).toBe('Rue de la Gare');
  });

  it('casse_incorrecte', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('LES PREBASQUE', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['casse_incorrecte']);
    expect(res).toBe('LES PREBASQUE');
    expect(remed).toBe('Les Prebasque');
  });

  it('casse_incorrecte', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('les PREBASQUE', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['word_all_uppercase']);
    expect(res).toBe('les PREBASQUE');
    expect(remed).toBe('Les Prebasque');
  });

  it('casse_incorrecte', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('les prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['casse_incorrecte']);
    expect(res).toBe('les prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('casse_incorrecte', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Les prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['word_all_lowercase']);
    expect(res).toBe('Les prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('no_abbreviation', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('av Les Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['no_abbreviation']);
    expect(res).toBe('av Les Prebasque');
    expect(remed).toBe('Avenue Les Prebasque');
  });

  it('contient_tiret_bas', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Les_Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['contient_tiret_bas']);
    expect(res).toBe('Les Prebasque');
    expect(remed).toBeUndefined();
  });

  it('multi errors', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom("' - av  (Des_prebasque) ", {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toContain('contient_tiret_bas');
    expect(errors).toContain('bad_caractere_start_end');
    expect(errors).toContain('ponctuation_invalide');
    expect(errors).toContain('multi_space_caractere');
    expect(errors).toContain('word_all_lowercase');
    expect(errors).toContain('no_abbreviation');
    expect(res).toBe("' - av  (Des prebasque) ");
    expect(remed).toBe('Avenue des Prebasque');
  });
});
