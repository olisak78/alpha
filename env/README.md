## Developer Portal Backend – Environment Management

This folder manages environment variables required by the backend.

- The `.env` file is generated automatically from keys in `env/.env.template` and values retrieved from SAP Vault.
- The `.env` file is git-ignored and must not be edited manually.

---

### Motivation
- Securely manage secret environment variables using SAP Vault.
- Synchronize local development environment of all developers.
- Ensure required environment variables are present before running or deploying the application.

---

### Quick start

1) Prerequisites
- Vault CLI: `brew tap hashicorp/tap && brew install hashicorp/tap/vault`
- jq: `brew install jq`
- Vault:
  - Successful `Sign in with OIDC Provider`: https://vault.tools.sap/ui/vault/auth?with=oidc%2F
  - Access to https://vault.tools.sap/ui/vault/secrets/pipeline/kv/developer-portal?namespace=cfs%2Fcfs-devops

2) Generate the `.env` file from Vault
- Execute `make generate-env` in the following cases:
  - First-time setup.
  - After a new key was added to `env/.env.template`.
  - When secret values in Vault have changed.
- `generate-env` make target is invoked as part of deployment targets.
- How it works (good to know):
  - Runs `env/generate_env.sh`, which:
    - Ensures Vault CLI is installed and you are logged in (will trigger `vault login -method=oidc` if needed).
    - Reads keys from `env/.env.template`.
    - Fetches values from Vault and writes them to `../.env` (with a generated header).

3) Validate the `.env` file
- `make validate-env` is executed automatically as part of other make targets:
  - `make run-dev`: before starting the development server.
  - `make deploy-dev`: before deploying to the dev k8s cluster.
  - `make deploy-prod`: before deploying to the prod k8s cluster.
- Purpose: Validates that `.env` is up-to-date and complete.
- How it works (good to know):
  - Runs `env/validate_env.sh`, which ensures:
    - The generated header is present (“GENERATED AUTOMATICALLY”).
    - All keys from `env/.env.template` exist in `.env`.
    - All required keys have non-empty values.
    - On failure, prints a tip to run `make generate-env`.
  - It doesn't verify correctness of values, only presence and non-emptiness. The reason is not to force Vault login on every server start (`make run-dev`).

---

### Files

- [`.env`](../.env)
  - Auto-generated file containing `KEY=VALUE` pairs. Not committed to git.
  - Includes a header indicating it was generated automatically.
- [`env/.env.template`](.env.template)
  - One required variable name per line (no values here).
  - The values for these keys are stored in Vault.
- [`env/generate_env.sh`](generate_env.sh)
  - Iterates keys from `env/.env.template` and fetches their values from Vault (`VAULT_ADDR=https://vault.tools.sap`, namespace `cfs/cfs-devops`, mount `pipeline`, path `developer-portal`).
  - Produces [`.env`](../.env) file.
- [`env/validate_env.sh`](validate_env.sh)
  - Validates `../.env`:
    - Checks the generated header exists.
    - Verifies all keys from `env/.env.template` are present.
    - Confirms each required key has a non-empty value.

---

### Adding a new environment variable

#### Secret variable

1. Add the variable name to [`env/.env.template`](.env.template) (one per line).
2. Add the variable’s value in Vault at:
   - https://vault.tools.sap/ui/vault/secrets/pipeline/kv/developer-portal?namespace=cfs%2Fcfs-devops
   - In the “Secret” tab, click “Create new version” and add it at the end of the list.
3. For local development:
   - Ensure the code reads the variable and, if needed, reference it alongside other variables used by `make run-dev`.
4. For Kubernetes (k8s) deployment, add/update as appropriate:
   - [`charts/developer-portal-backend/values.yaml`](../charts/developer-portal-backend/values.yaml)
   - [`charts/developer-portal-backend/templates/secret.yaml`](../charts/developer-portal-backend/templates/secret.yaml)
   - [`charts/developer-portal-backend/deploy.sh`](../charts/developer-portal-backend/deploy.sh)

#### Non-secret variable

Do NOT add non-secret variables to Vault or to `env/.env.template`.

- In code, read via `os.Getenv()` with a sensible default (see [`internal/config/config.go`](../internal/config/config.go)).
- For k8s deployment, add/update:
  - [`charts/developer-portal-backend/values.yaml`](../charts/developer-portal-backend/values.yaml)
  - [`charts/developer-portal-backend/templates/configmap.yaml`](../charts/developer-portal-backend/templates/configmap.yaml)

---

### Troubleshooting
In general, if `make generate-env` or `make validate-env` fail, carefully read the error message for hints.
- Vault Access
  - Verify Vault login via terminal command: `vault login -method=oidc`.
  - Ensure you can access the path: https://vault.tools.sap/ui/vault/secrets/pipeline/kv/developer-portal?namespace=cfs%2Fcfs-devops
  - If no access, contact the DevOps team.
  - Note: CUsers must log in once for DevOps to be able to grant access.
- Validation failed: missing keys
  - Ensure the key appears in `env/.env.template`.
  - Run `make generate-env` to regenerate `.env`.
  - Verify Vault access and that you’re able to log in via terminal command: `vault login -method=oidc`.

- Validation failed: empty values
  - Confirm non-empty values for the key(s) exist at the Vault path (see link above).
  - Regenerate `.env`: `make generate-env`.

- Vault CLI not found
  - Install: `brew tap hashicorp/tap && brew install hashicorp/tap/vault`.

- jq not found
  - Install: `brew install jq`.

---

### Security

- Never commit `.env` or any secrets to version control.
- Treat `.env` as sensitive material and do not share it.
- Use Vault to manage secret values and rotate them as needed.
