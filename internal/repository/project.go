package repository

import (
	"developer-portal-backend/internal/database/models"
	"encoding/json"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectRepository handles database operations for projects
type ProjectRepository struct {
	db *gorm.DB
}

// NewProjectRepository creates a new project repository
func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// Create creates a new project
func (r *ProjectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

// GetByID retrieves a project by ID
func (r *ProjectRepository) GetByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.First(&project, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// GetByName retrieves a project by name within an organization
func (r *ProjectRepository) GetByName(name string) (*models.Project, error) {
	var project models.Project
	err := r.db.First(&project, "name = ?", name).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// Update updates a project
func (r *ProjectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

// Delete deletes a project
func (r *ProjectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, "id = ?", id).Error
}

func (r *ProjectRepository) GetHealthMetadata(projectID uuid.UUID) (string, string, error) {
	var project models.Project
	if err := r.db.Select("id", "metadata").First(&project, "id = ?", projectID).Error; err != nil {
		return "", "", err
	}
	// Handle null or empty metadata
	if len(project.Metadata) == 0 || string(project.Metadata) == "null" {
		return "", "", nil
	}
	var meta map[string]interface{}
	if err := json.Unmarshal(project.Metadata, &meta); err != nil {
		return "", "", err
	}
	// URL template from metadata["health"]
	urlTemplate := ""
	if raw, ok := meta["health"]; ok {
		if s, ok := raw.(string); ok {
			urlTemplate = s
		}
	}
	// Success regex from metadata["health_success_regex"]
	successRegex := ""
	if raw, ok := meta["health_success_regex"]; ok {
		if s, ok := raw.(string); ok {
			successRegex = s
		}
	}
	return urlTemplate, successRegex, nil
}

// GetAllProjects retrieves all projects
func (r *ProjectRepository) GetAllProjects() ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}
