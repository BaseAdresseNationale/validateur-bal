const {readFile} = require('fs-extra')
const chalk = require('chalk')
const {validate, getLabel} = require('..')

module.exports = {
  command: 'validate [options] <file>',
  describe: 'Valider une base Adresse locale',
  builder: {
    'relax-fields-detection': {
      type: 'boolean',
      default: false,
      describe: 'Désactive la sensibilisé à la casse et accepte des variantes pour les noms des champs'
    },
    profile: {
      type: 'string',
      default: '1.3',
      describe: 'Permet de choisir la version du profil de validation à utiliser'
    }
  },
  async handler(argv) {
    const file = await readFile(argv.file)
    try {
      const report = await validate(file, {
        relaxFieldsDetection: argv.relaxFieldsDetection,
        profile: argv.profile
      })
      printReport(report)
    } catch (error) {
      console.error(error)
    }
  }
}

function getDelimiterName(delimiter) {
  if (delimiter === ';') {
    return 'point-virgule'
  }

  if (delimiter === ',') {
    return 'virgule'
  }

  if (delimiter === '\t') {
    return 'tabulation'
  }

  if (delimiter === '|') {
    return 'pipe'
  }
}

function printSeverity(severity) {
  if (severity === 'E') {
    return chalk.red('E')
  }

  if (severity === 'W') {
    return chalk.yellow('W')
  }

  if (severity === 'I') {
    return chalk.blue('I')
  }
}

function printReport(report) {
  const {fileValidation, parseOk, parseErrors, notFoundFields, fields, rows, profilesValidation, profilErrors} = report

  // Erreurs dans la structure
  if (parseErrors.length > 0) {
    console.log('')
    console.log('* Erreurs de lecture du fichier')
    console.log('')
    for (const err of parseErrors) {
      console.log(err)
    }
  }

  if (!parseOk) {
    console.log('')
    console.log('Le fichier n’est pas structuré correctement. La validation est abandonnée.')
    console.log('')
    return
  }

  const {encoding, linebreak, delimiter} = fileValidation

  // Validation de la structure
  console.log('')
  console.log('* Validation de la structure du fichier')
  console.log('')
  console.log(`Encodage : ${encoding.value.toUpperCase()} => ${encoding.isValid ? 'OK' : 'Pas OK !'}`)
  console.log(`Séparateur de ligne : ${linebreak.value} => ${linebreak.isValid ? 'OK' : 'Pas OK'}`)
  console.log(`Séparateur de colonne : ${getDelimiterName(delimiter.value)} => ${delimiter.isValid ? 'OK' : 'Pas OK'}`)

  // Validation des champs
  console.log('')
  console.log('* Validation du modèle')
  console.log('')
  if (notFoundFields.length === 0) {
    console.log('Tous les champs du modèle ont été trouvés !')
  } else {
    console.log('/!\\ Les champs suivants n’ont pas été trouvés:')
    for (const f of notFoundFields) {
      console.log(`[${printSeverity(f.level)}] ${f.schemaName}`)
    }
  }

  const unknownFields = fields.filter(f => !f.schemaName)
  if (unknownFields.length > 0) {
    console.log('')
    console.log('Les champs suivants sont inconnus, ils ont été ignorés :')
    for (const f of unknownFields) {
      console.log(f.name)
    }
  }

  const aliasedFields = fields.filter(f => f.schemaName && f.schemaName !== f.name && !f.localizedSchemaName)
  if (aliasedFields.length > 0) {
    console.log('')
    for (const f of aliasedFields) {
      console.log(`/!\\ Le champ ${f.schemaName} est mal orthographié mais a été pris en compte`)
    }
  }

  // Validation des données
  console.log('')
  console.log('* Validation des données')
  console.log('')

  const rowsWithIssues = rows.filter(r => r.errors.length > 0)
  if (rowsWithIssues.length > 0) {
    for (const row of rowsWithIssues) {
      if (row.errors) {
        for (const err of row.errors) {
          console.log(`[${printSeverity(err.level)}] #${row.line} ${getLabel(err.code)}`)
        }
      }
    }

    console.log('')
  }

  console.log(`${rows.length} données vérifiées !`)

  // Validation général
  if (profilErrors.length > 0) {
    console.log('')
    console.log('* Validation général du profil')
    console.log('')

    for (const err of profilErrors) {
      console.log(`[${printSeverity(err.level)}] ${getLabel(err.code)}`)
    }
  }

  console.log('')
  console.log('* Validité')
  for (const profileValidation of Object.values(profilesValidation)) {
    console.log(` - ${profileValidation.name} : ${profileValidation.isValid ? '✅' : '❌'}`)
  }

  console.log('')

  // On est content
  console.log('')
  console.log('Terminé !')
  console.log('')
}
