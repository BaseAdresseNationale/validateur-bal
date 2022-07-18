const bluebird = require('bluebird')
const {keyBy, mapValues, uniq} = require('lodash')
const {getErrorLevel} = require('../helpers')
const profiles = require('../schema/profiles')
const {computeFields} = require('./fields')
const {parse} = require('./parse')
const {validateRow} = require('./row')

const FATAL_PARSE_ERRORS = new Set([
  'MissingQuotes',
  'UndetectableDelimiter',
  'TooFewFields',
  'TooManyFields'
])

async function parseFile(file, options) {
  const parseOptions = options.relaxFieldsDetection
    ? {transformHeader: h => h.toLowerCase().trim()}
    : {}

  // Must be a Blob for browser or a Buffer for Node.js
  const {meta, errors, data, encoding} = await parse(file, parseOptions)

  const errorsKinds = uniq(errors.map(e => e.code))
  const parseOk = !errorsKinds.some(e => FATAL_PARSE_ERRORS.has(e))

  return {
    encoding,
    linebreak: meta.linebreak,
    delimiter: meta.delimiter,
    originalFields: meta.fields,
    parseOk,
    parseErrors: errors,
    parsedRows: data
  }
}

async function computeRows(parsedRows, {fields, rowsErrors}) {
  const indexedFields = keyBy(fields, 'name')
  const computedRows = await bluebird.map(parsedRows, async (parsedRow, line) => {
    const computedRow = await validateRow(parsedRow, {indexedFields, line: line + 1})
    for (const e of computedRow.errors) {
      rowsErrors.add(e.code)
    }

    return computedRow
  }, {concurrency: 4})

  return {rows: computedRows}
}

function validateFile(detectedParams, {globalErrors}) {
  const humanizedLinebreak = humanizeLinebreak(detectedParams.linebreak)

  const encoding = {
    value: detectedParams.encoding,
    isValid: detectedParams.encoding === 'utf-8'
  }

  if (!encoding.isValid) {
    globalErrors.add('file.encoding.non_standard')
  }

  const delimiter = {
    value: detectedParams.delimiter,
    isValid: detectedParams.delimiter === ';'
  }

  if (!delimiter.isValid) {
    globalErrors.add('file.delimiter.non_standard')
  }

  const linebreak = {
    value: humanizedLinebreak,
    isValid: ['Unix', 'Windows'].includes(humanizedLinebreak)
  }

  if (!linebreak.isValid) {
    globalErrors.add('file.linebreak.non_standard')
  }

  return {encoding, delimiter, linebreak}
}

async function prevalidate(file, options = {}) {
  const globalErrors = new Set()
  const rowsErrors = new Set()

  const {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows} = await parseFile(file, options)

  if (!parseOk) {
    return {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows}
  }

  const {fields, notFoundFields} = computeFields(originalFields, {globalErrors, relaxFieldsDetection: options.relaxFieldsDetection})
  const {rows} = await computeRows(parsedRows, {fields, rowsErrors})
  const fileValidation = validateFile({linebreak, encoding, delimiter}, {globalErrors})

  const uniqueErrors = new Set([...globalErrors, ...rowsErrors])

  const profilesValidation = mapValues(profiles, profile => {
    const {code, name, errors} = profile
    const isValid = !errors.some(e => uniqueErrors.has(e))
    return {code, name, isValid}
  })

  return {
    encoding,
    linebreak,
    delimiter,
    originalFields,
    parseOk,
    parseErrors,
    fields,
    notFoundFields,
    rows,
    fileValidation,
    profilesValidation,
    globalErrors: [...globalErrors],
    rowsErrors: [...rowsErrors],
    uniqueErrors: [...uniqueErrors]
  }
}

function validateRows(computedRows, profileName) {
  return computedRows.map(row => {
    const errors = row.errors.map(e => ({
      ...e,
      level: getErrorLevel(profileName, e.code)
    }))

    const isValid = !errors.some(e => e.level === 'E')

    return {
      ...row,
      errors,
      isValid
    }
  })
}

function validateProfile(prevalidateResult, profileName) {
  if (!prevalidateResult.parseOk) {
    return prevalidateResult
  }

  const rows = validateRows(prevalidateResult.rows, profileName)

  return {
    ...prevalidateResult,
    rows
  }
}

async function validate(file, options = {}) {
  const profile = options.profile || '1.3-etalab'

  const prevalidateResult = await prevalidate(file, options)
  return validateProfile(prevalidateResult, profile)
}

function humanizeLinebreak(linebreak) {
  if (linebreak === '\n') {
    return 'Unix'
  }

  if (linebreak === '\r\n') {
    return 'Windows'
  }

  if (linebreak === '\r') {
    return 'Old Mac/BSD'
  }

  return 'Inconnu'
}

module.exports = {validate, validateProfile, prevalidate}
