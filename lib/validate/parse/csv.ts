import type { ParseResult } from 'papaparse';
import Papa from 'papaparse';

const PAPA_OPTIONS = {
  delimitersToGuess: [',', '\t', ';'],
  skipEmptyLines: true,
  header: true,
};

export function parseCsv(
  file: string,
  options = {},
): Promise<ParseResult<Record<string, string>>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      ...PAPA_OPTIONS,
      ...options,
      complete: (res) => resolve(res),
      error: (err) => reject(err),
    });
  });
}
