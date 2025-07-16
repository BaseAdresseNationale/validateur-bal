/* eslint capitalized-comments: off */

const errorLabels: Record<string, string> = {
  // *
  '*.valeur_manquante': 'Le champ {} ne doit pas être vide',
  '*.valeur_invalide': 'La valeur du champ {} est incorrecte',
  '*.espaces_debut_fin':
    'La valeur du champ {} ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère',
  '*.caractere_invalide': 'Le champ {} contient des caractères non valides',

  // cle_interop
  'cle_interop.casse_invalide':
    'La clé d’interopérabilité doit être en minuscules',
  'cle_interop.structure_invalide':
    'La clé d’interopérabilité doit contenir au moins 3 segments',
  'cle_interop.commune_invalide': 'Clé d’interopérabilité invalide (commune)',
  'cle_interop.commune_ancienne':
    'Le commune INSEE référencée dans la clé d’interopérabilité est une commune ancienne',
  'cle_interop.voie_invalide': 'Clé d’interopérabilité invalide (voie)',
  'cle_interop.numero_invalide': 'Clé d’interopérabilité invalide (numéro)',
  'cle_interop.numero_prefixe_manquant':
    'La partie numéro de la clé d’interopérabilité doit contenir 5 caractères',
  'cle_interop.voie_non_renseignee':
    'La partie voie de la clé d’interopératibilité a été laissée à nul (0000 ou xxxx)',

  // uid_adresse
  'uid_adresse.type_invalide': 'La valeur de uid_adresse n’est pas valide',

  // id_ban_commune
  'id_ban_commune.type_invalide':
    'La valeur de id_ban_commune n’est pas un uuidv4 valide',

  // id_ban_toponyme
  'id_ban_toponyme.type_invalide':
    'La valeur de id_ban_toponyme n’est pas un uuidv4 valide',

  // id_ban_adresse
  'id_ban_adresse.type_invalide':
    'La valeur de id_ban_adresse n’est pas un uuidv4 valide',

  // numero
  'numero.type_invalide':
    'La valeur du champ numéro doit être un nombre entier',
  'numero.contient_prefixe':
    'La valeur du champ numéro ne doit pas être préfixée par des zéros',

  // suffixe
  'suffixe.debut_invalide':
    'La valeur du champ suffixe doit commencer par un caractère alphanumérique.',
  'suffixe.trop_long': 'La valeur du champ suffixe est trop longue',

  // voie_nom
  'voie_nom.trop_court':
    'Le nom de la voie est trop court (3 caractères minimum)',
  'voie_nom.trop_long':
    'Le nom de la voie est trop long (200 caractères maximum)',
  'voie_nom.casse_incorrecte': 'Le nom de la voie est en majuscules',
  'voie_nom.contient_tiret_bas':
    'Le nom de la voie contient un caractère tiret bas',

  // commune_insee
  'commune_insee.commune_invalide':
    'Le code INSEE de la commune n’est pas valide',
  'commune_insee.commune_ancienne':
    'Le code INSEE de la commune est le code d’une commune ancienne',

  // commune_deleguee_insee
  'commune_deleguee_insee.commune_invalide':
    'Le code INSEE de la commune déléguée renseigné n’est pas valide',

  // position
  'position.enum_fuzzy':
    'La valeur de la position a été acceptée mais n’est pas conforme à la spécification',

  // x
  'x.separateur_decimal_invalide':
    'Le séparateur des décimales du champ x doit être le point',

  // y
  'y.separateur_decimal_invalide':
    'Le séparateur des décimales du champ y doit être le point',

  // long
  'long.separateur_decimal_invalide':
    'Le séparateur des décimales du champ long doit être le point',

  // lat
  'lat.separateur_decimal_invalide':
    'Le séparateur des décimales du champ lat doit être le point',

  // date_der_maj
  'date_der_maj.date_invalide': 'Date invalide',
  'date_der_maj.date_ancienne': 'Date trop ancienne',
  'date_der_maj.date_future': 'Date dans le futur',

  // cad_parcelles
  'cad_parcelles.pipe_debut_fin':
    'Le symbole | ne doit pas être utilisé en début ou fin de chaîne',

  // ROW LEVEL ERROR
  'row.incoherence_numero':
    'Le numéro ne correspond pas à la valeur présente dans la clé',
  'row.voie_nom_have_same_lieudit_complement_nom':
    'Le nom de la voie et le nom du lieudit complémentaire sont identiques',
  'row.position_manquante': 'Position nulle',
  'row.chef_lieu_invalide':
    'La code INSEE de la commune courante ne correspond pas au chef lieu de la commune precedente renseignée',
  'row.commune_manquante': 'Aucun code commune valide n’est renseigné',
  'row.commune_nom_invalide': 'Le nom de la commune est invalide',
  'row.longlat_vides': 'Les coordonnées long/lat ne sont pas renseignées',
  'row.longlat_invalides':
    'Les coordonnées long/lat sont en dehors du territoire ou invalides',
  'row.longlat_xy_incoherents':
    'Les coordonnées long/lat et x/y ne sont pas cohérentes',
  'row.adresse_incomplete':
    'L’adresse est incomplète (numéro ou nom de la voie non renseignés)',
  'row.lack_of_id_ban': 'Il manque un ou plusieurs ids ban sur la ligne',
  'row.cog_no_match_id_ban_commune':
    'Le code_insee ne correspond pas au bon id_ban_commune',
  // ROWS LEVEL ERROR
  'rows.empty': 'Aucune ligne détecté',
  'rows.multi_id_ban_commune':
    'Il ne peut pas y avoir differents id_ban_commune',
  'rows.every_line_required_id_ban':
    'Les ids ban sont requis pour toutes les lignes si ils sont utilisés',
};

export default errorLabels;
