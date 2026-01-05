package repository

import (
	"encoding/json"
	"strings"
	"testing"

	"developer-portal-backend/internal/database/models"
	"developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
)

// LandscapeRepositoryTestSuite tests the LandscapeRepository
type LandscapeRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *LandscapeRepository
	factories     *testutils.FactorySet
	projectRepo   *ProjectRepository
}

// SetupSuite runs before all tests in the suite
func (suite *LandscapeRepositoryTestSuite) SetupSuite() {
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())

	suite.repo = NewLandscapeRepository(suite.baseTestSuite.DB)
	suite.projectRepo = NewProjectRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// Helper method to create a valid project for foreign key constraints
func (suite *LandscapeRepositoryTestSuite) createTestProject() *models.Project {
	project := suite.factories.Project.Create()
	// Ensure unique names to avoid constraint violations
	project.Name = "test-project-" + uuid.New().String()[:8]
	project.Title = "Test Project " + uuid.New().String()[:8]
	err := suite.projectRepo.Create(project)
	suite.NoError(err)
	return project
}

// Helper method to create landscape with all required fields
func (suite *LandscapeRepositoryTestSuite) createTestLandscape(project *models.Project) *models.Landscape {
	landscape := suite.factories.Landscape.Create()
	landscape.ProjectID = project.ID
	// Ensure unique names to avoid constraint violations
	landscape.Name = "test-landscape-" + uuid.New().String()[:8]
	landscape.Title = "Test Landscape " + uuid.New().String()[:8]
	return landscape
}

// TearDownSuite runs after all tests in the suite
func (suite *LandscapeRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *LandscapeRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *LandscapeRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// TestCreate tests creating a new landscape
func (suite *LandscapeRepositoryTestSuite) TestCreate() {
	// Create project first
	project := suite.createTestProject()

	// Create test landscape
	landscape := suite.createTestLandscape(project)

	// Create the landscape
	err := suite.repo.Create(landscape)

	// Assertions
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, landscape.ID)
	suite.NotZero(landscape.CreatedAt)
	suite.NotZero(landscape.UpdatedAt)
}

// TestCreateDuplicateName tests creating a landscape with duplicate name
func (suite *LandscapeRepositoryTestSuite) TestCreateDuplicateName() {
	// Create project first
	project := suite.createTestProject()

	// Create first landscape
	landscape1 := suite.factories.Landscape.WithName("duplicate-landscape")
	landscape1.ProjectID = project.ID
	err := suite.repo.Create(landscape1)
	suite.NoError(err)

	// Try to create second landscape with same name
	landscape2 := suite.factories.Landscape.WithName("duplicate-landscape")
	landscape2.ProjectID = project.ID
	err = suite.repo.Create(landscape2)

	// Should fail due to unique constraint on name (in BaseModel)
	suite.Error(err)
	suite.Contains(err.Error(), "duplicate key value")
}

// TestGetByID tests retrieving a landscape by ID
func (suite *LandscapeRepositoryTestSuite) TestGetByID() {
	// Create project first
	project := suite.createTestProject()

	// Create test landscape
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Retrieve the landscape
	retrievedLandscape, err := suite.repo.GetByID(landscape.ID)

	// Assertions
	suite.NoError(err)
	suite.NotNil(retrievedLandscape)
	suite.Equal(landscape.ID, retrievedLandscape.ID)
	suite.Equal(landscape.Name, retrievedLandscape.Name)
	suite.Equal(landscape.Title, retrievedLandscape.Title)
	suite.Equal(landscape.Environment, retrievedLandscape.Environment)
}

// TestGetByIDNotFound tests retrieving a non-existent landscape
func (suite *LandscapeRepositoryTestSuite) TestGetByIDNotFound() {
	nonExistentID := uuid.New()

	landscape, err := suite.repo.GetByID(nonExistentID)

	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(landscape)
}

// TestUpdate tests updating a landscape
func (suite *LandscapeRepositoryTestSuite) TestUpdate() {
	// Create project first
	project := suite.createTestProject()

	// Create test landscape
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Update the landscape
	landscape.Title = "Updated Landscape Display Name"
	landscape.Description = "Updated landscape description"
	landscape.Environment = "staging"

	err = suite.repo.Update(landscape)

	// Assertions
	suite.NoError(err)

	// Retrieve updated landscape
	updatedLandscape, err := suite.repo.GetByID(landscape.ID)
	suite.NoError(err)
	suite.Equal("Updated Landscape Display Name", updatedLandscape.Title)
	suite.Equal("Updated landscape description", updatedLandscape.Description)
	suite.Equal("staging", updatedLandscape.Environment)
	suite.True(updatedLandscape.UpdatedAt.After(updatedLandscape.CreatedAt))
}

// TestDelete tests deleting a landscape
func (suite *LandscapeRepositoryTestSuite) TestDelete() {
	// Create project first
	project := suite.createTestProject()

	// Create test landscape
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Delete the landscape
	err = suite.repo.Delete(landscape.ID)
	suite.NoError(err)

	// Verify landscape is deleted
	_, err = suite.repo.GetByID(landscape.ID)
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
}

// TestDeleteNotFound tests deleting a non-existent landscape
func (suite *LandscapeRepositoryTestSuite) TestDeleteNotFound() {
	nonExistentID := uuid.New()

	err := suite.repo.Delete(nonExistentID)

	// Should not error when deleting non-existent record
	suite.NoError(err)
}

// TestGetByName tests retrieving a landscape by name
func (suite *LandscapeRepositoryTestSuite) TestGetByName() {
	// Create project first
	project := suite.createTestProject()

	// Create test landscape
	landscape := suite.factories.Landscape.WithName("unique-landscape-name")
	landscape.ProjectID = project.ID
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Retrieve the landscape by name
	retrievedLandscape, err := suite.repo.GetByName("unique-landscape-name")

	// Assertions
	suite.NoError(err)
	suite.NotNil(retrievedLandscape)
	suite.Equal(landscape.ID, retrievedLandscape.ID)
	suite.Equal("unique-landscape-name", retrievedLandscape.Name)
}

// TestGetByNameNotFound tests retrieving a non-existent landscape by name
func (suite *LandscapeRepositoryTestSuite) TestGetByNameNotFound() {
	landscape, err := suite.repo.GetByName("nonexistent-landscape")

	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(landscape)
}

// TestGetByStatus is disabled - Status field was removed in new schema
/*
func (suite *LandscapeRepositoryTestSuite) TestGetByStatus() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create landscapes with different statuses
	active1 := suite.factories.Landscape.WithName("active-landscape-1")
	active1.OrganizationID = org.ID
	active1.Status = models.LandscapeStatusActive
	err = suite.repo.Create(active1)
	suite.NoError(err)

	active2 := suite.factories.Landscape.WithName("active-landscape-2")
	active2.OrganizationID = org.ID
	active2.Status = models.LandscapeStatusActive
	err = suite.repo.Create(active2)
	suite.NoError(err)

	inactive1 := suite.factories.Landscape.WithName("inactive-landscape-1")
	inactive1.OrganizationID = org.ID
	inactive1.Status = models.LandscapeStatusInactive
	err = suite.repo.Create(inactive1)
	suite.NoError(err)

	// Get landscapes by active status
	activeLandscapes, total, err := suite.repo.GetByStatus(org.ID, models.LandscapeStatusActive, 10, 0)

	// Assertions
	suite.NoError(err)
	suite.Len(activeLandscapes, 2)
	suite.Equal(int64(2), total)

	// Verify all returned landscapes match (Status field removed in new schema)
}
*/

// TestGetActiveLandscapes is disabled - Status field was removed in new schema
/*
func (suite *LandscapeRepositoryTestSuite) TestGetActiveLandscapes() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create landscapes with different statuses
	active1 := suite.factories.Landscape.WithName("active-for-test-1")
	active1.OrganizationID = org.ID
	active1.Status = models.LandscapeStatusActive
	err = suite.repo.Create(active1)
	suite.NoError(err)

	active2 := suite.factories.Landscape.WithName("active-for-test-2")
	active2.OrganizationID = org.ID
	active2.Status = models.LandscapeStatusActive
	err = suite.repo.Create(active2)
	suite.NoError(err)

	inactive1 := suite.factories.Landscape.WithName("inactive-for-test-1")
	inactive1.OrganizationID = org.ID
	inactive1.Status = models.LandscapeStatusInactive
	err = suite.repo.Create(inactive1)
	suite.NoError(err)

	// Get active landscapes
	activeLandscapes, total, err := suite.repo.GetActiveLandscapes(org.ID, 10, 0)

	// Assertions
	suite.NoError(err)
	suite.Len(activeLandscapes, 2)
	suite.Equal(int64(2), total)

	// Verify all returned landscapes match (Status field removed in new schema)
}
*/

// TestCreate_WithMetadata tests creating a landscape with metadata
func (suite *LandscapeRepositoryTestSuite) TestCreate_WithMetadata() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	metadata := map[string]interface{}{
		"region":      "us-west-2",
		"provider":    "aws",
		"cost_center": "engineering",
	}
	metadataJSON, err := json.Marshal(metadata)
	suite.NoError(err)
	landscape.Metadata = metadataJSON

	// Act
	err = suite.repo.Create(landscape)

	// Assert
	suite.NoError(err)
	suite.NotNil(landscape.Metadata)

	// Verify metadata was saved correctly
	retrieved, err := suite.repo.GetByID(landscape.ID)
	suite.NoError(err)
	suite.JSONEq(string(metadataJSON), string(retrieved.Metadata))
}

// TestCreate_DomainTooLong tests field length validation for Domain field
func (suite *LandscapeRepositoryTestSuite) TestCreate_DomainTooLong() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.Domain = strings.Repeat("a", 201) // Exceeds 200 char limit

	// Act
	err := suite.repo.Create(landscape)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// TestCreate_EnvironmentTooLong tests field length validation for Environment field
func (suite *LandscapeRepositoryTestSuite) TestCreate_EnvironmentTooLong() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.Environment = strings.Repeat("a", 21) // Exceeds 20 char limit

	// Act
	err := suite.repo.Create(landscape)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// TestCreate_NameTooLong tests field length validation for Name field from BaseModel
func (suite *LandscapeRepositoryTestSuite) TestCreate_NameTooLong() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.Name = strings.Repeat("a", 41) // Exceeds 40 char limit

	// Act
	err := suite.repo.Create(landscape)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// TestCreate_TitleTooLong tests field length validation for Title field from BaseModel
func (suite *LandscapeRepositoryTestSuite) TestCreate_TitleTooLong() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.Title = strings.Repeat("a", 101) // Exceeds 100 char limit

	// Act
	err := suite.repo.Create(landscape)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// TestGetByID_ZeroUUID tests retrieving with zero-value UUID
func (suite *LandscapeRepositoryTestSuite) TestGetByID_ZeroUUID() {
	// Act
	retrieved, err := suite.repo.GetByID(uuid.Nil)

	// Assert
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(retrieved)
}

// TestGetByName_EmptyString tests retrieving with empty name
func (suite *LandscapeRepositoryTestSuite) TestGetByName_EmptyString() {
	// Act
	retrieved, err := suite.repo.GetByName("")

	// Assert
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(retrieved)
}

// TestGetByType tests filtering landscapes by environment type
func (suite *LandscapeRepositoryTestSuite) TestGetByType_Success() {
	// Arrange
	project := suite.createTestProject()

	// Create landscapes with different environments
	prodLandscape := suite.createTestLandscape(project)
	prodLandscape.Environment = "production"
	prodLandscape.Name = "prod-landscape"
	err := suite.repo.Create(prodLandscape)
	suite.NoError(err)

	devLandscape := suite.createTestLandscape(project)
	devLandscape.Environment = "development"
	devLandscape.Name = "dev-landscape"
	err = suite.repo.Create(devLandscape)
	suite.NoError(err)

	// Act
	prodLandscapes, total, err := suite.repo.GetByType(uuid.New(), "production", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(prodLandscapes, 1)
	suite.Equal(int64(1), total)
	suite.Equal("production", prodLandscapes[0].Environment)
}

// TestGetByType_NoMatches tests environment filtering with no matches
func (suite *LandscapeRepositoryTestSuite) TestGetByType_NoMatches() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.Environment = "production"
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	landscapes, total, err := suite.repo.GetByType(uuid.New(), "staging", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(landscapes)
	suite.Equal(int64(0), total)
}

// TestGetLandscapesByProjectID tests project-based queries
func (suite *LandscapeRepositoryTestSuite) TestGetLandscapesByProjectID_Success() {
	// Arrange
	project1 := suite.createTestProject()
	project2 := suite.createTestProject()

	// Create landscapes for project1
	landscape1 := suite.createTestLandscape(project1)
	landscape1.Name = "project1-landscape1"
	err := suite.repo.Create(landscape1)
	suite.NoError(err)

	landscape2 := suite.createTestLandscape(project1)
	landscape2.Name = "project1-landscape2"
	err = suite.repo.Create(landscape2)
	suite.NoError(err)

	// Create landscape for project2
	landscape3 := suite.createTestLandscape(project2)
	landscape3.Name = "project2-landscape1"
	err = suite.repo.Create(landscape3)
	suite.NoError(err)

	// Act
	landscapes, total, err := suite.repo.GetLandscapesByProjectID(project1.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(landscapes, 2)
	suite.Equal(int64(2), total)
	for _, landscape := range landscapes {
		suite.Equal(project1.ID, landscape.ProjectID)
	}
}

// TestGetLandscapesByProjectID_NotFound tests project queries with no results
func (suite *LandscapeRepositoryTestSuite) TestGetLandscapesByProjectID_NotFound() {
	// Act
	landscapes, total, err := suite.repo.GetLandscapesByProjectID(uuid.New(), 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(landscapes)
	suite.Equal(int64(0), total)
}

// TestSearch tests search functionality
func (suite *LandscapeRepositoryTestSuite) TestSearch_ByName() {
	// Arrange
	project := suite.createTestProject()

	landscape1 := suite.createTestLandscape(project)
	landscape1.Name = "search-test-landscape"
	landscape1.Title = "Different Title"
	landscape1.Description = "Different Description"
	err := suite.repo.Create(landscape1)
	suite.NoError(err)

	landscape2 := suite.createTestLandscape(project)
	landscape2.Name = "other-landscape"
	landscape2.Title = "Other Title"
	landscape2.Description = "Other Description"
	err = suite.repo.Create(landscape2)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(uuid.New(), "search-test", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("search-test-landscape", results[0].Name)
}

// TestSearch_ByTitle tests search by title field
func (suite *LandscapeRepositoryTestSuite) TestSearch_ByTitle() {
	// Arrange
	project := suite.createTestProject()

	landscape := suite.createTestLandscape(project)
	landscape.Name = "test-landscape"
	landscape.Title = "Searchable Title Text"
	landscape.Description = "Different Description"
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(uuid.New(), "Searchable Title", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("Searchable Title Text", results[0].Title)
}

// TestSearch_CaseInsensitive tests case-insensitive search
func (suite *LandscapeRepositoryTestSuite) TestSearch_CaseInsensitive() {
	// Arrange
	project := suite.createTestProject()

	landscape := suite.createTestLandscape(project)
	landscape.Name = "UPPERCASE-landscape"
	landscape.Title = "MixedCase Title"
	landscape.Description = "lowercase description"
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act - Search with different cases
	results1, _, err := suite.repo.Search(uuid.New(), "uppercase", 10, 0)
	suite.NoError(err)
	suite.Len(results1, 1)

	results2, _, err := suite.repo.Search(uuid.New(), "mixedcase", 10, 0)
	suite.NoError(err)
	suite.Len(results2, 1)

	results3, _, err := suite.repo.Search(uuid.New(), "LOWERCASE", 10, 0)
	suite.NoError(err)
	suite.Len(results3, 1)
}

// TestSearch_NoMatches tests search with no results
func (suite *LandscapeRepositoryTestSuite) TestSearch_NoMatches() {
	// Arrange
	project := suite.createTestProject()

	landscape := suite.createTestLandscape(project)
	landscape.Name = "test-landscape"
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(uuid.New(), "nonexistent-search-term", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

// TestCheckLandscapeExists tests existence validation
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeExists_True() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	exists, err := suite.repo.CheckLandscapeExists(landscape.ID)

	// Assert
	suite.NoError(err)
	suite.True(exists)
}

// TestCheckLandscapeExists_False tests existence check for non-existent landscape
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeExists_False() {
	// Act
	exists, err := suite.repo.CheckLandscapeExists(uuid.New())

	// Assert
	suite.NoError(err)
	suite.False(exists)
}

// TestCheckLandscapeNameExists tests name uniqueness validation
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeNameExists_True() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.factories.Landscape.WithName("unique-name-test")
	landscape.ProjectID = project.ID
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	exists, err := suite.repo.CheckLandscapeNameExists(uuid.New(), "unique-name-test", nil)

	// Assert
	suite.NoError(err)
	suite.True(exists)
}

// TestCheckLandscapeNameExists_False tests name check for non-existent name
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeNameExists_False() {
	// Act
	exists, err := suite.repo.CheckLandscapeNameExists(uuid.New(), "non-existent-name", nil)

	// Assert
	suite.NoError(err)
	suite.False(exists)
}

// TestCheckLandscapeNameExists_WithExclusion tests name validation with exclusion
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeNameExists_WithExclusion() {
	// Arrange
	project := suite.createTestProject()

	landscape1 := suite.factories.Landscape.WithName("duplicate-name")
	landscape1.ProjectID = project.ID
	err := suite.repo.Create(landscape1)
	suite.NoError(err)

	landscape2 := suite.factories.Landscape.WithName("other-name")
	landscape2.ProjectID = project.ID
	err = suite.repo.Create(landscape2)
	suite.NoError(err)

	// Act - Check if name exists excluding landscape1's ID
	exists, err := suite.repo.CheckLandscapeNameExists(uuid.New(), "duplicate-name", &landscape1.ID)

	// Assert
	suite.NoError(err)
	suite.False(exists) // Should be false because we exclude the matching record
}

// TestGetProjectCount tests project count utility
func (suite *LandscapeRepositoryTestSuite) TestGetProjectCount_WithProject() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	count, err := suite.repo.GetProjectCount(landscape.ID)

	// Assert
	suite.NoError(err)
	suite.Equal(int64(1), count)
}

// TestGetProjectCount_NonExistentLandscape tests project count for invalid landscape
func (suite *LandscapeRepositoryTestSuite) TestGetProjectCount_NonExistentLandscape() {
	// Act
	count, err := suite.repo.GetProjectCount(uuid.New())

	// Assert
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Equal(int64(0), count)
}

// TestUpdate_WithMetadata tests updating landscape metadata
func (suite *LandscapeRepositoryTestSuite) TestUpdate_WithMetadata() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act - Update metadata
	newMetadata := map[string]interface{}{
		"updated": true,
		"version": "2.0",
	}
	metadataJSON, err := json.Marshal(newMetadata)
	suite.NoError(err)
	landscape.Metadata = metadataJSON

	err = suite.repo.Update(landscape)

	// Assert
	suite.NoError(err)

	updated, err := suite.repo.GetByID(landscape.ID)
	suite.NoError(err)
	suite.JSONEq(string(metadataJSON), string(updated.Metadata))
}

// TestUpdate_DomainTooLong tests updating with constraint violations
func (suite *LandscapeRepositoryTestSuite) TestUpdate_DomainTooLong() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act - Set invalid data
	landscape.Domain = strings.Repeat("a", 201) // Too long

	err = suite.repo.Update(landscape)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// TestUpdate_CreatesNewRecordForNonExistentID tests GORM Save() behavior with non-existent ID
func (suite *LandscapeRepositoryTestSuite) TestUpdate_CreatesNewRecordForNonExistentID() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	landscape.ID = uuid.New() // Set a non-existent ID

	// Act
	err := suite.repo.Update(landscape)

	// Assert
	// GORM Update with Save() doesn't fail for non-existent records,
	// it creates a new one instead, so this test verifies that behavior
	suite.NoError(err)
}

// TestGetByStatus_ReturnsAllLandscapes tests legacy status method
func (suite *LandscapeRepositoryTestSuite) TestGetByStatus_ReturnsAllLandscapes() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act - Status parameter is ignored in new model
	landscapes, total, err := suite.repo.GetByStatus("any-status", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(landscapes, 1)
	suite.Equal(int64(1), total)
}

// TestGetActiveLandscapes_ReturnsAllLandscapes tests legacy active landscapes method
func (suite *LandscapeRepositoryTestSuite) TestGetActiveLandscapes_ReturnsAllLandscapes() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	landscapes, total, err := suite.repo.GetActiveLandscapes(10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(landscapes, 1)
	suite.Equal(int64(1), total)
}

// TestSetStatus_NoOp tests legacy set status method
func (suite *LandscapeRepositoryTestSuite) TestSetStatus_NoOp() {
	// Act
	err := suite.repo.SetStatus(uuid.New(), "any-status")

	// Assert - Should be no-op (return nil)
	suite.NoError(err)
}

// TestDelegationMethods test methods that delegate to GetByID
func (suite *LandscapeRepositoryTestSuite) TestGetWithOrganization_DelegatesToGetByID() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	retrieved, err := suite.repo.GetWithOrganization(landscape.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrieved)
	suite.Equal(landscape.ID, retrieved.ID)
}

// TestGetWithOrganization_NotFound tests GetWithOrganization with non-existent ID
func (suite *LandscapeRepositoryTestSuite) TestGetWithOrganization_NotFound() {
	// Act
	retrieved, err := suite.repo.GetWithOrganization(uuid.New())

	// Assert
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(retrieved)
}

// TestGetWithFullDetails_DelegatesToGetByID tests GetWithFullDetails method
func (suite *LandscapeRepositoryTestSuite) TestGetWithFullDetails_DelegatesToGetByID() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	retrieved, err := suite.repo.GetWithFullDetails(landscape.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrieved)
	suite.Equal(landscape.ID, retrieved.ID)
}

// TestGetWithFullDetails_NotFound tests GetWithFullDetails with non-existent ID
func (suite *LandscapeRepositoryTestSuite) TestGetWithFullDetails_NotFound() {
	// Act
	retrieved, err := suite.repo.GetWithFullDetails(uuid.New())

	// Assert
	suite.Error(err)
	suite.Equal(errors.ErrLandscapeNotFound, err)
	suite.Nil(retrieved)
}

// TestSearch_EmptyQuery tests search with empty query
func (suite *LandscapeRepositoryTestSuite) TestSearch_EmptyQuery() {
	// Arrange
	project := suite.createTestProject()
	landscape := suite.createTestLandscape(project)
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(uuid.New(), "", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1) // Should return all landscapes when query is empty
	suite.Equal(int64(1), total)
}

// TestSearch_ByDescription tests search by description field
func (suite *LandscapeRepositoryTestSuite) TestSearch_ByDescription() {
	// Arrange
	project := suite.createTestProject()

	landscape := suite.createTestLandscape(project)
	landscape.Name = "test-landscape"
	landscape.Title = "Different Title"
	landscape.Description = "Searchable Description Content"
	err := suite.repo.Create(landscape)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(uuid.New(), "Searchable Description", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("Searchable Description Content", results[0].Description)
}

// TestCheckLandscapeExists_WithZeroUUID tests existence check with zero-value UUID
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeExists_WithZeroUUID() {
	// Act
	exists, err := suite.repo.CheckLandscapeExists(uuid.Nil)

	// Assert
	suite.NoError(err)
	suite.False(exists)
}

// TestCheckLandscapeNameExists_WithZeroUUID tests name check with zero-value UUID
func (suite *LandscapeRepositoryTestSuite) TestCheckLandscapeNameExists_WithZeroUUID() {
	// Act
	exists, err := suite.repo.CheckLandscapeNameExists(uuid.Nil, "some-name", nil)

	// Assert
	suite.NoError(err)
	suite.False(exists)
}

// Run the test suite
func TestLandscapeRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(LandscapeRepositoryTestSuite))
}
