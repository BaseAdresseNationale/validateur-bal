import proj from '@etalab/project-legal';
import { format } from 'date-fns';
import { getCommune } from '../utils/cog';
import { ValidateRowType } from '../validate/validate.type';
import { RemediationValue } from './shema.type';
import { getErrorMissingOrValeurManquante } from '../utils/remediation';

export function getCodeCommune(row: ValidateRowType) {
  return (
    row.parsedValues.commune_insee ||
    row.additionalValues?.cle_interop?.codeCommune
  );
}

function validateNumero(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  if (row.parsedValues.cle_interop && row.parsedValues.numero) {
    const { numeroVoie } = row.additionalValues.cle_interop;
    if (Number.parseInt(numeroVoie, 10) !== row.parsedValues.numero) {
      addError('incoherence_numero');
    }
  }
}

function validateCommuneInsee(
  row: ValidateRowType,
  {
    addError,
    addRemediation,
  }: {
    addError: (code: string) => void;
    addRemediation: <T>(key: string, remediation: RemediationValue<T>) => void;
  },
) {
  if (!row.parsedValues.cle_interop && !row.parsedValues.commune_insee) {
    addError('commune_manquante');
  } else if (
    row.parsedValues.cle_interop &&
    row.additionalValues?.cle_interop?.codeCommune &&
    !row.parsedValues.commune_insee
  ) {
    addRemediation('commune_insee', {
      errors: [getErrorMissingOrValeurManquante('commune_insee', row)],
      value: row.additionalValues?.cle_interop?.codeCommune,
    });
    const commune = getCommune(row.additionalValues?.cle_interop?.codeCommune);
    addRemediation<string>('commune_nom', {
      errors: [getErrorMissingOrValeurManquante('commune_nom', row)],
      value: commune?.nom,
    });
  } else if (!row.parsedValues.commune_nom) {
    const commune = getCommune(row.parsedValues.commune_insee);
    addRemediation<string>('commune_nom', {
      errors: [getErrorMissingOrValeurManquante('commune_nom', row)],
      value: commune?.nom,
    });
  }
}

function validatePositionType(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QU'IL Y A UN TYPE POSITION SI C'EST BIEN UN NUMERO (NON UN TOPONYME)
  if (
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    !row.rawValues.position
  ) {
    addError('position_manquante');
  }
}

function harmlessProj(coordinates): any {
  try {
    return proj(coordinates);
  } catch {
    // empty
  }
}

function validateCoords(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QU'IL Y AI LONG/LAT SI C'EST UN NUMERO (NON TOPONYME)
  if (
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    (!row.rawValues.long || !row.rawValues.lat)
  ) {
    addError('longlat_vides');
  }

  const long: number = row.parsedValues.long as number;
  const lat: number = row.parsedValues.lat as number;
  const x: number = row.parsedValues.x as number;
  const y: number = row.parsedValues.y as number;

  if (long !== undefined && lat !== undefined) {
    const projectedCoordInMeters = harmlessProj([long, lat]);
    if (projectedCoordInMeters) {
      if (x !== undefined && y !== undefined) {
        const distance = Math.sqrt(
          (x - projectedCoordInMeters[0]) ** 2 +
            (y - projectedCoordInMeters[1]) ** 2,
        );
        const tolerance = 10;

        // ON VERIFIE QUE LES COORDONEE long/lat SONT COHERENTE AVEC x/y
        if (distance > tolerance) {
          addError('longlat_xy_incoherents');
        }
      }
    } else {
      // LES COORDONEE NE SONT PAS EN FRANCE
      addError('longlat_invalides');
    }
  }
}

function validateMinimalAdress(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QU'IL Y AI UN NUMERO ET UN NOM DE VOIE
  if (row.parsedValues.numero === undefined || !row.parsedValues.voie_nom) {
    addError('adresse_incomplete');
  }
}

function validateCommuneDelegueeInsee(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  // Si il n'y a pas de commune_deleguee_insee pas d'erreur
  if (!row.parsedValues.commune_deleguee_insee) {
    return;
  }
  const errorCommuneDelegueeInsee =
    row.errors?.filter(({ schemaName }) =>
      ['commune_deleguee_insee', 'commune_insee'].includes(schemaName),
    ) || [];
  // Si il y a deja des erreur sur le commune_deleguee_insee on en rajoute pas
  if (errorCommuneDelegueeInsee.length > 0) {
    return;
  }
  // Si il y a pas de code_insee impossible de calculer l'erreur sur commune_deleguee_insee
  const codeCommune = getCodeCommune(row);
  if (!codeCommune) {
    return;
  }
  const commune = getCommune(codeCommune);

  if (
    !commune.anciensCodes?.includes(row.parsedValues.commune_deleguee_insee) &&
    row.parsedValues.commune_deleguee_insee != codeCommune
  ) {
    addError('chef_lieu_invalide');
  }
}

function validateBanIds(
  row: ValidateRowType,
  {
    addError,
  }: {
    addError: (code: string) => void;
  },
) {
  const idBanCommune =
    row.parsedValues.id_ban_commune ||
    row.additionalValues?.uid_adresse?.idBanCommune;
  const idBanToponyme =
    row.parsedValues.id_ban_toponyme ||
    row.additionalValues?.uid_adresse?.idBanToponyme;
  const idBanAdresse =
    row.parsedValues.id_ban_adresse ||
    row.additionalValues?.uid_adresse?.idBanAdresse;

  // Si au moins un des ID est présent, cela signifie que l'adresse BAL utilise BanID
  if (idBanCommune || idBanToponyme || idBanAdresse) {
    if (!idBanCommune) {
      addError('lack_of_id_ban');
    }
    if (!idBanToponyme) {
      addError('lack_of_id_ban');
    }
    if (!idBanAdresse && row.parsedValues.numero !== 99_999) {
      addError('lack_of_id_ban');
    }
  }
}

function validateDateDerMaj(
  row: ValidateRowType,
  {
    addRemediation,
  }: {
    addRemediation: <T>(key: string, remediation: RemediationValue<T>) => void;
  },
) {
  if (!row.parsedValues.date_der_maj && !row.remediations?.date_der_maj) {
    addRemediation('date_der_maj', {
      errors: [getErrorMissingOrValeurManquante('date_der_maj', row)],
      value: format(new Date(), 'yyyy-MM-dd'),
    });
  }
}

function validateRow(
  row: ValidateRowType,
  {
    addError,
    addRemediation,
  }: {
    addError: (code: string) => void;
    addRemediation: <T>(key: string, remediation: RemediationValue<T>) => void;
  },
) {
  validateNumero(row, { addError });
  validateCommuneInsee(row, { addError, addRemediation });
  validatePositionType(row, { addError });
  validateCoords(row, { addError });
  validateMinimalAdress(row, { addError });
  validateCommuneDelegueeInsee(row, { addError });
  validateBanIds(row, { addError });
  validateDateDerMaj(row, { addRemediation });
}

export default validateRow;
