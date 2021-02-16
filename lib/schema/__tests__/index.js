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
