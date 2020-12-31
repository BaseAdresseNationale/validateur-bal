const test = require('ava')
const {fields} = require('../schema')
const createContext = require('../validate/context')

function parse(field, value) {
  const ctx = createContext('field')
  ctx.setRawValue(value)
  ctx.setParsedValue(fields[field].parse(value, ctx))
  return ctx.toJSON()
}

test('validate suffixe', t => {
  t.deepEqual(parse('suffixe', 'ter'), {
    rawValue: 'ter',
    parsedValue: 'ter',
    errors: [],
    warnings: []
  })

  t.deepEqual(parse('suffixe', ' ter'), {
    rawValue: ' ter',
    parsedValue: 'ter',
    errors: [],
    warnings: ['La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère']
  })

  t.deepEqual(parse('suffixe', ' .'), {
    rawValue: ' .',
    errors: ['La valeur du champ suffixe doit commencer par un caractère alphanumérique.'],
    warnings: ['La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère']
  })

  t.deepEqual(parse('suffixe', '.'), {
    rawValue: '.',
    errors: ['La valeur du champ suffixe doit commencer par un caractère alphanumérique.'],
    warnings: []
  })
})
