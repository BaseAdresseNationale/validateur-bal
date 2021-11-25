const {keyBy, mapValues, uniq} = require('lodash')
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
  const parseOptions = options.strict
    ? {}
    : {transformHeader: h => h.toLowerCase().trim()}

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

function computeRows(parsedRows, {fields, uniqueErrors}) {
  const indexedFields = keyBy(fields, 'name')
  const computedRows = parsedRows.map((parsedRow, line) => {
    const computedRow = validateRow(parsedRow, {indexedFields, line: line + 1})
    for (const e of computedRow.errors) {
      uniqueErrors.add(e.code)
    }

    return computedRow
  })

  return {rows: computedRows}
}

function validateFile({linebreak, encoding, delimiter}) {
  const humanizedLinebreak = humanizeLinebreak(linebreak)

  const fileValidation = {
    encoding: {
      value: encoding,
      isValid: encoding === 'utf-8'
    },
    delimiter: {
      value: delimiter,
      isValid: delimiter === ';'
    },
    linebreak: {
      value: humanizedLinebreak,
      isValid: ['Unix', 'Windows'].includes(humanizedLinebreak)
    }
  }

  return {fileValidation}
}

async function prevalidate(file, options = {}) {
  const uniqueErrors = new Set()

  const {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows} = await parseFile(file, options)

  if (!parseOk) {
    return {encoding, linebreak, delimiter, originalFields, parseOk, parseErrors, parsedRows}
  }

  const {fields, notFoundFields} = computeFields(originalFields, {uniqueErrors, strict: options.strict})
  const {rows} = computeRows(parsedRows, {fields, uniqueErrors})
  const {fileValidation} = validateFile({linebreak, encoding, delimiter})

  const profilesValidation = mapValues(profiles, profile => {
    const {code, name} = profile
    return {code, name, isValid: profile.isValid({fileValidation, fields, notFoundFields, uniqueErrors})}
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
    uniqueErrors: [...uniqueErrors]
  }
}

function getErrorLevel(code, profile) {
  if (profile.errors.includes(code)) {
    return 'E'
  }

  if (profile.warnings.includes(code)) {
    return 'W'
  }

  return 'I'
}

function validateRows(computedRows, profileName) {
  const profile = profiles[profileName]

  return computedRows.map(row => {
    const errors = row.errors.map(e => ({
      ...e,
      level: getErrorLevel(e.code, profile)
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
