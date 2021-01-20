/* eslint capitalized-comments: off */

module.exports = {
  // *
  '*.valeur_manquante': 'Le champ {} ne doit pas être vide',
  '*.valeur_invalide': 'Le valeur du champ {} est incorrecte',
  '*.espaces_debut_fin': 'La valeur du champ {} ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère',

  // cle_interop
  'cle_interop.casse_invalide': 'La clé d’interopérabilité doit être en minuscules',
  'cle_interop.structure_invalide': 'La clé d’interopérabilité doit contenir au moins 3 segments',
  'cle_interop.commune_invalide': 'Clé d’interopérabilité invalide (commune)',
  'cle_interop.voie_invalide': 'Clé d’interopérabilité invalide (voie)',
  'cle_interop.numero_invalide': 'Clé d’interopérabilité invalide (numéro)',
  'cle_interop.numero_prefixe_manquant': 'La partie numéro de la clé d’interopérabilité doit contenir 5 caractères',

  // numero
  'numero.type_invalide': 'La valeur du champ numéro doit être un nombre entier',
  'numero.contient_prefixe': 'La valeur du champ numéro ne doit pas être préfixée par des zéros',

  // suffixe
  'suffixe.debut_invalide': 'La valeur du champ suffixe doit commencer par un caractère alphanumérique.',

  // commune_insee
  'commune_insee.commune_invalide': 'Le code INSEE de la commune n’est pas un code valide de commune actuelle.',

  // commune_deleguee_insee
  'commune_deleguee_insee.commune_invalide': 'Le code INSEE de la commune n’est pas un code valide de commune ancienne (déléguée, associées ou périmée)',

  // x
  'x.separateur_decimal_invalide': 'Le séparateur des décimales du champ x doit être le point',

  // y
  'y.separateur_decimal_invalide': 'Le séparateur des décimales du champ y doit être le point',

  // long
  'long.separateur_decimal_invalide': 'Le séparateur des décimales du champ long doit être le point',

  // lat
  'lat.separateur_decimal_invalide': 'Le séparateur des décimales du champ lat doit être le point',

  // date_der_maj
  'date_der_maj.date_invalide': 'Date invalide',

  // row-level errors
  'row.incoherence_numero': 'Le numéro ne correspond pas à la valeur présente dans la clé',
  'row.position_manquante': 'Position nulle',
  'row.chef_lieu_invalide': 'La code INSEE de la commune courante ne correspond pas au chef lieu de la commune disparue renseignée'
}
