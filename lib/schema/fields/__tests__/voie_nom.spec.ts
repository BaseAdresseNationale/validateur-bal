import { parseVoieNom } from '../voie_nom';

describe('PARSE voie_nom', () => {
  it('TEST without error', async () => {
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

  it('TEST trop_court', async () => {
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

  it('TEST trop_long', async () => {
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

  it('TEST caractere_invalide', async () => {
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

  it('TEST bad_caractere_start_end', async () => {
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

  it('TEST ponctuation_invalide', async () => {
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

  it('TEST ponctuation_invalide', async () => {
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

  it('TEST casse_incorrecte', async () => {
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

  it('TEST word_uppercase', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('les PREBASQUE', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['word_uppercase']);
    expect(res).toBe('les PREBASQUE');
    expect(remed).toBe('Les Prebasque');
  });

  it('TEST casse_incorrecte', async () => {
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

  it('TEST word_lowercase', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Les prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['word_lowercase']);
    expect(res).toBe('Les prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('TEST abbreviation_invalid', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('av Les Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['abbreviation_invalid']);
    expect(res).toBe('av Les Prebasque');
    expect(remed).toBe('Avenue les Prebasque');
  });

  it('TEST bad_word_lieudit one word', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Lieu-Dit Les Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });

    expect(errors).toEqual(['bad_word_lieudit']);
    expect(res).toBe('Lieu-Dit Les Prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('TEST bad_word_lieudit multi words', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Lieu Dit Les Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['bad_word_lieudit']);
    expect(res).toBe('Lieu Dit Les Prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('TEST bad_multi_word_rue', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Rue Grande Rue', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['bad_multi_word_rue']);
    expect(res).toBe('Rue Grande Rue');
    expect(remed).toBe('Grande Rue');
  });

  it('TEST contient_tiret_bas', async () => {
    const errors: string[] = [];
    let remed: string = undefined;

    const res = await parseVoieNom('Les_Prebasque', {
      addError: (e: string) => errors.push(e),
      setRemediation: (r: any) => (remed = r),
    });
    expect(errors).toEqual(['contient_tiret_bas']);
    expect(res).toBe('Les Prebasque');
    expect(remed).toBe('Les Prebasque');
  });

  it('TEST multi errors', async () => {
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
    expect(errors).toContain('word_lowercase');
    expect(errors).toContain('abbreviation_invalid');
    expect(res).toBe("' - av  (Des prebasque) ");
    expect(remed).toBe('Avenue des Prebasque');
  });
});
