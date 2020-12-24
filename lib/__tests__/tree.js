const test = require('ava')
const {extractAsTree} = require('../tree')

test('extractAsTree with empty input', t => {
  t.notThrows(() => extractAsTree({}))
})
