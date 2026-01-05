package handlers

import (
	"errors"
	"net/http"

	apperrors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// AlertStorageHandler handles HTTP requests for alert storage
type AlertStorageHandler struct {
	service *service.AlertStorageService
}

// NewAlertStorageHandler creates a new alert storage handler
func NewAlertStorageHandler(service *service.AlertStorageService) *AlertStorageHandler {
	return &AlertStorageHandler{
		service: service,
	}
}

// GetAvailableProjects godoc
// @Summary Get all alert storage projects
// @Description Retrieve a list of all available projects configured in the alert storage system
// @Tags alert-storage
// @Accept json
// @Produce json
// @Success 200 {object} client.ProjectsResponse "Successfully retrieved projects"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /alert-storage/projects [get]
// @Security BearerAuth
func (h *AlertStorageHandler) GetAvailableProjects(c *gin.Context) {
	logrus.WithFields(logrus.Fields{
		"method": c.Request.Method,
		"path":   c.Request.URL.Path,
	}).Info("Handler: Received request to get available projects")

	projects, err := h.service.GetAvailableProjects()
	if err != nil {
		logrus.WithError(err).Error("Handler: Failed to retrieve projects from alert storage service")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve projects from alert storage service"})
		return
	}

	logrus.WithField("project_count", len(projects.Projects)).Info("Handler: Successfully returned available projects")
	c.JSON(http.StatusOK, projects)
}

// GetAlertsByProject godoc
// @Summary Get alerts by project
// @Description Retrieve alerts for a specific project with optional filtering and pagination
// @Tags alert-storage
// @Accept json
// @Produce json
// @Param project path string true "Project name (must be one of cis2, usrv, cloud_automation)"
// @Param page query int false "Page number (min 1)" default(1) minimum(1)
// @Param pageSize query int false "Items per page (min 1, max 100)" default(50) minimum(1) maximum(100)
// @Param severity query string false "Filter by severity (e.g., critical, warning, info)"
// @Param region query string false "Filter by region label"
// @Param landscape query string false "Filter by landscape"
// @Param status query string false "Filter by status (firing or resolved)" Enums(firing, resolved)
// @Param component query string false "Filter by component label"
// @Param alertname query string false "Filter by alert name"
// @Param start_time query string false "Filter alerts after this time (RFC3339 format)"
// @Param end_time query string false "Filter alerts before this time (RFC3339 format)"
// @Success 200 {object} client.AlertStoragePaginatedResponse "Successfully retrieved alerts"
// @Failure 400 {object} map[string]string "Invalid request parameters"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /alert-storage/alerts/{project} [get]
// @Security BearerAuth
func (h *AlertStorageHandler) GetAlertsByProject(c *gin.Context) {
	project := c.Param("project")

	// Collect all query parameters to pass to the external service
	filters := make(map[string]string)

	// Add all possible filter parameters
	if page := c.Query("page"); page != "" {
		filters["page"] = page
	}
	if pageSize := c.Query("pageSize"); pageSize != "" {
		filters["pageSize"] = pageSize
	}
	if severity := c.Query("severity"); severity != "" {
		filters["severity"] = severity
	}
	if region := c.Query("region"); region != "" {
		filters["region"] = region
	}
	if landscape := c.Query("landscape"); landscape != "" {
		filters["landscape"] = landscape
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if component := c.Query("component"); component != "" {
		filters["component"] = component
	}
	if alertname := c.Query("alertname"); alertname != "" {
		filters["alertname"] = alertname
	}
	if startTime := c.Query("start_time"); startTime != "" {
		filters["start_time"] = startTime
	}
	if endTime := c.Query("end_time"); endTime != "" {
		filters["end_time"] = endTime
	}

	logrus.WithFields(logrus.Fields{
		"method":  c.Request.Method,
		"path":    c.Request.URL.Path,
		"project": project,
		"filters": filters,
	}).Info("Handler: Received request to get alerts by project")

	// Call the external service
	response, err := h.service.GetAlertsByProject(project, filters)
	if err != nil {
		if errors.Is(err, apperrors.ErrMissingProject) {
			logrus.WithField("project", project).Warn("Handler: Missing project parameter")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logrus.WithFields(logrus.Fields{
			"project": project,
			"error":   err.Error(),
		}).Error("Handler: Failed to retrieve alerts from alert storage service")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve alerts from alert storage service"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"alert_count": len(response.Data),
		"total_count": response.TotalCount,
		"page":        response.Page,
	}).Info("Handler: Successfully returned alerts by project")
	c.JSON(http.StatusOK, response)
}

// GetAlertByFingerprint godoc
// @Summary Get alert by fingerprint
// @Description Retrieve a specific alert by its unique fingerprint within a project
// @Tags alert-storage
// @Accept json
// @Produce json
// @Param project path string true "Project name (alphanumeric, dashes, underscores)"
// @Param fingerprint path string true "Alert fingerprint (hexadecimal string, max 128 chars)"
// @Success 200 {object} client.AlertStorageResponse "Successfully retrieved alert"
// @Failure 400 {object} map[string]string "Invalid request parameters"
// @Failure 404 {object} map[string]string "Alert not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /alert-storage/alerts/{project}/{fingerprint} [get]
// @Security BearerAuth
func (h *AlertStorageHandler) GetAlertByFingerprint(c *gin.Context) {
	project := c.Param("project")
	fingerprint := c.Param("fingerprint")

	logrus.WithFields(logrus.Fields{
		"method":      c.Request.Method,
		"path":        c.Request.URL.Path,
		"project":     project,
		"fingerprint": fingerprint,
	}).Info("Handler: Received request to get alert by fingerprint")

	// Call the external service
	alert, err := h.service.GetAlertByFingerprint(project, fingerprint)
	if err != nil {
		if errors.Is(err, apperrors.ErrAlertNotFound) {
			logrus.WithFields(logrus.Fields{
				"project":     project,
				"fingerprint": fingerprint,
			}).Warn("Handler: Alert not found")
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, apperrors.ErrMissingProject) || errors.Is(err, apperrors.ErrMissingFingerprint) {
			logrus.WithFields(logrus.Fields{
				"project":     project,
				"fingerprint": fingerprint,
			}).Warn("Handler: Missing required parameters")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Handler: Failed to retrieve alert from alert storage service")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve alert from alert storage service"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"alertname":   alert.Alertname,
		"status":      alert.Status,
	}).Info("Handler: Successfully returned alert by fingerprint")
	c.JSON(http.StatusOK, alert)
}

// UpdateAlertLabel godoc
// @Summary Update alert label
// @Description Update or add a label for a specific alert
// @Tags alert-storage
// @Accept json
// @Produce json
// @Param project path string true "Project name (alphanumeric, dashes, underscores)"
// @Param fingerprint path string true "Alert fingerprint (hexadecimal string, max 128 chars)"
// @Param body body map[string]string true "Label update request with 'key' and 'value' fields"
// @Success 200 {object} client.UpdateLabelResponse "Label updated successfully"
// @Failure 400 {object} map[string]string "Invalid request parameters or body"
// @Failure 404 {object} map[string]string "Alert not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /alert-storage/alerts/{project}/{fingerprint}/label [put]
// @Security BearerAuth
func (h *AlertStorageHandler) UpdateAlertLabel(c *gin.Context) {
	project := c.Param("project")
	fingerprint := c.Param("fingerprint")

	// Parse request body
	var req struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Warn("Handler: Invalid request body for update alert label")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	logrus.WithFields(logrus.Fields{
		"method":      c.Request.Method,
		"path":        c.Request.URL.Path,
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   req.Key,
		"label_value": req.Value,
	}).Info("Handler: Received request to update alert label")

	// Call the external service
	response, err := h.service.UpdateAlertLabel(project, fingerprint, req.Key, req.Value)
	if err != nil {
		if errors.Is(err, apperrors.ErrAlertNotFound) {
			logrus.WithFields(logrus.Fields{
				"project":     project,
				"fingerprint": fingerprint,
			}).Warn("Handler: Alert not found during label update")
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, apperrors.ErrMissingProject) || errors.Is(err, apperrors.ErrMissingFingerprint) || errors.Is(err, apperrors.ErrMissingLabelKey) {
			logrus.WithFields(logrus.Fields{
				"project":     project,
				"fingerprint": fingerprint,
				"label_key":   req.Key,
			}).Warn("Handler: Missing required parameters for label update")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"label_key":   req.Key,
			"error":       err.Error(),
		}).Error("Handler: Failed to update label in alert storage service")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update label in alert storage service"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   req.Key,
		"label_value": req.Value,
	}).Info("Handler: Successfully updated alert label")
	c.JSON(http.StatusOK, response)
}

// GetAlertFilters godoc
// @Summary Get available filter values for alerts
// @Description Retrieve available filter values for alerts in a specific project. Returns a dynamic map where keys are filter names (e.g., alertname, severity, status, landscape, region) and values are arrays of available options. Use query parameters to narrow down results.
// @Tags alert-storage
// @Accept json
// @Produce json
// @Param project path string true "Project name (must be one of cis2, usrv, cloud_automation)"
// @Param severity query string false "Filter by severity level (e.g., critical, warning, info)"
// @Param landscape query string false "Filter by landscape (e.g., production, staging, development)"
// @Param status query string false "Filter by alert status (firing or resolved)" Enums(firing, resolved)
// @Param alertname query string false "Filter by alert name"
// @Param region query string false "Filter by region (e.g., us-east-1, eu-west-1)"
// @Param component query string false "Filter by component label"
// @Param start_time query string false "Filter alerts starting from this time (RFC3339 format)"
// @Param end_time query string false "Filter alerts up to this time (RFC3339 format)"
// @Success 200 {object} map[string][]string "Successfully retrieved filter values as a dynamic map"
// @Failure 400 {object} map[string]string "Invalid query parameters"
// @Failure 404 {object} map[string]string "Project not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /alert-storage/alerts/{project}/filters [get]
// @Security BearerAuth
func (h *AlertStorageHandler) GetAlertFilters(c *gin.Context) {
	project := c.Param("project")

	// Collect all query parameters to pass to the external service
	filters := make(map[string]string)

	// Add all possible filter parameters
	if severity := c.Query("severity"); severity != "" {
		filters["severity"] = severity
	}
	if landscape := c.Query("landscape"); landscape != "" {
		filters["landscape"] = landscape
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if alertname := c.Query("alertname"); alertname != "" {
		filters["alertname"] = alertname
	}
	if region := c.Query("region"); region != "" {
		filters["region"] = region
	}
	if component := c.Query("component"); component != "" {
		filters["component"] = component
	}
	if startTime := c.Query("start_time"); startTime != "" {
		filters["start_time"] = startTime
	}
	if endTime := c.Query("end_time"); endTime != "" {
		filters["end_time"] = endTime
	}

	logrus.WithFields(logrus.Fields{
		"method":  c.Request.Method,
		"path":    c.Request.URL.Path,
		"project": project,
		"filters": filters,
	}).Info("Handler: Received request to get alert filters")

	// Call the external service
	response, err := h.service.GetAlertFilters(project, filters)
	if err != nil {
		if errors.Is(err, apperrors.ErrMissingProject) {
			logrus.WithField("project", project).Warn("Handler: Missing project parameter when fetching filters")
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logrus.WithFields(logrus.Fields{
			"project": project,
			"error":   err.Error(),
		}).Error("Handler: Failed to retrieve filters from alert storage service")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve filters from alert storage service"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"project":      project,
		"filter_count": len(*response),
	}).Info("Handler: Successfully returned alert filters")
	c.JSON(http.StatusOK, response)
}
