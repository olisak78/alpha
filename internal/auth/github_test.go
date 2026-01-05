package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type GitHubClientSuite struct {
	suite.Suite
}

func TestGitHubClientSuite(t *testing.T) {
	suite.Run(t, new(GitHubClientSuite))
}

// newGitHubEnterpriseAPIServer spins up a fake GitHub Enterprise API server.
// Production code uses github.NewClient(tc).WithEnterpriseURLs(base, base),
// which will call REST endpoints under "/api/v3/*".
func (s *GitHubClientSuite) newGitHubEnterpriseAPIServer(
	userStatus int,
	userBody map[string]any,
	emailsStatus int,
	emailsBody []map[string]any,
) *httptest.Server {
	mux := http.NewServeMux()

	// /api/v3/user -> current authenticated user
	mux.HandleFunc("/api/v3/user", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(userStatus)
		if userBody == nil {
			_ = json.NewEncoder(w).Encode(map[string]any{})
			return
		}
		_ = json.NewEncoder(w).Encode(userBody)
	})

	// /api/v3/user/emails -> list of user emails
	mux.HandleFunc("/api/v3/user/emails", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(emailsStatus)
		if emailsStatus >= http.StatusBadRequest {
			_ = json.NewEncoder(w).Encode(map[string]any{"message": "error"})
			return
		}
		if emailsBody == nil {
			_ = json.NewEncoder(w).Encode([]map[string]any{})
			return
		}
		_ = json.NewEncoder(w).Encode(emailsBody)
	})

	return httptest.NewServer(mux)
}

/*
	GetUserProfile tests
*/

// TestGetUserProfile_PrimaryEmail: picks primary email
func (s *GitHubClientSuite) TestGetUserProfile_PrimaryEmail() {
	// Arrange
	user := map[string]any{
		"login": "octocat",
		"email": "",
	}
	emails := []map[string]any{
		{"email": "primary@example.com", "primary": true, "verified": true},
		{"email": "other@example.com", "primary": false, "verified": true},
	}
	server := s.newGitHubEnterpriseAPIServer(http.StatusOK, user, http.StatusOK, emails)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "token-abc")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), profile)
	assert.Equal(s.T(), "octocat", profile.Username)
	assert.Equal(s.T(), "primary@example.com", profile.Email)
}

// TestGetUserProfile_VerifiedEmailFallback: picks verified email when no primary
func (s *GitHubClientSuite) TestGetUserProfile_VerifiedEmailFallback() {
	// Arrange
	user := map[string]any{
		"login": "octoverified",
		"email": "",
	}
	emails := []map[string]any{
		{"email": "not-verified@example.com", "primary": false, "verified": false},
		{"email": "verified@example.com", "primary": false, "verified": true},
	}
	server := s.newGitHubEnterpriseAPIServer(http.StatusOK, user, http.StatusOK, emails)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "token-x")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), profile)
	assert.Equal(s.T(), "octoverified", profile.Username)
	assert.Equal(s.T(), "verified@example.com", profile.Email)
}

// TestGetUserProfile_ProfileEmailFallback: falls back to user profile email when no primary/verified
func (s *GitHubClientSuite) TestGetUserProfile_ProfileEmailFallback() {
	// Arrange
	user := map[string]any{
		"login": "octofallback",
		"email": "profile@example.com",
	}
	emails := []map[string]any{
		{"email": "a@example.com", "primary": false, "verified": false},
		{"email": "b@example.com", "primary": false, "verified": false},
	}
	server := s.newGitHubEnterpriseAPIServer(http.StatusOK, user, http.StatusOK, emails)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "token-y")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), profile)
	assert.Equal(s.T(), "octofallback", profile.Username)
	assert.Equal(s.T(), "profile@example.com", profile.Email)
}

// TestGetUserProfile_EmailsAPIError_FallbackToProfile: emails endpoint errors -> should not fail, fallback to user email
func (s *GitHubClientSuite) TestGetUserProfile_EmailsAPIError_FallbackToProfile() {
	// Arrange
	user := map[string]any{
		"login": "octoerr",
		"email": "profile@error.com",
	}
	server := s.newGitHubEnterpriseAPIServer(http.StatusOK, user, http.StatusInternalServerError, nil)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "token-z")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), profile)
	assert.Equal(s.T(), "octoerr", profile.Username)
	assert.Equal(s.T(), "profile@error.com", profile.Email)
}

// TestGetUserProfile_UnauthorizedToken: user endpoint returns 401 -> expect "invalid access token"
func (s *GitHubClientSuite) TestGetUserProfile_UnauthorizedToken() {
	// Arrange
	server := s.newGitHubEnterpriseAPIServer(http.StatusUnauthorized, map[string]any{"message": "bad token"}, http.StatusOK, nil)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "bad-token")

	// Assert
	require.Error(s.T(), err)
	assert.Nil(s.T(), profile)
	assert.Equal(s.T(), "invalid access token", err.Error())
}

// TestGetUserProfile_OtherErrorWrapped: user endpoint returns 500 -> wrapped error
func (s *GitHubClientSuite) TestGetUserProfile_OtherErrorWrapped() {
	// Arrange
	server := s.newGitHubEnterpriseAPIServer(http.StatusInternalServerError, map[string]any{"message": "server err"}, http.StatusOK, nil)
	defer server.Close()

	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "secret",
		EnterpriseBaseURL: server.URL,
	}
	client := NewGitHubClient(cfg)

	// Act
	profile, err := client.GetUserProfile(context.Background(), "any-token")

	// Assert
	require.Error(s.T(), err)
	assert.Nil(s.T(), profile)
	assert.Contains(s.T(), err.Error(), "failed to get user profile")
}

/*
	GetOAuth2Config tests
*/

func (s *GitHubClientSuite) TestGetOAuth2Config_BuildsConfig() {
	// Arrange
	cfg := &ProviderConfig{
		ClientID:          "cid",
		ClientSecret:      "csecret",
		EnterpriseBaseURL: "https://ghe.example.com",
	}
	client := NewGitHubClient(cfg)

	// Act
	o := client.GetOAuth2Config("http://callback.local/cb")

	// Assert
	require.NotNil(s.T(), o)
	assert.Equal(s.T(), "cid", o.ClientID)
	assert.Equal(s.T(), "csecret", o.ClientSecret)
	assert.Equal(s.T(), "http://callback.local/cb", o.RedirectURL)
	assert.ElementsMatch(s.T(), []string{"user:email", "read:user", "repo"}, o.Scopes)
	assert.Equal(s.T(), "https://ghe.example.com/login/oauth/authorize", o.Endpoint.AuthURL)
	assert.Equal(s.T(), "https://ghe.example.com/login/oauth/access_token", o.Endpoint.TokenURL)
}

/*
	GetEnterpriseBaseURL tests
*/

func (s *GitHubClientSuite) TestGetEnterpriseBaseURL_WithConfig() {
	// Arrange
	cfg := &ProviderConfig{
		ClientID:          "id",
		ClientSecret:      "sec",
		EnterpriseBaseURL: "https://enterprise.example",
	}
	client := NewGitHubClient(cfg)

	// Act
	base := client.GetEnterpriseBaseURL()

	// Assert
	assert.Equal(s.T(), "https://enterprise.example", base)
}

func (s *GitHubClientSuite) TestGetEnterpriseBaseURL_NilConfig() {
	// Arrange
	client := &GitHubClient{config: nil}

	// Act
	base := client.GetEnterpriseBaseURL()

	// Assert
	assert.Equal(s.T(), "", base)
}

/*
	NewGitHubClient test
*/

func (s *GitHubClientSuite) TestNewGitHubClient_StoresConfig() {
	// Arrange
	cfg := &ProviderConfig{
		ClientID:          "id123",
		ClientSecret:      "sec123",
		EnterpriseBaseURL: "http://base",
	}

	// Act
	client := NewGitHubClient(cfg)

	// Assert
	require.NotNil(s.T(), client)
	assert.Equal(s.T(), cfg, client.config)
}
