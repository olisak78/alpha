package auth

import (
	"developer-portal-backend/internal/constants"
	"developer-portal-backend/internal/logger"
	"encoding/json"
	"html"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// formatResponseAsJSON converts the response to JSON string for embedding in HTML
func formatResponseAsJSON(response interface{}) string {
	jsonBytes, err := json.Marshal(response)
	if err != nil {
		return "{}"
	}
	return string(jsonBytes)
}

// escapeJSString safely escapes a Go string for embedding inside JS string literals.
func escapeJSString(s string) string {
	// basic HTML escape then replace newlines/quotes for safe inline JS
	e := html.EscapeString(s)
	e = strings.ReplaceAll(e, "\n", `\n`)
	e = strings.ReplaceAll(e, "\r", ``)
	return e
}

// AuthHandler handles HTTP requests for authentication
type AuthHandler struct {
	service *AuthService
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(service *AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Start handles GET /api/auth/{provider}/start
// @Summary Start OAuth authentication
// @Description Initiate OAuth authentication flow with the specified provider
// @Tags authentication
// @Accept json
// @Produce json
// @Param provider path string true "OAuth provider (githubtools or githubwdf)"
// @Success 302 {string} string "Redirect to OAuth provider authorization URL"
// @Failure 400 {object} map[string]interface{} "Invalid provider or request parameters"
// @Failure 500 {object} map[string]interface{} "Failed to generate authorization URL"
// @Router /api/auth/{provider}/start [get]
func (h *AuthHandler) Start(c *gin.Context) {
	provider := c.Param("provider")
	log := logger.FromGinContext(c).WithField("Provider", provider)

	// Validate provider
	if provider == "" {
		log.Warn("Provider is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
		return
	}

	// Validate supported providers
	if provider != "githubtools" && provider != "githubwdf" {
		log.Warn("Unsupported provider")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported provider"})
		return
	}

	// Generate state parameter for OAuth2 security
	state, err := h.service.generateRandomString(32)
	if err != nil {
		log.Errorf("Failed to generate state parameter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state parameter"})
		return
	}

	// Get authorization URL
	authURL, err := h.service.GetAuthURL(provider, state)
	if err != nil {
		log.WithField("State", state).Errorf("Failed to generate authorization URL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authorization URL", "details": err.Error()})
		return
	}

	// Redirect to GitHub OAuth authorization URL
	log.WithField("Auth URL", authURL).Debug("Redirecting to OAuth provider authorization URL")
	c.Redirect(http.StatusFound, authURL)
}

// HandlerFrame handles GET /api/auth/{provider}/handler/frame
// Refresh-token mode: sets HttpOnly refresh cookie, posts minimal success to opener, and closes.
// @Summary Handle OAuth callback
// @Description Handle OAuth callback from provider and return authentication result in HTML frame
// @Tags authentication
// @Accept json
// @Produce text/html
// @Param provider path string true "OAuth provider (githubtools or githubwdf)"
// @Param code query string true "OAuth authorization code from provider"
// @Param state query string true "OAuth state parameter for security"
// @Param error query string false "OAuth error parameter from provider"
// @Param error_description query string false "OAuth error description from provider"
// @Success 200 {string} string "HTML page that posts authentication result to opener window"
// @Failure 400 {object} map[string]interface{} "Invalid request parameters"
// @Router /api/auth/{provider}/handler/frame [get]
func (h *AuthHandler) HandlerFrame(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")
	errorParam := c.Query("error")

	// structured logger with safe context (do not log auth code/token)
	log := logger.FromGinContext(c).WithFields(map[string]interface{}{
		"Provider":     provider,
		"State":        state,
		"code_present": code != "",
	})

	// OAuth errors from provider
	if errorParam != "" {
		errorDescription := c.Query("error_description")
		log.WithFields(map[string]interface{}{
			"error":             errorParam,
			"error_description": errorDescription,
		}).Error("OAuth error from provider callback")
		errorHTML := `<!doctype html><html><body><script>
(function(){
  var msg = { type: "authorization_response", error: { name: "OAuthError", message: "` + escapeJSString(errorParam) + `: ` + escapeJSString(errorDescription) + `" } };
  try { if (window.opener) window.opener.postMessage(msg, "*"); } finally { window.close(); }
})();
</script></body></html>`
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, errorHTML)
		return
	}

	// Validate params
	if provider == "" {
		log.Error("Provider is required in callback")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
		return
	}
	if code == "" {
		log.Error("Authorization code is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code is required"})
		return
	}
	if state == "" {
		log.Error("State parameter is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "State parameter is required"})
		return
	}

	// Service callback – may return various shapes; we'll normalize in JS
	serviceResp, err := h.service.HandleCallback(c.Request.Context(), provider, code, state)
	if err != nil {
		log.Errorf("HandleCallback failed: %v", err)
		errorHTML := `<!doctype html><html><body><script>
(function(){
  var msg = { type: "authorization_response", error: { name: "Error", message: "` + escapeJSString(err.Error()) + `" } };
  try { if (window.opener) window.opener.postMessage(msg, "*"); } finally { window.close(); }
})();
</script></body></html>`
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, errorHTML)
		return
	}

	// once logged in via GitHub, create a refresh token
	maxAge, refreshToken, err := h.service.CreateRefreshToken(serviceResp.UUID)
	if err != nil {
		log.Errorf("Create refresh token failed: %v", err)
		errorHTML := `<!doctype html><html><body><script>
(function(){
  var msg = { type: "authorization_response", error: { name: "Error", message: "create refresh token failed" } };
  try { if (window.opener) window.opener.postMessage(msg, "*"); } finally { window.close(); }
})();
</script></body></html>`
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, errorHTML)
		return
	}

	// Set refresh_token cookie. Limit the cookie as much as possible
	log.Debug("OAuth callback successful; set refresh_token cookie")
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(constants.RefreshToken, refreshToken, maxAge, "/api/auth/refresh", "", true, true) // httpOnly for security

	// Minimal HTML: cookie already set server-side; just notify opener and close.
	successHTML := `<!doctype html><html><body><script>
(function(){
  try {
    if (window.opener) {
      window.opener.postMessage({ type: "authorization_response", status: "success" }, "*");
    }
  } finally {
    window.close();
  }
})();
</script></body></html>`

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, successHTML)
}

// Refresh handles GET /api/auth/refresh
// Regular-token mode JSON response. If your service returns a non-standard shape,
// we normalize it into { accessToken, tokenType, expiresInSeconds, scope, profile{...} }.
// @Summary Refresh authentication token
// @Description Refresh or validate authentication token using Authorization header or session cookies
// @Tags authentication
// @Accept json
// @Produce json
// @Param Authorization header string false "Bearer token for validation" example("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...")
// @Success 200 {object} AuthRefreshResponse "Successfully refreshed token"
// @Failure 401 {object} map[string]interface{} "Authentication required"
// @Router /api/auth/refresh [get]
func (h *AuthHandler) Refresh(c *gin.Context) {
	log := logger.FromGinContext(c)
	refreshTokenCookie, err := c.Cookie(constants.RefreshToken)
	if err != nil || refreshTokenCookie == "" {
		// this can be the case when refresh token has expired hence browser doesn't send it
		log.Debugf("No refresh token cookie found: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	// validate refresh token and get user profile
	userProfile, err := h.service.ValidateRefreshToken(refreshTokenCookie)
	if err != nil {
		log.Errorf("ValidateRefreshToken failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	newJWT, err := h.service.GenerateJWT(userProfile)
	if err != nil {
		log.Errorf("GenerateJWT failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	log.Debug("JWT created. Sending new access token in response")
	c.JSON(http.StatusOK, gin.H{
		"accessToken": newJWT,
	})
}

// Logout handles POST /api/auth/logout
// @Summary Logout user
// @Description Logout user and invalidate authentication session
// @Tags authentication
// @Accept json
// @Produce json
// @Success 200 {object} AuthLogoutResponse "Successfully logged out"
// @Failure 400 {object} map[string]interface{} "Invalid provider"
// @Failure 500 {object} map[string]interface{} "Logout failed"
// @Router /api/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	if err := h.service.Logout(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Logout failed", "details": err.Error()})
		return
	}

	// Clear all authentication cookies
	// Clear auth_token (access token)
	c.SetCookie(
		"auth_token",
		"",
		-1, // MaxAge < 0 means delete the cookie
		"/",
		"",
		false,
		true, // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
