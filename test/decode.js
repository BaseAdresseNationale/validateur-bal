const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util')
const test = require('ava')

const {decodeBuffer} = require('../lib/decode')

const readFile = promisify(fs.readFile)

async function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath)
  return readFile(absolutePath)
}

test('detect and decode UTF-8 from file', async t => {
  const buffer = await readAsBuffer('sample.csv')
  const {encoding, decodedString} = decodeBuffer(buffer)
  t.is(encoding, 'UTF-8')
  t.true(decodedString.includes('bâtiment'))
})

test('detect and decode ANSI from file', async t => {
  const buffer = await readAsBuffer('sample.ansi.csv')
  const {encoding, decodedString} = decodeBuffer(buffer)
  t.is(encoding, 'Latin-1')
  t.true(decodedString.includes('bâtiment'))
})
