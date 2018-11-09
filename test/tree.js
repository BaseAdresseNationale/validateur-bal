const test = require('ava')
const {extractAsTree} = require('..')

test('extractAsTree with empty input', t => {
  t.notThrows(() => extractAsTree({}))
})
