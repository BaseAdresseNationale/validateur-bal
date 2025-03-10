import { trim, words as getWords } from 'lodash';
import { ParseFunctionArg } from '../fields';

const LIEU_WORD = 'lieu';
const DIT_WORD = 'dit';

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

function fixCapitalize(words: string[]): string[] {
  return words.map((word) =>
    word
      .split('-')
      .map((w) => eventuallyCapitalize(w))
      .join('-'),
  );
}

function fixAbbreviation(words: string[]): string[] {
  return words.map((w, i) => {
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
  });
}

function fixWordLieuDit(words: string[]) {
  if (words.length < 2) {
    return words;
  } else if (words[0] === `${LIEU_WORD}${DIT_WORD}`) {
    return words.slice(1);
  } else if (words[0] === LIEU_WORD && words[1] === DIT_WORD) {
    return words.slice(2);
  }

  return words;
}

function fixMultiWordRue(words: string[]) {
  if (words.length === 1) {
    return words;
  } else if (
    words[0] === 'rue' &&
    words.slice(1).some((w) => w.endsWith('rue'))
  ) {
    return words.slice(1);
  }

  return words;
}

export function remediationVoieNom(str: string): string {
  const strBeautify: string = trim(
    str
      .replace(/�/g, '')
      .replace(/\s\s+/g, ' ')
      .replace(/[.,/#!$%^&*;:{}=\_~()"?«»…]/g, '')
      .replace(/('|’)\s*/g, '’ '),
    " '-",
  );

  let words: string[] = getWords(strBeautify).map((w) => w.toLowerCase());

  words = fixMultiWordRue(words);
  words = fixWordLieuDit(words);
  words = fixAbbreviation(words);
  words = fixCapitalize(words);

  return capitalize(words.join(' '));
}

export function parseVoieNom(
  value: string,
  { addError, setRemediation }: ParseFunctionArg,
) {
  const errors: string[] = [];

  // SI CELA FAIT MOINS DE 3 OU PLUS QUE 200 CARACTERES
  if (value.length < 3) {
    addError('trop_court');
    return undefined;
  } else if (value.length > 200) {
    addError('trop_long');
    return undefined;
  }
  // SI CARACTERE INVALIDE
  if (value.includes('�')) {
    addError('caractere_invalide');
    return undefined;
  }

  // AUTOFIX _
  if (value.includes('_')) {
    errors.push('contient_tiret_bas');
    value = value.replace(/_/g, ' ');
  }

  // SI CELA COMMENCE PAR ESPACE ' ou -
  if (trim(value, " '-") !== value) {
    errors.push('bad_caractere_start_end');
  }

  if (value.match(/[.,/#!$%^&*;:{}=\~()"?«»…]/g)) {
    errors.push('ponctuation_invalide');
  }

  // SI PLUSIEURS ESPACE DE SUITE
  if (value.match(/\s\s+/g)) {
    errors.push('multi_space_caractere');
  }

  const words: string[] = getWords(value);
  const lowerWords: string[] = words.map((w) => w.toLowerCase());
  // SI CELA COMMENCE PAR LIEU DIT
  if (
    lowerWords.length > 1 &&
    (lowerWords[0] === `${LIEU_WORD}${DIT_WORD}` ||
      (lowerWords[0] === LIEU_WORD && lowerWords[1] === DIT_WORD))
  ) {
    errors.push('bad_word_lieudit');
  }
  // SI IL Y A PLUSIEURS FOIS LE MOT RUE
  if (
    lowerWords.length > 1 &&
    lowerWords[0] === 'rue' &&
    lowerWords.slice(1).some((w) => w.endsWith('rue'))
  ) {
    errors.push('bad_multi_word_rue');
  }
  // SI TOUT EST EN MAJUSCULE OU SI IL Y A UN MOT TOUT EN MAJUSCULE
  if (value.toUpperCase() === value) {
    errors.push('casse_incorrecte');
  } else if (
    words.some(
      (w) =>
        w.match(/[a-zA-Z]/) &&
        w.toUpperCase() === w &&
        !ALWAYS_UPPER.includes(w),
    )
  ) {
    errors.push('word_uppercase');
  }

  // SI TOUT EST EN MINUSCULE SI IL Y A UN MOT TOUT EN MAJUSCULE
  if (value.toLowerCase() === value) {
    errors.push('casse_incorrecte');
  } else if (
    words.some(
      (w) =>
        w.match(/[a-zA-Z]/) && w.toLowerCase() === w && !STOP_WORDS.includes(w),
    )
  ) {
    errors.push('word_lowercase');
  }

  // SI IL Y A UNE ABREVATiON
  if (
    lowerWords.some(
      (w, i) =>
        (i !== 0 && Object.keys(EXPAND_WORD_TABLE).includes(w)) ||
        Object.keys(EXPAND_FIRST_WORD_TABLE).includes(w),
    )
  ) {
    errors.push('abbreviation_invalid');
  }

  if (errors.length > 0) {
    const remediation = remediationVoieNom(value);
    setRemediation(remediation);
    for (const error of errors) {
      addError(error);
    }
  }

  return value;
}
