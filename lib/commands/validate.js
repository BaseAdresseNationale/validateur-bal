const fs = require('fs')
const {promisify} = require('util')

const readFile = promisify(fs.readFile)
const validate = require('../validator/validate')

module.exports = {
  command: 'validate <file>',
  describe: 'Valider une base Adresse locale',
  handler: async argv => {
    const file = await readFile(argv.file)

    try {
      const report = await validate(file)
      printReport(report)
    } catch (err) {
      console.error(err)
    }
  }
}

function printReport(report) {
  const {fileValidation, parseErrors, notFoundFields, unknownFields, aliasedFields, rowsWithErrors, validatedRows, rowsErrorsCount} = report
  const {encoding, linebreak, delimiter} = fileValidation

  // Validation de la structure
  console.log('')
  console.log('* Validation de la structure du fichier')
  console.log('')
  console.log(`Encodage : ${encoding.value} => ${encoding.isValid ? 'OK' : 'Pas OK !'}`)
  console.log(`Séparateur de ligne : ${linebreak.value} => ${linebreak.isValid ? 'OK' : 'Pas OK'}`)
  console.log(`Séparateur de colonne : ${delimiter.localName} => ${delimiter.isValid ? 'OK' : 'Pas OK'}`)

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
    console.log(`/!\\ Les champs suivants n’ont pas été trouvés : ${notFoundFields.join(', ')}`)
  }
  if (unknownFields.length > 0) {
    console.log(`Les champs suivants sont inconnus, ils ont été ignorés : ${unknownFields.join(', ')}`)
  }
  if (Object.keys(aliasedFields).length > 0) {
    Object.keys(aliasedFields).forEach(k => console.log(`/!\\ Le champ ${k} est mal orthographié mais a été pris en compte`))
  }

  // Validation des données
  console.log('')
  console.log('* Validation des données')
  console.log('')
  if (rowsWithErrors && rowsWithErrors.length > 0) {
    rowsWithErrors.forEach(row => {
      if (row._errors) {
        row._errors.forEach(err => console.log(`${row.cle_interop.rawValue} ${err}`))
      }
    })
    console.log('')
    console.log(`${rowsErrorsCount} ${rowsErrorsCount === 1 ? 'anomalie trouvée' : 'anomalies trouvées'}.`)
    console.log('')
  }
  console.log(`${validatedRows.length} données vérifiées !`)

  // On est content
  console.log('')
  console.log('Terminé !')
  console.log('')
}
