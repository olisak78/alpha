#!/bin/bash

# Run ESLint with SARIF formatter and capture the exit code
eslint -f @microsoft/eslint-formatter-sarif -o eslint-results.sarif 'src/**/*.{js,ts,jsx,tsx}'
exit_code=$?

# Apply SARIF fixes using jq script
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
jq --arg ROOT "$ROOT" -f scripts/sarif-fix.jq eslint-results.sarif > eslint-results.sarif.tmp && mv eslint-results.sarif.tmp eslint-results.sarif || true

# Parse the SARIF results to count errors and warnings
if [ -f eslint-results.sarif ]; then
    error_count=$(jq '[.runs[0].results[] | select(.level == "error")] | length' eslint-results.sarif 2>/dev/null)
    warning_count=$(jq '[.runs[0].results[] | select(.level == "warning")] | length' eslint-results.sarif 2>/dev/null)

    # Validate both counts - if parsing fails, exit with error
    if [[ -z "$error_count" ]] || ! [[ "$error_count" =~ ^[0-9]+$ ]] || [[ -z "$warning_count" ]] || ! [[ "$warning_count" =~ ^[0-9]+$ ]]; then
        echo "❌ ERROR: Failed to parse error/warning counts from SARIF file. SARIF may be malformed."
        exit 1
    fi
else
    echo "❌ ERROR: eslint-results.sarif file not found. ESLint may have failed to run properly."
    exit 1
fi

# Determine output message based on original exit code and results
if [ "$exit_code" -eq 0 ]; then
    if [ "$warning_count" -gt 0 ]; then
        echo "⚠️  WARNING: ESLint found $warning_count warning(s) but no errors. Check eslint-results.sarif for details."
    else
        echo "✅ SUCCESS: ESLint SARIF linting completed successfully with no issues found."
    fi
elif [ "$exit_code" -eq 2 ]; then
    echo "❌ FATAL ERROR: ESLint encountered a fatal error (exit code 2). Check eslint-results.sarif for details."
else
    echo "❌ ERROR: ESLint failed with exit code $exit_code and found $error_count error(s) and $warning_count warning(s). Check eslint-results.sarif for details."
fi

# Exit with the original ESLint exit code to preserve behavior
exit $exit_code
