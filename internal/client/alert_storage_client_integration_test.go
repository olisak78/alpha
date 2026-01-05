//go:build integration

package client_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"developer-portal-backend/internal/client"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type AlertStorageClientIntegrationTestSuite struct {
	suite.Suite
	server *httptest.Server
	client *client.AlertStorageClient
}

func (suite *AlertStorageClientIntegrationTestSuite) SetupSuite() {
	// Create a comprehensive mock server that simulates the real alert-buffer-service
	suite.server = httptest.NewServer(http.HandlerFunc(suite.mockAlertBufferService))
	suite.client = client.NewAlertStorageClient(suite.server.URL)
}

func (suite *AlertStorageClientIntegrationTestSuite) TearDownSuite() {
	suite.server.Close()
}

// mockAlertBufferService simulates a complete alert-buffer-service API
func (suite *AlertStorageClientIntegrationTestSuite) mockAlertBufferService(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch {
	case r.Method == "GET" && r.URL.Path == "/api/projects":
		suite.handleGetProjects(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv":
		suite.handleGetAlerts(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv/abc123def456":
		suite.handleGetSingleAlert(w, r)
	case r.Method == "PUT" && r.URL.Path == "/api/alerts/usrv/abc123def456/label":
		suite.handleUpdateLabel(w, r)
	case r.Method == "GET" && r.URL.Path == "/api/alerts/usrv/filters":
		suite.handleGetFilters(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "not found"})
	}
}

func (suite *AlertStorageClientIntegrationTestSuite) handleGetProjects(w http.ResponseWriter, r *http.Request) {
	response := client.ProjectsResponse{
		Projects: []string{"usrv", "cis20", "ca"},
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageClientIntegrationTestSuite) handleGetAlerts(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	page := r.URL.Query().Get("page")
	pageSize := r.URL.Query().Get("pageSize")
	severity := r.URL.Query().Get("severity")
	status := r.URL.Query().Get("status")

	// Create realistic alert data
	alerts := []client.AlertStorageResponse{
		{
			Fingerprint: "abc123def456",
			Alertname:   "HighCPUUsage",
			Status:      "firing",
			Severity:    "critical",
			Landscape:   "production",
			Region:      "us-east-1",
			StartsAt:    time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			EndsAt:      nil,
			Labels: map[string]interface{}{
				"component": "api-server",
				"team":      "platform",
			},
			Annotations: map[string]interface{}{
				"summary":     "CPU usage is above 90%",
				"description": "The api-server component has high CPU usage for 10 minutes",
			},
			CreatedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
		{
			Fingerprint: "def456ghi789",
			Alertname:   "MemoryLeakDetected",
			Status:      "firing",
			Severity:    "warning",
			Landscape:   "production",
			Region:      "eu-west-1",
			StartsAt:    time.Now().Add(-5 * time.Hour).Format(time.RFC3339),
			EndsAt:      nil,
			Labels: map[string]interface{}{
				"component": "worker",
				"team":      "backend",
			},
			Annotations: map[string]interface{}{
				"summary":     "Memory leak detected",
				"description": "Memory usage is steadily increasing",
			},
			CreatedAt: time.Now().Add(-5 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
		},
	}

	// Filter by severity if specified
	if severity != "" {
		filtered := []client.AlertStorageResponse{}
		for _, alert := range alerts {
			if alert.Severity == severity {
				filtered = append(filtered, alert)
			}
		}
		alerts = filtered
	}

	// Filter by status if specified
	if status != "" {
		filtered := []client.AlertStorageResponse{}
		for _, alert := range alerts {
			if alert.Status == status {
				filtered = append(filtered, alert)
			}
		}
		alerts = filtered
	}

	response := client.AlertStoragePaginatedResponse{
		Data:       alerts,
		Page:       1,
		PageSize:   50,
		TotalCount: int64(len(alerts)),
		TotalPages: 1,
	}

	// Parse pagination parameters or use defaults
	if page != "" {
		// Parse the page number from query parameter
		if pageNum, err := strconv.Atoi(page); err == nil {
			response.Page = pageNum
		}
	}
	if pageSize != "" {
		// Parse the pageSize value from query parameter
		if pageSizeNum, err := strconv.Atoi(pageSize); err == nil {
			response.PageSize = pageSizeNum
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageClientIntegrationTestSuite) handleGetSingleAlert(w http.ResponseWriter, r *http.Request) {
	endsAt := time.Now().Format(time.RFC3339)
	response := client.AlertStorageResponse{
		Fingerprint: "abc123def456",
		Alertname:   "HighCPUUsage",
		Status:      "resolved",
		Severity:    "critical",
		Landscape:   "production",
		Region:      "us-east-1",
		StartsAt:    time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		EndsAt:      &endsAt,
		Labels: map[string]interface{}{
			"component": "api-server",
			"team":      "platform",
		},
		Annotations: map[string]interface{}{
			"summary":     "CPU usage is above 90%",
			"description": "The api-server component has high CPU usage for 10 minutes",
		},
		CreatedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (suite *AlertStorageClientIntegrationTestSuite) handleUpdateLabel(w http.ResponseWriter, r *http.Request) {
	var req client.UpdateLabelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	response := client.UpdateLabelResponse{
		Message:     "Label updated successfully",
		Project:     "usrv",
		Fingerprint: "abc123def456",
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

func (suite *AlertStorageClientIntegrationTestSuite) handleGetFilters(w http.ResponseWriter, r *http.Request) {
	response := client.AlertFiltersResponse{
		"alertname": []string{"HighCPUUsage", "MemoryLeakDetected", "DiskSpaceLow"},
		"severity":  []string{"critical", "warning", "info"},
		"status":    []string{"firing", "resolved"},
		"landscape": []string{"production", "staging", "development"},
		"region":    []string{"us-east-1", "eu-west-1", "ap-south-1"},
		"component": []string{"api-server", "worker", "database"},
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Test complete workflow: get projects, get alerts, get single alert, update label
func (suite *AlertStorageClientIntegrationTestSuite) TestCompleteWorkflow() {
	// Step 1: Get available projects
	projects, err := suite.client.GetAvailableProjects()
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), projects)
	assert.Contains(suite.T(), projects.Projects, "usrv")

	// Step 2: Get alerts for a project
	alertsResponse, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"page":     "1",
		"pageSize": "50",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), alertsResponse)
	assert.Greater(suite.T(), len(alertsResponse.Data), 0)

	// Step 3: Get a single alert by fingerprint
	fingerprint := "abc123def456"
	alert, err := suite.client.GetAlertByFingerprint("usrv", fingerprint)
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), alert)
	assert.Equal(suite.T(), fingerprint, alert.Fingerprint)
	assert.NotNil(suite.T(), alert.EndsAt) // This alert is resolved

	// Step 4: Update a label on the alert
	updateRequest := client.UpdateLabelRequest{
		Key:   "reviewed_by",
		Value: "john.doe@example.com",
	}
	updateResponse, err := suite.client.UpdateAlertLabel("usrv", fingerprint, updateRequest)
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), updateResponse)
	assert.Equal(suite.T(), "reviewed_by", updateResponse.Label.Key)
	assert.Equal(suite.T(), "john.doe@example.com", updateResponse.Label.Value)

	// Step 5: Get filters
	filters, err := suite.client.GetAlertFilters("usrv", map[string]string{})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), filters)
	assert.Contains(suite.T(), (*filters)["severity"], "critical")
	assert.Contains(suite.T(), (*filters)["status"], "firing")
}

// Test filtering alerts by severity
func (suite *AlertStorageClientIntegrationTestSuite) TestFilterAlertsBySeverity() {
	// Get critical alerts
	criticalAlerts, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"severity": "critical",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), criticalAlerts)

	// Verify all alerts are critical
	for _, alert := range criticalAlerts.Data {
		assert.Equal(suite.T(), "critical", alert.Severity)
	}

	// Get warning alerts
	warningAlerts, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"severity": "warning",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), warningAlerts)

	// Verify all alerts are warnings
	for _, alert := range warningAlerts.Data {
		assert.Equal(suite.T(), "warning", alert.Severity)
	}
}

// Test filtering alerts by status
func (suite *AlertStorageClientIntegrationTestSuite) TestFilterAlertsByStatus() {
	// Get firing alerts
	firingAlerts, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"status": "firing",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), firingAlerts)

	// Verify all alerts are firing
	for _, alert := range firingAlerts.Data {
		assert.Equal(suite.T(), "firing", alert.Status)
		assert.Nil(suite.T(), alert.EndsAt) // Firing alerts should not have an end time
	}
}

// Test with multiple filters
func (suite *AlertStorageClientIntegrationTestSuite) TestMultipleFilters() {
	// Get critical and firing alerts
	alerts, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"severity": "critical",
		"status":   "firing",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), alerts)

	// Verify alerts match both criteria
	for _, alert := range alerts.Data {
		assert.Equal(suite.T(), "critical", alert.Severity)
		assert.Equal(suite.T(), "firing", alert.Status)
	}
}

// Test pagination
func (suite *AlertStorageClientIntegrationTestSuite) TestPagination() {
	// Get first page
	page1, err := suite.client.GetAlertsByProject("usrv", map[string]string{
		"page":     "1",
		"pageSize": "1",
	})
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), page1)
	assert.Equal(suite.T(), 1, page1.Page)
	assert.Equal(suite.T(), 1, page1.PageSize)
}

// Test alert data structure completeness
func (suite *AlertStorageClientIntegrationTestSuite) TestAlertDataStructure() {
	alert, err := suite.client.GetAlertByFingerprint("usrv", "abc123def456")
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), alert)

	// Verify all fields are populated
	assert.NotEmpty(suite.T(), alert.Fingerprint)
	assert.NotEmpty(suite.T(), alert.Alertname)
	assert.NotEmpty(suite.T(), alert.Status)
	assert.NotEmpty(suite.T(), alert.Severity)
	assert.NotEmpty(suite.T(), alert.Landscape)
	assert.NotEmpty(suite.T(), alert.Region)
	assert.NotEmpty(suite.T(), alert.StartsAt)
	assert.NotNil(suite.T(), alert.EndsAt) // This specific alert is resolved
	assert.NotEmpty(suite.T(), alert.Labels)
	assert.NotEmpty(suite.T(), alert.Annotations)
	assert.NotEmpty(suite.T(), alert.CreatedAt)
	assert.NotEmpty(suite.T(), alert.UpdatedAt)

	// Verify label structure
	assert.Contains(suite.T(), alert.Labels, "component")
	assert.Contains(suite.T(), alert.Labels, "team")

	// Verify annotation structure
	assert.Contains(suite.T(), alert.Annotations, "summary")
	assert.Contains(suite.T(), alert.Annotations, "description")
}

// Test concurrent requests (simulating real-world usage)
func (suite *AlertStorageClientIntegrationTestSuite) TestConcurrentRequests() {
	done := make(chan bool, 3)

	// Make 3 concurrent requests
	go func() {
		_, err := suite.client.GetAvailableProjects()
		assert.NoError(suite.T(), err)
		done <- true
	}()

	go func() {
		_, err := suite.client.GetAlertsByProject("usrv", map[string]string{})
		assert.NoError(suite.T(), err)
		done <- true
	}()

	go func() {
		_, err := suite.client.GetAlertFilters("usrv", map[string]string{})
		assert.NoError(suite.T(), err)
		done <- true
	}()

	// Wait for all requests to complete
	for i := 0; i < 3; i++ {
		<-done
	}
}

// Test network/connection errors for GetAlertByFingerprint
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertByFingerprint_NetworkError() {
	// Create client pointing to invalid URL that will fail to connect
	invalidClient := client.NewAlertStorageClient("http://invalid-host-that-does-not-exist:9999")

	_, err := invalidClient.GetAlertByFingerprint("usrv", "abc123")
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to call alert storage service")
}

// Test JSON decoding error for GetAlertByFingerprint
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertByFingerprint_InvalidJSON() {
	// Setup server that returns invalid JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("this is not valid json{"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAlertByFingerprint("usrv", "abc123")
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// Test bad request error for GetAlertByFingerprint
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertByFingerprint_BadRequest() {
	// Setup server that returns 400 Bad Request
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("invalid parameters"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAlertByFingerprint("usrv", "abc123")
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "alert storage service returned status 400")
}

// Test network error for UpdateAlertLabel
func (suite *AlertStorageClientIntegrationTestSuite) TestUpdateAlertLabel_NetworkError() {
	// Create client pointing to invalid URL
	invalidClient := client.NewAlertStorageClient("http://invalid-host-that-does-not-exist:9999")

	req := client.UpdateLabelRequest{
		Key:   "team",
		Value: "platform",
	}
	_, err := invalidClient.UpdateAlertLabel("usrv", "abc123", req)
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to call alert storage service")
}

// Test invalid JSON request body for UpdateAlertLabel
func (suite *AlertStorageClientIntegrationTestSuite) TestUpdateAlertLabel_InvalidJSON() {
	// Setup server that returns invalid JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("invalid json response{"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	req := client.UpdateLabelRequest{
		Key:   "team",
		Value: "platform",
	}
	_, err := testClient.UpdateAlertLabel("usrv", "abc123", req)
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// Test bad request for UpdateAlertLabel
func (suite *AlertStorageClientIntegrationTestSuite) TestUpdateAlertLabel_BadRequest() {
	// Setup server that returns 400
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("invalid label data"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	req := client.UpdateLabelRequest{
		Key:   "team",
		Value: "platform",
	}
	_, err := testClient.UpdateAlertLabel("usrv", "abc123", req)
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "alert storage service returned status 400")
}

// Test internal server error for UpdateAlertLabel
func (suite *AlertStorageClientIntegrationTestSuite) TestUpdateAlertLabel_InternalServerError() {
	// Setup server that returns 500
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal server error"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	req := client.UpdateLabelRequest{
		Key:   "team",
		Value: "platform",
	}
	_, err := testClient.UpdateAlertLabel("usrv", "abc123", req)
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "alert storage service returned status 500")
}

// Test network error for GetAlertFilters
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertFilters_NetworkError() {
	// Create client pointing to invalid URL
	invalidClient := client.NewAlertStorageClient("http://invalid-host-that-does-not-exist:9999")

	_, err := invalidClient.GetAlertFilters("usrv", map[string]string{})
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to call alert storage service")
}

// Test invalid JSON for GetAlertFilters
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertFilters_InvalidJSON() {
	// Setup server that returns invalid JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("not valid json{"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAlertFilters("usrv", map[string]string{})
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// Test bad request for GetAlertFilters
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertFilters_BadRequest() {
	// Setup server that returns 400
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("invalid parameters"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAlertFilters("usrv", map[string]string{})
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "alert storage service returned status 400")
}

// Test network error for GetAlertsByProject
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertsByProject_NetworkError() {
	// Create client pointing to invalid URL
	invalidClient := client.NewAlertStorageClient("http://invalid-host-that-does-not-exist:9999")

	_, err := invalidClient.GetAlertsByProject("usrv", map[string]string{})
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to call alert storage service")
}

// Test invalid JSON for GetAlertsByProject
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAlertsByProject_InvalidJSON() {
	// Setup server that returns invalid JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("not valid json response{"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAlertsByProject("usrv", map[string]string{})
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// Test network error for GetAvailableProjects
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAvailableProjects_NetworkError() {
	// Create client pointing to invalid URL
	invalidClient := client.NewAlertStorageClient("http://invalid-host-that-does-not-exist:9999")

	_, err := invalidClient.GetAvailableProjects()
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to call alert storage service")
}

// Test invalid JSON for GetAvailableProjects
func (suite *AlertStorageClientIntegrationTestSuite) TestGetAvailableProjects_InvalidJSON() {
	// Setup server that returns invalid JSON
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("invalid json{"))
	}))
	defer server.Close()

	testClient := client.NewAlertStorageClient(server.URL)
	_, err := testClient.GetAvailableProjects()
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// Run the integration test suite
func TestAlertStorageClientIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(AlertStorageClientIntegrationTestSuite))
}
