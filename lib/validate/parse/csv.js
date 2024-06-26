const Papa = require("papaparse");

const PAPA_OPTIONS = {
  delimitersToGuess: [",", "\t", ";"],
  skipEmptyLines: true,
  header: true,
};

function parseCsv(file, options = {}) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...PAPA_OPTIONS,
      ...options,
      complete: (res) => resolve(res),
      error: (err) => reject(err),
    });
  });
}

module.exports = { parseCsv };
