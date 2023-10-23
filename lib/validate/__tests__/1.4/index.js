const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util')
const test = require('ava')

const {validate} = require('../../index')

const readFile = promisify(fs.readFile)

function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath)
  return readFile(absolutePath)
}

test('Valid file 1.3', async t => {
  const buffer = await readAsBuffer('1.3-valid.csv')
  const report = await validate(buffer, {profile: '1.3'})

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)
})

test('Valid file 1.4', async t => {
  const buffer = await readAsBuffer('1.4-valid.csv')
  const report = await validate(buffer)
  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)
})

test('Valid file 1.4 with relaxFieldsDetection', async t => {
  const buffer = await readAsBuffer('1.4-valid-relax.csv')
  const report = await validate(buffer, {relaxFieldsDetection: true})
  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)
})

test('Valid file 1.4 with profile relax', async t => {
  const buffer = await readAsBuffer('1.4-valid-relax.csv')
  const report = await validate(buffer, {profile: '1.4-relax'})
  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)
})

test('Error file 1.4 without relaxFieldsDetection', async t => {
  const buffer = await readAsBuffer('1.4-valid-relax.csv')
  const report = await validate(buffer, {profile: '1.4-relax', relaxFieldsDetection: false})

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, false)
  t.is(report.profilesValidation['1.4-relax'].isValid, false)
})

test('Error file 1.4 with profile 1.4', async t => {
  const buffer = await readAsBuffer('1.4-valid-relax.csv')
  const report = await validate(buffer, {profile: '1.4'})

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, false)
  t.is(report.profilesValidation['1.4-relax'].isValid, false)
})

test('Error bad id ban adresses (file 1.4)', async t => {
  const buffer = await readAsBuffer('1.4-bad-id-ban-adresse.csv')
  const report = await validate(buffer)

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)

  const error = report.profilErrors.filter(e => e.code === 'id_ban_adresse.type_invalide')
  t.is(error.length, 1)
  t.is(error[0].level, 'W')
})

test('Error bad id ban commune (file 1.4)', async t => {
  const buffer = await readAsBuffer('1.4-bad-id-ban-commune.csv')
  const report = await validate(buffer)

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)

  const error = report.profilErrors.filter(e => e.code === 'id_ban_commune.type_invalide')
  t.is(error.length, 1)
  t.is(error[0].level, 'W')
})

test('Error bad id ban toponyme a (file 1.4)', async t => {
  const buffer = await readAsBuffer('1.4-bad-id-ban-toponyme.csv')
  const report = await validate(buffer)

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)

  const error = report.profilErrors.filter(e => e.code === 'id_ban_toponyme.type_invalide')
  t.is(error.length, 1)
  t.is(error[0].level, 'W')
})

test('Error incoherent ban id (file 1.4)', async t => {
  const buffer = await readAsBuffer('1.4-incoherent-id-ban.csv')
  const report = await validate(buffer)

  t.is(report.encoding, 'utf-8')
  t.is(report.parseOk, true)
  t.is(report.profilesValidation[1.4].isValid, true)
  t.is(report.profilesValidation['1.4-relax'].isValid, true)

  const error = report.profilErrors.filter(e => e.code === 'row.incoherence_ids_ban')
  t.is(error.length, 1)
  t.is(error[0].level, 'W')
})

