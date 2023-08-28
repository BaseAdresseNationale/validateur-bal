const test = require('ava')
const {parseLocalizedField, parseErrorCode, getLabel, getErrorLevel} = require('../helpers')

test('parseLocalizedField', t => {
  t.is(parseLocalizedField('voie_nom'), undefined)
  t.deepEqual(parseLocalizedField('voie_nom_bre'), {schemaName: 'voie_nom', locale: 'bre'})
})

test('parseErrorCode', t => {
  t.deepEqual(parseErrorCode('voie_nom.trop_long'), {schemaName: 'voie_nom', fieldError: 'trop_long'})
  t.deepEqual(parseErrorCode('voie_nom_bre.trop_long'), {schemaName: 'voie_nom', locale: 'bre', fieldName: 'voie_nom_bre', fieldError: 'trop_long'})
})

test('getLabel', t => {
  t.is(getLabel('voie_nom.trop_court'), 'Le nom de la voie est trop court (3 caractères minimum)')
  t.is(getLabel('voie_nom_bre.trop_court'), 'Le nom de la voie est trop court (3 caractères minimum) [bre]')
  t.throws(() => getLabel('voie_nom_toto.trop_court'))
})

test('getErrorLevel', t => {
  t.is(getErrorLevel('1.3-relax', 'voie_nom.trop_court'), 'E')
  t.is(getErrorLevel('1.3-relax', 'voie_nom_bre.trop_court'), 'W')
})
