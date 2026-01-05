package auth

import (
	"developer-portal-backend/internal/constants"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"developer-portal-backend/internal/testutils"

	"developer-portal-backend/internal/database/models"
	"errors"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

/*
	AuthHandlersSuite

	- Uses testify/suite for organization
	- AAA pattern within each test (Arrange → Act → Assert)
	- HTTP tests leverage internal/testutils/http.go helpers
*/

type AuthHandlersSuite struct {
	suite.Suite
	service   *AuthService
	handler   *AuthHandler
	httpSuite *testutils.HTTPTestSuite
}

// SetupTest initializes a fresh service, handler, and HTTP router per test for isolation.
func (s *AuthHandlersSuite) SetupTest() {
	gin.SetMode(gin.TestMode)

	cfg := &AuthConfig{
		JWTSecret:   "unit-test-jwt-secret",
		TokenSecret: "unit-test-token-secret",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:          "tools-client-id",
				ClientSecret:      "tools-client-secret",
				EnterpriseBaseURL: "https://github.tools.sap",
			},
			"githubwdf": {
				ClientID:          "wdf-client-id",
				ClientSecret:      "wdf-client-secret",
				EnterpriseBaseURL: "https://github.wdf.sap.corp",
			},
		},
	}
	svc, err := NewAuthService(cfg, nil, &noopTokenStore{})
	require.NoError(s.T(), err)

	s.service = svc
	s.handler = NewAuthHandler(svc)

	// Setup HTTP router and register endpoints
	s.httpSuite = testutils.SetupHTTPTest()
	r := s.httpSuite.Router
	r.GET("/api/auth/:provider/start", s.handler.Start)
	r.GET("/api/auth/:provider/handler/frame", s.handler.HandlerFrame)
	r.GET("/api/auth/refresh", s.handler.Refresh)
	r.POST("/api/auth/logout", s.handler.Logout)
}

func TestAuthHandlersSuite(t *testing.T) {
	suite.Run(t, new(AuthHandlersSuite))
}

/*
	Start handler tests
*/

func (s *AuthHandlersSuite) TestStart_EmptyProvider() {
	// Arrange
	ctx, w := testutils.CreateTestGinContext()
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/auth//start", nil)
	// Act
	s.handler.Start(ctx)
	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Provider is required", resp["error"])
}

func (s *AuthHandlersSuite) TestStart_UnsupportedProvider() {
	// Arrange
	url := "/api/auth/foobar/start"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodGet, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, rec.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Unsupported provider", resp["error"])
}

func (s *AuthHandlersSuite) TestStart_SupportedProvider_GithubTools_Redirect() {
	// Arrange
	url := "/api/auth/githubtools/start"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodGet, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusFound, rec.Code)
	loc := rec.Header().Get("Location")
	assert.NotEmpty(s.T(), loc)
	assert.Contains(s.T(), loc, "/login/oauth/authorize")
	assert.Contains(s.T(), loc, "client_id=tools-client-id")
	assert.Contains(s.T(), loc, "state=")
}

func (s *AuthHandlersSuite) TestStart_SupportedProvider_GithubWdf_Redirect() {
	// Arrange
	url := "/api/auth/githubwdf/start"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodGet, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusFound, rec.Code)
	loc := rec.Header().Get("Location")
	assert.NotEmpty(s.T(), loc)
	assert.Contains(s.T(), loc, "/login/oauth/authorize")
	assert.Contains(s.T(), loc, "client_id=wdf-client-id")
	assert.Contains(s.T(), loc, "state=")
}

func (s *AuthHandlersSuite) TestStart_ProviderMissingConfig_AuthURLError() {
	// Arrange: create a service missing the requested provider config
	cfg := &AuthConfig{
		JWTSecret:   "jwt-secret",
		TokenSecret: "token-secret",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "secret", EnterpriseBaseURL: "https://github.tools.sap"},
			// githubwdf intentionally omitted to trigger GetAuthURL error
		},
	}
	svc, err := NewAuthService(cfg, nil, &noopTokenStore{})
	require.NoError(s.T(), err)
	h := NewAuthHandler(svc)

	// Register a temporary route using new handler
	r := gin.New()
	r.GET("/api/auth/:provider/start", h.Start)

	// Act
	req := httptest.NewRequest(http.MethodGet, "/api/auth/githubwdf/start", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusInternalServerError, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Failed to generate authorization URL", resp["error"])
	require.Contains(s.T(), resp["details"], "provider 'githubwdf' not found")
}

/*
	HandlerFrame tests
*/

func (s *AuthHandlersSuite) TestHandlerFrame_OAuthErrorParam_ReturnsHTMLWithError() {
	// Arrange
	url := "/api/auth/githubtools/handler/frame?error=access_denied&error_description=Bad%20%22desc%22"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodGet, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusOK, rec.Code)
	ct := rec.Header().Get("Content-Type")
	assert.Equal(s.T(), "text/html; charset=utf-8", ct)
	body := rec.Body.String()
	assert.Contains(s.T(), body, "authorization_response")
	assert.Contains(s.T(), body, "OAuthError")
	assert.Contains(s.T(), body, "access_denied")
	assert.Contains(s.T(), body, "Bad")
}

func (s *AuthHandlersSuite) TestHandlerFrame_MissingProvider_400() {
	// Arrange
	ctx, w := testutils.CreateTestGinContext()
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/auth//handler/frame", nil)
	testutils.SetQueryParam(ctx, "code", "abc")
	testutils.SetQueryParam(ctx, "state", "123")
	// Act
	s.handler.HandlerFrame(ctx)
	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Provider is required", resp["error"])
}

func (s *AuthHandlersSuite) TestHandlerFrame_MissingCode_400() {
	// Arrange
	ctx, w := testutils.CreateTestGinContext()
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/auth/githubtools/handler/frame", nil)
	testutils.SetURLParam(ctx, "provider", "githubtools")
	testutils.SetQueryParam(ctx, "state", "123")
	// Act
	s.handler.HandlerFrame(ctx)
	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Authorization code is required", resp["error"])
}

func (s *AuthHandlersSuite) TestHandlerFrame_MissingState_400() {
	// Arrange
	ctx, w := testutils.CreateTestGinContext()
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/auth/githubtools/handler/frame", nil)
	testutils.SetURLParam(ctx, "provider", "githubtools")
	testutils.SetQueryParam(ctx, "code", "abc")
	// Act
	s.handler.HandlerFrame(ctx)
	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "State parameter is required", resp["error"])
}

func (s *AuthHandlersSuite) TestHandlerFrame_ServiceError_ReturnsHTMLError() {
	// Arrange: initialize service without the requested provider; calling with githubtools will cause HandleCallback error
	cfg := &AuthConfig{
		JWTSecret:   "jwt-secret",
		TokenSecret: "secret",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"other": {ClientID: "id", ClientSecret: "secret", EnterpriseBaseURL: "https://github.tools.sap"},
		},
	}
	svc, err := NewAuthService(cfg, nil, &noopTokenStore{})
	require.NoError(s.T(), err)
	h := NewAuthHandler(svc)

	r := gin.New()
	r.GET("/api/auth/:provider/handler/frame", h.HandlerFrame)

	// Act
	req := httptest.NewRequest(http.MethodGet, "/api/auth/githubtools/handler/frame?code=abc&state=xyz", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusOK, w.Code)
	ct := w.Header().Get("Content-Type")
	assert.Equal(s.T(), "text/html; charset=utf-8", ct)
	body := w.Body.String()
	assert.Contains(s.T(), body, "authorization_response")
	assert.Contains(s.T(), body, "Error")
	assert.Contains(s.T(), body, "provider &#39;githubtools&#39; not found")
}

/*
	Refresh handler tests
*/

func (s *AuthHandlersSuite) TestRefresh_NoCookie_401() {
	// Arrange
	url := "/api/auth/refresh"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodGet, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, rec.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Authentication required", resp["error"])
}

func (s *AuthHandlersSuite) TestRefresh_InvalidJWTInCookie_401() {
	// Arrange
	url := "/api/auth/refresh"
	headers := map[string]string{
		"Cookie": constants.RefreshToken + "=" + "invalid-token",
	}
	// Act
	rec := s.httpSuite.MakeRequestWithHeaders(http.MethodGet, url, nil, headers)
	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, rec.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Authentication required", resp["error"])
}

/*
	Logout handler tests
*/

func (s *AuthHandlersSuite) TestLogout_Success_ClearsCookie() {
	// Arrange
	url := "/api/auth/logout"
	// Act
	rec := s.httpSuite.MakeRequest(http.MethodPost, url, nil)
	// Assert
	assert.Equal(s.T(), http.StatusOK, rec.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Logged out successfully", resp["message"])

	// Ensure Set-Cookie header indicates deletion of auth_token
	setCookie := rec.Header().Get("Set-Cookie")
	assert.True(s.T(), strings.Contains(setCookie, "auth_token="), "auth_token cookie should be present in header")
	assert.True(s.T(), strings.Contains(setCookie, "HttpOnly"), "cookie should be HttpOnly")
}

/*
	Utility functions tests
*/

func (s *AuthHandlersSuite) TestFormatResponseAsJSON_Success() {
	// Arrange
	resp := map[string]any{"k": "v", "n": 1}
	// Act
	out := formatResponseAsJSON(resp)
	// Assert
	assert.True(s.T(), strings.HasPrefix(out, "{"))
	assert.Contains(s.T(), out, `"k":"v"`)
	assert.Contains(s.T(), out, `"n":1`)
}

func (s *AuthHandlersSuite) TestFormatResponseAsJSON_MarshalError_ReturnsEmptyObject() {
	// Arrange: functions are not JSON-marshalable
	var resp interface{} = func() {}
	// Act
	out := formatResponseAsJSON(resp)
	// Assert
	assert.Equal(s.T(), "{}", out)
}

func (s *AuthHandlersSuite) TestEscapeJSString_NewlinesAndCarriageReturns() {
	// Arrange
	in := "Line1\nLine2\rLine3"
	// Act
	out := escapeJSString(in)
	// Assert
	// \n replaced, \r removed
	assert.Contains(s.T(), out, `Line1\nLine2Line3`)
}

// Additional handler coverage tests merged from handlers_additional_test.go

// stubTokenStore implements TokenStore with behavior needed for handler tests.
type stubTokenStore struct {
	refreshTok *models.Token
	refreshErr error
	upsertErr  error
}

func (s *stubTokenStore) UpsertToken(userUUID uuid.UUID, provider string, token string, expiresAt time.Time) error {
	return nil
}
func (s *stubTokenStore) UpsertRefreshToken(userUUID uuid.UUID, token string, expiresAt time.Time) error {
	return s.upsertErr
}
func (s *stubTokenStore) GetValidToken(userUUID uuid.UUID, provider string) (*models.Token, error) {
	return nil, nil
}
func (s *stubTokenStore) DeleteToken(userUUID uuid.UUID, provider string) error {
	return nil
}
func (s *stubTokenStore) CleanupExpiredTokens() error {
	return nil
}
func (s *stubTokenStore) GetByRefreshToken(refreshToken string) (*models.Token, error) {
	// The handler hashes the cookie value before querying. For this unit test,
	// we return the configured mapping regardless of the input string.
	return s.refreshTok, s.refreshErr
}

// stubUserRepo implements UserRepository for handler tests.
type stubUserRepo struct {
	user *models.User
	err  error
}

func (r *stubUserRepo) GetByEmail(email string) (interface{}, error) { return r.user, r.err }
func (r *stubUserRepo) GetByUUID(id uuid.UUID) (*models.User, error) { return r.user, r.err }

/*
	Merged test cases
*/

// TestRefresh_Success_ReturnsNewAccessToken verifies 200 when a valid refresh cookie exists.
func TestRefresh_Success_ReturnsNewAccessToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	uid := uuid.New()

	// TokenStore returns a non-expired refresh token mapping
	tstore := &stubTokenStore{
		refreshTok: &models.Token{
			UserUUID:  uid,
			Provider:  constants.RefreshToken,
			Token:     "hashed-refresh-token",
			ExpiresAt: time.Now().Add(2 * time.Hour),
		},
		refreshErr: nil,
	}
	// User returns a user for the UUID
	urepo := &stubUserRepo{
		user: &models.User{
			BaseModel: models.BaseModel{ID: uid, Name: "Alice"},
			Email:     "alice@example.com",
		},
		err: nil,
	}

	// Build service and handler; provider config present though not used by Refresh
	cfg := &AuthConfig{
		JWTSecret:   "unit-test-jwt-secret",
		TokenSecret: "unit-test-token",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			// Any provider config to satisfy validation
			"githubtools": {ClientID: "id", ClientSecret: "secret", EnterpriseBaseURL: "https://github.example.com"},
		},
	}
	svc, err := NewAuthService(cfg, urepo, tstore)
	require.NoError(t, err)
	h := NewAuthHandler(svc)

	// Wire router and invoke Refresh
	r := gin.New()
	r.GET("/api/auth/refresh", h.Refresh)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/refresh", nil)
	// Raw cookie value; handler hashes internally and uses TokenStore.GetByRefreshToken
	req.Header.Set("Cookie", constants.RefreshToken+"="+"raw-refresh-token")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "accessToken")
}

// TestHandlerFrame_Success_SetsCookieAndHTML verifies successful OAuth callback sets cookie and returns HTML.
func TestHandlerFrame_Success_SetsCookieAndHTML(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Arrange: GitHub Enterprise stub (token user + emails)
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"tok-ok","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"login":"tester","email":"tester@example.com"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[{"email":"tester@example.com","primary":true,"verified":true}]`))
		},
	)
	defer srv.Close()

	uid := uuid.New()
	cfg := &AuthConfig{
		JWTSecret:                 "unit-test-jwt-secret",
		TokenSecret:               "unit-token-secret",
		RefreshTokenExpiresInDays: 14,
		RedirectURL:               "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:          "id",
				ClientSecret:      "secret",
				EnterpriseBaseURL: srv.URL,
			},
		},
	}
	urepo := &stubUserRepo{
		user: &models.User{
			BaseModel: models.BaseModel{ID: uid, Name: "John"},
			Email:     "tester@example.com",
		},
		err: nil,
	}
	tstore := &stubTokenStore{}
	svc, err := NewAuthService(cfg, urepo, tstore)
	require.NoError(t, err)
	h := NewAuthHandler(svc)

	// Local router for this scenario
	r := gin.New()
	r.GET("/api/auth/:provider/handler/frame", h.HandlerFrame)

	//
	req := httptest.NewRequest(http.MethodGet, "/api/auth/githubtools/handler/frame?code=abc&state=xyz", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/html; charset=utf-8", w.Header().Get("Content-Type"))
	body := w.Body.String()
	assert.Contains(t, body, "authorization_response")
	// Ensure Set-Cookie header contains the refresh token cookie and correct path
	setCookie := w.Header().Get("Set-Cookie")
	assert.Contains(t, setCookie, constants.RefreshToken+"=")
	assert.Contains(t, setCookie, "Path=/api/auth/refresh")
	// Verify cookie Max-Age is 14 days (14*24*60*60 = 1209600 seconds)
	assert.Contains(t, setCookie, "Max-Age")
	assert.Contains(t, setCookie, "Max-Age=1209600")
}

// TestHandlerFrame_CreateRefreshToken_Error verifies HTML error when storing refresh token fails.
func TestHandlerFrame_CreateRefreshToken_Error(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Arrange: GitHub Enterprise stub (token + user + emails) but token store write fails
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"tok-ok","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"login":"tester","email":"tester@example.com"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[{"email":"tester@example.com","primary":true,"verified":true}]`))
		},
	)
	defer srv.Close()

	uid := uuid.New()
	cfg := &AuthConfig{
		JWTSecret:   "unit-test-jwt-secret",
		TokenSecret: "unit-test-token-secret",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:          "id",
				ClientSecret:      "secret",
				EnterpriseBaseURL: srv.URL,
			},
		},
	}
	urepo := &stubUserRepo{
		user: &models.User{
			BaseModel: models.BaseModel{ID: uid, Name: "John"},
			Email:     "tester@example.com",
		},
		err: nil,
	}
	// Failing store to trigger CreateRefreshToken error
	tstore := &stubTokenStore{upsertErr: errors.New("db failure")}
	svc, err := NewAuthService(cfg, urepo, tstore)
	require.NoError(t, err)
	h := NewAuthHandler(svc)

	r := gin.New()
	r.GET("/api/auth/:provider/handler/frame", h.HandlerFrame)

	// Act
	req := httptest.NewRequest(http.MethodGet, "/api/auth/githubtools/handler/frame?code=abc&state=s123", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	body := w.Body.String()
	assert.Contains(t, body, "authorization_response")
	assert.Contains(t, body, "create refresh token failed")
}
