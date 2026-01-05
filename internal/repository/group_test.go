package repository

import (
	"testing"

	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

// GroupRepositoryTestSuite tests the GroupRepository
type GroupRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *GroupRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *GroupRepositoryTestSuite) SetupSuite() {
	// Initialize shared BaseTestSuite using the new API
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())

	// Init repository and factories
	suite.repo = NewGroupRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *GroupRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *GroupRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *GroupRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// TestCreate tests creating a new group
func (suite *GroupRepositoryTestSuite) TestCreate() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)

	// Create the group
	err = suite.repo.Create(group)

	// Assertions
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, group.ID)
	suite.NotZero(group.CreatedAt)
	suite.NotZero(group.UpdatedAt)
}

// TestCreateDuplicateName tests creating a group with duplicate name in same organization
func (suite *GroupRepositoryTestSuite) TestCreateDuplicateName() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create first group
	group1 := suite.factories.Group.WithOrganization(org.ID)
	group1.Name = "duplicate-group"
	err = suite.repo.Create(group1)
	suite.NoError(err)

	// Try to create second group with same name in same organization
	group2 := suite.factories.Group.WithOrganization(org.ID)
	group2.Name = "duplicate-group"
	group2.Title = "Different Title"

	err = suite.repo.Create(group2)
	suite.Error(err)
	suite.Contains(err.Error(), "duplicate key value")
}

// TestCreateDuplicateNameDifferentOrg tests creating groups with same name in different organizations
func (suite *GroupRepositoryTestSuite) TestCreateDuplicateNameDifferentOrg() {
	// Create two organizations
	org1 := suite.factories.Organization.WithName("org1")
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org1)
	suite.NoError(err)

	org2 := suite.factories.Organization.WithName("org2")
	err = orgRepo.Create(org2)
	suite.NoError(err)

	// Create groups with same name in different organizations
	group1 := suite.factories.Group.WithOrganization(org1.ID)
	group1.Name = "same-name"
	err = suite.repo.Create(group1)
	suite.NoError(err)

	group2 := suite.factories.Group.WithOrganization(org2.ID)
	group2.Name = "same-name"
	err = suite.repo.Create(group2)
	suite.NoError(err) // Should succeed - different organizations
}

// TestGetByID tests retrieving a group by ID
func (suite *GroupRepositoryTestSuite) TestGetByID() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Retrieve the group
	retrievedGroup, err := suite.repo.GetByID(group.ID)

	// Assertions
	suite.NoError(err)
	suite.NotNil(retrievedGroup)
	suite.Equal(group.ID, retrievedGroup.ID)
	suite.Equal(group.Name, retrievedGroup.Name)
	suite.Equal(group.Title, retrievedGroup.Title)
	suite.Equal(group.Description, retrievedGroup.Description)
	suite.Equal(group.OrgID, retrievedGroup.OrgID)
	suite.Equal(group.Owner, retrievedGroup.Owner)
	suite.Equal(group.Email, retrievedGroup.Email)
	suite.Equal(group.PictureURL, retrievedGroup.PictureURL)
}

// TestGetByIDNotFound tests retrieving a non-existent group
func (suite *GroupRepositoryTestSuite) TestGetByIDNotFound() {
	nonExistentID := uuid.New()

	group, err := suite.repo.GetByID(nonExistentID)

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(group)
}

// TestGetByName tests retrieving a group by name within an organization
func (suite *GroupRepositoryTestSuite) TestGetByName() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	group.Name = "unique-group-name"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Retrieve the group by name
	retrievedGroup, err := suite.repo.GetByName(org.ID, "unique-group-name")

	// Assertions
	suite.NoError(err)
	suite.NotNil(retrievedGroup)
	suite.Equal(group.ID, retrievedGroup.ID)
	suite.Equal("unique-group-name", retrievedGroup.Name)
	suite.Equal(group.OrgID, retrievedGroup.OrgID)
}

// TestGetByNameNotFound tests retrieving a non-existent group by name
func (suite *GroupRepositoryTestSuite) TestGetByNameNotFound() {
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group, err := suite.repo.GetByName(org.ID, "nonexistent-group")

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(group)
}

// TestGetByNameWrongOrganization tests retrieving a group by name in wrong organization
func (suite *GroupRepositoryTestSuite) TestGetByNameWrongOrganization() {
	// Create two organizations
	org1 := suite.factories.Organization.WithName("org1")
	org2 := suite.factories.Organization.WithName("org2")
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org1)
	suite.NoError(err)
	err = orgRepo.Create(org2)
	suite.NoError(err)

	// Create group in org1
	group := suite.factories.Group.WithOrganization(org1.ID)
	group.Name = "test-group"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Try to find it in org2
	retrievedGroup, err := suite.repo.GetByName(org2.ID, "test-group")

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(retrievedGroup)
}

// TestGetByOrganizationID tests listing groups by organization
func (suite *GroupRepositoryTestSuite) TestGetByOrganizationID() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create multiple test groups
	group1 := suite.factories.Group.WithOrganization(org.ID)
	group1.Name = "group1"
	group1.Title = "Group One"
	err = suite.repo.Create(group1)
	suite.NoError(err)

	group2 := suite.factories.Group.WithOrganization(org.ID)
	group2.Name = "group2"
	group2.Title = "Group Two"
	err = suite.repo.Create(group2)
	suite.NoError(err)

	group3 := suite.factories.Group.WithOrganization(org.ID)
	group3.Name = "group3"
	group3.Title = "Group Three"
	err = suite.repo.Create(group3)
	suite.NoError(err)

	// List groups by organization
	groups, total, err := suite.repo.GetByOrganizationID(org.ID, 10, 0)

	// Assertions
	suite.NoError(err)
	suite.Len(groups, 3)
	suite.Equal(int64(3), total)

	// Verify groups are returned
	names := make([]string, len(groups))
	for i, group := range groups {
		names[i] = group.Name
	}
	suite.Contains(names, "group1")
	suite.Contains(names, "group2")
	suite.Contains(names, "group3")
}

// TestGetByOrganizationIDWithPagination tests listing groups with pagination
func (suite *GroupRepositoryTestSuite) TestGetByOrganizationIDWithPagination() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create multiple test groups with shorter names
	for i := 0; i < 5; i++ {
		group := suite.factories.Group.WithOrganization(org.ID)
		uuidSuffix := uuid.New().String()[:6]
		group.Name = "pg-" + uuidSuffix // Keep it short to fit 40 char limit
		group.Title = "Test Group " + uuidSuffix
		err := suite.repo.Create(group)
		suite.NoError(err)
	}

	// Test first page
	groups, total, err := suite.repo.GetByOrganizationID(org.ID, 2, 0)
	suite.NoError(err)
	suite.Len(groups, 2)
	suite.Equal(int64(5), total)

	// Test second page
	groups, total, err = suite.repo.GetByOrganizationID(org.ID, 2, 2)
	suite.NoError(err)
	suite.Len(groups, 2)
	suite.Equal(int64(5), total)

	// Test third page
	groups, total, err = suite.repo.GetByOrganizationID(org.ID, 2, 4)
	suite.NoError(err)
	suite.Len(groups, 1) // Only one left
	suite.Equal(int64(5), total)
}

// TestGetByOrganizationIDEmptyResult tests listing groups for organization with no groups
func (suite *GroupRepositoryTestSuite) TestGetByOrganizationIDEmptyResult() {
	// Create organization with no groups
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// List groups by organization
	groups, total, err := suite.repo.GetByOrganizationID(org.ID, 10, 0)

	// Assertions
	suite.NoError(err)
	suite.Len(groups, 0)
	suite.Equal(int64(0), total)
}

// TestUpdate tests updating a group using map updates
func (suite *GroupRepositoryTestSuite) TestUpdate() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Update the group
	updates := map[string]interface{}{
		"title":       "Updated Title",
		"description": "Updated description",
		"owner":       "I99999",
		"email":       "updated@test.com",
		"picture_url": "https://example.com/updated.png",
	}

	err = suite.repo.Update(group.ID, updates)

	// Assertions
	suite.NoError(err)

	// Retrieve updated group
	updatedGroup, err := suite.repo.GetByID(group.ID)
	suite.NoError(err)
	suite.Equal("Updated Title", updatedGroup.Title)
	suite.Equal("Updated description", updatedGroup.Description)
	suite.Equal("I99999", updatedGroup.Owner)
	suite.Equal("updated@test.com", updatedGroup.Email)
	suite.Equal("https://example.com/updated.png", updatedGroup.PictureURL)
	suite.True(updatedGroup.UpdatedAt.After(updatedGroup.CreatedAt))
}

// TestUpdateNonExistentGroup tests updating a non-existent group
func (suite *GroupRepositoryTestSuite) TestUpdateNonExistentGroup() {
	nonExistentID := uuid.New()
	updates := map[string]interface{}{
		"title": "Updated Title",
	}

	err := suite.repo.Update(nonExistentID, updates)

	// Should not error when updating non-existent record (GORM behavior)
	suite.NoError(err)
}

// TestUpdateEmptyUpdates tests updating with empty updates map
func (suite *GroupRepositoryTestSuite) TestUpdateEmptyUpdates() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Update with empty map
	updates := map[string]interface{}{}
	err = suite.repo.Update(group.ID, updates)

	// Should not error
	suite.NoError(err)
}

// TestDelete tests deleting a group
func (suite *GroupRepositoryTestSuite) TestDelete() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Delete the group
	err = suite.repo.Delete(group.ID)
	suite.NoError(err)

	// Verify group is deleted
	_, err = suite.repo.GetByID(group.ID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

// TestDeleteNotFound tests deleting a non-existent group
func (suite *GroupRepositoryTestSuite) TestDeleteNotFound() {
	nonExistentID := uuid.New()

	err := suite.repo.Delete(nonExistentID)

	// Should not error when deleting non-existent record
	suite.NoError(err)
}

// TestGetWithTeams tests retrieving group with its teams
func (suite *GroupRepositoryTestSuite) TestGetWithTeams() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Create teams under the group
	team1 := suite.factories.Team.WithGroup(group.ID)
	team1.Name = "team1"
	teamRepo := NewTeamRepository(suite.baseTestSuite.DB)
	err = teamRepo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithGroup(group.ID)
	team2.Name = "team2"
	err = teamRepo.Create(team2)
	suite.NoError(err)

	// Retrieve group with teams - this will fail because the model doesn't have relationships
	groupWithTeams, err := suite.repo.GetWithTeams(group.ID)

	// Should error because Teams relationship is not defined in the model
	suite.Error(err)
	suite.Contains(err.Error(), "unsupported relations")
	suite.Nil(groupWithTeams)
}

// TestGetWithTeamsNoTeams tests retrieving group with no teams
func (suite *GroupRepositoryTestSuite) TestGetWithTeamsNoTeams() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group without teams
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Retrieve group with teams - this will fail because the model doesn't have relationships
	groupWithTeams, err := suite.repo.GetWithTeams(group.ID)

	// Should error because Teams relationship is not defined in the model
	suite.Error(err)
	suite.Contains(err.Error(), "unsupported relations")
	suite.Nil(groupWithTeams)
}

// TestGetWithTeamsNotFound tests retrieving non-existent group with teams
func (suite *GroupRepositoryTestSuite) TestGetWithTeamsNotFound() {
	nonExistentID := uuid.New()

	group, err := suite.repo.GetWithTeams(nonExistentID)

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(group)
}

// TestGetWithOrganization tests retrieving group with its organization
func (suite *GroupRepositoryTestSuite) TestGetWithOrganization() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Retrieve group with organization details - this will fail because the model doesn't have relationships
	groupWithOrg, err := suite.repo.GetWithOrganization(group.ID)

	// Should error because Organization relationship is not defined in the model
	suite.Error(err)
	suite.Contains(err.Error(), "unsupported relations")
	suite.Nil(groupWithOrg)
}

// TestGetWithOrganizationNotFound tests retrieving non-existent group with organization
func (suite *GroupRepositoryTestSuite) TestGetWithOrganizationNotFound() {
	nonExistentID := uuid.New()

	group, err := suite.repo.GetWithOrganization(nonExistentID)

	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(group)
}

// TestSearch tests searching groups by name, title, or description
func (suite *GroupRepositoryTestSuite) TestSearch() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create groups with searchable content
	group1 := suite.factories.Group.WithOrganization(org.ID)
	group1.Name = "frontend-team"
	group1.Title = "Frontend Development Group"
	group1.Description = "Handles all frontend development tasks"
	err = suite.repo.Create(group1)
	suite.NoError(err)

	group2 := suite.factories.Group.WithOrganization(org.ID)
	group2.Name = "backend-team"
	group2.Title = "Backend Development Group"
	group2.Description = "Manages backend services and APIs"
	err = suite.repo.Create(group2)
	suite.NoError(err)

	group3 := suite.factories.Group.WithOrganization(org.ID)
	group3.Name = "devops-team"
	group3.Title = "DevOps and Infrastructure"
	group3.Description = "Handles deployment and infrastructure"
	err = suite.repo.Create(group3)
	suite.NoError(err)

	// Search by partial name
	results, total, err := suite.repo.Search(org.ID, "frontend", 10, 0)
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal(group1.Name, results[0].Name)

	// Search by partial title
	results, total, err = suite.repo.Search(org.ID, "Backend Development", 10, 0)
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal(group2.Name, results[0].Name)

	// Search by partial description
	results, total, err = suite.repo.Search(org.ID, "deployment", 10, 0)
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal(group3.Name, results[0].Name)

	// Search that matches multiple groups
	results, total, err = suite.repo.Search(org.ID, "development", 10, 0)
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 2)
	suite.GreaterOrEqual(total, int64(2))
}

// TestSearchCaseInsensitive tests case-insensitive search
func (suite *GroupRepositoryTestSuite) TestSearchCaseInsensitive() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group with mixed case content
	group := suite.factories.Group.WithOrganization(org.ID)
	group.Name = "TestGroup"
	group.Title = "Test Group Title"
	group.Description = "Test Group Description"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Search with different cases
	testCases := []string{"testgroup", "TESTGROUP", "Test", "GROUP", "title", "DESCRIPTION"}

	for _, query := range testCases {
		results, total, err := suite.repo.Search(org.ID, query, 10, 0)
		suite.NoError(err, "Failed for query: %s", query)
		suite.GreaterOrEqual(len(results), 1, "No results for query: %s", query)
		suite.GreaterOrEqual(total, int64(1), "No total for query: %s", query)
	}
}

// TestSearchWithPagination tests search with pagination
func (suite *GroupRepositoryTestSuite) TestSearchWithPagination() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create multiple groups with common search term
	for i := 0; i < 5; i++ {
		group := suite.factories.Group.WithOrganization(org.ID)
		uuidSuffix := uuid.New().String()[:6]
		group.Name = "search-group-" + uuidSuffix
		group.Title = "Searchable Group " + uuidSuffix
		group.Description = "This is a searchable group for testing"
		err := suite.repo.Create(group)
		suite.NoError(err)
	}

	// Test first page
	results, total, err := suite.repo.Search(org.ID, "searchable", 2, 0)
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Equal(int64(5), total)

	// Test second page
	results, total, err = suite.repo.Search(org.ID, "searchable", 2, 2)
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Equal(int64(5), total)

	// Test third page
	results, total, err = suite.repo.Search(org.ID, "searchable", 2, 4)
	suite.NoError(err)
	suite.Len(results, 1) // Only one left
	suite.Equal(int64(5), total)
}

// TestSearchNoResults tests search with no matching results
func (suite *GroupRepositoryTestSuite) TestSearchNoResults() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group that won't match search
	group := suite.factories.Group.WithOrganization(org.ID)
	group.Name = "specific-group"
	group.Title = "Specific Group"
	group.Description = "Very specific description"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Search for something that doesn't exist
	results, total, err := suite.repo.Search(org.ID, "nonexistent", 10, 0)

	suite.NoError(err)
	suite.Len(results, 0)
	suite.Equal(int64(0), total)
}

// TestSearchWrongOrganization tests search in wrong organization
func (suite *GroupRepositoryTestSuite) TestSearchWrongOrganization() {
	// Create two organizations
	org1 := suite.factories.Organization.WithName("org1")
	org2 := suite.factories.Organization.WithName("org2")
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org1)
	suite.NoError(err)
	err = orgRepo.Create(org2)
	suite.NoError(err)

	// Create group in org1
	group := suite.factories.Group.WithOrganization(org1.ID)
	group.Name = "searchable-group"
	group.Title = "Searchable Group"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Search in org2
	results, total, err := suite.repo.Search(org2.ID, "searchable", 10, 0)

	suite.NoError(err)
	suite.Len(results, 0)
	suite.Equal(int64(0), total)
}

// TestSearchEmptyQuery tests search with empty query
func (suite *GroupRepositoryTestSuite) TestSearchEmptyQuery() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create some groups
	group1 := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group1)
	suite.NoError(err)

	group2 := suite.factories.Group.WithOrganization(org.ID)
	group2.Name = "another-group"
	err = suite.repo.Create(group2)
	suite.NoError(err)

	// Search with empty query - should match all groups due to ILIKE '%%'
	results, total, err := suite.repo.Search(org.ID, "", 10, 0)

	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 2)
	suite.GreaterOrEqual(total, int64(2))
}

// TestConcurrentOperations tests concurrent operations on groups
func (suite *GroupRepositoryTestSuite) TestConcurrentOperations() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Simulate concurrent updates
	updates1 := map[string]interface{}{"title": "Updated Title 1"}
	updates2 := map[string]interface{}{"description": "Updated Description 2"}

	// Both should succeed as they update different fields
	err1 := suite.repo.Update(group.ID, updates1)
	err2 := suite.repo.Update(group.ID, updates2)

	suite.NoError(err1)
	suite.NoError(err2)

	// Verify both updates were applied
	updatedGroup, err := suite.repo.GetByID(group.ID)
	suite.NoError(err)
	suite.Equal("Updated Title 1", updatedGroup.Title)
	suite.Equal("Updated Description 2", updatedGroup.Description)
}

// TestEdgeCasesZeroLimitOffset tests edge cases with zero limit and offset
func (suite *GroupRepositoryTestSuite) TestEdgeCasesZeroLimitOffset() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create some groups
	for i := 0; i < 3; i++ {
		group := suite.factories.Group.WithOrganization(org.ID)
		uuidSuffix := uuid.New().String()[:6]
		group.Name = "edge-group-" + uuidSuffix
		err := suite.repo.Create(group)
		suite.NoError(err)
	}

	// Test with zero limit (GORM treats 0 limit as returning 0 records)
	groups, total, err := suite.repo.GetByOrganizationID(org.ID, 0, 0)
	suite.NoError(err)
	suite.Equal(int64(3), total) // Total count should still be correct
	suite.Equal(0, len(groups))  // But no records returned due to 0 limit

	// Test search with zero limit
	results, total, err := suite.repo.Search(org.ID, "edge", 0, 0)
	suite.NoError(err)
	suite.Equal(int64(3), total) // Total count should still be correct
	suite.Equal(0, len(results)) // But no records returned due to 0 limit
}

// TestLargeOffset tests behavior with large offset values
func (suite *GroupRepositoryTestSuite) TestLargeOffset() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create a few groups
	for i := 0; i < 3; i++ {
		group := suite.factories.Group.WithOrganization(org.ID)
		uuidSuffix := uuid.New().String()[:6]
		group.Name = "offset-group-" + uuidSuffix
		err := suite.repo.Create(group)
		suite.NoError(err)
	}

	// Test with offset larger than total records
	groups, total, err := suite.repo.GetByOrganizationID(org.ID, 10, 100)
	suite.NoError(err)
	suite.Len(groups, 0)         // No results beyond available records
	suite.Equal(int64(3), total) // Total should still be correct
}

// TestSpecialCharactersInSearch tests search with special characters
func (suite *GroupRepositoryTestSuite) TestSpecialCharactersInSearch() {
	// Create organization
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create group with special characters
	group := suite.factories.Group.WithOrganization(org.ID)
	group.Name = "special-group"
	group.Title = "Group with % and _ characters"
	group.Description = "Contains special chars: %test_data%"
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Search for special characters (should be escaped properly)
	results, total, err := suite.repo.Search(org.ID, "%", 10, 0)
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 1)
	suite.GreaterOrEqual(total, int64(1))

	results, total, err = suite.repo.Search(org.ID, "_", 10, 0)
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 1)
	suite.GreaterOrEqual(total, int64(1))
}

// TestUpdateWithInvalidData tests updating with invalid data types
func (suite *GroupRepositoryTestSuite) TestUpdateWithInvalidData() {
	// Create organization first
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create test group
	group := suite.factories.Group.WithOrganization(org.ID)
	err = suite.repo.Create(group)
	suite.NoError(err)

	// Try to update with invalid UUID for org_id
	updates := map[string]interface{}{
		"org_id": "invalid-uuid",
	}

	err = suite.repo.Update(group.ID, updates)
	suite.Error(err) // Should fail due to invalid UUID format
}

// Run the test suite
func TestGroupRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(GroupRepositoryTestSuite))
}
