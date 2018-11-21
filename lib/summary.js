function sumUp(summary, issues, line) {
  issues.forEach(issue => {
    if (issue in summary) {
      summary[issue].rows.push(line)
    } else {
      summary[issue] = {
        message: issue,
        rows: [line]
      }
    }
  })
}

function computeSummary(rowsWithIssues) {
  const errors = {}
  const warnings = {}

  rowsWithIssues.forEach(row => {
    sumUp(warnings, row._warnings, row._line)
    sumUp(errors, row._errors, row._line)
  })

  return {
    errors: Object.values(errors),
    warnings: Object.values(warnings)
  }
}

module.exports = computeSummary
