const test = require('ava')

const computeSummary = require('../lib/summary')

test('check output', t => {
  const rows = [
    {_line: '0', _errors: ['err1', 'err2'], _warnings: ['warn1']},
    {_line: '1', _errors: ['err2'], _warnings: ['warn2']}
  ]

  t.deepEqual(computeSummary(rows), {
    errors: [
      {
        message: 'err1',
        rows: ['0']
      },
      {
        message: 'err2',
        rows: ['0', '1']
      }
    ],
    warnings: [
      {
        message: 'warn1',
        rows: ['0']
      },
      {
        message: 'warn2',
        rows: ['1']
      }
    ]
  })
})
