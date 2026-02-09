import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { validate } from '../../index';
import { ValidateType } from '../../validate.type';
import { ErrorLevelEnum } from '../../../utils/helpers';

enableFetchMocks();

const readFile = promisify(fs.readFile);

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath);
  return readFile(absolutePath);
}

describe('VALIDATE 1.5 TEST', () => {
  beforeEach(() => {
    fetchMock.doMock(async () => {
      return JSON.stringify({
        status: 'success',
        response: [{ id: '0246e48c-f33d-433a-8984-034219be842e' }],
      });
    });
  });

  test('Valid file 1.5', async () => {
    const buffer = await readAsBuffer('1.5-valid.csv');
    const report = (await validate(buffer, {
      profile: '1.5',
    })) as ValidateType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.5'].isValid).toBe(true);
  });

  test('Error field.id_ban_commune.missing (file 1.5)', async () => {
    const buffer = await readAsBuffer('1.5-without-ban-ids.csv');
    const report = (await validate(buffer, {
      profile: '1.5',
    })) as ValidateType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.5'].isValid).toBe(false);
    const error = report.profilErrors.filter(
      (e) => e.code === 'field.id_ban_commune.missing',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error field.id_ban_toponyme.missing (file 1.5)', async () => {
    const buffer = await readAsBuffer('1.5-without-ban-ids.csv');
    const report = (await validate(buffer, {
      profile: '1.5',
    })) as ValidateType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.5'].isValid).toBe(false);
    const error = report.profilErrors.filter(
      (e) => e.code === 'field.id_ban_toponyme.missing',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error field.id_ban_adresse.missing (file 1.5)', async () => {
    const buffer = await readAsBuffer('1.5-without-ban-ids.csv');
    const report = (await validate(buffer, {
      profile: '1.5',
    })) as ValidateType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.5'].isValid).toBe(false);
    const error = report.profilErrors.filter(
      (e) => e.code === 'field.id_ban_adresse.missing',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error numero.not_to_be_zero (file 1.5)', async () => {
    const buffer = await readAsBuffer('1.5-numero-zero.csv');
    const report = (await validate(buffer, {
      profile: '1.5',
    })) as ValidateType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.5'].isValid).toBe(false);
    const error = report.profilErrors.filter(
      (e) => e.code === 'numero.not_to_be_zero',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });
});
