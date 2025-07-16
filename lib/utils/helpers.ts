import languesRegionales from '@ban-team/shared-data/langues-regionales.json';
import { normalize } from '@ban-team/adresses-util/lib/voies';

import profiles from '../schema/profiles';
import errorLabels from '../schema/error-labels';
import Schema from '../schema/index';
import { ProfileType } from '../schema/profiles/profile.type';
import { ValidateRowType } from '../validate/validate.type';

export enum ErrorLevelEnum {
  ERROR = 'E',
  WARNING = 'W',
  INFO = 'I',
}

export function getCodeCommune(row: ValidateRowType) {
  return (
    row.parsedValues.commune_insee ||
    row.additionalValues?.cle_interop?.codeCommune
  );
}

export function getVoieIdentifier({ parsedValues }: ValidateRowType) {
  return `${normalize(parsedValues.voie_nom)}#${parsedValues.commune_deleguee_insee}`;
}

export function getNumeroIdentifier({ parsedValues }: ValidateRowType) {
  return `${parsedValues.numero}#${parsedValues.suffixe}#${parsedValues.voie_nom}#${parsedValues.commune_deleguee_insee}`;
}

// On fait une liste des langues régional que l'on peut utiliser
export const allowedRegionalLangs: string[] = languesRegionales.map(
  (l) => l.code,
);

// On fait une map pour faire correspondre les erreur générique
const endsWithErrorLabels: Record<string, (submittedCode: string) => string> =
  {};

for (const c of Object.keys(errorLabels)) {
  if (c.includes('*') && c.startsWith('*.')) {
    endsWithErrorLabels[c.slice(2)] = (submittedCode) => {
      const [value] = submittedCode.split('.');
      return errorLabels[c].replace('{}', value);
    };
  }
}

export function parseLocalizedField(fieldName: string): {
  locale: string;
  schemaName: string;
} {
  // On cherche si le fieldName termine par _lang
  const locale = allowedRegionalLangs.find((l) => fieldName.endsWith('_' + l));

  if (!locale) {
    return;
  }
  // On récupère le nom du champ sans la langue
  const schemaName: string = fieldName.slice(0, -(locale.length + 1));
  // Si le champ est autorisé a avoir une langue régional on return le nom du champ et la langue
  if (
    Schema.fields[schemaName] &&
    Schema.fields[schemaName].allowRegionalLang
  ) {
    return { locale, schemaName };
  }
}

export function parseErrorCode(code: string): {
  prefix?: string;
  code?: string;
  schemaName?: string;
  locale?: string;
  fieldName?: string;
  fieldError?: string;
} {
  const parts = code.split('.');

  // On détermine si l'erreur vient du fichier, de la lignes, d'un champ ou de plusieurs lignes
  if (parts[0] === 'file') {
    return { prefix: 'file', code };
  }

  if (parts[0] === 'row') {
    return { prefix: 'row', code };
  }

  if (parts[0] === 'field') {
    return { prefix: 'field', code };
  }

  if (parts[0] === 'rows') {
    return { prefix: 'rows', code };
  }

  // On recupère le nom du champ et l'erreur
  const fieldName = parts[0];
  const fieldError = parts[1];

  const localizedField = parseLocalizedField(fieldName);

  if (localizedField) {
    return { fieldName, fieldError, ...localizedField };
  }

  if (!Schema.fields[fieldName]) {
    throw new Error('Unknown fieldName: ' + fieldName);
  }

  return { schemaName: fieldName, fieldError };
}

export function getErrorLevel(
  profileName: string,
  code: string,
): ErrorLevelEnum {
  const profile: ProfileType = profiles[profileName];
  const { schemaName, locale, fieldError } = parseErrorCode(code);
  // On rajoute @@ si il y a une langue
  const codeToCompare = locale ? `${schemaName}_@@.${fieldError}` : code;

  if (profile.errors.includes(codeToCompare)) {
    return ErrorLevelEnum.ERROR;
  }

  if (profile.warnings.includes(codeToCompare)) {
    return ErrorLevelEnum.WARNING;
  }

  return ErrorLevelEnum.INFO;
}

function getIfMissingColumn(code: string): string | null {
  const parts = code.split('.');
  if (parts[0] === 'field' && parts[2] === 'missing') {
    return `La colonne ${parts[1]} n’existe pas`;
  }

  return null;
}

export function getLabel(code: string) {
  // On récupère le code simple (sans langue) pour déterminer le label
  const { schemaName, locale, fieldError } = parseErrorCode(code);
  const codeToUser = locale ? `${schemaName}.${fieldError}` : code;

  // Si le code corrspond a un errorLabel on le retourne
  if (codeToUser in errorLabels) {
    return errorLabels[codeToUser] + (locale ? ` [${locale}]` : '');
  }

  // On vérifie si c'est un errorLabel générique (pour plusieurs code erreurs)
  const endsWithCandidate = Object.keys(endsWithErrorLabels).find((pattern) =>
    codeToUser.endsWith(pattern),
  );

  // On le retourne si c'est le cas
  if (endsWithCandidate) {
    return endsWithErrorLabels[endsWithCandidate](codeToUser);
  }

  // On retourne si c'est un champ qui manque
  const missingColumn = getIfMissingColumn(code);
  if (missingColumn) {
    return missingColumn;
  }

  return code;
}
