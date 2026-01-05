package repository

import (
	"strings"
	"testing"

	"developer-portal-backend/internal/database/models"
	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

// Constants for field length limits
const (
	MaxOwnerLength       = 100
	MaxRepoLength        = 100
	MaxTitleLength       = 100
	MaxDescriptionLength = 200
	MaxDocsPathLength    = 500
	MaxCreatedByLength   = 40
	MaxUpdatedByLength   = 40
)

// DocumentationRepositoryTestSuite tests the DocumentationRepository
type DocumentationRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *DocumentationRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *DocumentationRepositoryTestSuite) SetupSuite() {
	// Initialize shared BaseTestSuite using the new API
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())

	// Init repository and factories
	suite.repo = NewDocumentationRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *DocumentationRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *DocumentationRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *DocumentationRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// createStringOfLength creates a string of specified length filled with the given character
func (suite *DocumentationRepositoryTestSuite) createStringOfLength(length int, char rune) string {
	return strings.Repeat(string(char), length)
}

// createDocumentationFactory creates a Documentation factory since it doesn't exist in testutils
// Note: Uses uuid.Nil for ID to test auto-generation, and requires valid TeamID to be set
func (suite *DocumentationRepositoryTestSuite) createDocumentationFactory() *models.Documentation {
	return &models.Documentation{
		ID:          uuid.Nil, // Let the database auto-generate
		TeamID:      uuid.Nil, // Must be set to valid team ID before use
		Owner:       "test-owner",
		Repo:        "test-repo",
		Branch:      "main",
		DocsPath:    "docs/test",
		Title:       "Test Documentation",
		Description: "A test documentation for testing purposes",
		CreatedBy:   "test-user",
		UpdatedBy:   "test-user",
	}
}

// createDocumentationWithTeam creates a documentation with a valid team
func (suite *DocumentationRepositoryTestSuite) createDocumentationWithTeam() (*models.Documentation, *models.Team) {
	// Create organization first with unique name
	orgName := "test-org-" + uuid.New().String()[:8]
	org := suite.factories.Organization.WithName(orgName)
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group
	group := suite.factories.Group.WithOrganization(org.ID)
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group)
	suite.NoError(err)

	// Create team
	team := suite.factories.Team.WithGroup(group.ID)
	teamRepo := NewTeamRepository(suite.baseTestSuite.DB)
	err = teamRepo.Create(team)
	suite.NoError(err)

	// Create documentation
	doc := suite.createDocumentationFactory()
	doc.TeamID = team.ID

	return doc, team
}

// TestCreate tests creating a new documentation
func (suite *DocumentationRepositoryTestSuite) TestCreate() {
	doc, _ := suite.createDocumentationWithTeam()

	// Create the documentation
	err := suite.repo.Create(doc)

	// Assertions
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, doc.ID)
	suite.NotZero(doc.CreatedAt)
	suite.NotZero(doc.UpdatedAt)
}

// TestCreate_WithoutTeam tests creating documentation without a valid team (should fail)
func (suite *DocumentationRepositoryTestSuite) TestCreate_WithoutTeam() {
	doc := suite.createDocumentationFactory()
	doc.TeamID = uuid.New() // Non-existent team ID

	err := suite.repo.Create(doc)

	// Should fail due to foreign key constraint
	suite.Error(err)
	suite.Contains(err.Error(), "violates foreign key constraint")
}

// TestCreate_WithEmptyRequiredFields tests creating documentation with empty required fields
func (suite *DocumentationRepositoryTestSuite) TestCreate_WithEmptyRequiredFields() {
	doc, _ := suite.createDocumentationWithTeam()

	// Test empty owner - database allows empty strings, so this should succeed
	doc.Owner = ""
	err := suite.repo.Create(doc)
	suite.NoError(err) // Database doesn't enforce NOT NULL on owner

	// Reset and test empty repo - database allows empty strings
	doc, _ = suite.createDocumentationWithTeam()
	doc.Repo = ""
	err = suite.repo.Create(doc)
	suite.NoError(err) // Database doesn't enforce NOT NULL on repo

	// Reset and test empty title - database allows empty strings
	doc, _ = suite.createDocumentationWithTeam()
	doc.Title = ""
	err = suite.repo.Create(doc)
	suite.NoError(err) // Database doesn't enforce NOT NULL on title

	// Reset and test empty docs path - database allows empty strings
	doc, _ = suite.createDocumentationWithTeam()
	doc.DocsPath = ""
	err = suite.repo.Create(doc)
	suite.NoError(err) // Database doesn't enforce NOT NULL on docs_path
}

// TestCreate_WithLongFields tests creating documentation with fields exceeding max length
func (suite *DocumentationRepositoryTestSuite) TestCreate_WithLongFields() {
	doc, _ := suite.createDocumentationWithTeam()

	// Test owner too long (max 100)
	doc.Owner = suite.createStringOfLength(MaxOwnerLength+1, 'a')
	err := suite.repo.Create(doc)
	suite.Error(err)

	// Reset and test repo too long (max 100)
	doc, _ = suite.createDocumentationWithTeam()
	doc.Repo = suite.createStringOfLength(MaxRepoLength+1, 'b')
	err = suite.repo.Create(doc)
	suite.Error(err)

	// Reset and test title too long (max 100)
	doc, _ = suite.createDocumentationWithTeam()
	doc.Title = suite.createStringOfLength(MaxTitleLength+1, 'c')
	err = suite.repo.Create(doc)
	suite.Error(err)

	// Reset and test description too long (max 200)
	doc, _ = suite.createDocumentationWithTeam()
	doc.Description = suite.createStringOfLength(MaxDescriptionLength+1, 'd')
	err = suite.repo.Create(doc)
	suite.Error(err)

	// Reset and test docs path too long (max 500)
	doc, _ = suite.createDocumentationWithTeam()
	doc.DocsPath = suite.createStringOfLength(MaxDocsPathLength+1, 'e')
	err = suite.repo.Create(doc)
	suite.Error(err)
}

// TestGetByID tests retrieving a documentation by ID
func (suite *DocumentationRepositoryTestSuite) TestGetByID() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Retrieve the documentation
	retrievedDoc, err := suite.repo.GetByID(doc.ID)

	// Assertions
	suite.NoError(err)
	suite.NotNil(retrievedDoc)
	suite.Equal(doc.ID, retrievedDoc.ID)
	suite.Equal(doc.TeamID, retrievedDoc.TeamID)
	suite.Equal(doc.Owner, retrievedDoc.Owner)
	suite.Equal(doc.Repo, retrievedDoc.Repo)
	suite.Equal(doc.Branch, retrievedDoc.Branch)
	suite.Equal(doc.DocsPath, retrievedDoc.DocsPath)
	suite.Equal(doc.Title, retrievedDoc.Title)
	suite.Equal(doc.Description, retrievedDoc.Description)
}

// TestGetByID_NotFound tests retrieving a non-existent documentation
func (suite *DocumentationRepositoryTestSuite) TestGetByID_NotFound() {
	nonExistentID := uuid.New()

	doc, err := suite.repo.GetByID(nonExistentID)

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(doc)
}

// TestGetByID_SoftDeleted tests retrieving a soft-deleted documentation
func (suite *DocumentationRepositoryTestSuite) TestGetByID_SoftDeleted() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Soft delete the documentation
	err = suite.repo.Delete(doc.ID)
	suite.NoError(err)

	// Try to retrieve the soft-deleted documentation
	retrievedDoc, err := suite.repo.GetByID(doc.ID)

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(retrievedDoc)
}

// TestGetByTeamID tests retrieving all documentations for a specific team
func (suite *DocumentationRepositoryTestSuite) TestGetByTeamID() {
	doc1, team := suite.createDocumentationWithTeam()
	doc1.Title = "A Documentation" // For ordering test
	err := suite.repo.Create(doc1)
	suite.NoError(err)

	doc2 := suite.createDocumentationFactory()
	doc2.TeamID = team.ID
	doc2.Title = "B Documentation" // For ordering test
	err = suite.repo.Create(doc2)
	suite.NoError(err)

	doc3 := suite.createDocumentationFactory()
	doc3.TeamID = team.ID
	doc3.Title = "C Documentation" // For ordering test
	err = suite.repo.Create(doc3)
	suite.NoError(err)

	// Create documentation for different team
	otherDoc, _ := suite.createDocumentationWithTeam()
	err = suite.repo.Create(otherDoc)
	suite.NoError(err)

	// Retrieve documentations by team ID
	docs, err := suite.repo.GetByTeamID(team.ID)

	// Assertions
	suite.NoError(err)
	suite.Len(docs, 3)

	// Verify ordering by title ASC
	suite.Equal("A Documentation", docs[0].Title)
	suite.Equal("B Documentation", docs[1].Title)
	suite.Equal("C Documentation", docs[2].Title)

	// Verify all docs belong to the correct team
	for _, doc := range docs {
		suite.Equal(team.ID, doc.TeamID)
	}
}

// TestGetByTeamID_EmptyResult tests retrieving documentations for a team with no docs
func (suite *DocumentationRepositoryTestSuite) TestGetByTeamID_EmptyResult() {
	// Create team without any documentations
	_, team := suite.createDocumentationWithTeam()

	docs, err := suite.repo.GetByTeamID(team.ID)

	suite.NoError(err)
	suite.Empty(docs)
	suite.Len(docs, 0)
}

// TestGetByTeamID_NonExistentTeam tests retrieving documentations for non-existent team
func (suite *DocumentationRepositoryTestSuite) TestGetByTeamID_NonExistentTeam() {
	nonExistentTeamID := uuid.New()

	docs, err := suite.repo.GetByTeamID(nonExistentTeamID)

	suite.NoError(err)
	suite.Empty(docs)
	suite.Len(docs, 0)
}

// TestGetByTeamID_ExcludesSoftDeleted tests that soft-deleted docs are excluded
func (suite *DocumentationRepositoryTestSuite) TestGetByTeamID_ExcludesSoftDeleted() {
	doc1, team := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc1)
	suite.NoError(err)

	doc2 := suite.createDocumentationFactory()
	doc2.TeamID = team.ID
	err = suite.repo.Create(doc2)
	suite.NoError(err)

	// Soft delete one documentation
	err = suite.repo.Delete(doc1.ID)
	suite.NoError(err)

	// Retrieve documentations by team ID
	docs, err := suite.repo.GetByTeamID(team.ID)

	// Should only return the non-deleted documentation
	suite.NoError(err)
	suite.Len(docs, 1)
	suite.Equal(doc2.ID, docs[0].ID)
}

// TestUpdate tests updating an existing documentation
func (suite *DocumentationRepositoryTestSuite) TestUpdate() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Update the documentation
	doc.Owner = "updated-owner"
	doc.Repo = "updated-repo"
	doc.Branch = "develop"
	doc.DocsPath = "docs/updated"
	doc.Title = "Updated Documentation"
	doc.Description = "Updated description"
	doc.UpdatedBy = "updated-user"

	err = suite.repo.Update(doc)

	// Assertions
	suite.NoError(err)

	// Retrieve updated documentation
	updatedDoc, err := suite.repo.GetByID(doc.ID)
	suite.NoError(err)
	suite.Equal("updated-owner", updatedDoc.Owner)
	suite.Equal("updated-repo", updatedDoc.Repo)
	suite.Equal("develop", updatedDoc.Branch)
	suite.Equal("docs/updated", updatedDoc.DocsPath)
	suite.Equal("Updated Documentation", updatedDoc.Title)
	suite.Equal("Updated description", updatedDoc.Description)
	suite.Equal("updated-user", updatedDoc.UpdatedBy)
	suite.True(updatedDoc.UpdatedAt.After(updatedDoc.CreatedAt))
}

// TestUpdate_NonExistent tests updating a non-existent documentation
func (suite *DocumentationRepositoryTestSuite) TestUpdate_NonExistent() {
	doc, _ := suite.createDocumentationWithTeam()
	doc.ID = uuid.New() // Non-existent ID but with valid team

	err := suite.repo.Update(doc)

	// GORM Save doesn't error for non-existent records, it creates them
	// So this test verifies the behavior
	suite.NoError(err)
}

// TestUpdate_WithInvalidData tests updating with invalid data
func (suite *DocumentationRepositoryTestSuite) TestUpdate_WithInvalidData() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Update with field that exceeds max length
	doc.Title = suite.createStringOfLength(MaxTitleLength+1, 'a')
	err = suite.repo.Update(doc)
	suite.Error(err) // Should fail due to length constraint
}

// TestDelete tests deleting a documentation (soft delete)
func (suite *DocumentationRepositoryTestSuite) TestDelete() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Delete the documentation
	err = suite.repo.Delete(doc.ID)
	suite.NoError(err)

	// Verify documentation is soft deleted
	_, err = suite.repo.GetByID(doc.ID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)

	// Verify it still exists in database but with deleted_at set
	var count int64
	suite.baseTestSuite.DB.Unscoped().Model(&models.Documentation{}).Where("id = ?", doc.ID).Count(&count)
	suite.Equal(int64(1), count)
}

// TestDelete_NonExistent tests deleting a non-existent documentation
func (suite *DocumentationRepositoryTestSuite) TestDelete_NonExistent() {
	nonExistentID := uuid.New()

	err := suite.repo.Delete(nonExistentID)

	// Should not error when deleting non-existent record
	suite.NoError(err)
}

// TestDelete_AlreadyDeleted tests deleting an already soft-deleted documentation
func (suite *DocumentationRepositoryTestSuite) TestDelete_AlreadyDeleted() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Delete once
	err = suite.repo.Delete(doc.ID)
	suite.NoError(err)

	// Delete again
	err = suite.repo.Delete(doc.ID)
	suite.NoError(err) // Should not error
}

// TestGetAll tests retrieving all documentations with pagination
func (suite *DocumentationRepositoryTestSuite) TestGetAll() {
	// Create multiple documentations
	docs := make([]*models.Documentation, 5)
	for i := 0; i < 5; i++ {
		doc, _ := suite.createDocumentationWithTeam()
		doc.Title = string(rune('A'+i)) + " Documentation" // A, B, C, D, E for ordering
		err := suite.repo.Create(doc)
		suite.NoError(err)
		docs[i] = doc
	}

	// Get all without pagination
	allDocs, total, err := suite.repo.GetAll(0, 0)

	// Assertions
	suite.NoError(err)
	suite.Len(allDocs, 5)
	suite.Equal(int64(5), total)

	// Verify ordering by title ASC
	suite.Equal("A Documentation", allDocs[0].Title)
	suite.Equal("B Documentation", allDocs[1].Title)
	suite.Equal("C Documentation", allDocs[2].Title)
	suite.Equal("D Documentation", allDocs[3].Title)
	suite.Equal("E Documentation", allDocs[4].Title)
}

// TestGetAll_WithPagination tests retrieving documentations with pagination
func (suite *DocumentationRepositoryTestSuite) TestGetAll_WithPagination() {
	// Create multiple documentations
	for i := 0; i < 5; i++ {
		doc, _ := suite.createDocumentationWithTeam()
		doc.Title = string(rune('A'+i)) + " Documentation"
		err := suite.repo.Create(doc)
		suite.NoError(err)
	}

	// Test first page
	docs, total, err := suite.repo.GetAll(2, 0)
	suite.NoError(err)
	suite.Len(docs, 2)
	suite.Equal(int64(5), total)
	suite.Equal("A Documentation", docs[0].Title)
	suite.Equal("B Documentation", docs[1].Title)

	// Test second page
	docs, total, err = suite.repo.GetAll(2, 2)
	suite.NoError(err)
	suite.Len(docs, 2)
	suite.Equal(int64(5), total)
	suite.Equal("C Documentation", docs[0].Title)
	suite.Equal("D Documentation", docs[1].Title)

	// Test third page
	docs, total, err = suite.repo.GetAll(2, 4)
	suite.NoError(err)
	suite.Len(docs, 1) // Only one left
	suite.Equal(int64(5), total)
	suite.Equal("E Documentation", docs[0].Title)
}

// TestGetAll_EmptyResult tests retrieving all documentations when none exist
func (suite *DocumentationRepositoryTestSuite) TestGetAll_EmptyResult() {
	docs, total, err := suite.repo.GetAll(10, 0)

	suite.NoError(err)
	suite.Empty(docs)
	suite.Equal(int64(0), total)
}

// TestGetAll_ExcludesSoftDeleted tests that soft-deleted docs are excluded
func (suite *DocumentationRepositoryTestSuite) TestGetAll_ExcludesSoftDeleted() {
	// Create documentations
	doc1, _ := suite.createDocumentationWithTeam()
	doc1.Title = "A Documentation"
	err := suite.repo.Create(doc1)
	suite.NoError(err)

	doc2, _ := suite.createDocumentationWithTeam()
	doc2.Title = "B Documentation"
	err = suite.repo.Create(doc2)
	suite.NoError(err)

	// Soft delete one
	err = suite.repo.Delete(doc1.ID)
	suite.NoError(err)

	// Get all
	docs, total, err := suite.repo.GetAll(0, 0)

	// Should only return non-deleted documentation
	suite.NoError(err)
	suite.Len(docs, 1)
	suite.Equal(int64(1), total)
	suite.Equal(doc2.ID, docs[0].ID)
}

// TestConcurrentOperations tests concurrent access to documentation repository
func (suite *DocumentationRepositoryTestSuite) TestConcurrentOperations() {
	doc, _ := suite.createDocumentationWithTeam()
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Test concurrent reads
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func() {
			_, err := suite.repo.GetByID(doc.ID)
			suite.NoError(err)
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}

// TestDocumentationModel_GetFullURL tests the GetFullURL method
func (suite *DocumentationRepositoryTestSuite) TestDocumentationModel_GetFullURL() {
	doc := &models.Documentation{
		Owner:    "test-org",
		Repo:     "test-repo",
		Branch:   "main",
		DocsPath: "docs/api",
	}

	baseURL := "https://github.tools.sap"
	expectedURL := "https://github.tools.sap/test-org/test-repo/tree/main/docs/api"

	actualURL := doc.GetFullURL(baseURL)
	suite.Equal(expectedURL, actualURL)
}

// TestDocumentationModel_BeforeCreate tests the BeforeCreate hook
func (suite *DocumentationRepositoryTestSuite) TestDocumentationModel_BeforeCreate() {
	doc, _ := suite.createDocumentationWithTeam()
	doc.ID = uuid.Nil // Reset ID to test auto-generation

	err := suite.repo.Create(doc)

	suite.NoError(err)
	suite.NotEqual(uuid.Nil, doc.ID)
}

// TestEdgeCases tests various edge cases
func (suite *DocumentationRepositoryTestSuite) TestEdgeCases() {
	// Test with minimal valid data
	doc, _ := suite.createDocumentationWithTeam()
	doc.Description = "" // Optional field
	doc.Branch = "main"  // Default value
	err := suite.repo.Create(doc)
	suite.NoError(err)

	// Test with maximum length fields
	doc2, _ := suite.createDocumentationWithTeam()
	doc2.Owner = suite.createStringOfLength(MaxOwnerLength, 'a')
	doc2.Repo = suite.createStringOfLength(MaxRepoLength, 'b')
	doc2.Title = suite.createStringOfLength(MaxTitleLength, 'c')
	doc2.Description = suite.createStringOfLength(MaxDescriptionLength, 'd')
	doc2.DocsPath = suite.createStringOfLength(MaxDocsPathLength, 'e')

	err = suite.repo.Create(doc2)
	suite.NoError(err)
}

// TestDatabaseConstraints tests database-level constraints
func (suite *DocumentationRepositoryTestSuite) TestDatabaseConstraints() {
	// Test foreign key constraint on team_id with nil UUID
	doc := suite.createDocumentationFactory()
	doc.TeamID = uuid.Nil

	err := suite.repo.Create(doc)
	suite.Error(err)
	suite.Contains(err.Error(), "violates foreign key constraint")
}

// Run the test suite
func TestDocumentationRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(DocumentationRepositoryTestSuite))
}
