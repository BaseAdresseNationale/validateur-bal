import Papa from 'papaparse';
import { PrevalidateType } from './validate.type';
import { ParsedValues } from '../schema/shema.type';

export function exportCsvBALWithReport({ rows }: PrevalidateType): Buffer {
  const csvRows: ParsedValues[] = rows.map(({ parsedValues, remediations }) => {
    return {
      ...parsedValues,
      ...remediations,
    };
  });
  const csvData = Papa.unparse(csvRows, { delimiter: ';' });
  return Buffer.from(csvData);
}
