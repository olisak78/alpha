# Authentication Module (internal/auth)

This module implements OAuth login with GitHub Enterprise providers, stateless JWT access tokens, and a secure refresh-token cookie to mint new access tokens. It also persists provider GitHub access tokens for later API calls on behalf of the signed-in user.

Contents:
- Login flow
- JWT and refresh-token behavior
- GitHub tokens (storage and client creation)
- Middleware and endpoints overview
- Configuration and environment
- Frontend integration notes

## Terminology
- Provider: One of `githubtools` or `githubwdf`, configured in `config/auth.yaml` and environment variables.
- JWT: Short-lived access token used in `Authorization: Bearer <token>` for protected API calls.
- Refresh token: Long-lived, HttpOnly, Secure cookie used to obtain new JWTs without re-authenticating.
- TokenStore: Persistence interface used to store provider access tokens and hashed refresh tokens.

---

## Endpoints Overview

- `GET /api/auth/{provider}/start`
  - Validates provider and generates a secure `state`.
  - Builds provider authorization URL using OAuth2 (`offline` access) and redirects the browser.

- `GET /api/auth/{provider}/handler/frame`
  - OAuth callback endpoint (HTML “frame” response).
  - Exchanges `code` for provider access token, fetches GitHub profile, links user by email to internal UUID, optionally persists the provider token.
  - Creates and sets an HttpOnly Secure refresh-token cookie (scoped to `/api/auth/refresh`) and posts `"authorization_response"` to the opener window, then closes the frame.

- `GET /api/auth/refresh`
  - Reads refresh-token cookie, validates it against DB persistence, and returns a new JWT in JSON: `{ "accessToken": "<jwt>" }`.
  - Returns `401` if the cookie is missing/expired/invalid.

- `POST /api/auth/logout`
  - Stateless logout; clears an `auth_token` cookie if present.
  - JWTs are stateless; client should drop tokens. No refresh-token invalidation is persisted here.

---

## Login Flow

1. Start
   - Client initiates `GET /api/auth/{provider}/start` with `provider ∈ {githubtools, githubwdf}`.
   - Server:
     - Validates provider.
     - Generates a random `state` (32 bytes, base64).
     - Computes callback URL: `{RedirectURL}/api/auth/{provider}/handler/frame`.
     - Redirects to GitHub Enterprise authorize URL with scopes `user:email`, `read:user`, `repo`, and `access_type=offline`.

2. Callback (HandlerFrame)
   - Provider redirects back with `code`, `state`. Errors are surfaced to the frame and posted to `window.opener`.
   - Service steps:
     - Exchanges `code` for an access token via OAuth2.
     - Fetches user profile (login and primary/verified email) using the GitHub API.
     - Attempts to resolve the internal user UUID by email via `UserRepository.GetByEmail`.
     - If a UUID is found:
       - Persists the provider access token via `TokenStore.UpsertToken(userUUID, provider, token, expiresAt)`, where `expiresAt = now + GithubTokenExpiresInDays`.
     - Generates a JWT for the user (`GenerateJWT`).
   - Refresh token creation:
     - Creates a random 256-bit refresh token.
     - Hashes it with SHA-256 and persists via `TokenStore.UpsertRefreshToken(userUUID, hashed, expiresAt)`, where `expiresAt = now + RefreshTokenExpiresInDays`.
     - Sets an HttpOnly, Secure, SameSite=Lax cookie scoped to `/api/auth/refresh` with `maxAge` matching the refresh token TTL.
   - Returns a minimal HTML page that:
     - `postMessage({ type: "authorization_response", status: "success" }, "*")` to `window.opener`.
     - Closes the frame.
   - Note: The access token is not returned via the frame; the client should call `/api/auth/refresh` next.

3. Refresh
   - Client calls `GET /api/auth/refresh`.
   - Server:
     - Reads refresh-token cookie.
     - Validates it by hashing and looking up in the token store; checks expiry.
     - Loads the user profile via `UserRepository.GetByUUID`.
     - Generates a new JWT.
     - Responds with `{ "accessToken": "<jwt>" }`.

---

## JWT and Refresh Tokens

- JWT
  - Algorithm: HS256.
  - Secret: `JWT_SECRET`.
  - Claims:
    - `username`, `email`, `user_uuid`.
    - Standard registered claims: `iat`, `exp`, `iss = "developer-portal"`.
  - Expiration: `JWT_EXPIRES_IN_MINUTES` (default 15).

- Refresh token
  - Random 256-bit value, Base64 URL encoded.
  - Persisted hashed (SHA-256) in the token store with an expiry of `REFRESH_TOKEN_EXPIRATION_IN_DAYS` (default 14).
  - Delivered as an HttpOnly, Secure cookie, SameSite=Lax, path `/api/auth/refresh`.
  - On `/api/auth/refresh`, a new JWT is generated if the cookie is valid and not expired.
  - If missing/expired/invalid, server returns `401`.

- Logout
  - Stateless; removing JWT on the client suffices.
  - The current `POST /api/auth/logout` clears an `auth_token` cookie but does not revoke refresh tokens server-side.
  - If server-side revocation is required, add a token blacklist or removal from `TokenStore`.

---

## GitHub Tokens (Provider Access Tokens)

- Persistence
  - When a user UUID is known, the provider access token is stored via:
    - `TokenStore.UpsertToken(userUUID, provider, token, expiresAt)`
    - Expiry is `now + GithubTokenExpiresInDays` (default 365).
  - Retrieval:
    - `GetGitHubAccessToken(userUUID, provider)` returns a valid non-expired token or error.

- Client creation
  - REST:
    - `GitHubClient(ctx, userUUID, provider)` returns an authenticated `github.Client` bound to the provider’s Enterprise base URL.
  - GraphQL:
    - `CreateGraphqlClient(ctx, userUUID, provider)` returns an authenticated `githubv4.Client` using `{EnterpriseBaseURL}/api/graphql`.
  - Scopes requested during OAuth:
    - `user:email`, `read:user`, `repo` (adjust as necessary).

- Encryption utilities (optional)
  - `internal/auth/crypto.go` provides AES-256-GCM helpers for encrypting/decrypting tokens using a base64-encoded 32-byte `TOKEN_SECRET`.
  - If the `TokenStore` implementation opts to encrypt provider tokens at rest, ensure `TOKEN_SECRET` is configured.

---

## Middleware

- `AuthMiddleware.RequireAuth()`
  - Expects `Authorization: Bearer <jwt>` header.
  - Validates JWT via `ValidateJWT`.
  - On success, sets `user_uuid`, `username`, `email` in Gin context.

- Helper getters:
  - `GetUsername(c)`, `GetUserEmail(c)`, `GetProvider(c)`, `GetEnvironment(c)`.

---

## Configuration

- File: `config/auth.yaml` (viper-based; also reads environment variables).
- Key fields:
  - `jwt_secret` (or env `JWT_SECRET`)
  - `token_secret` (or env `TOKEN_SECRET`) for encryption helpers
  - `redirect_url` (or env `AUTH_REDIRECT_URL`) used to form frame callback URL
  - `jwt_expires_in_minutes` (or env `JWT_EXPIRES_IN_MINUTES`, default 15)
  - `github_token_expires_in_days` (or env `GITHUB_TOKEN_EXPIRATION_IN_DAYS`, default 365)
  - `refresh_token_expires_in_days` (or env `REFRESH_TOKEN_EXPIRATION_IN_DAYS`, default 14)
  - `providers`:
    - `githubtools`, `githubwdf`
    - `client_id`, `client_secret`
    - `enterprise_base_url` (GitHub Enterprise base, e.g. `https://github.enterprise.example.com`)

- Environment overrides:
  - `GITHUB_TOOLS_APP_CLIENT_ID`, `GITHUB_TOOLS_APP_CLIENT_SECRET`
  - `GITHUB_WDF_APP_CLIENT_ID`, `GITHUB_WDF_APP_CLIENT_SECRET`
  - `AUTH_REDIRECT_URL`, `JWT_SECRET`, `TOKEN_SECRET`
  - Expiration overrides noted above

- Notes:
  - Providers must be present and have non-empty client credentials.

---

## Frontend Integration

- Popup/Frame OAuth:
  - Open `/api/auth/{provider}/start` in a popup.
  - The provider completes OAuth and returns to `/api/auth/{provider}/handler/frame`.
  - The frame sets the refresh-token cookie, posts a success message to `window.opener`, and closes.
- Token retrieval:
  - After success, call `GET /api/auth/refresh` to obtain `{ accessToken }`.
  - Include `Authorization: Bearer <accessToken>` on subsequent API requests.
- Error handling:
  - The frame posts `{ type: "authorization_response", error: { name, message } }` on errors.
  - If the refresh cookie expires, `/api/auth/refresh` returns `401`; re-initiate the login flow.

---

## Security Considerations

- Do not log access tokens or authorization codes; logs only include safe metadata.
- Refresh-token cookie is:
  - HttpOnly: not accessible to JavaScript.
  - Secure: only sent over HTTPS.
  - SameSite=Lax: mitigates CSRF while allowing typical navigation flows.
  - Scoped to `/api/auth/refresh`: reduces unnecessary exposure.
- JWTs are short-lived and stateless; rotate using the refresh endpoint.
- If storing provider tokens at rest, consider using `crypto.go` AES-GCM helpers and a managed `TOKEN_SECRET`.

---

## Quick Reference (cURL)

- Start (will redirect):
  ```bash
  curl -I "http://localhost:3000/api/auth/githubtools/start"
  ```

- Refresh (after successful login in browser; cookie must be present):
  ```
  curl -H "Cookie: <refresh-token-cookie>" \
       "http://localhost:3000/api/auth/refresh"
  # => { "accessToken": "<jwt>" }
  ```

- Logout (client-side should also clear stored JWT):
  ```
  curl -X POST "http://localhost:3000/api/auth/logout"
  ```
