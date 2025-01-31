import proj from "@etalab/project-legal";
import { getCommuneActuelle } from "../utils/cog";
import { ValidateRowType } from "../validate/rows";

function harmlessProj(coordinates) {
  try {
    return proj(coordinates);
  } catch {
    // empty
  }
}

function validateCoords(row, { addError }) {
  if (
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    (!row.rawValues.long || !row.rawValues.lat)
  ) {
    addError("longlat_vides");
  }

  const { long, lat, x, y } = row.parsedValues;

  if (long !== undefined && lat !== undefined) {
    const projectedCoordInMeters = harmlessProj([long, lat]);

    if (projectedCoordInMeters) {
      if (x !== undefined && y !== undefined) {
        const distance = Math.sqrt(
          (x - projectedCoordInMeters[0]) ** 2 +
            (y - projectedCoordInMeters[1]) ** 2
        );
        const tolerance = 10;

        if (distance > tolerance) {
          addError("longlat_xy_incoherents");
        }
      }
    } else {
      // Not in France or error
      addError("longlat_invalides");
    }
  }
}

function checkBanIds(row, addError) {
  // SI IL Y A UN id_ban_toponyme, IL Y A UN id_ban_commune
  // SI IL Y A UN id_ban_adresse, IL Y A UN id_ban_toponyme ET DONC IL Y A IL Y A UN id_ban_commune
  if (
    (!row.parsedValues.id_ban_commune && row.parsedValues.id_ban_toponyme) ||
    ((!row.parsedValues.id_ban_commune || !row.parsedValues.id_ban_toponyme) &&
      row.parsedValues.id_ban_adresse)
  ) {
    addError("incoherence_ids_ban");
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
    addError("incoherence_ids_ban");
  }

  // SI IL Y A UN id_ban_toponyme, id_ban_commune ET UN numero, IL FAUT UN id_ban_adresse
  if (
    row.parsedValues.id_ban_commune &&
    row.parsedValues.id_ban_toponyme &&
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    !row.parsedValues.id_ban_adresse
  ) {
    addError("id_ban_adresses_required");
  }
}

function validateRow(
  row: ValidateRowType,
  { addError }: { addError: (code: string) => void }
) {
  if (row.parsedValues.cle_interop && row.parsedValues.numero) {
    const { numeroVoie } = row.additionalValues.cle_interop;
    if (Number.parseInt(numeroVoie, 10) !== row.parsedValues.numero) {
      addError("incoherence_numero");
    }
  }

  if (!row.parsedValues.cle_interop && !row.parsedValues.commune_insee) {
    addError("commune_manquante");
  }

  if (
    row.parsedValues.numero &&
    row.parsedValues.numero !== 99_999 &&
    !row.rawValues.position
  ) {
    addError("position_manquante");
  }

  validateCoords(row, { addError });

  if (row.parsedValues.numero === undefined || !row.parsedValues.voie_nom) {
    addError("adresse_incomplete");
  }

  if (
    row.parsedValues.commune_deleguee_insee &&
    row.parsedValues.commune_insee
  ) {
    const codeCommune = row.parsedValues.commune_insee;
    const codeAncienneCommune = row.parsedValues.commune_deleguee_insee;
    const communeActuelle = getCommuneActuelle(codeAncienneCommune as string);

    if (communeActuelle && communeActuelle.code !== codeCommune) {
      addError("chef_lieu_invalide");
    }
  }

  checkBanIds(row, addError);
}

export default validateRow;
