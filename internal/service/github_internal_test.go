package service

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"developer-portal-backend/internal/auth"

	"github.com/google/go-github/v57/github"
	"github.com/shurcooL/githubv4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

// Minimal mock implementing GitHubAuthService for tests
type mockAuthService struct {
	accessToken string
	baseURL     string
	tokenErr    error
	clientErr   error
}

func (m *mockAuthService) CreateGraphqlClient(ctx context.Context, userUUID, provider string) (*githubv4.Client, error) {
	// Build a real GraphQL client pointing to the mocked server
	if m.tokenErr != nil {
		return nil, m.tokenErr
	}
	if m.accessToken == "" {
		return nil, fmt.Errorf("no access token")
	}

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: m.accessToken})
	httpClient := oauth2.NewClient(ctx, ts)

	// If baseURL is provided, use Enterprise endpoint /api/graphql, else use public GitHub GraphQL
	if m.baseURL != "" {
		graphqlURL := strings.TrimSuffix(m.baseURL, "/") + "/api/graphql"
		return githubv4.NewEnterpriseClient(graphqlURL, httpClient), nil
	}
	return githubv4.NewClient(httpClient), nil
}

func (m *mockAuthService) CreateGitHubClient(ctx context.Context, userUUID, provider string) (*github.Client, error) {
	return nil, nil
}

func (m *mockAuthService) GetGitHubAccessToken(userUUID, provider string) (string, error) {
	if m.tokenErr != nil {
		return "", m.tokenErr
	}
	if m.accessToken == "" {
		return "", fmt.Errorf("no access token")
	}
	return m.accessToken, nil
}

func (m *mockAuthService) GetGitHubClient(provider string) (*auth.GitHubClient, error) {
	if m.clientErr != nil {
		return nil, m.clientErr
	}
	cfg := &auth.ProviderConfig{
		ClientID:          "test-client-id",
		ClientSecret:      "test-client-secret",
		EnterpriseBaseURL: m.baseURL,
	}
	return auth.NewGitHubClient(cfg), nil
}

func (m *mockAuthService) GetAllProviders() map[string]string {
	return map[string]string{
		"github":      "https://github.com",
		"githubtools": "https://github.tools.sap",
	}
}

// TestParseRepositoryFromURL_Internal tests the internal parseRepositoryFromURL function
func TestParseRepositoryFromURL_Internal(t *testing.T) {
	tests := []struct {
		name          string
		url           string
		expectedOwner string
		expectedRepo  string
		expectedFull  string
	}{
		{
			name:          "StandardGitHubURL",
			url:           "https://github.com/octocat/Hello-World/pull/42",
			expectedOwner: "octocat",
			expectedRepo:  "Hello-World",
			expectedFull:  "octocat/Hello-World",
		},
		{
			name:          "EnterpriseURL",
			url:           "https://github.enterprise.com/myorg/myrepo/pull/123",
			expectedOwner: "myorg",
			expectedRepo:  "myrepo",
			expectedFull:  "myorg/myrepo",
		},
		{
			name:          "TrailingSlash",
			url:           "https://github.com/owner/repo/",
			expectedOwner: "owner",
			expectedRepo:  "repo",
			expectedFull:  "owner/repo",
		},
		{
			name:          "InvalidURL",
			url:           "https://github.com/",
			expectedOwner: "",
			expectedRepo:  "",
			expectedFull:  "",
		},
		{
			name:          "EmptyURL",
			url:           "",
			expectedOwner: "",
			expectedRepo:  "",
			expectedFull:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			owner, repo, full := parseRepositoryFromURL(tt.url)
			assert.Equal(t, tt.expectedOwner, owner)
			assert.Equal(t, tt.expectedRepo, repo)
			assert.Equal(t, tt.expectedFull, full)
		})
	}
}

func TestAuthServiceAdapter_Nil(t *testing.T) {
	adapter := NewAuthServiceAdapter(nil)

	// GetGitHubAccessToken should error when auth service is nil
	_, err := adapter.GetGitHubAccessToken("test-uuid", "githubtools")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "auth service is not initialized")

}

// Context deadline behavior for TotalContributions
func TestGetUserTotalContributions_ContextDeadline(t *testing.T) {
	// Slow server to trigger context timeout
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(2 * time.Second)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"data": {"viewer": {"contributionsCollection": {"startedAt":"2024-10-16T00:00:00Z","endedAt":"2025-10-16T23:59:59Z","contributionCalendar":{"totalContributions":1}}}}}`))
	}))
	defer server.Close()

	mock := &mockAuthService{
		accessToken: "test-token",
		baseURL:     server.URL,
	}
	svc := NewGitHubServiceWithAdapter(mock)

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	res, err := svc.GetUserTotalContributions(ctx, "test-uuid")
	// The new implementation doesn't fail when individual providers timeout
	// It logs warnings and returns a response with 0 contributions for failed providers
	require.NoError(t, err)
	require.NotNil(t, res)
	assert.Equal(t, 0, res.TotalContributions) // All providers timed out
}
