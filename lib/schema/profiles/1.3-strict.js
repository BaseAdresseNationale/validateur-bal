const errors = [
  "cle_interop.valeur_manquante",
  "cle_interop.casse_invalide",
  "cle_interop.structure_invalide",
  "cle_interop.commune_invalide",
  "cle_interop.voie_invalide",
  "cle_interop.voie_non_renseignee",
  "cle_interop.numero_invalide",
  "cle_interop.numero_prefixe_manquant",
  "voie_nom.valeur_manquante",
  "voie_nom.caractere_invalide",
  "voie_nom_@@.caractere_invalide",
  "numero.valeur_manquante",
  "numero.contient_prefixe",
  "numero.type_invalide",
  "suffixe.debut_invalide",
  "commune_insee.commune_invalide",
  "commune_deleguee_insee.commune_invalide",
  "position.valeur_invalide",
  "x.valeur_invalide",
  "x.separateur_decimal_invalide",
  "y.valeur_invalide",
  "y.separateur_decimal_invalide",
  "long.valeur_invalide",
  "long.separateur_decimal_invalide",
  "lat.valeur_invalide",
  "lat.separateur_decimal_invalide",
  "cad_parcelles.valeur_invalide",
  "cad_parcelles.pipe_debut_fin",
  "source.valeur_manquante",
  "date_der_maj.valeur_manquante",
  "date_der_maj.date_invalide",
  "certification_commune.valeur_invalide",
  "row.incoherence_numero",
  "row.position_manquante",
  "row.adresse_incomplete",

  "field.cle_interop.missing",
  "field.commune_insee.missing",
  "field.commune_nom.missing",
  "field.commune_deleguee_insee.missing",
  "field.commune_deleguee_nom.missing",
  "field.uid_adresse.missing",
  "field.voie_nom.missing",
  "field.lieudit_complement_nom.missing",
  "field.numero.missing",
  "field.suffixe.missing",
  "field.position.missing",
  "field.long.missing",
  "field.lat.missing",
  "field.x.missing",
  "field.y.missing",
  "field.cad_parcelles.missing",
  "field.source.missing",
  "field.date_der_maj.missing",
  "field.certification_commune.missing",

  "field.cle_interop.fuzzy",
  "field.commune_insee.fuzzy",
  "field.commune_nom.fuzzy",
  "field.commune_deleguee_insee.fuzzy",
  "field.commune_deleguee_nom.fuzzy",
  "field.uid_adresse.fuzzy",
  "field.voie_nom.fuzzy",
  "field.lieudit_complement_nom.fuzzy",
  "field.numero.fuzzy",
  "field.suffixe.fuzzy",
  "field.position.fuzzy",
  "field.long.fuzzy",
  "field.lat.fuzzy",
  "field.x.fuzzy",
  "field.y.fuzzy",
  "field.cad_parcelles.fuzzy",
  "field.source.fuzzy",
  "field.date_der_maj.fuzzy",
  "field.certification_commune.fuzzy",

  "file.encoding.non_standard",
  "file.delimiter.non_standard",
  "file.linebreak.non_standard",
];

const warnings = ["position.enum_fuzzy"];

module.exports = {
  code: "1.3-strict",
  name: "BAL 1.3 Strict",
  isUsed: false,
  relax: false,
  errors,
  warnings,
  format: "1.3",
};
