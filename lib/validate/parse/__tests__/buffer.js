const { join } = require("path");
const fs = require("fs");
const { promisify } = require("util");
const test = require("ava");

const { decodeBuffer } = require("../buffer");

const readFile = promisify(fs.readFile);

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, "data", relativePath);
  return readFile(absolutePath);
}

test("detect and decode UTF-8 from file", async (t) => {
  const buffer = await readAsBuffer("sample.csv");
  const { encoding, decodedString } = decodeBuffer(buffer);
  t.is(encoding, "utf-8");
  t.true(decodedString.includes("bâtiment"));
});

test("detect and decode ASCI from file => default to UTF-8", async (t) => {
  const buffer = await readAsBuffer("junk.ascii.csv");
  const { encoding, decodedString } = decodeBuffer(buffer);
  t.is(encoding, "utf-8");
  t.true(decodedString.includes("gml_id"));
});

test("detect and decode ANSI from file", async (t) => {
  const buffer = await readAsBuffer("sample.ansi.csv");
  const { encoding, decodedString } = decodeBuffer(buffer);
  t.is(encoding, "windows-1252");
  t.true(decodedString.includes("bâtiment"));
});
