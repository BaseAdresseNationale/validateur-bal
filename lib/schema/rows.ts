import { IS_TOPO_NB, ValidateRowType } from '../validate/validate.type';
import { getCodeCommune } from './row';
import { normalize } from '@ban-team/adresses-util/lib/voies';
import { chain } from 'lodash';
import { v4 as uuid } from 'uuid';
import * as turf from '@turf/turf';
import {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from 'geojson';

function validateRowsEmpty(
  rows: ValidateRowType[],
  { addError }: { addError: (code: string) => void },
) {
  // VERIFIE QUE LE FICHIER N'EST PAS VIDE
  if (rows.length <= 0) {
    addError('empty');
  }
}

function getVoieIdentifier({ parsedValues }: ValidateRowType) {
  return `${normalize(parsedValues.voie_nom)}#${parsedValues.commune_deleguee_insee}`;
}

function getNumeroIdentifier({ parsedValues }: ValidateRowType) {
  return `${parsedValues.numero}#${parsedValues.suffixe}#${parsedValues.voie_nom}#${parsedValues.commune_deleguee_insee}`;
}

function getMapNameVoieBanId(
  parsedRows: ValidateRowType[],
): Record<string, string> {
  return chain(parsedRows)
    .groupBy((row) => getVoieIdentifier(row))
    .mapValues((rows) => {
      const rowWithValue = rows.find(
        (row) =>
          row.parsedValues.id_ban_toponyme ||
          row.additionalValues?.uid_adresse?.idBanToponyme,
      );
      if (rowWithValue) {
        return (
          rowWithValue.parsedValues.id_ban_toponyme ||
          rowWithValue.additionalValues?.uid_adresse?.idBanToponyme
        );
      }
      return uuid();
    })
    .value();
}

function getMapNumeroBanId(
  parsedRows: ValidateRowType[],
): Record<string, string> {
  return chain(parsedRows)
    .filter(({ parsedValues }) => parsedValues.numero !== 99_999)
    .groupBy((row) => getNumeroIdentifier(row))
    .mapValues((rows) => {
      const rowWithValue = rows.find(
        (row) =>
          row.parsedValues.id_ban_adresse ||
          row.additionalValues?.uid_adresse?.idBanAdresse,
      );
      if (rowWithValue) {
        return (
          rowWithValue.parsedValues.id_ban_adresse ||
          rowWithValue.additionalValues?.uid_adresse?.idBanAdresse
        );
      }
      return uuid();
    })
    .value();
}

function getErrorIdBanCorrected(field: string): string[] {
  return [
    `field.${field}.missing`,
    `id_ban_${field}.valeur_manquante`,
    'row.lack_of_id_ban',
    'rows.every_line_required_id_ban',
  ];
}

function remediationBanIds(
  row: ValidateRowType,
  { idBanCommune, idBanToponyme, idBanAdresse },
  {
    mapCodeCommuneBanId,
    mapNomVoieBanId,
    mapNumeroBanId,
  }: {
    mapCodeCommuneBanId: Record<string, string> | undefined;
    mapNomVoieBanId: Record<string, string>;
    mapNumeroBanId: Record<string, string>;
  },
) {
  const codeCommune = getCodeCommune(row);
  if (!idBanCommune && mapCodeCommuneBanId) {
    row.remediations.id_ban_commune = {
      errors: getErrorIdBanCorrected('id_ban_commune'),
      value: mapCodeCommuneBanId[codeCommune],
    };
  }
  if (!idBanToponyme) {
    row.remediations.id_ban_toponyme = {
      errors: getErrorIdBanCorrected('id_ban_toponyme'),
      value: mapNomVoieBanId[getVoieIdentifier(row)],
    };
  }
  if (!idBanAdresse && row.parsedValues.numero !== 99_999) {
    row.remediations.id_ban_adresse = {
      errors: getErrorIdBanCorrected('id_ban_adresse'),
      value: mapNumeroBanId[getNumeroIdentifier(row)],
    };
  }
}

function getBanIdsFromRow(row: ValidateRowType) {
  return {
    idBanCommune:
      row.parsedValues.id_ban_commune ||
      row.additionalValues?.uid_adresse?.idBanCommune,
    idBanToponyme:
      row.parsedValues.id_ban_toponyme ||
      row.additionalValues?.uid_adresse?.idBanToponyme,
    idBanAdresse:
      row.parsedValues.id_ban_adresse ||
      row.additionalValues?.uid_adresse?.idBanAdresse,
  };
}

function validateUseBanIds(
  rows: ValidateRowType[],
  {
    addError,
    mapCodeCommuneBanId,
  }: {
    addError: (code: string) => void;
    mapCodeCommuneBanId: Record<string, string>;
  },
) {
  const mapNomVoieBanId = getMapNameVoieBanId(rows);
  const mapNumeroBanId = getMapNumeroBanId(rows);
  const districtIDs = new Set();
  let balAdresseUseBanId = 0;

  for (const row of rows) {
    const { idBanCommune, idBanToponyme, idBanAdresse } = getBanIdsFromRow(row);
    const numero = row.parsedValues.numero;

    // On verifie que l'idBanCommune correspond bien a celui délivré par l'api BAN
    const communeInsee = getCodeCommune(row);
    if (
      idBanCommune &&
      mapCodeCommuneBanId[communeInsee] &&
      mapCodeCommuneBanId[communeInsee] !== idBanCommune
    ) {
      row.errors?.push({
        code: 'row.cog_no_match_id_ban_commune',
      });
    }

    if (
      idBanCommune &&
      idBanToponyme &&
      (idBanAdresse || (!idBanAdresse && numero === Number(IS_TOPO_NB)))
    ) {
      balAdresseUseBanId++;
      districtIDs.add(idBanCommune);
    } else {
      remediationBanIds(
        row,
        { idBanCommune, idBanToponyme, idBanAdresse },
        { mapCodeCommuneBanId, mapNomVoieBanId, mapNumeroBanId },
      );
    }
  }
  if (balAdresseUseBanId === rows.length) {
    // Check district IDs consistency
    if (districtIDs.size > 1) {
      addError('multi_id_ban_commune');
    }
    return true;
  } else if (balAdresseUseBanId > 0) {
    addError('every_line_required_id_ban');
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
