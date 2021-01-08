/* eslint capitalized-comments: off */

module.exports = {
  // *
  '*.valeur_manquante': 'Le champ {} ne doit pas être vide',
  '*.valeur_invalide': 'Le valeur du champ {} est incorrecte',

  // cle_interop
  'cle_interop.casse_invalide': 'La clé d’interopérabilité doit être en minuscules',
  'cle_interop.structure_invalide': 'La clé d’interopérabilité doit contenir au moins 3 segments',
  'cle_interop.commune_invalide': 'Clé d’interopérabilité invalide (commune)',
  'cle_interop.voie_invalide': 'Clé d’interopérabilité invalide (voie)',
  'cle_interop.numero_invalide': 'Clé d’interopérabilité invalide (numéro)',
  'cle_interop.numero_prefixe_manquant': 'La partie numéro de la clé d’interopérabilité doit contenir 5 caractères',

  // voie_nom
  'voie_nom.vide': 'Le nom de la voie doit contenir au moins un caractère alpha-numérique.',

  // numero
  'numero.type_invalide': 'La valeur du champ numéro doit être un nombre entier',
  'numero.contient_prefixe': 'La valeur du champ numéro ne doit pas être préfixée par des zéros',

  // suffixe
  'suffixe.espaces_debut_fin': 'La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère',
  'suffixe.debut_invalide': 'La valeur du champ suffixe doit commencer par un caractère alphanumérique.',

  // commune_insee
  'commune_insee.espaces_debut_fin': 'La valeur du champ commune_insee ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère',
  'commune_insee.commune_invalide': 'Le code INSEE de la commune n’est pas un code valide de commune actuelle.',

  // x
  'x.separateur_decimal_invalide': 'Le séparateur des décimales du champ x doit être le point',
  'x.valeur_invalide': 'Impossible d’interpréter la valeur du champ x',

  // y
  'y.separateur_decimal_invalide': 'Le séparateur des décimales du champ y doit être le point',
  'y.valeur_invalide': 'Impossible d’interpréter la valeur du champ y',

  // long
  'long.separateur_decimal_invalide': 'Le séparateur des décimales du champ long doit être le point',
  'long.valeur_invalide': 'Impossible d’interpréter la valeur du champ long',

  // lat
  'lat.separateur_decimal_invalide': 'Le séparateur des décimales du champ lat doit être le point',
  'lat.valeur_invalide': 'Impossible d’interpréter la valeur du champ lat',

  // date_der_maj
  'date_der_maj.date_invalide': 'Date invalide',

  // row-level errors
  'row.incoherence_numero': 'Le numéro ne correspond pas à la valeur présente dans la clé',
  'row.position_manquante': 'Position nulle'
}
