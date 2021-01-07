const {readFile} = require('fs-extra')
const validate = require('../validate')

module.exports = {
  command: 'validate [options] <file>',
  describe: 'Valider une base Adresse locale',
  builder: {
    strict: {
      type: 'boolean',
      default: false,
      describe: 'Réalise la validation en mode strict'
    }
  },
  handler: async argv => {
    const file = await readFile(argv.file)

    try {
      const report = await validate(file, {strict: argv.strict})
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

function printReport(report) {
  const {fileValidation, parseErrors, notFoundFields, fields, rows, isValid} = report
  const {encoding, linebreak, delimiter} = fileValidation

  // Validation de la structure
  console.log('')
  console.log('* Validation de la structure du fichier')
  console.log('')
  console.log(`Encodage : ${encoding.value.toUpperCase()} => ${encoding.isValid ? 'OK' : 'Pas OK !'}`)
  console.log(`Séparateur de ligne : ${linebreak.value} => ${linebreak.isValid ? 'OK' : 'Pas OK'}`)
  console.log(`Séparateur de colonne : ${getDelimiterName(delimiter.value)} => ${delimiter.isValid ? 'OK' : 'Pas OK'}`)

  // Erreurs dans la structure
  if (parseErrors.length > 0) {
    console.log('')
    console.log('* Erreurs de lecture du fichier')
    console.log('')
    parseErrors.forEach(err => console.log(err))
  }

  // Validation des champs
  console.log('')
  console.log('* Validation du modèle')
  console.log('')
  if (notFoundFields.length === 0) {
    console.log('Tous les champs du modèle ont été trouvés !')
  } else {
    console.log(`/!\\ Les champs suivants n’ont pas été trouvés : ${notFoundFields.map(f => f.schemaName).join(', ')}`)
  }

  const unknownFields = fields.filter(f => !f.schemaName)
  if (unknownFields.length > 0) {
    console.log(`Les champs suivants sont inconnus, ils ont été ignorés : ${unknownFields.map(f => f.name).join(', ')}`)
  }

  const aliasedFields = fields.filter(f => f.schemaName && f.schemaName !== f.name)
  if (aliasedFields.length > 0) {
    aliasedFields.forEach(f => console.log(`/!\\ Le champ ${f.schemaName} est mal orthographié mais a été pris en compte`))
  }

  // Validation des données
  console.log('')
  console.log('* Validation des données')
  console.log('')

  const rowsWithIssues = rows.filter(r => r._errors && r._errors.length > 0)
  if (rowsWithIssues.length > 0) {
    rowsWithIssues.forEach(row => {
      if (row._errors) {
        row._errors.forEach(err => console.log(`[E] ${row.cle_interop.rawValue} ${err}`))
      }
    })
    console.log('')
  }

  console.log(`${rows.length} données vérifiées !`)

  console.log('')
  console.log(`Valide : ${isValid ? '✅' : '❌'}`)
  console.log('')

  // On est content
  console.log('')
  console.log('Terminé !')
  console.log('')
}
