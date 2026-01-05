package service

import (
	"developer-portal-backend/internal/client"
	apperrors "developer-portal-backend/internal/errors"

	"github.com/sirupsen/logrus"
)

// AlertStorageService wraps the alert storage API client
type AlertStorageService struct {
	client *client.AlertStorageClient
}

// NewAlertStorageService creates a new alert storage service
func NewAlertStorageService(client *client.AlertStorageClient) *AlertStorageService {
	return &AlertStorageService{
		client: client,
	}
}

// GetAvailableProjects retrieves all available projects
func (s *AlertStorageService) GetAvailableProjects() (*client.ProjectsResponse, error) {
	logrus.Info("Service: Fetching available projects from alert storage")

	result, err := s.client.GetAvailableProjects()
	if err != nil {
		logrus.WithError(err).Error("Service: Failed to fetch available projects")
		return nil, err
	}

	logrus.WithField("project_count", len(result.Projects)).Info("Service: Successfully fetched available projects")
	return result, nil
}

// GetAlertsByProject retrieves alerts for a specific project with filters
func (s *AlertStorageService) GetAlertsByProject(project string, filters map[string]string) (*client.AlertStoragePaginatedResponse, error) {
	logrus.WithFields(logrus.Fields{
		"project": project,
		"filters": filters,
	}).Info("Service: Fetching alerts by project")

	if project == "" {
		logrus.Warn("Service: Missing project parameter when fetching alerts")
		return nil, apperrors.ErrMissingProject
	}

	result, err := s.client.GetAlertsByProject(project, filters)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"project": project,
			"error":   err.Error(),
		}).Error("Service: Failed to fetch alerts by project")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"alert_count": len(result.Data),
		"total_count": result.TotalCount,
	}).Info("Service: Successfully fetched alerts by project")
	return result, nil
}

// GetAlertByFingerprint retrieves a specific alert by fingerprint
func (s *AlertStorageService) GetAlertByFingerprint(project, fingerprint string) (*client.AlertStorageResponse, error) {
	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
	}).Info("Service: Fetching alert by fingerprint")

	if project == "" {
		logrus.Warn("Service: Missing project parameter when fetching alert by fingerprint")
		return nil, apperrors.ErrMissingProject
	}
	if fingerprint == "" {
		logrus.Warn("Service: Missing fingerprint parameter when fetching alert")
		return nil, apperrors.ErrMissingFingerprint
	}

	result, err := s.client.GetAlertByFingerprint(project, fingerprint)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"error":       err.Error(),
		}).Error("Service: Failed to fetch alert by fingerprint")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"alertname":   result.Alertname,
		"status":      result.Status,
	}).Info("Service: Successfully fetched alert by fingerprint")
	return result, nil
}

// UpdateAlertLabel updates or adds a label to an alert
func (s *AlertStorageService) UpdateAlertLabel(project, fingerprint, key, value string) (*client.UpdateLabelResponse, error) {
	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   key,
		"label_value": value,
	}).Info("Service: Updating alert label")

	if project == "" {
		logrus.Warn("Service: Missing project parameter when updating alert label")
		return nil, apperrors.ErrMissingProject
	}
	if fingerprint == "" {
		logrus.Warn("Service: Missing fingerprint parameter when updating alert label")
		return nil, apperrors.ErrMissingFingerprint
	}
	if key == "" {
		logrus.Warn("Service: Missing label key parameter when updating alert label")
		return nil, apperrors.ErrMissingLabelKey
	}

	request := client.UpdateLabelRequest{
		Key:   key,
		Value: value,
	}

	result, err := s.client.UpdateAlertLabel(project, fingerprint, request)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"project":     project,
			"fingerprint": fingerprint,
			"label_key":   key,
			"error":       err.Error(),
		}).Error("Service: Failed to update alert label")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"project":     project,
		"fingerprint": fingerprint,
		"label_key":   key,
		"label_value": value,
	}).Info("Service: Successfully updated alert label")
	return result, nil
}

// GetAlertFilters retrieves available filter values for alerts in a specific project
func (s *AlertStorageService) GetAlertFilters(project string, filters map[string]string) (*client.AlertFiltersResponse, error) {
	logrus.WithFields(logrus.Fields{
		"project": project,
		"filters": filters,
	}).Info("Service: Fetching alert filters")

	if project == "" {
		logrus.Warn("Service: Missing project parameter when fetching alert filters")
		return nil, apperrors.ErrMissingProject
	}

	result, err := s.client.GetAlertFilters(project, filters)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"project": project,
			"error":   err.Error(),
		}).Error("Service: Failed to fetch alert filters")
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"project":      project,
		"filter_count": len(*result),
	}).Info("Service: Successfully fetched alert filters")
	return result, nil
}
