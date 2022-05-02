const test = require('ava')
const {readValue} = require('../../validate/row')

test('validate suffixe', async t => {
  const result = await readValue('suffixe', 'ter')
  t.is(result.parsedValue, 'ter')
  t.deepEqual(result.errors, [])
})

test('validate suffixe / debut_invalide', async t => {
  const result = await readValue('suffixe', '.')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['debut_invalide'])
})

test('validate suffixe / trop_long', async t => {
  const result = await readValue('suffixe', 'azertyuiopazertyuiop')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['trop_long'])
})

test('validate cad_parcelles', async t => {
  const result = await readValue('cad_parcelles', '12345000AA0001')
  t.deepEqual(result.parsedValue, ['12345000AA0001'])
  t.deepEqual(result.errors, [])
})

test('validate cad_parcelles / multiple', async t => {
  const result = await readValue('cad_parcelles', '12345000AA0001|12345000AA0002')
  t.deepEqual(result.parsedValue, ['12345000AA0001', '12345000AA0002'])
  t.deepEqual(result.errors, [])
})

test('validate certification_commune / 1', async t => {
  const result = await readValue('certification_commune', '1')
  t.is(result.parsedValue, true)
  t.deepEqual(result.errors, [])
})

test('validate certification_commune / 0', async t => {
  const result = await readValue('certification_commune', '0')
  t.is(result.parsedValue, false)
  t.deepEqual(result.errors, [])
})

test('validate certification_commune / valeur_invalide', async t => {
  const result = await readValue('certification_commune', 'toto')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['valeur_invalide'])
})

test('validate date_der_maj / date ancienne', async t => {
  const result = await readValue('date_der_maj', '2000-01-01')
  t.is(result.parsedValue, '2000-01-01')
  t.deepEqual(result.errors, ['date_ancienne'])
})

test('validate date_der_maj / date future', async t => {
  const result = await readValue('date_der_maj', '2050-01-01')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['date_future'])
})

test('validate voie_nom / trop_court', async t => {
  const result = await readValue('voie_nom', 'Aa')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['trop_court'])
})

test('validate voie_nom / trop_long', async t => {
  const result = await readValue('voie_nom', 'Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['trop_long'])
})

test('validate voie_nom / casse_incorrecte', async t => {
  const result = await readValue('voie_nom', 'ALLEE DES RUISSEAUX')
  t.is(result.parsedValue, 'ALLEE DES RUISSEAUX')
  t.deepEqual(result.errors, ['casse_incorrecte'])
})

test('validate voie_nom / caractere_invalide', async t => {
  const result = await readValue('voie_nom', 'All�e des roses')
  t.is(result.parsedValue, undefined)
  t.deepEqual(result.errors, ['caractere_invalide'])
})

test('validate voie_nom / contient_tiret_bas', async t => {
  const result = await readValue('voie_nom', 'Allée_des_roseaux')
  t.is(result.parsedValue, 'Allée des roseaux')
  t.deepEqual(result.errors, ['contient_tiret_bas'])
})
