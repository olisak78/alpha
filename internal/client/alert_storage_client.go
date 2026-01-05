package client

import (
	"bytes"
	apperrors "developer-portal-backend/internal/errors"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// AlertStorageClient handles communication with the external alert storage service
type AlertStorageClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewAlertStorageClient creates a new alert storage API client
func NewAlertStorageClient(baseURL string) *AlertStorageClient {
	return &AlertStorageClient{
		BaseURL: strings.TrimSuffix(baseURL, "/"),
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// AlertStorageResponse represents a single alert from the external service
type AlertStorageResponse struct {
	Fingerprint string                 `json:"fingerprint"`
	Alertname   string                 `json:"alertname"`
	Status      string                 `json:"status"`
	Severity    string                 `json:"severity"`
	Landscape   string                 `json:"landscape"`
	Region      string                 `json:"region"`
	StartsAt    string                 `json:"startsAt"`
	EndsAt      *string                `json:"endsAt"`
	Labels      map[string]interface{} `json:"labels"`
	Annotations map[string]interface{} `json:"annotations"`
	CreatedAt   string                 `json:"createdAt"`
	UpdatedAt   string                 `json:"updatedAt"`
}

// AlertStoragePaginatedResponse represents paginated alerts from the external service
type AlertStoragePaginatedResponse struct {
	Data       []AlertStorageResponse `json:"data"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"pageSize"`
	TotalCount int64                  `json:"totalCount"`
	TotalPages int                    `json:"totalPages"`
}

// ProjectsResponse represents the list of available projects
type ProjectsResponse struct {
	Projects []string `json:"projects"`
}

// UpdateLabelRequest represents a label update request
type UpdateLabelRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// UpdateLabelResponse represents the response after updating a label
type UpdateLabelResponse struct {
	Message     string `json:"message"`
	Project     string `json:"project"`
	Fingerprint string `json:"fingerprint"`
	Label       struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	} `json:"label"`
}

// AlertFiltersResponse represents available filter values for alerts
// Uses a dynamic map to support any filter fields without hardcoding
type AlertFiltersResponse map[string][]string

// GetAvailableProjects retrieves all available projects from the alert storage service
func (c *AlertStorageClient) GetAvailableProjects() (*ProjectsResponse, error) {
	url := fmt.Sprintf("%s/api/projects", c.BaseURL)

	logrus.WithFields(logrus.Fields{
		"method": "GET",
		"url":    url,
	}).Info("Sending request to alert storage service to fetch available projects")

	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   url,
			"error": err.Error(),
		}).Error("Failed to call alert storage service for projects")
		return nil, fmt.Errorf("failed to call alert storage service: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"url":         url,
	}).Debug("Received response from alert storage service")

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"url":         url,
			"response":    string(body),
		}).Error("Alert storage service returned non-OK status for projects")
		return nil, fmt.Errorf("alert storage service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result ProjectsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   url,
			"error": err.Error(),
		}).Error("Failed to decode projects response from alert storage service")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"project_count": len(result.Projects),
		"projects":      result.Projects,
	}).Info("Successfully retrieved projects from alert storage service")

	return &result, nil
}

// GetAlertsByProject retrieves alerts for a specific project with filters
func (c *AlertStorageClient) GetAlertsByProject(project string, params map[string]string) (*AlertStoragePaginatedResponse, error) {
	// Build URL with query parameters
	baseURL := fmt.Sprintf("%s/api/alerts/%s", c.BaseURL, project)

	queryParams := url.Values{}
	for key, value := range params {
		if value != "" {
			queryParams.Add(key, value)
		}
	}

	fullURL := baseURL
	if len(queryParams) > 0 {
		fullURL = fmt.Sprintf("%s?%s", baseURL, queryParams.Encode())
	}

	logrus.WithFields(logrus.Fields{
		"method":  "GET",
		"url":     fullURL,
		"project": project,
		"filters": params,
	}).Info("Sending request to alert storage service to fetch alerts by project")

	resp, err := c.HTTPClient.Get(fullURL)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":     fullURL,
			"project": project,
			"error":   err.Error(),
		}).Error("Failed to call alert storage service for alerts by project")
		return nil, fmt.Errorf("failed to call alert storage service: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"url":         fullURL,
		"project":     project,
	}).Debug("Received response from alert storage service")

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"url":         fullURL,
			"project":     project,
			"response":    string(body),
		}).Error("Alert storage service returned non-OK status for alerts by project")
		return nil, fmt.Errorf("alert storage service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result AlertStoragePaginatedResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":     fullURL,
			"project": project,
			"error":   err.Error(),
		}).Error("Failed to decode alerts response from alert storage service")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"alert_count": len(result.Data),
		"page":        result.Page,
		"page_size":   result.PageSize,
		"total_count": result.TotalCount,
		"total_pages": result.TotalPages,
	}).Info("Successfully retrieved alerts from alert storage service")

	return &result, nil
}

// GetAlertByFingerprint retrieves a specific alert by fingerprint
func (c *AlertStorageClient) GetAlertByFingerprint(project, fingerprint string) (*AlertStorageResponse, error) {
	url := fmt.Sprintf("%s/api/alerts/%s/%s", c.BaseURL, project, fingerprint)

	logrus.WithFields(logrus.Fields{
		"method":      "GET",
		"url":         url,
		"project":     project,
		"fingerprint": fingerprint,
	}).Info("Sending request to alert storage service to fetch alert by fingerprint")

	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to call alert storage service for alert by fingerprint")
		return nil, fmt.Errorf("failed to call alert storage service: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"url":         url,
		"project":     project,
		"fingerprint": fingerprint,
	}).Debug("Received response from alert storage service")

	if resp.StatusCode == http.StatusNotFound {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
		}).Warn("Alert not found in alert storage service")
		return nil, apperrors.ErrAlertNotFound
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"response":    string(body),
		}).Error("Alert storage service returned non-OK status for alert by fingerprint")
		return nil, fmt.Errorf("alert storage service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result AlertStorageResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to decode alert response from alert storage service")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"alertname":   result.Alertname,
		"status":      result.Status,
		"severity":    result.Severity,
	}).Info("Successfully retrieved alert from alert storage service")

	return &result, nil
}

// UpdateAlertLabel updates or adds a label to an alert
func (c *AlertStorageClient) UpdateAlertLabel(project, fingerprint string, request UpdateLabelRequest) (*UpdateLabelResponse, error) {
	url := fmt.Sprintf("%s/api/alerts/%s/%s/label", c.BaseURL, project, fingerprint)

	logrus.WithFields(logrus.Fields{
		"method":      "PUT",
		"url":         url,
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   request.Key,
		"label_value": request.Value,
	}).Info("Sending request to alert storage service to update alert label")

	jsonData, err := json.Marshal(request)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to marshal label update request")
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("PUT", url, bytes.NewReader(jsonData))
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to create HTTP request for label update")
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to call alert storage service for label update")
		return nil, fmt.Errorf("failed to call alert storage service: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"url":         url,
		"project":     project,
		"fingerprint": fingerprint,
	}).Debug("Received response from alert storage service")

	if resp.StatusCode == http.StatusNotFound {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
		}).Warn("Alert not found in alert storage service during label update")
		return nil, apperrors.ErrAlertNotFound
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"response":    string(body),
		}).Error("Alert storage service returned non-OK status for label update")
		return nil, fmt.Errorf("alert storage service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result UpdateLabelResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         url,
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Failed to decode label update response from alert storage service")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   result.Label.Key,
		"label_value": result.Label.Value,
	}).Info("Successfully updated alert label in alert storage service")

	return &result, nil
}

// GetAlertFilters retrieves available filter values for alerts in a specific project
func (c *AlertStorageClient) GetAlertFilters(project string, params map[string]string) (*AlertFiltersResponse, error) {
	// Build URL with query parameters
	baseURL := fmt.Sprintf("%s/api/alerts/%s/filters", c.BaseURL, project)

	queryParams := url.Values{}
	for key, value := range params {
		if value != "" {
			queryParams.Add(key, value)
		}
	}

	fullURL := baseURL
	if len(queryParams) > 0 {
		fullURL = fmt.Sprintf("%s?%s", baseURL, queryParams.Encode())
	}

	logrus.WithFields(logrus.Fields{
		"method":  "GET",
		"url":     fullURL,
		"project": project,
		"filters": params,
	}).Info("Sending request to alert storage service to fetch alert filters")

	resp, err := c.HTTPClient.Get(fullURL)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":     fullURL,
			"project": project,
			"error":   err.Error(),
		}).Error("Failed to call alert storage service for alert filters")
		return nil, fmt.Errorf("failed to call alert storage service: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"url":         fullURL,
		"project":     project,
	}).Debug("Received response from alert storage service")

	if resp.StatusCode == http.StatusNotFound {
		logrus.WithFields(logrus.Fields{
			"project": project,
		}).Warn("Project not found in alert storage service when fetching filters")
		return nil, fmt.Errorf("project not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.WithFields(logrus.Fields{
			"status_code": resp.StatusCode,
			"url":         fullURL,
			"project":     project,
			"response":    string(body),
		}).Error("Alert storage service returned non-OK status for alert filters")
		return nil, fmt.Errorf("alert storage service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result AlertFiltersResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":     fullURL,
			"project": project,
			"error":   err.Error(),
		}).Error("Failed to decode alert filters response from alert storage service")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"project":      project,
		"filter_count": len(result),
	}).Info("Successfully retrieved alert filters from alert storage service")

	return &result, nil
}
