package service

import (
	"context"
	"fmt"

	"developer-portal-backend/internal/auth"

	"github.com/google/go-github/v57/github"
	"github.com/shurcooL/githubv4"
)

//go:generate mockgen -source=github_auth_interface.go -destination=../mocks/github_auth_mocks.go -package=mocks

// GitHubAuthService defines the interface for auth service methods needed by GitHub service
type GitHubAuthService interface {
	GetGitHubAccessToken(userUUID, provider string) (string, error)
	CreateGitHubClient(ctx context.Context, userUUID, provider string) (*github.Client, error)
	CreateGraphqlClient(ctx context.Context, userUUID, provider string) (*githubv4.Client, error)
	GetAllProviders() map[string]string
}

// authServiceAdapter adapts auth.AuthService to implement GitHubAuthService interface
type authServiceAdapter struct {
	authService *auth.AuthService
}

func (a *authServiceAdapter) CreateGraphqlClient(ctx context.Context, userUUID, provider string) (*githubv4.Client, error) {
	if a.authService == nil {
		return nil, fmt.Errorf("auth service is not initialized")
	}
	return a.authService.CreateGraphqlClient(ctx, userUUID, provider)
}

func (a *authServiceAdapter) CreateGitHubClient(ctx context.Context, userUUID, provider string) (*github.Client, error) {
	if a.authService == nil {
		return nil, fmt.Errorf("auth service is not initialized")
	}
	return a.authService.CreateGitHubClient(ctx, userUUID, provider)
}

func (a *authServiceAdapter) GetGitHubAccessToken(userUUID, provider string) (string, error) {
	if a.authService == nil {
		return "", fmt.Errorf("auth service is not initialized")
	}
	return a.authService.GetGitHubAccessToken(userUUID, provider)
}

// NewAuthServiceAdapter creates an adapter for auth.AuthService
func NewAuthServiceAdapter(authService *auth.AuthService) GitHubAuthService {
	if authService == nil {
		return &authServiceAdapter{authService: nil}
	}
	return &authServiceAdapter{authService: authService}
}

func (a *authServiceAdapter) GetGitHubClient(provider string) (*auth.GitHubClient, error) {
	if a.authService == nil {
		return nil, fmt.Errorf("auth service is not initialized")
	}
	return a.authService.GetGitHubClient(provider)
}

func (a *authServiceAdapter) GetAllProviders() map[string]string {
	if a.authService == nil {
		return map[string]string{}
	}
	return a.authService.GetAllProviders()
}
