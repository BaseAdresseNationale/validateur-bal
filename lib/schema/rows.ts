import { ValidateRowType } from '../validate/validate.type';
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
import { validateUseBanIds } from './rows/ban_ids';

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

function validateRows(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
    cadastreGeoJSON,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
    cadastreGeoJSON: FeatureCollection | undefined;
  },
) {
  validateRowsEmpty(rows, { addError });
  validateRowsCoords(rows);
  if (cadastreGeoJSON) {
    validateRowsCadastre(rows, { cadastreGeoJSON });
    validateRowsCadastreNextToLongLat(rows, { cadastreGeoJSON });
  }
  validateUseBanIds(rows, { addError, mapCodeCommuneBanId });
}

export default validateRows;
