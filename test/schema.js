const test = require('ava')
const {fields} = require('../lib/schema')

test('validate suffixe', t => {
  t.deepEqual(fields.suffixe.parse('ter'), {
    parsedValue: 'ter',
    errors: [],
    warnings: []
  })

  t.deepEqual(fields.suffixe.parse(' ter'), {
    parsedValue: 'ter',
    errors: [],
    warnings: ['La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère']
  })

  t.deepEqual(fields.suffixe.parse(' .'), {
    errors: ['La valeur du champ suffixe doit commencer par un caractère alphanumérique.'],
    warnings: ['La valeur du champ suffixe ne doit pas avoir d’espaces en début ou en fin de chaîne de caractère']
  })

  t.deepEqual(fields.suffixe.parse('.'), {
    errors: ['La valeur du champ suffixe doit commencer par un caractère alphanumérique.'],
    warnings: []
  })
})
