import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import { chain } from 'lodash';
import * as turf from '@turf/turf';
import {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from 'geojson';
import { getVoieIdentifier } from '../utils/helpers';
import {
  validateAdresseBanIds,
  validateUseBanIds,
  validateVoieBanIds,
} from './rows/ban_ids';
import { FantoirVoie } from '../utils/fantoir';

function validateRowsEmpty(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (rows.length <= 0) {
    addError('empty');
  }
}

function getFeaturesPointsByVoie(
  parsedRows: ValidateRowType[],
): Record<string, Array<Feature<Point>>> {
  return chain(parsedRows)
    .filter(
      ({ parsedValues }) =>
        parsedValues.numero !== 99_999 && parsedValues.long && parsedValues.lat,
    )
    .groupBy((row) => getVoieIdentifier(row))
    .mapValues((rows) => {
      return rows.map(({ parsedValues }) =>
        turf.point([parsedValues.long, parsedValues.lat]),
      );
    })
    .value();
}

function validateRowsCoords(rows: ValidateRowType[]) {
  try {
    // On créer un répètoire de features de points par voie
    const pointsByVoie = getFeaturesPointsByVoie(rows);

    for (const row of rows) {
      if (
        row.parsedValues.numero === 99_999 ||
        !row.parsedValues.long ||
        !row.parsedValues.lat
      ) {
        continue;
      }
      // On récupère les coordonnées du point de la ligne
      const currentPoint = turf.point([
        row.parsedValues.long,
        row.parsedValues.lat,
      ]);
      // On calcule chaques distance avec les autres points de la même voie (sauf 0 le même point)
      const voie = getVoieIdentifier(row);
      const distances = pointsByVoie[voie]
        .map((otherPoint) => turf.distance(currentPoint, otherPoint))
        .filter((distance) => distance > 0);
      // Si le point de la ligne esT distant de plus 1km de tous les autres points de la même voie
      if (distances.length > 0 && Math.min(...distances) > 1) {
        row.errors?.push({
          code: 'row.coord_outlier',
        });
      }
    }
  } catch (error) {
    console.error('Problème lors de la validation des coordonnées', error);
  }
}

function validateRowsCadastre(
  rows: ValidateRowType[],
  { cadastreGeoJSON }: { cadastreGeoJSON: FeatureCollection },
) {
  for (const row of rows) {
    if (row.parsedValues.cad_parcelles) {
      for (const parcelleId of row.parsedValues.cad_parcelles) {
        const parcelleExistInCommune = cadastreGeoJSON.features.some(
          (feature) => feature.id === parcelleId,
        );
        if (!parcelleExistInCommune) {
          row.errors?.push({
            code: 'row.cadastre_no_exist',
          });
        }
      }
    }
  }
}

function validateRowsCadastreNextToLongLat(
  rows: ValidateRowType[],
  { cadastreGeoJSON }: { cadastreGeoJSON: FeatureCollection },
) {
  try {
    for (const row of rows) {
      if (
        !row.parsedValues.long ||
        !row.parsedValues.lat ||
        !row.parsedValues.cad_parcelles
      ) {
        continue;
      }
      // On crée un point à partir des coordonnées de la ligne
      const point = turf.point([row.parsedValues.long, row.parsedValues.lat]);
      for (const parcelleId of row.parsedValues.cad_parcelles) {
        // On récupère le geoJSON de la parcelle dans le cadastre
        const parcellesGeoJSON = cadastreGeoJSON.features.find(
          (feature) => feature.id === parcelleId,
        );
        if (!parcellesGeoJSON) {
          continue;
        }
        // On créer un ligne a partir du polygone
        const lineString = turf.polygonToLine(
          parcellesGeoJSON as Feature<Polygon>,
        );
        // On calcule la distance entre le point et la ligne
        const distance = turf.pointToLineDistance(
          point,
          lineString as Feature<LineString>,
        );
        // Si la distance est supérieure à 1km, on ajoute un erreur
        if (distance > 0.5) {
          row.errors?.push({
            code: 'row.cadastre_outlier',
          });
        }
      }
    }
  } catch (error) {
    console.error('Problème lors de la validation du cadastre', error);
  }
}

function validateComplementIsDeclared(rows: ValidateRowType[]) {
  const complementDeclareds: Set<string> = new Set();

  for (const row of rows) {
    if (row.parsedValues.numero === Number(IS_TOPO_NB)) {
      complementDeclareds.add(row.parsedValues.voie_nom);
    }
  }
  for (const row of rows) {
    if (
      'lieudit_complement_nom' in row.parsedValues &&
      !complementDeclareds.has(row.parsedValues.lieudit_complement_nom)
    ) {
      row.errors?.push({
        code: 'row.lieudit_complement_nom_not_declared',
      });
    }
  }
}

function addRemediationCleInterop(
  row: ValidateRowType,
  { fantoirVoies, errors }: { fantoirVoies: FantoirVoie[]; errors: string[] },
) {
  const fantoirVoie = fantoirVoies.find(
    (voie) =>
      voie.libelleVoie === row.parsedValues.voie_nom.toUpperCase() ||
      voie.libelleVoieComplet === row.parsedValues.voie_nom.toUpperCase(),
  );
  if (fantoirVoie) {
    const codeVoie = `${row.parsedValues.commune_insee}_${fantoirVoie.codeRivoli}`;
    const codeNumero = `${String(row.parsedValues.numero).padStart(5, '0')}${row.parsedValues.suffixe ? `_${row.parsedValues.suffixe}` : ''}`;
    row.remediations.cle_interop = {
      errors,
      value: `${codeVoie}_${codeNumero}`.toLowerCase(),
    };
  }
}

function validateRowsFantoir(
  rows: ValidateRowType[],
  { fantoirVoies }: { fantoirVoies: FantoirVoie[] },
) {
  for (const row of rows) {
    if (!row.parsedValues.cle_interop) {
      addRemediationCleInterop(row, {
        fantoirVoies,
        errors: ['cle_interop.valeur_manquante', 'field.cle_interop.missing'],
      });
    }
  }
}

function validateRows(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
    cadastreGeoJSON,
    fantoirVoies,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
    cadastreGeoJSON: FeatureCollection | undefined;
    fantoirVoies: FantoirVoie[] | undefined;
  },
) {
  if (fantoirVoies) {
    validateRowsFantoir(rows, { fantoirVoies });
  }
  validateRowsEmpty(rows, { addError });
  validateRowsCoords(rows);
  if (cadastreGeoJSON) {
    validateRowsCadastre(rows, { cadastreGeoJSON });
    validateRowsCadastreNextToLongLat(rows, { cadastreGeoJSON });
  }
  validateUseBanIds(rows, { addError, mapCodeCommuneBanId });
  validateVoieBanIds(rows);
  validateAdresseBanIds(rows);
  validateComplementIsDeclared(rows);
}

export default validateRows;
