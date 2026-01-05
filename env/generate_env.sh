#!/usr/bin/env bash
# Generates developer-portal-backend/.env from keys in developer-portal-backend/.env.template
# Fills values from Vault at path: pipeline/developer-portal with namespace cfs/cfs-devops

set -uo pipefail

ENV_FILE="../.env"
TEMPLATE_FILE="./.env.template"

VAULT_ADDR_URL="https://vault.tools.sap"
VAULT_NAMESPACE="cfs/cfs-devops"
VAULT_MOUNT="pipeline"
VAULT_PATH="developer-portal"

echo_msg() { printf "%s\n" "$*" ; }
echo_err() { printf "ERROR: %s\n" "$*" >&2 ; }

# 6. Check Vault CLI installed
if ! command -v vault >/dev/null 2>&1; then
  echo_err "Vault CLI not found. Please install it: brew tap hashicorp/tap && brew install hashicorp/tap/vault"
  exit 1
fi

# Basic input validation
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo_err "Template file not found: $TEMPLATE_FILE"
  exit 1
fi

# 1. Create/empty the .env file and 2. add the generated comment
echo -e "##############################################################\n###         GENERATED AUTOMATICALLY. DO NOT EDIT.          ###\n### See developer-portal-backend/env/README.md for details ###\n##############################################################\n" > "$ENV_FILE"

# 8. Ensure user is logged in to Vault
export VAULT_ADDR="$VAULT_ADDR_URL"
if ! vault token lookup >/dev/null 2>&1; then
  echo_msg "Not logged in to Vault. Initiating login via OIDC..."
  # This may prompt for interactive login
  if ! vault login -method=oidc; then
    echo_err "Vault login failed or was cancelled. Aborting."
    exit 1
  fi
fi

# 5. Fetch all key-values from Vault once (JSON) for efficient lookups
SECRET_JSON="$(vault kv get -format=json -namespace="$VAULT_NAMESPACE" -mount="$VAULT_MOUNT" "$VAULT_PATH" 2>/dev/null || true)"

if [ -z "$SECRET_JSON" ]; then
  echo_err "Failed to fetch secret from Vault: mount='$VAULT_MOUNT' path='$VAULT_PATH' namespace='$VAULT_NAMESPACE'."
  exit 1
fi

# Verify JSON contains data.data object
if ! printf '%s' "$SECRET_JSON" | jq -e '.data.data | type == "object"' >/dev/null 2>&1; then
  echo_err "Vault response did not contain expected data structure (.data.data)."
  exit 1
fi

# 3. Read template and 4. loop keys; 7. exit if a key is missing from Vault
count=0
while IFS= read -r KEY; do
  # Skip empty lines or lines starting with '#'
  if [ -z "$KEY" ] || printf '%s' "$KEY" | grep -qE '^\s*#'; then
    continue
  fi

  # Trim whitespace
  KEY_TRIMMED="$(printf '%s' "$KEY" | awk '{$1=$1};1')"
  if [ -z "$KEY_TRIMMED" ]; then
    continue
  fi

  VALUE="$(printf '%s' "$SECRET_JSON" | jq -r --arg k "$KEY_TRIMMED" '.data.data[$k] // empty')"

  if [ -z "$VALUE" ]; then
    echo_err "Value for key '$KEY_TRIMMED' not found in Vault (namespace='$VAULT_NAMESPACE', mount='$VAULT_MOUNT', path='$VAULT_PATH')."
    echo_err "Aborting. Ensure the key exists in Vault or update the template."
    exit 1
  fi

  # Write KEY=VALUE to .env
  printf '%s=%s\n' "$KEY_TRIMMED" "$VALUE" >> "$ENV_FILE"
  count=$((count + 1))
done < "$TEMPLATE_FILE"

echo_msg "✅ Successfully generated '.env' file with $count entries."
