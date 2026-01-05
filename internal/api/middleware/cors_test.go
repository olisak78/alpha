package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"developer-portal-backend/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter(cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(CORS(cfg))

	// Add a test endpoint to verify Next() is called
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	router.POST("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "post success"})
	})

	return router
}

func TestCORS_AllowedOrigin_ExactMatch(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com", "https://test.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "https://example.com", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With", w.Header().Get("Access-Control-Allow-Headers"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
	assert.Equal(t, "86400", w.Header().Get("Access-Control-Max-Age"))
}

func TestCORS_AllowedOrigin_WildcardMatch(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"*"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://anydomain.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "https://anydomain.com", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
}

func TestCORS_DisallowedOrigin_NoOriginHeader(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://malicious.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Should NOT set Access-Control-Allow-Origin for disallowed origin
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))
	// But should still set other CORS headers
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
}

func TestCORS_NoOriginHeader_RequestProcessed(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	// No Origin header set
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Should NOT set Access-Control-Allow-Origin when no origin
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))
	// But should still set other CORS headers
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	// Should continue to handler
	assert.Contains(t, w.Body.String(), "success")
}

func TestCORS_EmptyAllowedOrigins_NoAccess(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{}, // Empty slice
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Should NOT set Access-Control-Allow-Origin with empty allowed origins
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))
	// But should still set other CORS headers
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
}

func TestCORS_NilAllowedOrigins_NoAccess(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: nil, // Nil slice
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Should NOT set Access-Control-Allow-Origin with nil allowed origins
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))
	// But should still set other CORS headers
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
}

func TestCORS_CaseSensitive_ExactMatchOnly(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://Example.com"}, // Capital E
	}
	router := setupTestRouter(cfg)

	// Test lowercase - should not match
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://example.com") // lowercase e
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))

	// Test exact case - should match
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.Header.Set("Origin", "https://Example.com") // Capital E
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "https://Example.com", w2.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORS_MultipleAllowedOrigins_ChecksAll(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://first.com", "https://second.com", "https://third.com"},
	}
	router := setupTestRouter(cfg)

	// Test first origin
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req1.Header.Set("Origin", "https://first.com")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, "https://first.com", w1.Header().Get("Access-Control-Allow-Origin"))

	// Test middle origin
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.Header.Set("Origin", "https://second.com")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, "https://second.com", w2.Header().Get("Access-Control-Allow-Origin"))

	// Test last origin
	req3 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req3.Header.Set("Origin", "https://third.com")
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	assert.Equal(t, "https://third.com", w3.Header().Get("Access-Control-Allow-Origin"))

	// Test unallowed origin
	req4 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req4.Header.Set("Origin", "https://fourth.com")
	w4 := httptest.NewRecorder()
	router.ServeHTTP(w4, req4)
	assert.Equal(t, "", w4.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORS_WildcardPriority_StopsAtFirstMatch(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		// Wildcard first - should match any origin and stop checking
		AllowedOrigins: []string{"*", "https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://anydomain.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "https://anydomain.com", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORS_OptionsRequest_PreflightHandling(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusNoContent, w.Code) // 204
	assert.Equal(t, "https://example.com", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
	assert.Equal(t, "86400", w.Header().Get("Access-Control-Max-Age"))
	// Should not reach the handler - body should be empty
	assert.Empty(t, w.Body.String())
}

func TestCORS_OptionsRequest_DisallowedOrigin_StillReturns204(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "https://malicious.com") // Not allowed
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusNoContent, w.Code)                      // Still 204
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin")) // But no origin header
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Empty(t, w.Body.String()) // Should not reach handler
}

func TestCORS_PostRequest_ContinuesToHandler(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Origin", "https://example.com")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "https://example.com", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	// Should reach the handler
	assert.Contains(t, w.Body.String(), "post success")
}

func TestCORS_SpecialCharacters_InOrigin(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://sub-domain.example-site.com:8080"},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://sub-domain.example-site.com:8080")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "https://sub-domain.example-site.com:8080", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORS_StaticHeaders_AlwaysSet(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{}, // Empty origins
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	// No origin header
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Access-Control-Allow-Origin should not be set
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))

	// But all other CORS headers should always be set regardless of origin
	assert.Equal(t, "GET, POST, PUT, PATCH, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With", w.Header().Get("Access-Control-Allow-Headers"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
	assert.Equal(t, "86400", w.Header().Get("Access-Control-Max-Age"))
}

func TestCORS_EmptyOrigin_NoMatch(t *testing.T) {
	// Arrange
	cfg := &config.Config{
		AllowedOrigins: []string{"https://example.com", ""},
	}
	router := setupTestRouter(cfg)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "") // Empty origin
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	// Empty origin should match empty allowed origin
	assert.Equal(t, "", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Contains(t, w.Body.String(), "success")
}
