/* eslint camelcase: off */

const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util')
const test = require('ava')

const validate = require('..')

const readFile = promisify(fs.readFile)

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath)
  return readFile(absolutePath)
}

test('validate a file', async t => {
  const buffer = await readAsBuffer('sample.csv')
  const report = await validate(buffer)
  t.is(report.parseMeta.encoding, 'UTF-8')
})

test('validate a file with aliases', async t => {
  const buffer = await readAsBuffer('aliases.csv')
  const report = await validate(buffer)
  t.deepEqual(report.aliasedFields, {
    cle_interop: 'cle_intero',
    commune_nom: 'commune_no',
    commune_insee: 'commune_in',
    date_der_maj: 'date_der_m',
    lat: 'lat_wgs84',
    long: 'long_wgs84',
    uid_adresse: 'uid_adress',
    x: 'x_l93',
    y: 'y_l93'
  });
  [
    'cle_interop',
    'uid_adresse',
    'voie_nom',
    'numero',
    'suffixe',
    'commune_nom',
    'position',
    'x',
    'y',
    'long',
    'lat',
    'source',
    'date_der_maj'
  ].forEach(field => t.true(report.knownFields.includes(field)))
  t.true(report.notFoundFields.length === 0)
  t.true(report.unknownFields.length === 0)
})

test('validate a binary file', async t => {
  const buffer = await readAsBuffer('troll.png')
  await t.throwsAsync(() => validate(buffer), {message: 'Unable to detect encoding'})
})

test('validate an arbitrary CSV file', async t => {
  const buffer = await readAsBuffer('junk.ascii.csv')
  const report = await validate(buffer)
  t.is(report.notFoundFields.length, 14)
})
