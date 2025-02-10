import { join } from "path";
import fs from "fs";
import { promisify } from "util";
import { validate } from "../../index";
import { ValidateProfile } from "../../profiles";

const readFile = promisify(fs.readFile);

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, "data", relativePath);
  return readFile(absolutePath);
}

describe("VALIDATE 1.4 TEST", () => {
  test("Valid file 1.3", async () => {
    const buffer = await readAsBuffer("1.3-valid.csv");
    const report = await validate(buffer, { profile: "1.3" });
    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(true);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Valid file 1.4", async () => {
    const buffer = await readAsBuffer("1.4-valid.csv");
    const report = await validate(buffer, { profile: "1.4" });
    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(true);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Valid file 1.4 with relaxFieldsDetection", async () => {
    const buffer = await readAsBuffer("1.4-valid-relax.csv");
    const report = await validate(buffer, { relaxFieldsDetection: true });

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Valid file 1.4 with profile relax", async () => {
    const buffer = await readAsBuffer("1.4-valid-relax.csv");
    const report = await validate(buffer, {
      profile: "1.4-relax",
      relaxFieldsDetection: true,
    });

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Error file 1.4 without relaxFieldsDetection", async () => {
    const buffer = await readAsBuffer("1.4-valid-relax.csv");
    const report = await validate(buffer, {
      profile: "1.4-relax",
      relaxFieldsDetection: false,
    });

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Error file 1.4 with profile 1.4", async () => {
    const buffer = await readAsBuffer("1.4-valid-relax.csv");
    const report = await validate(buffer, { profile: "1.4" });

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Error bad id ban adresses (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-bad-id-ban-adresse.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "id_ban_adresse.type_invalide"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Error bad id ban commune (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-bad-id-ban-commune.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "id_ban_commune.type_invalide"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Error bad id ban toponyme a (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-bad-id-ban-toponyme.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "id_ban_toponyme.type_invalide"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Error incoherent ban id (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-incoherent-id-ban.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "row.incoherence_ids_ban"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Good incoherent dependance ban id (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-good-dependance-id-ban.csv");
    const report = await validate(buffer, { profile: "1.4" });

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(true);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
  });

  test("Error incoherent dependance ban id (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-bad-dependance-id-ban.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "row.incoherence_ids_ban"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Warning id_ban_adresses_required (file 1.4) with profile relax", async () => {
    const buffer = await readAsBuffer("1.4-without-ban-adresse.csv");
    const report = (await validate(buffer, {
      profile: "1.4-relax",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "row.id_ban_adresses_required"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("W");
  });

  test("ERROR id_ban_adresses_required (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-without-ban-adresse.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "row.id_ban_adresses_required"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Warning rows.ids_required_every (file 1.4) with profile relax", async () => {
    const buffer = await readAsBuffer("1.4-no-ids-ban-every.csv");
    const report = (await validate(buffer, {
      profile: "1.4-relax",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "rows.ids_required_every"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("W");
  });

  test("Warning rows.ids_required_every (file 1.4)", async () => {
    const buffer = await readAsBuffer("1.4-no-ids-ban-every.csv");
    const report = (await validate(buffer, {
      profile: "1.4",
    })) as ValidateProfile;

    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(false);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);

    const error = report.profilErrors.filter(
      (e) => e.code === "rows.ids_required_every"
    );
    expect(error.length).toBe(1);
    expect(error[0].level).toBe("E");
  });

  test("Read uid_adresse", async () => {
    const buffer = await readAsBuffer("1.3-valid-uid_adresse.csv");
    const report = await validate(buffer, { profile: "1.4" });
    expect(report.encoding).toBe("utf-8");
    expect(report.parseOk).toBe(true);
    expect(report.profilesValidation["1.4"].isValid).toBe(true);
    expect(report.profilesValidation["1.4-relax"].isValid).toBe(true);
    expect(report.rows[0].additionalValues.uid_adresse.idBanCommune).toBe(
      "0246e48c-f33d-433a-8984-034219be842e"
    );
    expect(report.rows[0].additionalValues.uid_adresse.idBanToponyme).toBe(
      "8a3bab10-f329-4ce3-9c7d-280d91a8053a"
    );
    expect(report.rows[0].additionalValues.uid_adresse.idBanAdresse).toBe(
      "3c87abe4-887b-46ee-9192-5c1b35a06625"
    );
  });
});
