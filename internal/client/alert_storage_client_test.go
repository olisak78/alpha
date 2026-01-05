package client_test

import (
	"developer-portal-backend/internal/client"
	apperrors "developer-portal-backend/internal/errors"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type AlertStorageClientTestSuite struct {
	suite.Suite
	server *httptest.Server
	client *client.AlertStorageClient
}

func (suite *AlertStorageClientTestSuite) SetupTest() {
	// Create a test server for each test
	suite.server = httptest.NewServer(http.HandlerFunc(suite.handleRequests))
	suite.client = client.NewAlertStorageClient(suite.server.URL)
}

func (suite *AlertStorageClientTestSuite) TearDownTest() {
	suite.server.Close()
}

func (suite *AlertStorageClientTestSuite) handleRequests(w http.ResponseWriter, r *http.Request) {
	// This will be overridden in each test
	w.WriteHeader(http.StatusNotFound)
}

// TestGetAvailableProjects tests the GetAvailableProjects method
func (suite *AlertStorageClientTestSuite) TestGetAvailableProjects_Success() {
	// Setup server to return projects
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "GET", r.Method)
		assert.Equal(suite.T(), "/api/projects", r.URL.Path)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(client.ProjectsResponse{
			Projects: []string{"usrv", "cis20", "ca"},
		})
	})

	// Execute
	result, err := suite.client.GetAvailableProjects()

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Len(suite.T(), result.Projects, 3)
	assert.Contains(suite.T(), result.Projects, "usrv")
	assert.Contains(suite.T(), result.Projects, "cis20")
	assert.Contains(suite.T(), result.Projects, "ca")
}

func (suite *AlertStorageClientTestSuite) TestGetAvailableProjects_ServerError() {
	// Setup server to return error
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal server error"))
	})

	// Execute
	result, err := suite.client.GetAvailableProjects()

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "500")
}

func (suite *AlertStorageClientTestSuite) TestGetAvailableProjects_InvalidJSON() {
	// Setup server to return invalid JSON
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("invalid json"))
	})

	// Execute
	result, err := suite.client.GetAvailableProjects()

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "failed to decode response")
}

// TestGetAlertsByProject tests the GetAlertsByProject method
func (suite *AlertStorageClientTestSuite) TestGetAlertsByProject_Success() {
	// Setup server
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "GET", r.Method)
		assert.Equal(suite.T(), "/api/alerts/usrv", r.URL.Path)
		assert.Equal(suite.T(), "1", r.URL.Query().Get("page"))
		assert.Equal(suite.T(), "50", r.URL.Query().Get("pageSize"))
		assert.Equal(suite.T(), "critical", r.URL.Query().Get("severity"))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(client.AlertStoragePaginatedResponse{
			Data: []client.AlertStorageResponse{
				{
					Fingerprint: "abc123",
					Alertname:   "HighCPU",
					Status:      "firing",
					Severity:    "critical",
				},
			},
			Page:       1,
			PageSize:   50,
			TotalCount: 100,
			TotalPages: 2,
		})
	})

	// Execute
	params := map[string]string{
		"page":     "1",
		"pageSize": "50",
		"severity": "critical",
	}
	result, err := suite.client.GetAlertsByProject("usrv", params)

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Len(suite.T(), result.Data, 1)
	assert.Equal(suite.T(), "abc123", result.Data[0].Fingerprint)
	assert.Equal(suite.T(), "HighCPU", result.Data[0].Alertname)
	assert.Equal(suite.T(), 1, result.Page)
	assert.Equal(suite.T(), int64(100), result.TotalCount)
}

func (suite *AlertStorageClientTestSuite) TestGetAlertsByProject_EmptyFilters() {
	// Setup server
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "GET", r.Method)
		assert.Equal(suite.T(), "/api/alerts/usrv", r.URL.Path)
		assert.Empty(suite.T(), r.URL.RawQuery)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(client.AlertStoragePaginatedResponse{
			Data:       []client.AlertStorageResponse{},
			Page:       1,
			PageSize:   50,
			TotalCount: 0,
			TotalPages: 0,
		})
	})

	// Execute
	result, err := suite.client.GetAlertsByProject("usrv", map[string]string{})

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Empty(suite.T(), result.Data)
}

func (suite *AlertStorageClientTestSuite) TestGetAlertsByProject_ServerError() {
	// Setup server to return error
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("bad request"))
	})

	// Execute
	result, err := suite.client.GetAlertsByProject("usrv", map[string]string{})

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "400")
}

// TestGetAlertByFingerprint tests the GetAlertByFingerprint method
func (suite *AlertStorageClientTestSuite) TestGetAlertByFingerprint_Success() {
	// Setup server
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "GET", r.Method)
		assert.Equal(suite.T(), "/api/alerts/usrv/abc123", r.URL.Path)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		endsAt := "2024-01-01T12:00:00Z"
		json.NewEncoder(w).Encode(client.AlertStorageResponse{
			Fingerprint: "abc123",
			Alertname:   "HighCPU",
			Status:      "resolved",
			Severity:    "critical",
			Landscape:   "production",
			Region:      "us-east-1",
			StartsAt:    "2024-01-01T10:00:00Z",
			EndsAt:      &endsAt,
			Labels: map[string]interface{}{
				"component": "api-server",
			},
			Annotations: map[string]interface{}{
				"summary": "High CPU usage detected",
			},
		})
	})

	// Execute
	result, err := suite.client.GetAlertByFingerprint("usrv", "abc123")

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), "abc123", result.Fingerprint)
	assert.Equal(suite.T(), "HighCPU", result.Alertname)
	assert.Equal(suite.T(), "resolved", result.Status)
	assert.Equal(suite.T(), "critical", result.Severity)
	assert.NotNil(suite.T(), result.EndsAt)
	assert.Equal(suite.T(), "api-server", result.Labels["component"])
}

func (suite *AlertStorageClientTestSuite) TestGetAlertByFingerprint_NotFound() {
	// Setup server to return 404
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("alert not found"))
	})

	// Execute
	result, err := suite.client.GetAlertByFingerprint("usrv", "nonexistent")

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Equal(suite.T(), apperrors.ErrAlertNotFound, err)
}

func (suite *AlertStorageClientTestSuite) TestGetAlertByFingerprint_ServerError() {
	// Setup server to return error
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal error"))
	})

	// Execute
	result, err := suite.client.GetAlertByFingerprint("usrv", "abc123")

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "500")
}

// TestUpdateAlertLabel tests the UpdateAlertLabel method
func (suite *AlertStorageClientTestSuite) TestUpdateAlertLabel_Success() {
	// Setup server
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "PUT", r.Method)
		assert.Equal(suite.T(), "/api/alerts/usrv/abc123/label", r.URL.Path)
		assert.Equal(suite.T(), "application/json", r.Header.Get("Content-Type"))

		// Read and validate request body
		var req client.UpdateLabelRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		assert.NoError(suite.T(), err)
		assert.Equal(suite.T(), "team", req.Key)
		assert.Equal(suite.T(), "platform", req.Value)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(client.UpdateLabelResponse{
			Message:     "Label updated successfully",
			Project:     "usrv",
			Fingerprint: "abc123",
			Label: struct {
				Key   string `json:"key"`
				Value string `json:"value"`
			}{
				Key:   "team",
				Value: "platform",
			},
		})
	})

	// Execute
	request := client.UpdateLabelRequest{
		Key:   "team",
		Value: "platform",
	}
	result, err := suite.client.UpdateAlertLabel("usrv", "abc123", request)

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), "Label updated successfully", result.Message)
	assert.Equal(suite.T(), "usrv", result.Project)
	assert.Equal(suite.T(), "abc123", result.Fingerprint)
	assert.Equal(suite.T(), "team", result.Label.Key)
	assert.Equal(suite.T(), "platform", result.Label.Value)
}

func (suite *AlertStorageClientTestSuite) TestUpdateAlertLabel_NotFound() {
	// Setup server to return 404
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("alert not found"))
	})

	// Execute
	request := client.UpdateLabelRequest{Key: "team", Value: "platform"}
	result, err := suite.client.UpdateAlertLabel("usrv", "nonexistent", request)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Equal(suite.T(), apperrors.ErrAlertNotFound, err)
}

func (suite *AlertStorageClientTestSuite) TestUpdateAlertLabel_ServerError() {
	// Setup server to return error
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal error"))
	})

	// Execute
	request := client.UpdateLabelRequest{Key: "team", Value: "platform"}
	result, err := suite.client.UpdateAlertLabel("usrv", "abc123", request)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "500")
}

// TestGetAlertFilters tests the GetAlertFilters method
func (suite *AlertStorageClientTestSuite) TestGetAlertFilters_Success() {
	// Setup server
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(suite.T(), "GET", r.Method)
		assert.Equal(suite.T(), "/api/alerts/usrv/filters", r.URL.Path)
		assert.Equal(suite.T(), "firing", r.URL.Query().Get("status"))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		filters := client.AlertFiltersResponse{
			"severity":  []string{"critical", "warning", "info"},
			"landscape": []string{"production", "staging"},
			"status":    []string{"firing", "resolved"},
			"region":    []string{"us-east-1", "eu-west-1"},
		}
		json.NewEncoder(w).Encode(filters)
	})

	// Execute
	params := map[string]string{"status": "firing"}
	result, err := suite.client.GetAlertFilters("usrv", params)

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Len(suite.T(), *result, 4)
	assert.Contains(suite.T(), (*result)["severity"], "critical")
	assert.Contains(suite.T(), (*result)["landscape"], "production")
}

func (suite *AlertStorageClientTestSuite) TestGetAlertFilters_NotFound() {
	// Setup server to return 404
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("project not found"))
	})

	// Execute
	result, err := suite.client.GetAlertFilters("nonexistent", map[string]string{})

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "project not found")
}

func (suite *AlertStorageClientTestSuite) TestGetAlertFilters_ServerError() {
	// Setup server to return error
	suite.server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal error"))
	})

	// Execute
	result, err := suite.client.GetAlertFilters("usrv", map[string]string{})

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "500")
}

// TestNewAlertStorageClient tests the constructor
func TestNewAlertStorageClient(t *testing.T) {
	// Test with trailing slash
	client1 := client.NewAlertStorageClient("http://localhost:8080/")
	assert.Equal(t, "http://localhost:8080", client1.BaseURL)

	// Test without trailing slash
	client2 := client.NewAlertStorageClient("http://localhost:8080")
	assert.Equal(t, "http://localhost:8080", client2.BaseURL)

	// Test that HTTPClient is not nil
	assert.NotNil(t, client1.HTTPClient)
	assert.NotNil(t, client2.HTTPClient)

	// Test timeout is set
	assert.NotNil(t, client1.HTTPClient.Timeout)
}

// Run the test suite
func TestAlertStorageClientTestSuite(t *testing.T) {
	suite.Run(t, new(AlertStorageClientTestSuite))
}
