package auth

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type AuthConfigSuite struct {
	suite.Suite
	tempDir string
}

func TestAuthConfigSuite(t *testing.T) {
	suite.Run(t, new(AuthConfigSuite))
}

func (s *AuthConfigSuite) SetupTest() {
	s.tempDir = s.T().TempDir()

	// Clear all relevant env vars to avoid cross-test leakage
	envs := []string{
		"JWT_SECRET",
		"TOKEN_SECRET",
		"AUTH_REDIRECT_URL",
		"JWT_EXPIRES_IN_MINUTES",
		"GITHUB_TOKEN_EXPIRATION_IN_DAYS",
		"REFRESH_TOKEN_EXPIRATION_IN_DAYS",
		"GITHUB_TOOLS_APP_CLIENT_ID",
		"GITHUB_TOOLS_APP_CLIENT_SECRET",
		"GITHUB_WDF_APP_CLIENT_ID",
		"GITHUB_WDF_APP_CLIENT_SECRET",
		"TOOLS_ID_ENV",
		"TOOLS_SECRET_ENV",
		"X_ID",
		"X_SEC",
	}
	for _, k := range envs {
		s.T().Setenv(k, "")
	}
}

func (s *AuthConfigSuite) writeTempAuthYAML(content string) string {
	path := filepath.Join(s.tempDir, "auth.yaml")
	require.NoError(s.T(), os.WriteFile(path, []byte(content), 0o644))
	return path
}

/*
	ValidateConfig tests
*/

func (s *AuthConfigSuite) TestValidateConfig_Happy_DefaultsFilled() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		TokenSecret: "secret",
		RedirectURL: "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:     "id",
				ClientSecret: "sec",
			},
		},
		JWTExpiresInMinutes:       15,
		GithubTokenExpiresInDays:  365,
		RefreshTokenExpiresInDays: 14,
	}

	err := cfg.ValidateConfig()
	require.NoError(s.T(), err)

	assert.Equal(s.T(), 15, cfg.JWTExpiresInMinutes)
	assert.Equal(s.T(), 365, cfg.GithubTokenExpiresInDays)
	assert.Equal(s.T(), 14, cfg.RefreshTokenExpiresInDays)
}

func (s *AuthConfigSuite) TestValidateConfig_MissingJWTSecret() {
	cfg := AuthConfig{
		JWTSecret:   "",
		RedirectURL: "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "sec"},
		},
	}

	err := cfg.ValidateConfig()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "JWT secret is required")
}

func (s *AuthConfigSuite) TestValidateConfig_MissingRedirectURL() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		TokenSecret: "secret",
		RedirectURL: "",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "sec"},
		},
	}

	err := cfg.ValidateConfig()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "redirect URL is required")
}

func (s *AuthConfigSuite) TestValidateConfig_NoProviders() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		TokenSecret: "secret",
		RedirectURL: "http://localhost",
		Providers:   map[string]ProviderConfig{},
	}

	err := cfg.ValidateConfig()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "at least one provider must be configured")
}

func (s *AuthConfigSuite) TestValidateConfig_MissingProviderClientID() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		TokenSecret: "secret",
		RedirectURL: "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "", ClientSecret: "sec"},
		},
	}

	err := cfg.ValidateConfig()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "client_id is required for provider 'githubtools'")
}

func (s *AuthConfigSuite) TestValidateConfig_MissingProviderClientSecret() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		TokenSecret: "secret",
		RedirectURL: "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: ""},
		},
	}

	err := cfg.ValidateConfig()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "client_secret is required for provider 'githubtools'")
}

/*
	GetProvider tests
*/

func (s *AuthConfigSuite) TestGetProvider_Found() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		RedirectURL: "http://localhost",
		Providers: map[string]ProviderConfig{
			"githubtools": {ClientID: "id", ClientSecret: "sec", EnterpriseBaseURL: "https://e"},
		},
	}
	p, err := cfg.GetProvider("githubtools")
	require.NoError(s.T(), err)
	require.NotNil(s.T(), p)
	assert.Equal(s.T(), "id", p.ClientID)
	assert.Equal(s.T(), "sec", p.ClientSecret)
	assert.Equal(s.T(), "https://e", p.EnterpriseBaseURL)
}

func (s *AuthConfigSuite) TestGetProvider_NotFound() {
	cfg := AuthConfig{
		JWTSecret:   "secret",
		RedirectURL: "http://localhost",
		Providers:   map[string]ProviderConfig{},
	}
	p, err := cfg.GetProvider("missing")
	require.Error(s.T(), err)
	assert.Nil(s.T(), p)
	assert.Contains(s.T(), err.Error(), "provider 'missing' not found")
}

/*
	setAuthDefaults tests (indirect config defaults)
	and direct test of setAuth to improve coverage
*/

func (s *AuthConfigSuite) TestSetAuthDefaults_SetsExpectedDefaults() {
	v := viper.New()
	setAuthDefaults(v)

	assert.Equal(s.T(), "http://localhost:3000", v.GetString("redirect_url"))

	providers := v.GetStringMap("providers")
	assert.Contains(s.T(), providers, "githubtools")
	assert.Contains(s.T(), providers, "githubwdf")
}

/*
	LoadAuthConfig tests
*/

func (s *AuthConfigSuite) TestLoadAuthConfig_NoFile_UsesDefaultsAndEnv() {
	// Arrange env overrides for secrets, redirect, and expirations
	s.T().Setenv("JWT_SECRET", "env-jwt")
	s.T().Setenv("TOKEN_SECRET", "env-token")
	s.T().Setenv("AUTH_REDIRECT_URL", "http://override.local")
	s.T().Setenv("JWT_EXPIRES_IN_MINUTES", "30")
	s.T().Setenv("GITHUB_TOKEN_EXPIRATION_IN_DAYS", "365")
	s.T().Setenv("REFRESH_TOKEN_EXPIRATION_IN_DAYS", "14")
	// Provider credentials via env (to satisfy ValidateConfig)
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_ID", "gid")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_SECRET", "gsec")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_ID", "wid")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_SECRET", "wsec")

	// Act
	cfg, err := LoadAuthConfig("")

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), cfg)

	assert.Equal(s.T(), "env-jwt", cfg.JWTSecret)
	assert.Equal(s.T(), "env-token", cfg.TokenSecret)
	assert.Equal(s.T(), "http://override.local", cfg.RedirectURL)
	assert.Equal(s.T(), 30, cfg.JWTExpiresInMinutes)

	// default providers exist and credentials are applied from env
	require.Contains(s.T(), cfg.Providers, "githubtools")
	require.Contains(s.T(), cfg.Providers, "githubwdf")
	assert.Equal(s.T(), "gid", cfg.Providers["githubtools"].ClientID)
	assert.Equal(s.T(), "gsec", cfg.Providers["githubtools"].ClientSecret)
	assert.Equal(s.T(), "wid", cfg.Providers["githubwdf"].ClientID)
	assert.Equal(s.T(), "wsec", cfg.Providers["githubwdf"].ClientSecret)
}

func (s *AuthConfigSuite) TestLoadAuthConfig_FromFile_WithPlaceholdersAndEnterpriseURL() {
	// Arrange a YAML that uses ${...} placeholders for one provider and static for the other
	yaml := `
redirect_url: "http://from-file"
providers:
  githubtools:
    client_id: "${TOOLS_ID_ENV}"
    client_secret: "${TOOLS_SECRET_ENV}"
    enterprise_base_url: "https://github.tools.sap"
  githubwdf:
    client_id: "static-id"
    client_secret: "static-sec"
    enterprise_base_url: "https://github.wdf.sap.corp"
`
	path := s.writeTempAuthYAML(yaml)

	// Placeholder envs for expansion; leave GITHUB_TOOLS_* empty to exercise placeholder branch
	s.T().Setenv("TOOLS_ID_ENV", "tools-id")
	s.T().Setenv("TOOLS_SECRET_ENV", "tools-sec")

	// Provide JWT secret via env to satisfy validation
	s.T().Setenv("JWT_SECRET", "env-jwt")
	s.T().Setenv("TOKEN_SECRET", "secret")
	// Also ensure direct env overrides are present to satisfy validation across both providers
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_ID", "gid")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_SECRET", "gsec")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_ID", "wid")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_SECRET", "wsec")

	// Act
	cfg, err := LoadAuthConfig(path)

	// Assert
	require.NoError(s.T(), err)
	require.NotNil(s.T(), cfg)

	assert.Equal(s.T(), "http://from-file", cfg.RedirectURL)

	// githubtools creds overridden from env
	assert.Equal(s.T(), "gid", cfg.Providers["githubtools"].ClientID)
	assert.Equal(s.T(), "gsec", cfg.Providers["githubtools"].ClientSecret)
	assert.Equal(s.T(), "https://github.tools.sap", cfg.Providers["githubtools"].EnterpriseBaseURL)

	// githubwdf env overrides applied
	assert.Equal(s.T(), "wid", cfg.Providers["githubwdf"].ClientID)
	assert.Equal(s.T(), "wsec", cfg.Providers["githubwdf"].ClientSecret)
	assert.Equal(s.T(), "https://github.wdf.sap.corp", cfg.Providers["githubwdf"].EnterpriseBaseURL)

	// Defaults applied for expirations when not provided by file/env
	assert.Equal(s.T(), 15, cfg.JWTExpiresInMinutes)
}

func (s *AuthConfigSuite) TestLoadAuthConfig_InvalidYAML_ReturnsError() {
	path := s.writeTempAuthYAML(`redirect_url: [unterminated`)
	cfg, err := LoadAuthConfig(path)
	require.Error(s.T(), err)
	assert.Nil(s.T(), cfg)
	assert.Contains(s.T(), err.Error(), "error reading auth config file")
}

func (s *AuthConfigSuite) TestLoadAuthConfig_RedirectURLEnvPrecedence() {
	yaml := `redirect_url: "http://from-file"`
	path := s.writeTempAuthYAML(yaml)

	// Env should override YAML
	s.T().Setenv("AUTH_REDIRECT_URL", "http://env-redirect")
	// Provide minimal requirements for validation
	s.T().Setenv("JWT_SECRET", "secret")
	s.T().Setenv("TOKEN_SECRET", "secret")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_ID", "id")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_SECRET", "sec")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_ID", "wid")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_SECRET", "wsec")

	cfg, err := LoadAuthConfig(path)
	require.NoError(s.T(), err)
	require.NotNil(s.T(), cfg)
	assert.Equal(s.T(), "http://env-redirect", cfg.RedirectURL)
}

func (s *AuthConfigSuite) TestLoadAuthConfig_DefaultRedirectWhenNoEnvOrFile() {
	// No file found and no AUTH_REDIRECT_URL; ensure default redirect is applied
	s.T().Setenv("JWT_SECRET", "secret")
	s.T().Setenv("TOKEN_SECRET", "secret")
	// Provide provider creds via env to satisfy validation
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_ID", "id")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_SECRET", "sec")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_ID", "wid")
	s.T().Setenv("GITHUB_WDF_APP_CLIENT_SECRET", "wsec")

	cfg, err := LoadAuthConfig("")
	require.NoError(s.T(), err)
	require.NotNil(s.T(), cfg)
	assert.Equal(s.T(), "http://localhost:3000", cfg.RedirectURL)
}

/*
	overrideFromEnvironment tests
*/

func (s *AuthConfigSuite) TestOverrideFromEnvironment_EmptyProviders_NoChange() {
	cfg := AuthConfig{
		Providers: map[string]ProviderConfig{},
	}
	out := overrideFromEnvironment(cfg)
	require.Empty(s.T(), out.Providers)
}

func (s *AuthConfigSuite) TestOverrideFromEnvironment_PlaceholderExpansionAndPreserveEnterprise() {
	cfg := AuthConfig{
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:          "${X_ID}",
				ClientSecret:      "${X_SEC}",
				EnterpriseBaseURL: "https://enterprise.example",
			},
		},
	}

	// Ensure direct GITHUB_TOOLS_* overrides are empty so expansion path triggers
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_ID", "")
	s.T().Setenv("GITHUB_TOOLS_APP_CLIENT_SECRET", "")
	// Values for placeholders
	s.T().Setenv("X_ID", "AAA")
	s.T().Setenv("X_SEC", "BBB")

	out := overrideFromEnvironment(cfg)

	require.Contains(s.T(), out.Providers, "githubtools")
	p := out.Providers["githubtools"]
	assert.Equal(s.T(), "AAA", p.ClientID)
	assert.Equal(s.T(), "BBB", p.ClientSecret)
	assert.Equal(s.T(), "https://enterprise.example", p.EnterpriseBaseURL)
}
