import proj from '@etalab/project-legal';
import { getCommuneActuelle } from '../utils/cog';
import { ValidateRowType } from '../validate/rows';

function harmlessProj(coordinates: [number, number]) {
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

function validateBanIds(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  // SI IL Y A UN id_ban_toponyme, IL Y A UN id_ban_commune
  // SI IL Y A UN id_ban_adresse, IL Y A UN id_ban_toponyme ET DONC IL Y A IL Y A UN id_ban_commune
  if (
    (!row.parsedValues.id_ban_commune && row.parsedValues.id_ban_toponyme) ||
    ((!row.parsedValues.id_ban_commune || !row.parsedValues.id_ban_toponyme) &&
      row.parsedValues.id_ban_adresse)
  ) {
    addError('incoherence_ids_ban');
  }

  // LES IDS id_ban_commune / id_ban_toponyme / id_ban_adresse NE PEUVENT PAS ËTRE IDENTIQUES
  if (
    (row.parsedValues.id_ban_commune &&
      row.parsedValues.id_ban_toponyme &&
      row.parsedValues.id_ban_commune === row.parsedValues.id_ban_toponyme) ||
    (row.parsedValues.id_ban_commune &&
      row.parsedValues.id_ban_adresse &&
      row.parsedValues.id_ban_commune === row.parsedValues.id_ban_adresse) ||
    (row.parsedValues.id_ban_adresse &&
      row.parsedValues.id_ban_toponyme &&
      row.parsedValues.id_ban_toponyme === row.parsedValues.id_ban_adresse)
  ) {
    addError('incoherence_ids_ban');
  }

  // SI IL Y A UN id_ban_toponyme, id_ban_commune ET UN numero, IL FAUT UN id_ban_adresse
  if (
    row.parsedValues.id_ban_commune &&
    row.parsedValues.id_ban_toponyme &&
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    !row.parsedValues.id_ban_adresse
  ) {
    addError('id_ban_adresses_required');
  }
}

function validateCleInterop(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  if (row.parsedValues.cle_interop && row.parsedValues.numero) {
    const { numeroVoie } = row.additionalValues.cle_interop;
    if (Number.parseInt(numeroVoie, 10) !== row.parsedValues.numero) {
      addError('incoherence_numero');
    }
  }

  if (!row.parsedValues.cle_interop && !row.parsedValues.commune_insee) {
    addError('commune_manquante');
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
  // VERIFIE QUE LE commune_insee_deleguee SOIT UNE ANCIEN COMMUNE DU commune_insee
  if (
    row.parsedValues.commune_deleguee_insee &&
    row.parsedValues.commune_insee
  ) {
    const codeCommune = row.parsedValues.commune_insee;
    const codeAncienneCommune = row.parsedValues.commune_deleguee_insee;
    const communeActuelle = getCommuneActuelle(codeAncienneCommune as string);

    if (communeActuelle && communeActuelle.code !== codeCommune) {
      addError('chef_lieu_invalide');
    }
  }
}

function validateRow(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void },
) {
  validateCleInterop(row, { addError });
  validatePositionType(row, { addError });
  validateCoords(row, { addError });
  validateMinimalAdress(row, { addError });
  validateCommuneDelegueeInsee(row, { addError });
  validateBanIds(row, { addError });
}

export default validateRow;
