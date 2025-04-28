import { readFile } from 'fs-extra';
import fs from 'fs';

import { autofix } from '../index';

module.exports = {
  command: 'autofix <file> <fixed_file>',
  describe: "Mise en forme d'un fichier BAL",
  async handler(argv) {
    const file = await readFile(argv.file);
    try {
      const buffer: Buffer = await autofix(file);
      fs.writeFile(argv.fixed_file, buffer, (err) => {
        if (err) {
          console.error("Erreur lors de l'écriture du fichier :", err);
        } else {
          console.log('Mise en forme du fichier BAL réussi !');
        }
      });
    } catch (error) {
      console.error(error);
    }
  },
};
