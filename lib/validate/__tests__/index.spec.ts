/* eslint camelcase: off */

import { join } from "path";
import fs from "fs";
import { promisify } from "util";

import { validate } from "..";
import { ValidateProfile } from "../profiles";

const readFile = promisify(fs.readFile);

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, "data", relativePath);
  return readFile(absolutePath);
}

describe("VALIDATE TEST", () => {
  it("validate a file", async () => {
    const buffer = await readAsBuffer("sample.csv");
    const report = await validate(buffer);
    expect(report.encoding).toBe("utf-8");
  });

  it("validate a file with aliases / relaxFieldsDetection true", async () => {
    const buffer = await readAsBuffer("aliases.csv");
    const { fields, notFoundFields } = await validate(buffer, {
      relaxFieldsDetection: true,
    });

    const aliasedFields = {
      cle_interop: "cle_intero",
      commune_nom: "commune_no",
      commune_insee: "commune_in",
      date_der_maj: "date_der_m",
      lat: "lat_wgs84",
      long: "long_wgs84",
      uid_adresse: "uid_adress",
      x: "x_l93",
      y: "y_l93",
    };

    for (const schemaName of Object.keys(aliasedFields)) {
      const originalName = aliasedFields[schemaName];
      expect(
        fields.find(
          (f) => f.name === originalName && f.schemaName === schemaName
        )
      ).toBeTruthy();
    }

    for (const field of [
      "cle_interop",
      "uid_adresse",
      "voie_nom",
      "numero",
      "suffixe",
      "commune_nom",
      "position",
      "x",
      "y",
      "long",
      "lat",
      "source",
      "date_der_maj",
    ]) {
      expect(fields.some((f) => f.schemaName === field)).toBeTruthy();
    }

    expect(notFoundFields.length).toBe(5);

    for (const field of [
      "lieudit_complement_nom",
      "commune_deleguee_insee",
      "commune_deleguee_nom",
      "cad_parcelles",
    ]) {
      expect(notFoundFields.some((f) => f.schemaName === field)).toBeTruthy();
    }

    // Unknown fields
    expect(fields.filter((f) => !f.schemaName).length).toBe(0);
  });

  it("validate a file with aliases with 1.3-relax", async () => {
    const buffer = await readAsBuffer("aliases.csv");
    const { fields, notFoundFields } = await validate(buffer, {
      profile: "1.3-relax",
    });

    const aliasedFields = {
      cle_interop: "cle_intero",
      commune_nom: "commune_no",
      commune_insee: "commune_in",
      date_der_maj: "date_der_m",
      lat: "lat_wgs84",
      long: "long_wgs84",
      uid_adresse: "uid_adress",
      x: "x_l93",
      y: "y_l93",
    };

    for (const schemaName of Object.keys(aliasedFields)) {
      const originalName = aliasedFields[schemaName];
      expect(
        fields.find(
          (f) => f.name === originalName && f.schemaName === schemaName
        )
      ).toBeTruthy();
    }

    for (const field of [
      "cle_interop",
      "uid_adresse",
      "voie_nom",
      "numero",
      "suffixe",
      "commune_nom",
      "position",
      "x",
      "y",
      "long",
      "lat",
      "source",
      "date_der_maj",
    ]) {
      expect(fields.some((f) => f.schemaName === field)).toBeTruthy();
    }

    expect(notFoundFields.length === 5).toBeTruthy();

    for (const field of [
      "lieudit_complement_nom",
      "commune_deleguee_insee",
      "commune_deleguee_nom",
      "cad_parcelles",
    ]) {
      expect(notFoundFields.some((f) => f.schemaName === field)).toBeTruthy();
    }

    // Unknown fields
    expect(fields.filter((f) => !f.schemaName).length === 0).toBeTruthy();
  });

  it("validate a file with aliases / profile relax and relaxFieldsDetection false", async () => {
    const buffer = await readAsBuffer("aliases.csv");
    const { fields, notFoundFields } = await validate(buffer, {
      profile: "1.3-relax",
      relaxFieldsDetection: false,
    });

    const unknownFields = fields.filter((f) => !f.schemaName);
    const knownFields = fields.filter((f) => f.schemaName);
    const aliasedFields = knownFields.filter((f) => f.name !== f.schemaName);

    for (const field of [
      "voie_nom",
      "numero",
      "suffixe",
      "position",
      "source",
    ]) {
      expect(knownFields.find((f) => f.schemaName === field)).toBeTruthy();
    }

    expect(aliasedFields.length).toBe(0);
    expect(knownFields.length).toBe(5);
    expect(notFoundFields.length).toBe(14);
    expect(unknownFields.length).toBe(9);
  });

  it("validate a file with aliases / relaxFieldsDetection false", async () => {
    const buffer = await readAsBuffer("aliases.csv");
    const { fields, notFoundFields } = await validate(buffer, {
      relaxFieldsDetection: false,
    });

    const unknownFields = fields.filter((f) => !f.schemaName);
    const knownFields = fields.filter((f) => f.schemaName);
    const aliasedFields = knownFields.filter((f) => f.name !== f.schemaName);

    for (const field of [
      "voie_nom",
      "numero",
      "suffixe",
      "position",
      "source",
    ]) {
      expect(knownFields.find((f) => f.schemaName === field)).toBeTruthy();
    }

    expect(aliasedFields.length).toBe(0);
    expect(knownFields.length).toBe(5);
    expect(notFoundFields.length).toBe(14);
    expect(unknownFields.length).toBe(9);
  });

  it("validate a binary file", async () => {
    const buffer = await readAsBuffer("troll.png");
    await expect(validate(buffer)).rejects.toThrow(
      "Non-text file cannot be processed"
    );
  });

  it("validate an arbitrary CSV file", async () => {
    const buffer = await readAsBuffer("junk.ascii.csv");
    const { notFoundFields } = await validate(buffer);
    expect(notFoundFields.length).toBe(19);
  });

  it("validation avec locales", async () => {
    const buffer = await readAsBuffer("locales.csv");
    const { fields, rows, uniqueErrors } = await validate(buffer);
    expect(uniqueErrors.includes("voie_nom_eus.trop_court")).toBeTruthy();
    expect(
      rows[0].errors.some((e) => e.code === "voie_nom_eus.trop_court")
    ).toBeTruthy();
    expect(rows[1].localizedValues.voie_nom).toEqual({
      bre: "Nom de la rue en breton",
      eus: "Nom de la voie en basque",
    });
    expect(
      fields.some((f) => f.schemaName === "voie_nom" && f.locale === "eus")
    ).toBeTruthy();
    expect(
      fields.some((f) => f.schemaName === "voie_nom" && f.locale === "bre")
    ).toBeTruthy();
  });

  it("validation check profilErrors", async () => {
    const buffer = await readAsBuffer("locales.csv");
    const { profilErrors, uniqueErrors } = (await validate(
      buffer
    )) as ValidateProfile;
    for (const e of profilErrors) {
      expect(uniqueErrors.includes(e.code)).toBeTruthy();
      expect(["I", "W", "E"].includes(e.level)).toBeTruthy();
    }
  });

  it("validation check notFoundFields", async () => {
    const buffer = await readAsBuffer("locales.csv");
    const { notFoundFields } = await validate(buffer);
    for (const e of notFoundFields) {
      expect(["I", "W", "E"].includes(e.level)).toBeTruthy();
    }
  });

  it("validation check row empty", async () => {
    const buffer = await readAsBuffer("without_row.csv");
    const { profilesValidation, uniqueErrors, globalErrors } =
      await validate(buffer);
    expect(uniqueErrors.includes("rows.empty")).toBeTruthy();
    expect(globalErrors.includes("rows.empty")).toBeTruthy();
    expect(!profilesValidation["1.3-relax"].isValid).toBeTruthy();
    expect(!profilesValidation["1.3"].isValid).toBeTruthy();
  });
});
