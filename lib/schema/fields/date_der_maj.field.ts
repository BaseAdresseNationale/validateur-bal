import { format, isValid, parse as parseDateFns, parseISO } from 'date-fns';

const formats = [
  'dd/MM/yy', // 01/05/25
  'dd/MM/yyyy', // 01/05/2025
  'yyyy/MM/dd', // 2025/05/01
  'dd-MM-yyyy', // 01-05-2025
  'yyyy-MM-dd', // 2025-05-01
  'dd MM yyyy', // 01-05-2025
  'yyyy MM dd', // 2025-05-01
  'd MMM yyyy', // 6 mai 2025
  'yyyy-MM-dd HH:mm', // 2025-05-01 00:00
];

function calculateRemediation(
  value: string,
  {
    setRemediation,
  }: {
    setRemediation: (remediation: any) => void;
  },
) {
  for (const fmt of formats) {
    const dt = parseDateFns(value, fmt, new Date());
    if (isValid(dt)) {
      setRemediation(format(dt, 'yyyy-MM-dd'));
      return;
    }
  }
  setRemediation(format(new Date(), 'yyyy-MM-dd'));
}

function parse(
  v: string,
  {
    addError,
    setRemediation,
  }: {
    addError: (error: string) => void;
    setRemediation: (remediation: any) => void;
  },
) {
  if (!/^(\d{4}-\d{2}-\d{2})$/.test(v)) {
    addError('date_invalide');
    calculateRemediation(v, { setRemediation });
    return undefined;
  }

  const parsedDate = parseISO(v);

  if (Number.isNaN(parsedDate.getTime())) {
    addError('date_invalide');
    calculateRemediation(v, { setRemediation });
    return undefined;
  }

  if (parsedDate < new Date('2010-01-01')) {
    addError('date_ancienne');
  }

  if (parsedDate > new Date()) {
    addError('date_future');
    return undefined;
  }

  return format(parsedDate, 'yyyy-MM-dd');
}

export const date_der_maj = {
  required: true,
  formats: ['1.1', '1.2', '1.3', '1.4'],
  trim: true,
  parse,
};
