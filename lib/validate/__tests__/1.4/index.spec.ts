import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { validate } from '../../index';
import { ErrorLevelEnum, ValidateProfileType } from '../../validate.type';

const readFile = promisify(fs.readFile);

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath);
  return readFile(absolutePath);
}

describe('VALIDATE 1.4 TEST', () => {
  test('Valid file 1.3', async () => {
    const buffer = await readAsBuffer('1.3-valid.csv');
    const report = (await validate(buffer, {
      profile: '1.3',
    })) as ValidateProfileType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);

    expect(report.profilesValidation['1.4'].isValid).toBe(true);
  });

  test('Valid file 1.4', async () => {
    const buffer = await readAsBuffer('1.4-valid.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(true);
  });

  test('Valid file 1.4 with relaxFieldsDetection', async () => {
    const buffer = await readAsBuffer('1.4-valid-relax.csv');
    const report = (await validate(buffer, {
      relaxFieldsDetection: true,
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);
  });

  test('Valid file 1.4 with profile relax', async () => {
    const buffer = await readAsBuffer('1.4-valid-relax.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
      relaxFieldsDetection: true,
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);
  });

  test('Error file 1.4 without relaxFieldsDetection', async () => {
    const buffer = await readAsBuffer('1.4-valid-relax.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
      relaxFieldsDetection: false,
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);
  });

  test('Error file 1.4 with profile 1.4', async () => {
    const buffer = await readAsBuffer('1.4-valid-relax.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);
  });

  test('Error bad id ban adresses (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-bad-id-ban-adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'id_ban_adresse.type_invalide',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error bad id ban commune (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-bad-id-ban-commune.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'id_ban_commune.type_invalide',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error bad id ban toponyme a (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-bad-id-ban-toponyme.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'id_ban_toponyme.type_invalide',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Good incoherent dependance ban id (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-incoherent-dependance-id-ban.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);
  });

  test('Error incoherent dependance ban id (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-bad-dependance-id-ban.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'row.lack_of_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Warning adresses_required_id_ban (file 1.4) with profile relax', async () => {
    const buffer = await readAsBuffer('1.4-without-ban-adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'row.lack_of_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('ERROR adresses_required_id_ban (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-without-ban-adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'row.lack_of_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Valid file 1.4 with ids ban empty', async () => {
    const buffer = await readAsBuffer('1.4-ids-ban-empty.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.profilesValidation['1.4'].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.level === ErrorLevelEnum.ERROR,
    );
    expect(error.length).toBe(0);
  });

  test('Warning rows.every_line_required_id_ban (file 1.4) with profile relax', async () => {
    const buffer = await readAsBuffer('1.4-no-ids-ban-every.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'rows.every_line_required_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Warning rows.every_line_required_id_ban (file 1.4)', async () => {
    const buffer = await readAsBuffer('1.4-no-ids-ban-every.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'rows.every_line_required_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Read uid_adresse', async () => {
    const buffer = await readAsBuffer('1.3-valid-uid_adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;
    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(true);
    expect(report.rows[0].additionalValues.uid_adresse.idBanCommune).toBe(
      '0246e48c-f33d-433a-8984-034219be842e',
    );
    expect(report.rows[0].additionalValues.uid_adresse.idBanToponyme).toBe(
      '8a3bab10-f329-4ce3-9c7d-280d91a8053a',
    );
    expect(report.rows[0].additionalValues.uid_adresse.idBanAdresse).toBe(
      '3c87abe4-887b-46ee-9192-5c1b35a06625',
    );
  });

  test('Error uid_adresse type invalide', async () => {
    const buffer = await readAsBuffer('1.3-invalid-uid_adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'uid_adresse.type_invalide',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });

  test('Error uid_adresse incoherence_id_ban', async () => {
    const buffer = await readAsBuffer('1.3-incoherent-uid_adresse.csv');
    const report = (await validate(buffer, {
      profile: '1.4',
    })) as ValidateProfileType;

    expect(report.encoding).toBe('utf-8');
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation['1.4'].isValid).toBe(false);

    const error = report.profilErrors.filter(
      (e) => e.code === 'row.lack_of_id_ban',
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe(ErrorLevelEnum.ERROR);
  });
});
