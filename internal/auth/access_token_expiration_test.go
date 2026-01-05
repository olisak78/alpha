package auth

import (
	"developer-portal-backend/internal/constants"
	"fmt"
	"testing"
	"time"

	"developer-portal-backend/internal/database/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

type dummyTokenStore struct {
	tokens map[string]models.Token
}

func newDummyTokenStore() *dummyTokenStore {
	return &dummyTokenStore{tokens: make(map[string]models.Token)}
}

func (d *dummyTokenStore) UpsertToken(userUUID uuid.UUID, provider string, token string, expiresAt time.Time) error {
	d.tokens[userUUID.String()+":"+provider] = models.Token{
		UserUUID:  userUUID,
		Provider:  provider,
		Token:     token,
		ExpiresAt: expiresAt,
	}
	return nil
}

func (d *dummyTokenStore) GetValidToken(userUUID uuid.UUID, provider string) (*models.Token, error) {
	tok, ok := d.tokens[userUUID.String()+":"+provider]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	if time.Now().After(tok.ExpiresAt) {
		return nil, fmt.Errorf("expired")
	}
	return &tok, nil
}

func (d *dummyTokenStore) GetByRefreshToken(refreshToken string) (*models.Token, error) {
	tok, ok := d.tokens[refreshToken]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return &tok, nil
}

func (d *dummyTokenStore) UpsertRefreshToken(userUUID uuid.UUID, token string, expiresAt time.Time) error {
	d.tokens[userUUID.String()] = models.Token{
		UserUUID:  userUUID,
		Provider:  constants.RefreshToken,
		Token:     token,
		ExpiresAt: expiresAt,
	}
	return nil
}

func (d *dummyTokenStore) DeleteToken(userUUID uuid.UUID, provider string) error {
	delete(d.tokens, userUUID.String()+":"+provider)
	return nil
}

func (d *dummyTokenStore) CleanupExpiredTokens() error {
	// no-op for tests
	return nil
}

func TestGetGitHubAccessToken_ExpirationHandling(t *testing.T) {
	cfg := &AuthConfig{
		JWTSecret:           "test-secret",
		JWTExpiresInMinutes: 15,
		TokenSecret:         "test-secret",
		RedirectURL:         "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:          "dummy",
				ClientSecret:      "dummy",
				EnterpriseBaseURL: "http://example.com", // not used in this test
			},
		},
	}
	store := newDummyTokenStore()
	svc, err := NewAuthService(cfg, nil, store)
	require.NoError(t, err, "NewAuthService should initialize without error")

	userUUID := uuid.New().String()
	const provider = "githubtools"
	id := uuid.MustParse(userUUID)

	// Seed a valid refresh token (ExpiresAt in the future)
	_ = store.UpsertToken(id, provider, "valid-token", time.Now().Add(1*time.Hour))

	// Valid token should succeed
	token, err := svc.GetGitHubAccessToken(userUUID, provider)
	require.NoError(t, err, "expected no error for valid token")
	require.Equal(t, "valid-token", token, "expected to get the valid access token")

	// Replace with expired token (ExpiresAt in the past)
	_ = store.UpsertToken(id, provider, "expired-token", time.Now().Add(-1*time.Hour))

	// Expired token should fail
	_, err = svc.GetGitHubAccessToken(userUUID, provider)
	require.Error(t, err, "expected error for expired token")
	require.Contains(t, err.Error(), "valid GitHub token", "error should indicate no valid token")
}
