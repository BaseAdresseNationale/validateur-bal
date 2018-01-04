const {join} = require('path')
const fs = require('fs')
const {promisify} = require('util')
const test = require('ava')

const {validate} = require('../')

const readFile = promisify(fs.readFile)

async function readAsBuffer(relativePath) {
  const absolutePath = join(__dirname, 'data', relativePath)
  return readFile(absolutePath)
}

test('validate a file', async t => {
  const buffer = await readAsBuffer('sample.csv')
  const report = await validate(buffer)
  t.is(report.parseMeta.encoding, 'UTF-8')
})

test('validate a binary file', async t => {
  const buffer = await readAsBuffer('troll.png')
  await t.throws(validate(buffer))
})
