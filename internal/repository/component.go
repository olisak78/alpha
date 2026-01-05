package repository

import (
	"developer-portal-backend/internal/database/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ComponentRepository handles database operations for components
type ComponentRepository struct {
	db *gorm.DB
}

// NewComponentRepository creates a new component repository
func NewComponentRepository(db *gorm.DB) *ComponentRepository {
	return &ComponentRepository{db: db}
}

// Create creates a new component
func (r *ComponentRepository) Create(component *models.Component) error {
	return r.db.Create(component).Error
}

// GetByID retrieves a component by ID
func (r *ComponentRepository) GetByID(id uuid.UUID) (*models.Component, error) {
	var component models.Component
	err := r.db.First(&component, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &component, nil
}

// GetByName retrieves a component by name within an organization
func (r *ComponentRepository) GetByName(projectID uuid.UUID, name string) (*models.Component, error) {
	var component models.Component
	err := r.db.First(&component, "project_id = ? AND name = ?", projectID, name).Error
	if err != nil {
		return nil, err
	}
	return &component, nil
}

// GetByType retrieves all components of a specific type in an organization

// GetByStatus retrieves all components with a specific status in an organization

// GetActiveComponents retrieves all active components for an organization

// Update updates a component
func (r *ComponentRepository) Update(component *models.Component) error {
	return r.db.Save(component).Error
}

// Delete deletes a component
func (r *ComponentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Component{}, "id = ?", id).Error
}

// GetWithProjects retrieves a component with all its projects
func (r *ComponentRepository) GetWithProjects(id uuid.UUID) (*models.Component, error) {
	var component models.Component
	err := r.db.Preload("Projects").First(&component, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &component, nil
}

// GetWithDeployments retrieves a component with all its deployments
func (r *ComponentRepository) GetWithDeployments(id uuid.UUID) (*models.Component, error) {
	var component models.Component
	err := r.db.Preload("Deployments").First(&component, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &component, nil
}

// GetWithTeamOwnerships retrieves a component with team ownerships
func (r *ComponentRepository) GetWithTeamOwnerships(id uuid.UUID) (*models.Component, error) {
	var component models.Component
	err := r.db.Preload("TeamOwnerships").Preload("TeamOwnerships.Team").First(&component, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &component, nil
}

// SetStatus sets the status of a component

// CheckComponentExists checks if a component exists by ID
func (r *ComponentRepository) CheckComponentExists(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Component{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

// GetComponentsByTeamID retrieves all components owned by a specific team
func (r *ComponentRepository) GetComponentsByTeamID(teamID uuid.UUID, limit, offset int) ([]models.Component, int64, error) {
	var components []models.Component
	var total int64

	// New model stores ownership directly in components.owner_id
	query := r.db.Model(&models.Component{}).Where("owner_id = ?", teamID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Limit(limit).Offset(offset).Find(&components).Error; err != nil {
		return nil, 0, err
	}

	return components, total, nil
}

// Added: GetByOwnerID to align with new interface
func (r *ComponentRepository) GetByOwnerID(ownerID uuid.UUID, limit, offset int) ([]models.Component, int64, error) {
	return r.GetComponentsByTeamID(ownerID, limit, offset)
}

// GetComponentsByProjectID retrieves all components used by a specific project
func (r *ComponentRepository) GetComponentsByProjectID(projectID uuid.UUID, limit, offset int) ([]models.Component, int64, error) {
	var components []models.Component
	var total int64

	// New model stores project reference directly in components.project_id
	query := r.db.Model(&models.Component{}).Where("project_id = ?", projectID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Limit(limit).Offset(offset).Find(&components).Error; err != nil {
		return nil, 0, err
	}

	return components, total, nil
}

// Added: GetByProjectID to align with new interface
func (r *ComponentRepository) GetByProjectID(projectID uuid.UUID, limit, offset int) ([]models.Component, int64, error) {
	return r.GetComponentsByProjectID(projectID, limit, offset)
}

// GetComponentsByTypeAndStatus retrieves components by type and status
