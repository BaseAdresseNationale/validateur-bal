const fs = require('fs')
const {promisify} = require('util')

const readFile = promisify(fs.readFile)
const validate = require('../validator/validate')

module.exports = {
  command: 'validate <file>',
  describe: 'Valider une base Adresse locale',
  handler: async argv => {
    const file = await readFile(argv.file)

    validate(file)
      .on('error', console.error)
      // .on('end', result => console.log(JSON.stringify(result, true, 2)))
  }
}
