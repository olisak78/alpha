package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

/*
	MiddlewareSuite

	- Uses testify/suite for organization
	- AAA pattern within test (Arrange → Act → Assert)
	- Covers RequireAuth and RequireProvider middleware plus helper getters
*/

type MiddlewareSuite struct {
	suite.Suite
	service *AuthService
	mw      *AuthMiddleware
	router  *gin.Engine
}

func (s *MiddlewareSuite) SetupTest() {
	gin.SetMode(gin.TestMode)

	cfg := &AuthConfig{
		JWTSecret:           "test-signing-key-mw",
		JWTExpiresInMinutes: 15,
		TokenSecret:         "test-signing-key-mw",
		RedirectURL:         "http://localhost:3000",
		Providers: map[string]ProviderConfig{
			"githubtools": {
				ClientID:     "id",
				ClientSecret: "secret",
				// EnterpriseBaseURL optional for these tests
			},
			"githubwdf": {
				ClientID:     "id-wdf",
				ClientSecret: "secret-wdf",
			},
		},
	}
	svc, err := NewAuthService(cfg, nil, &noopTokenStore{})
	require.NoError(s.T(), err)

	s.service = svc
	s.mw = NewAuthMiddleware(svc)
	s.router = gin.New()
}

func TestMiddlewareSuite(t *testing.T) {
	suite.Run(t, new(MiddlewareSuite))
}

/*
	RequireAuth middleware tests
*/

func (s *MiddlewareSuite) TestRequireAuth_NotExpiredToken() {
	// Arrange: build a not-expired token (1 minute in future)
	now := time.Now()
	claims := &AuthClaims{
		Username: "user58",
		Email:    "user58@example.com",
		UUID:     "uuid-58",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(1 * time.Minute)),
			Issuer:    "developer-portal",
		},
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := jwtToken.SignedString([]byte(s.service.config.JWTSecret))
	require.NoError(s.T(), err)
	require.NotEmpty(s.T(), token)

	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		// Ensure user context keys were placed in context
		if name, ok1 := GetUsername(c); ok1 && name != "" {
			if email, ok2 := GetUserEmail(c); ok2 && email != "" {
				if _, exists := c.Get("user_uuid"); exists {
					c.String(http.StatusOK, "ok")
					return
				}
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "missing user context"})
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusOK, w.Code, "token with short expiry should pass middleware")
	assert.Equal(s.T(), "ok", w.Body.String())
}

func (s *MiddlewareSuite) TestRequireAuth_ExpiredToken() {
	// Arrange: build a token that already expired (1 minute ago)
	claims := &AuthClaims{
		Username: "expired-user",
		Email:    "expired@example.com",
		UUID:     "uuid-expired",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
			Issuer:    "developer-portal",
		},
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	expiredToken, err := jwtToken.SignedString([]byte(s.service.config.JWTSecret))
	require.NoError(s.T(), err)

	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		// Should not reach handler due to 401 from middleware
		c.String(http.StatusOK, "ok-should-not-reach")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, w.Code, "expired token should be rejected by middleware")
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Invalid token", resp["error"])
}

func (s *MiddlewareSuite) TestRequireAuth_MissingAuthorizationHeader_401() {
	// Arrange
	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Authorization header is required", resp["error"])
}

func (s *MiddlewareSuite) TestRequireAuth_InvalidHeaderFormat_401() {
	// Arrange: header without "Bearer " prefix should be rejected
	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	// Missing space after Bearer causes invalid format; TrimPrefix fails to remove prefix resulting in same string
	req.Header.Set("Authorization", "BearerXYZ token")
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Invalid authorization header format", resp["error"])
}

func (s *MiddlewareSuite) TestRequireAuth_InvalidToken_401() {
	// Arrange
	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.value")
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Invalid token", resp["error"])
	require.Contains(s.T(), resp["details"], "failed")
}

func (s *MiddlewareSuite) TestRequireAuth_ContextValuesSet_HappyPath() {
	// Arrange: create valid JWT via service.GenerateJWT
	userProfile := &UserProfile{
		Username: "I999999",
		Email:    "profile@example.com",
		UUID:     "uuid-ctx",
	}
	token, err := s.service.GenerateJWT(userProfile)
	require.NoError(s.T(), err)

	s.router = gin.New()
	s.router.GET("/protected", s.mw.RequireAuth(), func(c *gin.Context) {
		// Read via getters and direct context to verify middleware sets fields
		name, okName := GetUsername(c)
		email, okEmail := GetUserEmail(c)
		uuidVal, _ := c.Get("user_uuid")

		c.JSON(http.StatusOK, gin.H{
			"okName":   okName,
			"okEmail":  okEmail,
			"username": name,
			"email":    email,
			"uuid":     uuidVal,
		})
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusOK, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), true, resp["okName"])
	assert.Equal(s.T(), true, resp["okEmail"])
	assert.Equal(s.T(), "I999999", resp["username"])
	assert.Equal(s.T(), "profile@example.com", resp["email"])
	assert.Equal(s.T(), "uuid-ctx", resp["uuid"])
}

/*
	RequireProvider middleware tests
*/

func (s *MiddlewareSuite) TestRequireProvider_NoProviderInContext_401() {
	// Arrange
	s.router = gin.New()
	s.router.GET("/prov", s.mw.RequireProvider("githubtools"), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/prov", nil)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Authentication required", resp["error"])
}
func (s *MiddlewareSuite) TestRequireProvider_InvalidProviderType_500() {
	// Arrange: set provider context to wrong type before RequireProvider
	s.router = gin.New()
	s.router.Use(func(c *gin.Context) {
		c.Set("provider", 123) // wrong type
	})
	s.router.GET("/prov", s.mw.RequireProvider("githubtools"), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/prov", nil)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusInternalServerError, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Invalid provider context", resp["error"])
}

func (s *MiddlewareSuite) TestRequireProvider_NotAllowed_403() {
	// Arrange: set provider not included in allowed list
	s.router = gin.New()
	s.router.Use(func(c *gin.Context) {
		c.Set("provider", "githubwdf")
	})
	s.router.GET("/prov", s.mw.RequireProvider("githubtools"), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/prov", nil)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusForbidden, w.Code)
	var resp map[string]any
	require.NoError(s.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(s.T(), "Provider not allowed for this resource", resp["error"])
}

func (s *MiddlewareSuite) TestRequireProvider_Allowed_200() {
	// Arrange: set provider in context that matches allowed list
	s.router = gin.New()
	s.router.Use(func(c *gin.Context) {
		c.Set("provider", "githubtools")
	})
	s.router.GET("/prov", s.mw.RequireProvider("githubtools"), func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Act
	req := httptest.NewRequest(http.MethodGet, "/prov", nil)
	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(s.T(), http.StatusOK, w.Code)
	assert.Equal(s.T(), "ok", w.Body.String())
}

/*
	Helper getter functions tests
*/

func (s *MiddlewareSuite) TestGetUsername_Scenarios() {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Missing key
	name, ok := GetUsername(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", name)

	// Wrong type
	c.Set("username", 999)
	name, ok = GetUsername(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", name)

	// Correct type
	c.Set("username", "tester")
	name, ok = GetUsername(c)
	assert.True(s.T(), ok)
	assert.Equal(s.T(), "tester", name)
}

func (s *MiddlewareSuite) TestGetUserEmail_Scenarios() {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Missing key
	email, ok := GetUserEmail(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", email)

	// Wrong type
	c.Set("email", 10.5)
	email, ok = GetUserEmail(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", email)

	// Correct type
	c.Set("email", "john@example.com")
	email, ok = GetUserEmail(c)
	assert.True(s.T(), ok)
	assert.Equal(s.T(), "john@example.com", email)
}

func (s *MiddlewareSuite) TestGetProvider_Scenarios() {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Missing key
	p, ok := GetProvider(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", p)

	// Wrong type
	c.Set("provider", true)
	p, ok = GetProvider(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", p)

	// Correct type
	c.Set("provider", "githubtools")
	p, ok = GetProvider(c)
	assert.True(s.T(), ok)
	assert.Equal(s.T(), "githubtools", p)
}

func (s *MiddlewareSuite) TestGetEnvironment_Scenarios() {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Missing key
	env, ok := GetEnvironment(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", env)

	// Wrong type
	c.Set("environment", 123)
	env, ok = GetEnvironment(c)
	assert.False(s.T(), ok)
	assert.Equal(s.T(), "", env)

	// Correct type
	c.Set("environment", "production")
	env, ok = GetEnvironment(c)
	assert.True(s.T(), ok)
	assert.Equal(s.T(), "production", env)
}
