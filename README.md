# Validateur de fichier "Base Adresse Locale"

## Principe

Une Base Adresse Locale est typiquement une base de données voies-adresses maintenue par un organisme gérant une base de référence sur un territoire.

Afin de normaliser la production de fichiers informatiques d'échange pour alimenter la [Base Adresse Nationale](https://adresse.data.gouv.fr/), un groupe de travail du [Groupe SIG et topographie de l'Association des Ingénieurs Territoriaux de France](http://aitf.fr/groupe-travail/sig-topographie) (AITF) a publié une proposition de modèle de données simple.
Ce document est disponible [ici](assets/AITF-SIG-Topo-Adresse--Fichier-echange-modele-simple-v1.1.pdf).

Le logiciel disponible en téléchargement [sur cette page](https://github.com/etalab/bal/releases) permet de contrôler et valider un fichier "Base Adresse Locale" (BAL) produit conformément au modèle de données ci-dessus.


## Utilisation

Exemple sous terminal ms-dos sous Windows

```
bal-win.exe validate mon_fichier_bal.csv
```

Si votre fichier BAL est correct, vous devriez obtenir simplement ceci

```
* Validation de la structure du fichier

Encodage : UTF-8 => OK
Séparateur de ligne : Windows => OK
Séparateur de colonne : ; => OK

* Validation du modèle

Tous les champs du modèle ont été trouvés !


Terminé !
```

## Navigateur

Cette bibliothèque expose un point d’entrée `browser` pour être utilisée dans une application web.
Afin de fonctionner dans un plus grand nombre de navigateurs, elle est *transpilée* avec `babel` – avec le plugin `@babel/plugin-transform-runtime`.

Il sera donc nécessaire d’installer `@babel/runtime-corejs2` :

```bash
npm install @etalab/bal @babel/runtime-corejs2
```

## Aide

En cas de difficultés vous pourrez trouver de l'aide ici : [https://gitter.im/etalab/outils-bal](https://gitter.im/etalab/outils-bal)
