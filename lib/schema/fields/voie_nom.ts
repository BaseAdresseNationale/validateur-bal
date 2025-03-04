import { trim, flatten } from 'lodash';

// const OVNI_WORDS = ['lieudit', 'lieu-dit'];

const EXPAND_FIRST_WORD_TABLE = {
  pl: 'place',
  av: 'avenue',
  bd: 'boulevard',
  sq: 'square',
  che: 'chemin',
  chem: 'chemin',
  rte: 'route',
  all: 'allee',
  pas: 'passage',
  vla: 'villa',
  imp: 'impasse',
  qu: 'quai',
  ham: 'hammeau',
  prt: 'porte',
  parv: 'parvis',
  lot: 'lotissement',
  sen: 'sente',
  r: 'rue',
  rle: 'ruelle',
  car: 'carrefour',
  mte: 'montee',
  ptte: 'placette',
  str: 'sentier',
  tsse: 'terrasse',
  snt: 'sente',
};

const EXPAND_WORD_TABLE = {
  st: 'saint',
  ste: 'sainte',
  gal: 'general',
  mal: 'marechal',
};

const STOP_WORDS = [
  ...Object.keys(EXPAND_FIRST_WORD_TABLE),
  ...Object.keys(EXPAND_WORD_TABLE),
  'la',
  'le',
  'les',
  'l’',
  'los',
  'de',
  'des',
  'du',
  'd’',
  'par',
  'sur',
  'sous',
  'et',
  'au',
  'aux',
  'a',
  'à',
  'hui',
];

const ALWAYS_UPPER = [
  /* Acronymes */
  'za',
  'zac',
  'zi',
  'zad',
  /* Chiffres romains */
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
  'xi',
  'xii',
  'xiii',
  'xiv',
  'xv',
  'xvi',
  'xvii',
  'xviii',
  'xix',
  'xx',
  'xxi',
  'xxii',
  'xxiii',
  'xxiv',
  'xxv',
];

function capitalize(str: string): string {
  if (str.length === 0) {
    return '';
  }

  if (str.length === 1) {
    return str.toUpperCase();
  }

  return str[0].toUpperCase() + str.substr(1);
}

function eventuallyCapitalize(word: string): string {
  if (STOP_WORDS.includes(word)) {
    return word;
  }

  if (ALWAYS_UPPER.includes(word)) {
    return word.toUpperCase();
  }

  return capitalize(word);
}

function fixCapitalize(str: string): string {
  return capitalize(
    str
      .toLowerCase()
      .replace(/('|’)\s*/g, '’ ') // Ajoute un espace après toutes les '
      .split(' ')
      .filter((s) => Boolean(s))
      .map((word) =>
        word
          .split('-')
          .map((w) => eventuallyCapitalize(w))
          .join('-'),
      )
      .join(' ')
      .replace(/’\s/g, '’'),
  );
}

function fixAbbreviation(str: string): string {
  return capitalize(
    getWords(str)
      .map((w, i) => {
        if (i !== 0) {
          if (Object.keys(EXPAND_WORD_TABLE).includes(w)) {
            return EXPAND_WORD_TABLE[w];
          }

          return w;
        }

        if (Object.keys(EXPAND_FIRST_WORD_TABLE).includes(w)) {
          return EXPAND_FIRST_WORD_TABLE[w];
        }

        return w;
      })
      .join(' '),
  );
}

function getWords(str: string): string[] {
  return flatten(
    str
      .replace(/[.,/#!$%^&*;:{}=\_~()"?«»…]/g, '')
      .replace(/('|’)\s*/g, '’ ')
      .split(' ')
      .filter((s) => Boolean(s))
      .map((word) => word.split('-')),
  );
}

export function parseVoieNom(
  value: string,
  addError: (error: string) => void,
  addRemed: (error: string) => void,
) {
  // SI CELA FAIT MOINS DE 3 OU PLUS QUE 200 CARACTERES
  if (value.length < 3) {
    addError('trop_court');
    return;
  } else if (value.length > 200) {
    addError('trop_long');
    return;
  }
  let remed: string = value;

  // SI CELA COMMENCE PAR ESPACE ' ou -
  if (trim(value, " '-") !== value) {
    addError('bad_caractere_start_end');
    remed = trim(remed, " '-");
  }

  // SI CARACTERE INVALIDE
  if (value.includes('�')) {
    addError('caractere_invalide');
    remed = remed.replace(/�/g, '');
  }

  if (value.match(/[.,/#!$%^&*;:{}=\~()"?«»…]/g)) {
    addError('ponctuation_invalide');
    remed = remed.replace(/[.,/#!$%^&*;:{}=\~()"?«»…]/g, '');
  }

  // SI PLUSIEURS ESPACE DE SUITE
  if (value.match(/\s\s+/g)) {
    addError('multi_space_caractere');
    remed = remed.replace(/\s\s+/g, ' ');
  }

  // // SI MOT OVNI
  // if (OVNI_WORDS.some((word) => value.toLowerCase().includes(word))) {
  //   addError('word_ovni');
  //   for (const ovni of OVNI_WORDS) {
  //     remed = remed.replaceAll(ovni, '');
  //   }
  // }

  const words: string[] = getWords(value);
  // SI TOUT EST EN MAJUSCULE OU SI IL Y A UN MOT TOUT EN MAJUSCULE
  if (value.toUpperCase() === value) {
    addError('casse_incorrecte');
    remed = fixCapitalize(value);
  } else if (
    words.some(
      (w) =>
        w.match(/[a-zA-Z]/) &&
        w.toUpperCase() === w &&
        !ALWAYS_UPPER.includes(w),
    )
  ) {
    addError('word_all_uppercase');
    remed = fixCapitalize(value);
  }

  // SI TOUT EST EN MINUSCULE SI IL Y A UN MOT TOUT EN MAJUSCULE
  if (value.toLowerCase() === value) {
    addError('casse_incorrecte');
    remed = fixCapitalize(value);
  } else if (
    words.some(
      (w) =>
        w.match(/[a-zA-Z]/) && w.toLowerCase() === w && !STOP_WORDS.includes(w),
    )
  ) {
    addError('word_all_lowercase');
    remed = fixCapitalize(value);
  }

  // SI IL Y A UNE ABREVATiON
  if (
    words.some(
      (w, i) =>
        (i !== 0 && Object.keys(EXPAND_WORD_TABLE).includes(w)) ||
        Object.keys(EXPAND_FIRST_WORD_TABLE).includes(w),
    )
  ) {
    addError('no_abbreviation');
    remed = fixAbbreviation(remed);
  }

  if (remed !== value) {
    addRemed(remed);
  }

  // AUTOFIX _
  if (value.includes('_')) {
    addError('contient_tiret_bas');
    value = value.replace(/_/g, ' ');
  }

  return value;
}
