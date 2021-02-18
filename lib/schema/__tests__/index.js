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
})

test('validate cad_parcelles', t => {
  const ctx1 = createContext()
  t.deepEqual(fields.cad_parcelles.parse('12345000AA0001', ctx1), ['12345000AA0001'])
  t.deepEqual(ctx1.errors, [])

  const ctx2 = createContext()
  t.deepEqual(fields.cad_parcelles.parse('12345000AA0001|12345000AA0002', ctx2), ['12345000AA0001', '12345000AA0002'])
  t.deepEqual(ctx2.errors, [])
})
