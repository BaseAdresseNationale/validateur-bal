const errorLabels: Record<string, string> = {
  // LES ERRORS files ET fields N'ONT PAS DE LABELS

  // VALUE LEVEL ERRORS

  // *
  '*.valeur_manquante': 'Le champ {} ne doit pas être vide',
  '*.valeur_invalide': 'La valeur du champ {} est incorrecte',
  '*.espaces_debut_fin':
    'La valeur du champ {} ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère',

  // cle_interop
  'cle_interop.casse_invalide':
    'La clé d’interopérabilité doit être en minuscules',
  'cle_interop.structure_invalide':
    'La clé d’interopérabilité doit contenir au moins 3 segments',
  'cle_interop.commune_invalide': 'Clé d’interopérabilité invalide (commune)',
  'cle_interop.commune_ancienne':
    'La commune référencée est une commune ancienne',
  'cle_interop.voie_invalide': 'Clé d’interopérabilité invalide (voie)',
  'cle_interop.numero_invalide': 'Clé d’interopérabilité invalide (numéro)',
  'cle_interop.numero_prefixe_manquant':
    'La partie numéro de la clé d’interopérabilité doit contenir 5 caractères',
  'cle_interop.voie_non_renseignee':
    'La partie voie de la clé d’interopératibilité a été laissée à nul (0000 ou xxxx)',

  // uid_adresse
  'uid_adresse.type_invalide': 'La valeur de uid_adresse n’est pas valide',
  'uid_adresse.incoherence_id_ban':
    'Les ids ban renseignés ne sont pas cohérents',

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
  'numero.trop_grand':
    'Le numéro doit être compris entre 0 et 9999 (sauf toponyme)',

  // suffixe
  'suffixe.debut_invalide':
    'La valeur du champ suffixe doit commencer par un caractère alphanumérique.',
  'suffixe.trop_long': 'La valeur du champ suffixe est trop longue',

  // voie_nom / voie_nom_@@ / lieudit_complement_nom / lieudit_complement_nom_@@
  '*.trop_court': 'Le champ {} est trop court (3 caractères minimum)',
  '*.trop_long': 'Le champ {} est trop long (200 caractères maximum)',
  '*.casse_incorrecte': 'Le champ {} est en majuscules ou minuscule',
  '*.contient_tiret_bas': 'Le champ {} contient un caractère tiret bas',
  '*.caractere_invalide': 'Le champ {} contient des caractères non valides',
  '*.bad_caractere_start_end':
    'Le champ {} contient de mauvais caractères en début et/ou fin',
  '*.ponctuation_invalide': 'Le champ {} contient de la ponctuation',
  '*.multi_space_caractere': 'Le champ {} contient plusieurs espace de suite',
  '*.word_uppercase': 'Le champ {} contient un ou des mots tout en majuscule',
  '*.word_lowercase': 'Le champ {} contient un ou des mots tout en minuscule',
  '*.abbreviation_invalid': 'Le champ {} contient des abreviation',
  '*.no_words_in_parentheses':
    'Le champ {} contient des mots entre parenthèses',
  '*.bad_point_at_the_end': 'Le champ {} contient un point a la fin',
  '*.bad_word_lieudit': 'Le champ {} contient le mot lieudit',
  '*.bad_multi_word_rue': 'Le champ {} contient plusieurs fois le mot rue',

  // commune_insee
  'commune_insee.commune_invalide':
    'Le code INSEE de la commune n’est pas un code ayant existé',
  'commune_insee.commune_ancienne':
    'Le code INSEE de la commune est le code d’une commune ancienne',

  // commune_deleguee_insee
  'commune_deleguee_insee.commune_invalide':
    'Le code INSEE renseigné n’est pas un code valide ou n’a jamais existé',
  'commune_deleguee_insee.commune_actuelle_non_deleguee':
    'Le code INSEE renseigné correspond au code d’une commune actuelle dont le chef lieu n’est pas une commune déléguée',
  'commune_deleguee_insee.commune_ancienne_non_deleguee':
    'Le code INSEE renseigné correspond au code d’une commune ancienne qui n’a pas le statut de commune déléguée',

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

  // ROW LEVEL ERRORS
  'row.incoherence_numero':
    'Le numéro ne correspond pas à la valeur présente dans la clé',
  'row.position_manquante': 'Position nulle',
  'row.chef_lieu_invalide':
    'La code INSEE de la commune courante ne correspond pas au chef lieu de la commune disparue renseignée',
  'row.commune_manquante': 'Aucun code commune valide n’est renseigné',
  'row.longlat_vides': 'Les coordonnées long/lat ne sont pas renseignées',
  'row.longlat_invalides':
    'Les coordonnées long/lat sont en dehors du territoire ou invalides',
  'row.longlat_xy_incoherents':
    'Les coordonnées long/lat et x/y ne sont pas cohérentes',
  'row.adresse_incomplete':
    'L’adresse est incomplète (numéro ou nom de la voie non renseignés)',
  'row.incoherence_id_ban': 'Les ids ban renseignés ne sont pas cohérents',
  'row.adresses_required_id_ban':
    'id_ban_adresses est requis les ids ban et le numero sont renseigné',

  // ROWS LEVEL ERROS
  'rows.empty': 'Aucune ligne détecté',
  'rows.every_line_required_id_ban':
    'Les ids ban sont requis pour toutes les lignes si ils sont utlisés',
  'rows.multi_id_ban_commune': 'Il ne pas y avoir differents id_ban_commune',
  'rows.complement_not_declared':
    'Un lieudit_complement_nom n’a pas été déclaré avec une ligne 99999',
};

export default errorLabels;
