package repository

import (
	"developer-portal-backend/internal/database/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TeamRepository handles database operations for teams
type TeamRepository struct {
	db *gorm.DB
}

// NewTeamRepository creates a new team repository
func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

// Create creates a new team
func (r *TeamRepository) Create(team *models.Team) error {
	return r.db.Create(team).Error
}

// GetByID retrieves a team by ID
func (r *TeamRepository) GetByID(id uuid.UUID) (*models.Team, error) {
	var team models.Team
	err := r.db.First(&team, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// GetByName retrieves a team by name within a group
func (r *TeamRepository) GetByName(groupID uuid.UUID, name string) (*models.Team, error) {
	var team models.Team
	err := r.db.First(&team, "group_id = ? AND name = ?", groupID, name).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// GetByNameGlobal retrieves a team by name across all groups/organizations (first match)
func (r *TeamRepository) GetByNameGlobal(name string) (*models.Team, error) {
	var team models.Team
	err := r.db.First(&team, "name = ?", name).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// GetByGroupID retrieves all teams for a group with pagination
func (r *TeamRepository) GetByGroupID(groupID uuid.UUID, limit, offset int) ([]models.Team, int64, error) {
	var teams []models.Team
	var total int64

	// Get total count
	if err := r.db.Model(&models.Team{}).Where("group_id = ?", groupID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Where("group_id = ?", groupID).Limit(limit).Offset(offset).Find(&teams).Error
	if err != nil {
		return nil, 0, err
	}

	return teams, total, nil
}

// GetByOrganizationID retrieves all teams for an organization (through groups) with pagination
func (r *TeamRepository) GetByOrganizationID(orgID uuid.UUID, limit, offset int) ([]models.Team, int64, error) {
	var teams []models.Team
	var total int64

	// Get total count - join with groups to filter by organization
	if err := r.db.Model(&models.Team{}).
		Joins("JOIN groups ON teams.group_id = groups.id").
		Where("groups.org_id = ?", orgID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.
		Joins("JOIN groups ON teams.group_id = groups.id").
		Where("groups.org_id = ?", orgID).
		Limit(limit).Offset(offset).
		Find(&teams).Error
	if err != nil {
		return nil, 0, err
	}

	return teams, total, nil
}

// Update updates a team
func (r *TeamRepository) Update(team *models.Team) error {
	return r.db.Save(team).Error
}

// Delete deletes a team
func (r *TeamRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Team{}, "id = ?", id).Error
}

// Search searches for teams by name or description within an organization (through groups)
func (r *TeamRepository) Search(orgID uuid.UUID, query string, limit, offset int) ([]models.Team, int64, error) {
	var teams []models.Team
	var total int64

	// Return empty results for empty query
	if query == "" {
		return teams, 0, nil
	}

	searchQuery := r.db.Model(&models.Team{}).
		Joins("JOIN groups ON teams.group_id = groups.id").
		Where("groups.org_id = ? AND (teams.name ILIKE ? OR teams.description ILIKE ?)", orgID, "%"+query+"%", "%"+query+"%")

	// Get total count
	if err := searchQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := searchQuery.Limit(limit).Offset(offset).Find(&teams).Error
	if err != nil {
		return nil, 0, err
	}

	return teams, total, nil
}

// GetAll retrieves all teams across all organizations
func (r *TeamRepository) GetAll() ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Find(&teams).Error
	return teams, err
}
