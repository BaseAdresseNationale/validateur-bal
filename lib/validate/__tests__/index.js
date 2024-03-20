/* eslint camelcase: off */

const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util')
const test = require('ava')

const {validate} = require('..')

const readFile = promisify(fs.readFile)

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath)
  return readFile(absolutePath)
}

test('validate a file', async t => {
  const buffer = await readAsBuffer('sample.csv')
  const report = await validate(buffer)
  t.is(report.encoding, 'utf-8')
})

test('validate a file with aliases / relaxFieldsDetection true', async t => {
  const buffer = await readAsBuffer('aliases.csv')
  const {fields, notFoundFields} = await validate(buffer, {relaxFieldsDetection: true})

  const aliasedFields = {
    cle_interop: 'cle_intero',
    commune_nom: 'commune_no',
    commune_insee: 'commune_in',
    date_der_maj: 'date_der_m',
    lat: 'lat_wgs84',
    long: 'long_wgs84',
    uid_adresse: 'uid_adress',
    x: 'x_l93',
    y: 'y_l93'
  }

  for (const schemaName of Object.keys(aliasedFields)) {
    const originalName = aliasedFields[schemaName]
    t.truthy(fields.find(f => f.name === originalName && f.schemaName === schemaName))
  }

  for (const field of [
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
  ]) {
    t.true(fields.some(f => f.schemaName === field))
  }

  t.true(notFoundFields.length === 5)

  for (const field of [
    'lieudit_complement_nom',
    'commune_deleguee_insee',
    'commune_deleguee_nom',
    'cad_parcelles'
  ]) {
    t.true(notFoundFields.some(f => f.schemaName === field))
  }

  // Unknown fields
  t.true(fields.filter(f => !f.schemaName).length === 0)
})

test('validate a file with aliases with 1.3-relax', async t => {
  const buffer = await readAsBuffer('aliases.csv')
  const {fields, notFoundFields} = await validate(buffer, {profile: '1.3-relax'})

  const aliasedFields = {
    cle_interop: 'cle_intero',
    commune_nom: 'commune_no',
    commune_insee: 'commune_in',
    date_der_maj: 'date_der_m',
    lat: 'lat_wgs84',
    long: 'long_wgs84',
    uid_adresse: 'uid_adress',
    x: 'x_l93',
    y: 'y_l93'
  }

  for (const schemaName of Object.keys(aliasedFields)) {
    const originalName = aliasedFields[schemaName]
    t.truthy(fields.find(f => f.name === originalName && f.schemaName === schemaName))
  }

  for (const field of [
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
  ]) {
    t.true(fields.some(f => f.schemaName === field))
  }

  t.true(notFoundFields.length === 5)

  for (const field of [
    'lieudit_complement_nom',
    'commune_deleguee_insee',
    'commune_deleguee_nom',
    'cad_parcelles'
  ]) {
    t.true(notFoundFields.some(f => f.schemaName === field))
  }

  // Unknown fields
  t.true(fields.filter(f => !f.schemaName).length === 0)
})

test('validate a file with aliases / profile relax and relaxFieldsDetection false', async t => {
  const buffer = await readAsBuffer('aliases.csv')
  const {fields, notFoundFields} = await validate(buffer, {profile: '1.3-relax', relaxFieldsDetection: false})

  const unknownFields = fields.filter(f => !f.schemaName)
  const knownFields = fields.filter(f => f.schemaName)
  const aliasedFields = knownFields.filter(f => f.name !== f.schemaName)

  for (const field of [
    'voie_nom',
    'numero',
    'suffixe',
    'position',
    'source'
  ]) {
    t.truthy(knownFields.find(f => f.schemaName === field))
  }

  t.is(aliasedFields.length, 0)
  t.is(knownFields.length, 5)
  t.is(notFoundFields.length, 14)
  t.is(unknownFields.length, 9)
})

test('validate a file with aliases / relaxFieldsDetection false', async t => {
  const buffer = await readAsBuffer('aliases.csv')
  const {fields, notFoundFields} = await validate(buffer, {relaxFieldsDetection: false})

  const unknownFields = fields.filter(f => !f.schemaName)
  const knownFields = fields.filter(f => f.schemaName)
  const aliasedFields = knownFields.filter(f => f.name !== f.schemaName)

  for (const field of [
    'voie_nom',
    'numero',
    'suffixe',
    'position',
    'source'
  ]) {
    t.truthy(knownFields.find(f => f.schemaName === field))
  }

  t.is(aliasedFields.length, 0)
  t.is(knownFields.length, 5)
  t.is(notFoundFields.length, 14)
  t.is(unknownFields.length, 9)
})

test('validate a binary file', async t => {
  const buffer = await readAsBuffer('troll.png')
  await t.throwsAsync(() => validate(buffer), {message: 'Non-text file cannot be processed'})
})

test('validate an arbitrary CSV file', async t => {
  const buffer = await readAsBuffer('junk.ascii.csv')
  const {notFoundFields} = await validate(buffer)
  t.is(notFoundFields.length, 19)
})

test('validation avec locales', async t => {
  const buffer = await readAsBuffer('locales.csv')
  const {fields, rows, uniqueErrors} = await validate(buffer)
  t.true(uniqueErrors.includes('voie_nom_eus.trop_court'))
  t.true(rows[0].errors.some(e => e.code === 'voie_nom_eus.trop_court'))
  t.deepEqual(rows[1].localizedValues.voie_nom, {
    bre: 'Nom de la rue en breton',
    eus: 'Nom de la voie en basque'
  })
  t.true(fields.some(f => f.schemaName === 'voie_nom' && f.locale === 'eus'))
  t.true(fields.some(f => f.schemaName === 'voie_nom' && f.locale === 'bre'))
})

test('validation check profilErrors', async t => {
  const buffer = await readAsBuffer('locales.csv')
  const {profilErrors, uniqueErrors} = await validate(buffer)
  for (const e of profilErrors) {
    t.true(uniqueErrors.includes(e.code))
    t.true(['I', 'W', 'E'].includes(e.level))
  }
})

test('validation check notFoundFields', async t => {
  const buffer = await readAsBuffer('locales.csv')
  const {notFoundFields} = await validate(buffer)
  for (const e of notFoundFields) {
    t.true(['I', 'W', 'E'].includes(e.level))
  }
})

test('validation check row empty', async t => {
  const buffer = await readAsBuffer('without_row.csv')
  const {profilesValidation, uniqueErrors, globalErrors} = await validate(buffer)
  t.true(uniqueErrors.includes('rows.empty'))
  t.true(globalErrors.includes('rows.empty'))
  t.true(!profilesValidation['1.3-relax'].isValid)
  t.true(!profilesValidation['1.3'].isValid)
})

