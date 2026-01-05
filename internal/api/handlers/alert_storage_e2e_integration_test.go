//go:build integration

package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"developer-portal-backend/internal/api/handlers"
	"developer-portal-backend/internal/client"
	"developer-portal-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// AlertStorageE2EIntegrationTestSuite tests the complete HTTP flow
// from HTTP request → Router → Handler → Service → Client → External Service
type AlertStorageE2EIntegrationTestSuite struct {
	suite.Suite
	externalServer *httptest.Server
	router         *gin.Engine
	client         *client.AlertStorageClient
	service        *service.AlertStorageService
	handler        *handlers.AlertStorageHandler
}

func (suite *AlertStorageE2EIntegrationTestSuite) SetupSuite() {
	gin.SetMode(gin.TestMode)

	// Create mock external alert-buffer-service
	suite.externalServer = httptest.NewServer(http.HandlerFunc(suite.mockExternalService))

	// Setup complete application stack
	suite.client = client.NewAlertStorageClient(suite.externalServer.URL)
	suite.service = service.NewAlertStorageService(suite.client)
	suite.handler = handlers.NewAlertStorageHandler(suite.service)

	// Setup router with actual routes
	suite.router = gin.New()
	suite.setupRoutes()
}

func (suite *AlertStorageE2EIntegrationTestSuite) TearDownSuite() {
	suite.externalServer.Close()
}

// setupRoutes configures the actual API routes
func (suite *AlertStorageE2EIntegrationTestSuite) setupRoutes() {
	alertStorage := suite.router.Group("/alert-storage")
	{
		alertStorage.GET("/projects", suite.handler.GetAvailableProjects)
		alertStorage.GET("/alerts/:project", suite.handler.GetAlertsByProject)
		alertStorage.GET("/alerts/:project/:fingerprint", suite.handler.GetAlertByFingerprint)
		alertStorage.PUT("/alerts/:project/:fingerprint/label", suite.handler.UpdateAlertLabel)
		alertStorage.GET("/alerts/:project/filters", suite.handler.GetAlertFilters)
	}
}

// mockExternalService simulates the external alert-buffer-service
func (suite *AlertStorageE2EIntegrationTestSuite) mockExternalService(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch {
	case r.Method == "GET" && r.URL.Path == "/api/projects":
		suite.handleGetProjects(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv":
		suite.handleGetAlerts(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv/test-fingerprint-123":
		suite.handleGetSingleAlert(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv/not-found-fingerprint":
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "alert not found"})
	case r.Method == "PUT" && r.URL.Path == "/api/alerts/usrv/test-fingerprint-123/label":
		suite.handleUpdateLabel(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv/filters":
		suite.handleGetFilters(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/error-project":
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal server error"))
	default:
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "not found"})
	}
}

func (suite *AlertStorageE2EIntegrationTestSuite) handleGetProjects(w http.ResponseWriter, r *http.Request) {
	response := client.ProjectsResponse{
		Projects: []string{"usrv", "cis20", "ca"},
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageE2EIntegrationTestSuite) handleGetAlerts(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	severity := r.URL.Query().Get("severity")
	status := r.URL.Query().Get("status")

	alerts := []client.AlertStorageResponse{
		{
			Fingerprint: "test-fingerprint-123",
			Alertname:   "HighCPUUsage",
			Status:      "firing",
			Severity:    "critical",
			Landscape:   "production",
			Region:      "us-east-1",
			StartsAt:    time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			EndsAt:      nil,
			Labels: map[string]interface{}{
				"component": "api-server",
			},
			Annotations: map[string]interface{}{
				"summary": "CPU usage is above 90%",
			},
			CreatedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
	}

	// Filter by severity
	if severity != "" && severity != "critical" {
		alerts = []client.AlertStorageResponse{}
	}

	// Filter by status
	if status != "" && status != "firing" {
		alerts = []client.AlertStorageResponse{}
	}

	response := client.AlertStoragePaginatedResponse{
		Data:       alerts,
		Page:       1,
		PageSize:   50,
		TotalCount: int64(len(alerts)),
		TotalPages: 1,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageE2EIntegrationTestSuite) handleGetSingleAlert(w http.ResponseWriter, r *http.Request) {
	endsAt := time.Now().Format(time.RFC3339)
	response := client.AlertStorageResponse{
		Fingerprint: "test-fingerprint-123",
		Alertname:   "HighCPUUsage",
		Status:      "resolved",
		Severity:    "critical",
		Landscape:   "production",
		Region:      "us-east-1",
		StartsAt:    time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		EndsAt:      &endsAt,
		Labels: map[string]interface{}{
			"component": "api-server",
		},
		Annotations: map[string]interface{}{
			"summary": "CPU usage is above 90%",
		},
		CreatedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageE2EIntegrationTestSuite) handleUpdateLabel(w http.ResponseWriter, r *http.Request) {
	var req client.UpdateLabelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	response := client.UpdateLabelResponse{
		Message:     "Label updated successfully",
		Project:     "usrv",
		Fingerprint: "test-fingerprint-123",
		Label: struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		}{
			Key:   req.Key,
			Value: req.Value,
		},
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageE2EIntegrationTestSuite) handleGetFilters(w http.ResponseWriter, r *http.Request) {
	response := client.AlertFiltersResponse{
		"alertname": []string{"HighCPUUsage", "MemoryLeakDetected"},
		"severity":  []string{"critical", "warning"},
		"status":    []string{"firing", "resolved"},
		"landscape": []string{"production", "staging"},
		"region":    []string{"us-east-1", "eu-west-1"},
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Test complete workflow through all layers
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_CompleteWorkflow() {
	// Step 1: Get available projects
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/projects", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var projectsResp client.ProjectsResponse
	json.Unmarshal(w.Body.Bytes(), &projectsResp)
	assert.Contains(suite.T(), projectsResp.Projects, "usrv")

	// Step 2: Get alerts for a project
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/alert-storage/alerts/usrv", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var alertsResp client.AlertStoragePaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &alertsResp)
	assert.Greater(suite.T(), len(alertsResp.Data), 0)

	// Step 3: Get a single alert by fingerprint
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/alert-storage/alerts/usrv/test-fingerprint-123", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var alertResp client.AlertStorageResponse
	json.Unmarshal(w.Body.Bytes(), &alertResp)
	assert.Equal(suite.T(), "test-fingerprint-123", alertResp.Fingerprint)

	// Step 4: Update alert label
	updateReq := map[string]string{
		"key":   "reviewed_by",
		"value": "john.doe@example.com",
	}
	jsonBody, _ := json.Marshal(updateReq)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/alert-storage/alerts/usrv/test-fingerprint-123/label", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var updateResp client.UpdateLabelResponse
	json.Unmarshal(w.Body.Bytes(), &updateResp)
	assert.Equal(suite.T(), "reviewed_by", updateResp.Label.Key)

	// Step 5: Get filters
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/alert-storage/alerts/usrv/filters", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var filtersResp client.AlertFiltersResponse
	json.Unmarshal(w.Body.Bytes(), &filtersResp)
	assert.Contains(suite.T(), filtersResp["severity"], "critical")
}

// Test filtering through complete stack
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_FilteringByQueryParameters() {
	// Test with severity filter
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv?severity=critical&status=firing", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var alertsResp client.AlertStoragePaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &alertsResp)
	assert.Greater(suite.T(), len(alertsResp.Data), 0)

	// Verify filter worked
	for _, alert := range alertsResp.Data {
		assert.Equal(suite.T(), "critical", alert.Severity)
		assert.Equal(suite.T(), "firing", alert.Status)
	}
}

// Test 404 error path through all layers
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_NotFoundError() {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv/not-found-fingerprint", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
	var errorResp map[string]string
	json.Unmarshal(w.Body.Bytes(), &errorResp)
	assert.Contains(suite.T(), errorResp["error"], "not found")
}

// Test validation error path
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_ValidationError() {
	// Missing required fields in request body
	invalidReq := map[string]string{
		"key": "test", // missing "value"
	}
	jsonBody, _ := json.Marshal(invalidReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/alert-storage/alerts/usrv/test-fingerprint-123/label", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// Test invalid JSON error path
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_InvalidJSON() {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/alert-storage/alerts/usrv/test-fingerprint-123/label", bytes.NewBufferString("not valid json{"))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// Test external service error handling
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_ExternalServiceError() {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/error-project", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
}

// Test URL path parameters
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_PathParameters() {
	// Test with different project parameter
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify the project parameter was passed through correctly
	var alertsResp client.AlertStoragePaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &alertsResp)
	// External service should have received "usrv" as the project
	assert.NotNil(suite.T(), alertsResp)
}

// Test multiple query parameters
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_MultipleQueryParameters() {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv?page=1&pageSize=50&severity=critical&region=us-east-1&landscape=production&status=firing", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var alertsResp client.AlertStoragePaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &alertsResp)
	assert.NotNil(suite.T(), alertsResp)
}

// Test special characters in URL encoding
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_URLEncoding() {
	// Test with URL-encoded fingerprint (although in this case it's alphanumeric)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv/test-fingerprint-123", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// Test empty filter results
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_EmptyFilterResults() {
	// Request with filters that match nothing
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/alerts/usrv?severity=info&status=resolved", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var alertsResp client.AlertStoragePaginatedResponse
	json.Unmarshal(w.Body.Bytes(), &alertsResp)
	assert.Equal(suite.T(), 0, len(alertsResp.Data))
}

// Test content type headers
func (suite *AlertStorageE2EIntegrationTestSuite) TestE2E_ContentTypeHeaders() {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/alert-storage/projects", nil)
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Gin automatically sets content-type for JSON responses
	assert.Contains(suite.T(), w.Header().Get("Content-Type"), "application/json")
}

// Run the E2E integration test suite
func TestAlertStorageE2EIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(AlertStorageE2EIntegrationTestSuite))
}
