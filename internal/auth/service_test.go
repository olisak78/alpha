package auth

import (
	"context"
	"developer-portal-backend/internal/constants"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"developer-portal-backend/internal/database/models"
	apperrors "developer-portal-backend/internal/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

/*
	ServiceSuite

	- Uses testify/suite for organization
	- AAA pattern within test (Arrange → Act → Assert)
	- Follows conventions from middleware_test.go and crypto_test.go
	- Covers happy paths, error scenarios, and edge cases to target >80% coverage on service_mocks.go
*/

// fakeUserRepo implements UserRepository for tests
type fakeUserRepo struct {
	ret interface{}
	err error
}

func (f *fakeUserRepo) GetByUUID(uuid uuid.UUID) (*models.User, error) {
	return f.ret.(*models.User), f.err
}

func (f *fakeUserRepo) GetByEmail(email string) (interface{}, error) {
	return f.ret, f.err
}

// spyTokenStore implements TokenStore and captures calls
type spyTokenStore struct {
	upsertCalled        bool
	upsertRefreshCalled bool
	upsertUserUUID      uuid.UUID
	upsertProvider      string
	upsertToken         string
	upsertExpires       time.Time
	upsertErr           error

	getToken *models.Token
	getErr   error
}

func (s *spyTokenStore) UpsertRefreshToken(userUUID uuid.UUID, token string, expiresAt time.Time) error {
	s.upsertRefreshCalled = true
	s.upsertUserUUID = userUUID
	s.upsertProvider = constants.RefreshToken
	s.upsertToken = token
	s.upsertExpires = expiresAt
	return s.upsertErr
}

func (s *spyTokenStore) GetByRefreshToken(refreshToken string) (*models.Token, error) {
	return s.getToken, s.getErr
}

func (s *spyTokenStore) UpsertToken(userUUID uuid.UUID, provider string, token string, expiresAt time.Time) error {
	s.upsertCalled = true
	s.upsertUserUUID = userUUID
	s.upsertProvider = provider
	s.upsertToken = token
	s.upsertExpires = expiresAt
	return s.upsertErr
}
func (s *spyTokenStore) GetValidToken(userUUID uuid.UUID, provider string) (*models.Token, error) {
	return s.getToken, s.getErr
}
func (s *spyTokenStore) DeleteToken(userUUID uuid.UUID, provider string) error { return nil }
func (s *spyTokenStore) CleanupExpiredTokens() error                           { return nil }

// ServiceSuite encapsulates common setup for auth service tests
type ServiceSuite struct {
	suite.Suite
	cfg        *AuthConfig
	service    *AuthService
	userRepo   *fakeUserRepo
	tokenStore *spyTokenStore
	provider   string
}

func TestServiceSuite(t *testing.T) {
	suite.Run(t, new(ServiceSuite))
}

func (s *ServiceSuite) SetupTest() {
	s.provider = "githubtools"
	s.userRepo = &fakeUserRepo{}
	s.tokenStore = &spyTokenStore{}

	s.cfg = &AuthConfig{
		JWTSecret:                 "test-signing-key-service",
		JWTExpiresInMinutes:       15,
		RefreshTokenExpiresInDays: 14,
		TokenSecret:               "test-signing-key-service",
		RedirectURL:               "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			s.provider: {
				ClientID:          "id",
				ClientSecret:      "secret",
				EnterpriseBaseURL: "https://github.example.com", // default; overridden per-test when needed
			},
			"githubwdf": {
				ClientID:     "id-wdf",
				ClientSecret: "secret-wdf",
			},
		},
	}
	svc, err := NewAuthService(s.cfg, s.userRepo, s.tokenStore)
	require.NoError(s.T(), err)
	s.service = svc
}

/*
	NewAuthService tests
*/

func (s *ServiceSuite) TestNewAuthService_ValidInitialization() {
	// Arrange
	cfg := &AuthConfig{
		JWTSecret:   "key",
		TokenSecret: "key2",
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "secret", EnterpriseBaseURL: "https://gh.tools"},
			"githubwdf":   {ClientID: "id2", ClientSecret: "secret2", EnterpriseBaseURL: "https://gh.wdf"},
		},
	}
	userRepo := &fakeUserRepo{}
	tokStore := &spyTokenStore{}

	// Act
	svc, err := NewAuthService(cfg, userRepo, tokStore)

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), svc)
	assert.NotNil(s.T(), svc.githubClients["githubtools"])
	assert.NotNil(s.T(), svc.githubClients["githubwdf"])
	assert.Equal(s.T(), cfg, svc.config)
	assert.Equal(s.T(), userRepo, svc.userRepo)
	assert.Equal(s.T(), tokStore, svc.tokenStore)
}

func (s *ServiceSuite) TestNewAuthService_InvalidConfig_Error() {
	// Arrange: missing JWTSecret
	cfg := &AuthConfig{
		RedirectURL: "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "secret"},
		},
	}

	// Act
	svc, err := NewAuthService(cfg, nil, nil)

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), svc)
	assert.Contains(s.T(), err.Error(), "invalid auth config")
}

/*
	getMemberIDByEmail tests
*/

func (s *ServiceSuite) TestGetMemberIDByEmail_NilRepoOrEmptyEmail_ReturnsEmpty() {
	// Arrange
	s.service.userRepo = nil

	// Act
	id1 := s.service.getMemberIDByEmail("user@example.com")
	id2 := s.service.getMemberIDByEmail("")

	// Assert
	assert.Equal(s.T(), "", id1)
	assert.Equal(s.T(), "", id2)
}

func (s *ServiceSuite) TestGetMemberIDByEmail_RepoErrorOrNil_ReturnsEmpty() {
	// Arrange: repo error
	s.userRepo.err = errors.New("db err")

	// Act
	id := s.service.getMemberIDByEmail("user@example.com")
	assert.Equal(s.T(), "", id)

	// Arrange: repo returns nil
	s.userRepo.err = nil
	s.userRepo.ret = nil

	// Act
	id2 := s.service.getMemberIDByEmail("user@example.com")
	// Assert
	assert.Equal(s.T(), "", id2)
}

func (s *ServiceSuite) TestGetMemberIDByEmail_ReturnsUUID_FromPointerStruct() {
	// Arrange
	user := &models.User{
		BaseModel: models.BaseModel{
			ID: uuid.New(),
		},
	}
	s.userRepo.err = nil
	s.userRepo.ret = user

	// Act
	id := s.service.getMemberIDByEmail("john.doe@test.com")

	// Assert
	assert.Equal(s.T(), user.ID.String(), id)
}

func (s *ServiceSuite) TestGetMemberIDByEmail_NoIDField_ReturnsEmpty() {
	// Arrange: struct without ID field
	type noID struct {
		Name string
	}
	s.userRepo.err = nil
	s.userRepo.ret = &noID{Name: "x"}

	// Act
	id := s.service.getMemberIDByEmail("x@test.com")

	// Assert
	assert.Equal(s.T(), "", id)
}

/*
	GetAuthURL tests
*/

func (s *ServiceSuite) TestGetAuthURL_ProviderMissing_Error() {
	// Act
	urlStr, err := s.service.GetAuthURL("nonexistent", "state123")

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), urlStr)
	assert.Contains(s.T(), err.Error(), "provider 'nonexistent' not found")
}

func (s *ServiceSuite) TestGetAuthURL_ClientNotFound_Error() {
	// Arrange: remove client from map while provider exists in config
	delete(s.service.githubClients, s.provider)

	// Act
	urlStr, err := s.service.GetAuthURL(s.provider, "stateXYZ")

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), urlStr)
	assert.Contains(s.T(), err.Error(), "GitHub client not found for provider")
}

func (s *ServiceSuite) TestGetAuthURL_HappyPath_ReturnsAuthorizeURL() {
	// Arrange
	state := "s123"
	expectedCallback := fmt.Sprintf("%s/api/auth/%s/handler/frame", s.cfg.RedirectURL, s.provider)

	// Act
	urlStr, err := s.service.GetAuthURL(s.provider, state)

	// Assert
	require.NoError(s.T(), err)
	require.NotEmpty(s.T(), urlStr)
	assert.True(s.T(), strings.Contains(urlStr, "/login/oauth/authorize"))
	assert.True(s.T(), strings.Contains(urlStr, "client_id"))
	// Parse URL to validate query parameters precisely (redirect_uri is URL-encoded)
	u, parseErr := url.Parse(urlStr)
	require.NoError(s.T(), parseErr)
	q := u.Query()
	assert.Equal(s.T(), expectedCallback, q.Get("redirect_uri"))
	assert.Equal(s.T(), state, q.Get("state"))
}

/*
	HandleCallback tests with single enterprise server hosting both OAuth and API endpoints
*/

func enterpriseServer(
	tokenHandler func(w http.ResponseWriter, r *http.Request),
	userHandler func(w http.ResponseWriter, r *http.Request),
	emailsHandler func(w http.ResponseWriter, r *http.Request),
) *httptest.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/login/oauth/access_token", tokenHandler)
	mux.HandleFunc("/api/v3/user", userHandler)
	mux.HandleFunc("/api/v3/user/emails", emailsHandler)
	return httptest.NewServer(mux)
}

func (s *ServiceSuite) reinitServiceWithEnterpriseBase(base string) {
	// Reinitialize service with new Enterprise base URL for provider
	s.cfg.Providers[s.provider] = ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: base,
	}
	newSvc, err := NewAuthService(s.cfg, s.userRepo, s.tokenStore)
	require.NoError(s.T(), err)
	s.service = newSvc
}

func (s *ServiceSuite) TestHandleCallback_ProviderMissing_Error() {
	// Act
	resp, err := s.service.HandleCallback(context.Background(), "nonexistent", "code123", "state123")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "provider 'nonexistent' not found")
}

func (s *ServiceSuite) TestHandleCallback_ClientNotFound() {
	// Arrange
	delete(s.service.githubClients, s.provider)

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "code", "state")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "GitHub client not found for provider")
}

func (s *ServiceSuite) TestHandleCallback_ExchangeError() {
	// Arrange: token endpoint returns 400 to cause exchange error
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"invalid_grant"}`))
		},
		func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) },
		func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) },
	)
	defer srv.Close()
	s.reinitServiceWithEnterpriseBase(srv.URL)

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "bad_code", "stateX")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "failed to exchange code for token")
}

func (s *ServiceSuite) TestHandleCallback_GetUserProfileError() {
	// Arrange: token returns access token; user endpoint returns 401
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"t123","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"message":"bad token"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[]`))
		},
	)
	defer srv.Close()
	s.reinitServiceWithEnterpriseBase(srv.URL)

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "code", "state")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "failed to get user profile")
	assert.Contains(s.T(), err.Error(), "invalid access token")
}

func (s *ServiceSuite) TestHandleCallback_UpsertTokenCalledAndJWTReturned_HappyPath() {
	// Arrange: token returns access token; user + emails return valid data
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"test-access","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"login":"tester","email":"profile@example.com"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[{"email":"primary@example.com","primary":true,"verified":true}]`))
		},
	)
	defer srv.Close()
	s.reinitServiceWithEnterpriseBase(srv.URL)

	// return a real user from repo to populate UUID
	user := &models.User{BaseModel: models.BaseModel{ID: uuid.New()}}
	s.userRepo.ret = user
	s.userRepo.err = nil
	s.tokenStore.upsertErr = nil

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "codeX", "stateX")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), resp)
	assert.Equal(s.T(), "Bearer", resp.TokenType)
	assert.Equal(s.T(), int64(s.cfg.JWTExpiresInMinutes), resp.ExpiresIn)
	require.True(s.T(), s.tokenStore.upsertCalled)
	assert.Equal(s.T(), s.provider, s.tokenStore.upsertProvider)
	assert.Equal(s.T(), "test-access", s.tokenStore.upsertToken)
	//Hub provider token expires in days; verify using GithubTokenExpiresInDays
	assert.WithinDuration(s.T(), time.Now().AddDate(0, 0, s.cfg.GithubTokenExpiresInDays), s.tokenStore.upsertExpires, time.Minute)

	claims, err := s.service.ValidateJWT(resp.AccessToken)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), "tester", claims.Username)
	assert.Equal(s.T(), "primary@example.com", claims.Email)
	assert.Equal(s.T(), user.ID.String(), claims.UUID)
}

func (s *ServiceSuite) TestHandleCallback_InvalidUUIDInRepo_ReturnsError() {
	// Arrange: token and profile succeed; repo returns struct with non-UUID ID
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"a1","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`{"login":"tester","email":"tester@example.com"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`[]`))
		},
	)
	defer srv.Close()
	s.reinitServiceWithEnterpriseBase(srv.URL)

	// Custom member type with string ID to produce non-parseable UUID
	type badMember struct {
		ID string
	}
	s.userRepo.ret = &badMember{ID: "not-a-uuid"}
	s.userRepo.err = nil

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "code", "state")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "invalid user UUID")
}

func (s *ServiceSuite) TestHandleCallback_UpsertTokenFails_Error() {
	// Arrange: token and profile succeed; Upsert returns error
	srv := enterpriseServer(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"tok123","token_type":"bearer","expires_in":3600}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`{"login":"tester","email":"tester@example.com"}`))
		},
		func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`[]`))
		},
	)
	defer srv.Close()
	s.reinitServiceWithEnterpriseBase(srv.URL)

	s.userRepo.ret = &models.User{BaseModel: models.BaseModel{ID: uuid.New()}}
	s.userRepo.err = nil
	s.tokenStore.upsertErr = errors.New("db failure")

	// Act
	resp, err := s.service.HandleCallback(context.Background(), s.provider, "code", "state")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), resp)
	assert.Contains(s.T(), err.Error(), "failed to store provider access token")
}

/*
	GenerateJWT and ValidateJWT basic coverage (additional to auth_test.go)
*/

func (s *ServiceSuite) TestGenerateJWT_And_ValidateJWT_RoundTrip() {
	// Arrange
	userProfile := &UserProfile{Username: "u1", Email: "u1@example.com", UUID: "uuid-1"}

	// Act
	token, err := s.service.GenerateJWT(userProfile)
	require.NoError(s.T(), err)
	claims, err := s.service.ValidateJWT(token)

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), claims)
	assert.Equal(s.T(), "u1", claims.Username)
	assert.Equal(s.T(), "u1@example.com", claims.Email)
	assert.Equal(s.T(), "uuid-1", claims.UUID)
}

func (s *ServiceSuite) TestValidateJWT_InvalidToken_Error() {
	// Act
	claims, err := s.service.ValidateJWT("invalid.token.value")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), claims)
	assert.Contains(s.T(), err.Error(), "failed to parse token")
}

/*
	generateRandomString tests
*/

func (s *ServiceSuite) TestGenerateRandomString_Success() {
	// Act
	str, err := s.service.generateRandomString(16)

	// Assert
	require.NoError(s.T(), err)
	require.NotEmpty(s.T(), str)
	assert.NotContains(s.T(), str, "+")
	assert.NotContains(s.T(), str, "/")
}

// Refresh token expiration tests: default 14 days and cookie maxAge calculation
func (s *ServiceSuite) TestCreateRefreshToken_Default14Days_UpsertAndMaxAge() {
	// Arrange
	userID := uuid.New()
	s.tokenStore.upsertErr = nil

	// Act
	maxAge, refreshTok, err := s.service.CreateRefreshToken(userID.String())

	// Assert store call and values
	require.NoError(s.T(), err)
	require.NotEmpty(s.T(), refreshTok)
	require.True(s.T(), s.tokenStore.upsertRefreshCalled, "UpsertRefreshToken should be called")
	assert.Equal(s.T(), constants.RefreshToken, s.tokenStore.upsertProvider)

	// ExpiresAt should be ~14 days in the future by default (or cfg-defined value)
	expectedDays := s.cfg.RefreshTokenExpiresInDays
	require.True(s.T(), expectedDays > 0, "RefreshTokenExpiresInDays should be defaulted > 0")
	assert.WithinDuration(s.T(),
		time.Now().AddDate(0, 0, expectedDays),
		s.tokenStore.upsertExpires,
		time.Minute)

	// maxAge cookie value should equal days*24*60*60
	assert.Equal(s.T(), expectedDays*24*60*60, maxAge)
}

/*
	GetGitHubAccessToken tests
*/

func (s *ServiceSuite) TestGetGitHubAccessToken_ServiceNil_Error() {
	// Arrange
	var svc *AuthService

	// Act
	token, err := svc.GetGitHubAccessToken(uuid.New().String(), s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.True(s.T(), apperrors.IsConfiguration(err))
	assert.EqualError(s.T(), err, apperrors.ErrAuthServiceNotInitialized.Error())
}

func (s *ServiceSuite) TestGetGitHubAccessToken_UserUUIDMissing_Error() {
	// Act
	token, err := s.service.GetGitHubAccessToken("", s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.True(s.T(), apperrors.IsValidation(err))
	assert.EqualError(s.T(), err, apperrors.ErrUserUUIDMissing.Error())
}

func (s *ServiceSuite) TestGetGitHubAccessToken_ProviderMissing_Error() {
	// Act
	token, err := s.service.GetGitHubAccessToken(uuid.New().String(), "")

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.True(s.T(), apperrors.IsValidation(err))
	assert.EqualError(s.T(), err, apperrors.ErrProviderMissing.Error())
}

func (s *ServiceSuite) TestGetGitHubAccessToken_TokenStoreNil_Error() {
	// Arrange
	s.service.tokenStore = nil

	// Act
	token, err := s.service.GetGitHubAccessToken(uuid.New().String(), s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.True(s.T(), apperrors.IsConfiguration(err))
	assert.EqualError(s.T(), err, apperrors.ErrTokenStoreNotInitialized.Error())
}

func (s *ServiceSuite) TestGetGitHubAccessToken_InvalidUUID_Error() {
	// Arrange
	s.service.tokenStore = s.tokenStore

	// Act
	token, err := s.service.GetGitHubAccessToken("not-a-uuid", s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.Contains(s.T(), err.Error(), "invalid userUUID")
}

func (s *ServiceSuite) TestGetGitHubAccessToken_NoValidToken_Error() {
	// Arrange
	s.service.tokenStore = s.tokenStore
	s.tokenStore.getToken = nil
	s.tokenStore.getErr = nil
	userID := uuid.New().String()

	// Act
	token, err := s.service.GetGitHubAccessToken(userID, s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Empty(s.T(), token)
	assert.Contains(s.T(), err.Error(), "no valid GitHub token found")
	assert.True(s.T(), strings.Contains(err.Error(), userID))
	assert.True(s.T(), strings.Contains(err.Error(), s.provider))
}

func (s *ServiceSuite) TestGetGitHubAccessToken_ValidToken_HappyPath() {
	// Arrange
	s.service.tokenStore = s.tokenStore
	userUUID := uuid.New()
	s.tokenStore.getToken = &models.Token{
		UserUUID:  userUUID,
		Provider:  s.provider,
		Token:     "ghp_valid_token",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	s.tokenStore.getErr = nil

	// Act
	token, err := s.service.GetGitHubAccessToken(userUUID.String(), s.provider)

	// Assert
	require.NoError(s.T(), err)
	assert.Equal(s.T(), "ghp_valid_token", token)
}

/*
	GetGitHubClient tests
*/

func (s *ServiceSuite) TestGetGitHubClient_ServiceNil_Error() {
	// Arrange
	var svc *AuthService

	// Act
	client, err := svc.GetGitHubClient(s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), client)
	assert.EqualError(s.T(), err, apperrors.ErrAuthServiceNotInitialized.Error())
}

func (s *ServiceSuite) TestGetGitHubClient_ProviderNotFound_Error() {
	// Act
	client, err := s.service.GetGitHubClient("nonexistent")

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), client)
	assert.Contains(s.T(), err.Error(), "GitHub client not found for provider")
}

func (s *ServiceSuite) TestGetGitHubClient_HappyPath() {
	// Act
	client, err := s.service.GetGitHubClient(s.provider)

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), client)
}

/*
	CreateGitHubClient tests
*/

func (s *ServiceSuite) TestCreateGitHubClient_FailedGetAccessToken_Error() {
	// Arrange: token store returns no valid token
	s.service.tokenStore = s.tokenStore
	s.tokenStore.getToken = nil
	s.tokenStore.getErr = nil

	// Act
	client, err := s.service.CreateGitHubClient(context.Background(), uuid.New().String(), s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), client)
	assert.Contains(s.T(), err.Error(), "failed to get GitHub access token")
}

func (s *ServiceSuite) TestCreateGitHubClient_FailedGetGitHubClient_Error() {
	// Arrange: remove client mapping
	delete(s.service.githubClients, s.provider)
	s.service.tokenStore = s.tokenStore
	userUUID := uuid.New().String()
	s.tokenStore.getToken = &models.Token{
		UserUUID:  uuid.MustParse(userUUID),
		Provider:  s.provider,
		Token:     "tok",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	// Act
	client, err := s.service.CreateGitHubClient(context.Background(), userUUID, s.provider)

	// Assert
	assert.Error(s.T(), err)
	assert.Nil(s.T(), client)
	assert.Contains(s.T(), err.Error(), "failed to get GitHub client")
}

func (s *ServiceSuite) TestCreateGitHubClient_HappyPath() {
	// Arrange
	s.reinitServiceWithEnterpriseBase("https://github.enterprise.local")
	userUUID := uuid.New().String()
	s.tokenStore.getToken = &models.Token{
		UserUUID:  uuid.MustParse(userUUID),
		Provider:  s.provider,
		Token:     "tok123",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	s.tokenStore.getErr = nil

	// Act
	client, err := s.service.CreateGitHubClient(context.Background(), userUUID, s.provider)

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), client)
}

/*
	Logout test
*/

func (s *ServiceSuite) TestLogout_ReturnsNil() {
	// Act
	err := s.service.Logout()
	// Assert
	assert.NoError(s.T(), err)
}

const validUUID = "550e8400-e29b-41d4-a716-446655440000"

// TestCreateGraphqlClient_Success_GitHubCom tests client creation for GitHub.com (empty enterprise URL)
func TestCreateGraphqlClient_Success_GitHubCom(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: ""}),
		},
		tokenStore: &mockTokenStore{
			tok: &models.Token{
				Token:     "test-token",
				ExpiresAt: time.Now().Add(time.Hour),
			},
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.NoError(t, err)
	assert.NotNil(t, client)
}

// TestCreateGraphqlClient_Success_Enterprise tests client creation for GitHub Enterprise
func TestCreateGraphqlClient_Success_Enterprise(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: "https://enterprise.github.com"}),
		},
		tokenStore: &mockTokenStore{
			tok: &models.Token{
				Token:     "test-token",
				ExpiresAt: time.Now().Add(time.Hour),
			},
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.NoError(t, err)
	assert.NotNil(t, client)
}

// TestCreateGraphqlClient_Fail_GetGitHubClient tests failure when provider client isn't configured
func TestCreateGraphqlClient_Fail_GetGitHubClient(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{},
		tokenStore: &mockTokenStore{
			tok: &models.Token{
				Token:     "test-token",
				ExpiresAt: time.Now().Add(time.Hour),
			},
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to get GitHub client")
}

// TestCreateGraphqlClient_Fail_GetAccessToken tests failure to get access token
func TestCreateGraphqlClient_Fail_GetAccessToken(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: ""}),
		},
		tokenStore: &mockTokenStore{
			err: errors.New("token store not initialized"),
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to get GitHub access token")
}

// TestCreateGraphqlClient_InvalidUUID ensures invalid UUID is handled
func TestCreateGraphqlClient_InvalidUUID(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: ""}),
		},
		tokenStore: &mockTokenStore{
			tok: &models.Token{
				Token:     "test-token",
				ExpiresAt: time.Now().Add(time.Hour),
			},
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), "not-a-uuid", "github")
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "invalid userUUID")
}

// TestCreateGraphqlClient_Fail_TokenStoreNil ensures nil tokenStore is handled (token store not initialized)
func TestCreateGraphqlClient_Fail_TokenStoreNil(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: ""}),
		},
		// tokenStore is nil
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.Error(t, err)
	assert.Nil(t, client)
	// bubbled from GetGitHubAccessToken
	assert.Contains(t, err.Error(), "failed to get GitHub access token")
}

// TestCreateGraphqlClient_Fail_NoValidToken ensures expired tokens are rejected
func TestCreateGraphqlClient_Fail_NoValidToken(t *testing.T) {
	authSvc := &AuthService{
		githubClients: map[string]*GitHubClient{
			"github": NewGitHubClient(&ProviderConfig{EnterpriseBaseURL: ""}),
		},
		tokenStore: &mockTokenStore{
			tok: &models.Token{
				Token:     "expired-token",
				ExpiresAt: time.Now().Add(-1 * time.Hour), // expired
			},
		},
	}

	client, err := authSvc.CreateGraphqlClient(context.Background(), validUUID, "github")
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "no valid GitHub token found")
}

// mockTokenStore implements TokenStore exactly as defined in service_mocks.go
type mockTokenStore struct {
	tok *models.Token
	err error
}

func (m *mockTokenStore) UpsertRefreshToken(userUUID uuid.UUID, token string, expiresAt time.Time) error {
	return nil
}

func (m *mockTokenStore) GetByRefreshToken(refreshToken string) (*models.Token, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.tok, nil
}

func (m *mockTokenStore) UpsertToken(userUUID uuid.UUID, provider string, token string, expiresAt time.Time) error {
	return nil
}

func (m *mockTokenStore) GetValidToken(userUUID uuid.UUID, provider string) (*models.Token, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.tok, nil
}

func (m *mockTokenStore) DeleteToken(userUUID uuid.UUID, provider string) error {
	return nil
}

func (m *mockTokenStore) CleanupExpiredTokens() error {
	return nil
}
