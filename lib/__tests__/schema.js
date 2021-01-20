const test = require('ava')
const {fields} = require('../schema')
const createContext = require('../validate/context')

function parse(field, value) {
  const ctx = createContext('field', {uniqueErrors: new Set()})
  ctx.setRawValue(value)
  ctx.setParsedValue(fields[field].parse(value, ctx))
  return ctx.toJSON()
}

test('validate suffixe', t => {
  t.deepEqual(parse('suffixe', 'ter'), {
    rawValue: 'ter',
    parsedValue: 'ter',
    errors: []
  })

  t.deepEqual(parse('suffixe', '.'), {
    rawValue: '.',
    errors: ['suffixe.debut_invalide']
  })
})
