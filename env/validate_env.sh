#!/usr/bin/env bash
# Validates '.env' file
# 1) Verifies .env was generated automatically (header check)
# 2) Ensures .env contains all keys listed in '.env.template'
# 3) Ensures no keys in .env have empty values

set -uo pipefail

ENV_FILE="../.env"
TEMPLATE_FILE="./.env.template"

echo_msg() { printf "%s\n" "$*"; }
echo_err() { printf "ERROR: %s\n" "$*" >&2; }

# Ensure files exist
if [ ! -f "$ENV_FILE" ]; then
  echo_err "Missing .env file: $ENV_FILE. Run generate_env.sh first."
  exit 1
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo_err "Missing template file: $TEMPLATE_FILE."
  exit 1
fi

# 1) Header check - make sure .env was generated automatically
# Accept either of the following patterns:
# - '# GENERATED AUTOMATICALLY BY generate_env.sh'
# - '# GENERATED AUTOMATICALLY. DO NOT EDIT.'
if ! grep -qE 'GENERATED AUTOMATICALLY' "$ENV_FILE"; then
  echo_err ".env does not appear to be generated automatically. Expected header containing 'GENERATED AUTOMATICALLY' (e.g. '# GENERATED AUTOMATICALLY. DO NOT EDIT.')."
  exit 1
fi

# Load environment variables from .env for value checks
set -a
. "$ENV_FILE"
set +a

# 2) Ensure .env contains all keys from .env.template
missing_keys=()
empty_value_keys=()
total_keys=0

while IFS= read -r raw; do
  # Trim leading/trailing whitespace
  key="$(printf '%s' "$raw" | awk '{$1=$1};1')"

  # Skip empty lines and comments
  if [ -z "$key" ] || printf '%s' "$key" | grep -qE '^\s*#'; then
    continue
  fi

  total_keys=$((total_keys + 1))

  # Check presence of exact key (left side of '=') in .env using awk to avoid regex edge cases
  if ! awk -v k="$key" -F'=' '
    /^[[:space:]]*#/ { next }     # skip comments
    NF {
      # extract and trim the key before '='
      var=$1
      sub(/^[[:space:]]+/, "", var)
      sub(/[[:space:]]+$/, "", var)
      # tolerate optional `export KEY=...` syntax
      sub(/^export[[:space:]]+/, "", var)
      if (var == k) { found=1 }
    }
    END { exit (found ? 0 : 1) }
  ' "$ENV_FILE"; then
    missing_keys+=("$key")
  else
    # Key exists; check value using sourced environment (handles quoted and multi-line values)
    val="${!key}"
    if [ -z "$val" ]; then
      empty_value_keys+=("$key")
    fi
  fi
done < "$TEMPLATE_FILE"

if [ "${#missing_keys[@]}" -gt 0 ]; then
  echo_err ".env file is missing the following ${#missing_keys[@]} key(s) required by .env.template:"
  for k in "${missing_keys[@]}"; do
    echo_err " - $k"
  done
  exit 1
fi

if [ "${#empty_value_keys[@]}" -gt 0 ]; then
  echo_err ".env contains ${#empty_value_keys[@]} key(s) with empty values:"
  for k in "${empty_value_keys[@]}"; do
    echo_err " - $k"
  done
  exit 1
fi

echo_msg "✅ Validation passed: .env contains all $total_keys required entries with non-empty values."
