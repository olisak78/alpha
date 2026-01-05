package handlers

import (
	"developer-portal-backend/internal/errors"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// cacheEntry represents a cached response with expiration
type cacheEntry struct {
	data       map[string]interface{}
	cachedAt   time.Time
	expiration time.Duration
}

// isExpired checks if the cache entry has expired
func (ce *cacheEntry) isExpired() bool {
	return time.Since(ce.cachedAt) > ce.expiration
}

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db                        *gorm.DB
	centralLandscapesCache    *cacheEntry
	globalAccountsCache       *cacheEntry
	centralLandscapesCacheMux sync.RWMutex
	globalAccountsCacheMux    sync.RWMutex
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{
		db: db,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services"`
}

// ErrorResponse represents a standard API error response
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

// Health returns the health status of the application
// @Summary Health check
// @Description Get the overall health status of the application including database connectivity
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse "Application is healthy"
// @Failure 503 {object} HealthResponse "Application is unhealthy"
// @Router /health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Services:  make(map[string]string),
	}

	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		response.Status = "unhealthy"
		response.Services["database"] = "error: " + err.Error()
	} else {
		if err := sqlDB.Ping(); err != nil {
			response.Status = "unhealthy"
			response.Services["database"] = "error: " + err.Error()
		} else {
			response.Services["database"] = "healthy"
		}
	}

	statusCode := http.StatusOK
	if response.Status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// Ready returns the readiness status of the application
// @Summary Readiness check
// @Description Check if the application is ready to serve requests
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Application is ready"
// @Failure 503 {object} map[string]interface{} "Application is not ready"
// @Router /health/ready [get]
func (h *HealthHandler) Ready(c *gin.Context) {
	// Check if the application is ready to serve requests
	// This could include checking if migrations are complete, external services are available, etc.

	ready := true
	services := make(map[string]string)

	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		ready = false
		services["database"] = "not ready: " + err.Error()
	} else {
		if err := sqlDB.Ping(); err != nil {
			ready = false
			services["database"] = "not ready: " + err.Error()
		} else {
			services["database"] = "ready"
		}
	}

	response := map[string]interface{}{
		"ready":     ready,
		"timestamp": time.Now(),
		"services":  services,
	}

	statusCode := http.StatusOK
	if !ready {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// Live returns the liveness status of the application
// @Summary Liveness check
// @Description Check if the application is alive and responding
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Application is alive"
// @Router /health/live [get]
func (h *HealthHandler) Live(c *gin.Context) {
	// Simple liveness check - if we can respond, we're alive
	c.JSON(http.StatusOK, map[string]interface{}{
		"alive":     true,
		"timestamp": time.Now(),
	})
}

// ProxyComponentHealth proxies requests to component public endpoints (health, version, etc.)
// This solves CORS issues when frontend tries to call component endpoints directly
// @Summary Proxy component public endpoints
// @Description Fetch data from component public endpoints (health, version, system info) server-side to avoid CORS
// @Tags cis-public
// @Accept json
// @Produce json
// @Param url query string true "Component public endpoint URL to fetch"
// @Success 200 {object} map[string]interface{} "Response from component endpoint"
// @Failure 400 {object} ErrorResponse "URL parameter is required"
// @Failure 502 {object} ErrorResponse "Failed to fetch from component"
// @Security BearerAuth
// @Router /cis-public/proxy [get]
func (h *HealthHandler) ProxyComponentHealth(c *gin.Context) {
	targetURL := c.Query("url")
	if targetURL == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{errors.NewMissingQueryParam("url").Error()})
		return
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Make request to component health endpoint
	startTime := time.Now()
	resp, err := client.Get(targetURL)
	responseTime := time.Since(startTime).Milliseconds()

	if err != nil {
		c.JSON(http.StatusBadGateway, map[string]interface{}{
			"error":        "Failed to fetch from component endpoint: " + err.Error(),
			"responseTime": responseTime,
		})
		return
	}
	defer resp.Body.Close()

	// Read response body
	var result map[string]interface{}
	if err := c.ShouldBindJSON(&result); err != nil {
		// Read body manually if JSON parsing from request fails
		decoder := resp.Body
		var healthResult map[string]interface{}
		if err := json.NewDecoder(decoder).Decode(&healthResult); err != nil {
			// If JSON parsing fails, return error response with 502 to frontend
			c.JSON(http.StatusBadGateway, map[string]interface{}{
				"error":            errors.ErrInvalidJSONResponse,
				"statusCode":       resp.StatusCode,
				"responseTime":     responseTime,
				"componentSuccess": false,
			})
			return
		}
		result = healthResult
	}

	// Add metadata to result
	result["responseTime"] = responseTime
	result["statusCode"] = resp.StatusCode
	result["componentSuccess"] = resp.StatusCode >= 200 && resp.StatusCode < 300

	// Always return 200 to frontend so apiClient doesn't throw
	// Frontend should check componentSuccess field
	c.JSON(http.StatusOK, result)
}

// ProxyOps2go proxies requests to ops2go central landscapes endpoint
// This solves CORS issues when frontend tries to call ops2go directly
// Implements 1-hour cache to reduce load on ops2go endpoint
// @Summary Proxy ops2go central landscapes endpoint
// @Description Fetch data from ops2go server-side to avoid CORS (cached for 1 hour)
// @Tags cis-public
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Response from ops2go endpoint"
// @Failure 502 {object} ErrorResponse "Failed to fetch from ops2go"
// @Security BearerAuth
// @Router /cis-public/ops2go/centrallandscapes [get]
func (h *HealthHandler) ProxyOps2go(c *gin.Context) {
	// Check cache first (read lock)
	h.centralLandscapesCacheMux.RLock()
	if h.centralLandscapesCache != nil && !h.centralLandscapesCache.isExpired() {
		cachedResponse := h.centralLandscapesCache.data
		h.centralLandscapesCacheMux.RUnlock()

		// Add cache metadata
		cachedResponse["cached"] = true
		cachedResponse["cachedAt"] = h.centralLandscapesCache.cachedAt

		c.JSON(http.StatusOK, cachedResponse)
		return
	}
	h.centralLandscapesCacheMux.RUnlock()

	// Cache miss or expired - fetch from ops2go
	targetURL := "https://ops2go.internal.cfapps.eu12.hana.ondemand.com/json/centrallandscapes"

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// Make request to ops2go endpoint
	startTime := time.Now()
	resp, err := client.Get(targetURL)
	responseTime := time.Since(startTime).Milliseconds()

	if err != nil {
		c.JSON(http.StatusBadGateway, map[string]interface{}{
			"error":        "Failed to fetch from ops2go endpoint: " + err.Error(),
			"responseTime": responseTime,
		})
		return
	}
	defer resp.Body.Close()

	// Read response body
	var result map[string]interface{}
	decoder := resp.Body
	if err := json.NewDecoder(decoder).Decode(&result); err != nil {
		c.JSON(http.StatusBadGateway, map[string]interface{}{
			"error":        "Failed to parse ops2go response: " + err.Error(),
			"statusCode":   resp.StatusCode,
			"responseTime": responseTime,
		})
		return
	}

	// Add metadata to result
	response := map[string]interface{}{
		"data":         result,
		"responseTime": responseTime,
		"statusCode":   resp.StatusCode,
		"success":      resp.StatusCode >= 200 && resp.StatusCode < 300,
		"cached":       false,
		"cachedAt":     time.Now(),
	}

	// Update cache (write lock)
	h.centralLandscapesCacheMux.Lock()
	h.centralLandscapesCache = &cacheEntry{
		data:       response,
		cachedAt:   time.Now(),
		expiration: 1 * time.Hour, // 1 hour cache
	}
	h.centralLandscapesCacheMux.Unlock()

	// Return response to frontend
	c.JSON(http.StatusOK, response)
}

// ProxyOps2goGlobalAccounts proxies requests to ops2go global accounts endpoint
// This solves CORS issues when frontend tries to call ops2go directly
// Implements 1-hour cache to reduce load on ops2go endpoint
// @Summary Proxy ops2go global accounts endpoint
// @Description Fetch global accounts data from ops2go server-side to avoid CORS (cached for 1 hour)
// @Tags cis-public
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Response from ops2go globalaccounts endpoint"
// @Failure 502 {object} ErrorResponse "Failed to fetch from ops2go"
// @Security BearerAuth
// @Router /cis-public/ops2go/globalaccounts [get]
func (h *HealthHandler) ProxyOps2goGlobalAccounts(c *gin.Context) {
	// Check cache first (read lock)
	h.globalAccountsCacheMux.RLock()
	if h.globalAccountsCache != nil && !h.globalAccountsCache.isExpired() {
		cachedResponse := h.globalAccountsCache.data
		h.globalAccountsCacheMux.RUnlock()

		// Add cache metadata
		cachedResponse["cached"] = true
		cachedResponse["cachedAt"] = h.globalAccountsCache.cachedAt

		c.JSON(http.StatusOK, cachedResponse)
		return
	}
	h.globalAccountsCacheMux.RUnlock()

	// Cache miss or expired - fetch from ops2go
	targetURL := "https://ops2go.internal.cfapps.eu12.hana.ondemand.com/json/globalaccounts"

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// Make request to ops2go endpoint
	startTime := time.Now()
	resp, err := client.Get(targetURL)
	responseTime := time.Since(startTime).Milliseconds()

	if err != nil {
		c.JSON(http.StatusBadGateway, map[string]interface{}{
			"error":        "Failed to fetch from ops2go globalaccounts endpoint: " + err.Error(),
			"responseTime": responseTime,
		})
		return
	}
	defer resp.Body.Close()

	// Read response body
	var result map[string]interface{}
	decoder := resp.Body
	if err := json.NewDecoder(decoder).Decode(&result); err != nil {
		c.JSON(http.StatusBadGateway, map[string]interface{}{
			"error":        "Failed to parse ops2go globalaccounts response: " + err.Error(),
			"statusCode":   resp.StatusCode,
			"responseTime": responseTime,
		})
		return
	}

	// Add metadata to result
	response := map[string]interface{}{
		"data":         result,
		"responseTime": responseTime,
		"statusCode":   resp.StatusCode,
		"success":      resp.StatusCode >= 200 && resp.StatusCode < 300,
		"cached":       false,
		"cachedAt":     time.Now(),
	}

	// Update cache (write lock)
	h.globalAccountsCacheMux.Lock()
	h.globalAccountsCache = &cacheEntry{
		data:       response,
		cachedAt:   time.Now(),
		expiration: 1 * time.Hour, // 1 hour cache
	}
	h.globalAccountsCacheMux.Unlock()

	// Return response to frontend
	c.JSON(http.StatusOK, response)
}
