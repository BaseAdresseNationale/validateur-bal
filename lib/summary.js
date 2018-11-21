function computeSummary(rowsWithIssues) {
  const issuesSummary = {
    errors: [],
    warnings: []
  }

  rowsWithIssues.forEach(row => {
    row._warnings.forEach(warning => {
      const currentWarning = issuesSummary.warnings.find(warn => warn.message === warning)

      if (currentWarning) {
        currentWarning.rows.push(row._line)
      } else {
        issuesSummary.warnings.push({
          message: warning,
          rows: [row._line]
        })
      }
    })

    row._errors.forEach(error => {
      const currentError = issuesSummary.errors.find(warn => warn.message === error)

      if (currentError) {
        currentError.rows.push(row._line)
      } else {
        issuesSummary.errors.push({
          message: error,
          rows: [row._line]
        })
      }
    })
  })

  return issuesSummary
}

module.exports = computeSummary

