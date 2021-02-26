const errors = [
  'cle_interop.valeur_manquante',
  'cle_interop.structure_invalide',
  'cle_interop.commune_invalide',
  'cle_interop.numero_invalide',
  'voie_nom.valeur_manquante',
  'numero.valeur_manquante',
  'numero.type_invalide',
  'suffixe.debut_invalide',
  'commune_insee.commune_invalide',
  'x.valeur_invalide',
  'y.valeur_invalide',
  'long.valeur_invalide',
  'lat.valeur_invalide',
  'row.incoherence_numero',
  'row.commune_manquante',
  'row.longlat_vides',
  'field.cle_interop.missing',
  'field.voie_nom.missing',
  'field.numero.missing'
]

const warnings = [
  'cle_interop.casse_invalide',
  'cle_interop.voie_invalide',
  'cle_interop.numero_prefixe_manquant',
  'numero.contient_prefixe',
  'commune_deleguee_insee.commune_invalide',
  'position.enum_fuzzy',
  'position.valeur_invalide',
  'x.separateur_decimal_invalide',
  'y.separateur_decimal_invalide',
  'long.separateur_decimal_invalide',
  'lat.separateur_decimal_invalide',
  'cad_parcelles.valeur_invalide',
  'source.valeur_manquante',
  'date_der_maj.valeur_manquante',
  'date_der_maj.date_invalide',
  'row.position_manquante',
  'row.chef_lieu_invalide',
  'field.suffixe.missing',
  'field.commune_insee.missing',
  'field.position.missing',
  'field.long.missing',
  'field.lat.missing',
  'field.x.missing',
  'field.y.missing',
  'field.source.missing',
  'field.date_der_maj.missing',

  'cle_interop.espaces_debut_fin',
  'commune_insee.espaces_debut_fin',
  'commune_nom.espaces_debut_fin',
  'commune_deleguee_insee.espaces_debut_fin',
  'commune_deleguee_nom.espaces_debut_fin',
  'uid_adresse.espaces_debut_fin',
  'voie_nom.espaces_debut_fin',
  'lieudit_complement_nom.espaces_debut_fin',
  'numero.espaces_debut_fin',
  'suffixe.espaces_debut_fin',
  'position.espaces_debut_fin',
  'long.espaces_debut_fin',
  'lat.espaces_debut_fin',
  'x.espaces_debut_fin',
  'y.espaces_debut_fin',
  'cad_parcelles.espaces_debut_fin',
  'source.espaces_debut_fin',
  'date_der_maj.espaces_debut_fin'
]

module.exports = {
  code: '1.2-etalab',
  name: 'BAL 1.2',
  errors,
  warnings,

  isValid({uniqueErrors}) {
    return !errors.some(e => uniqueErrors.has(e))
  }
}

