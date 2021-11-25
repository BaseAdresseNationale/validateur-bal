const test = require('ava')
const {fields} = require('..')

function createContext() {
  const errors = []
  return {
    addError(code) {
      errors.push(code)
    },
    errors
  }
}

test('validate suffixe', t => {
  const ctx1 = createContext()
  t.is(fields.suffixe.parse('ter', ctx1), 'ter')
  t.deepEqual(ctx1.errors, [])

  const ctx2 = createContext()
  t.is(fields.suffixe.parse('.', ctx2), undefined)
  t.deepEqual(ctx2.errors, ['debut_invalide'])

  const ctx3 = createContext()
  t.is(fields.suffixe.parse('azertyuiopazertyuiop', ctx3), undefined)
  t.deepEqual(ctx3.errors, ['trop_long'])
})

test('validate cad_parcelles', t => {
  const ctx1 = createContext()
  t.deepEqual(fields.cad_parcelles.parse('12345000AA0001', ctx1), ['12345000AA0001'])
  t.deepEqual(ctx1.errors, [])

  const ctx2 = createContext()
  t.deepEqual(fields.cad_parcelles.parse('12345000AA0001|12345000AA0002', ctx2), ['12345000AA0001', '12345000AA0002'])
  t.deepEqual(ctx2.errors, [])
})

test('validate certification_commune', t => {
  const ctx1 = createContext()
  t.is(fields.certification_commune.parse('1', ctx1), true)
  t.deepEqual(ctx1.errors, [])

  const ctx2 = createContext()
  t.is(fields.certification_commune.parse('0', ctx2), false)
  t.deepEqual(ctx2.errors, [])

  const ctx3 = createContext()
  t.is(fields.certification_commune.parse('toto', ctx3), undefined)
  t.deepEqual(ctx3.errors, ['valeur_invalide'])
})

test('validate date_der_maj', t => {
  const ctx1 = createContext()
  t.is(fields.date_der_maj.parse('2000-01-01', ctx1), '2000-01-01')
  t.deepEqual(ctx1.errors, ['date_ancienne'])

  const ctx2 = createContext()
  t.is(fields.date_der_maj.parse('2050-01-01', ctx2), undefined)
  t.deepEqual(ctx2.errors, ['date_future'])
})

test('validate voie_nom', t => {
  const ctx1 = createContext()
  t.is(fields.voie_nom.parse('Aa', ctx1), undefined)
  t.deepEqual(ctx1.errors, ['trop_court'])

  const ctx2 = createContext()
  t.is(fields.voie_nom.parse('Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf Abcededf ', ctx2), undefined)
  t.deepEqual(ctx2.errors, ['trop_long'])

  const ctx3 = createContext()
  t.is(fields.voie_nom.parse('ALLEE DES RUISSEAUX', ctx3), 'ALLEE DES RUISSEAUX')
  t.deepEqual(ctx3.errors, ['casse_incorrecte'])

  const ctx4 = createContext()
  t.is(fields.voie_nom.parse('All�e des roses', ctx4), undefined)
  t.deepEqual(ctx4.errors, ['caractere_invalide'])

  const ctx5 = createContext()
  t.is(fields.voie_nom.parse('Allée_des_roseaux', ctx5), 'Allée des roseaux')
  t.deepEqual(ctx5.errors, ['contient_tiret_bas'])
})
