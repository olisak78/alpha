//go:build integration

package repository

import (
	"testing"

	"developer-portal-backend/internal/database/models"
	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

// TeamRepositoryTestSuite tests the TeamRepository
type TeamRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *TeamRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *TeamRepositoryTestSuite) SetupSuite() {
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())
	suite.repo = NewTeamRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *TeamRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *TeamRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *TeamRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// Helper to create organization, group hierarchy with unique names
func (suite *TeamRepositoryTestSuite) createOrgAndGroup() (*models.Organization, *models.Group) {
	// Use UUID to ensure unique organization names
	orgName := "test-org-" + uuid.New().String()[:8]
	org := suite.factories.Organization.WithName(orgName)
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	groupName := "test-group-" + uuid.New().String()[:8]
	group := suite.factories.Group.WithName(groupName)
	group.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group)
	suite.NoError(err)

	return org, group
}

// ============================================================================
// Create Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestCreate_Success() {
	// Arrange
	org, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID

	// Act
	err := suite.repo.Create(team)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, team.ID)
	suite.NotZero(team.CreatedAt)
	suite.NotZero(team.UpdatedAt)

	// Verify in database
	var dbTeam models.Team
	err = suite.baseTestSuite.DB.First(&dbTeam, "id = ?", team.ID).Error
	suite.NoError(err)
	suite.Equal(team.Name, dbTeam.Name)
	suite.Equal(org.ID, group.OrgID)
}

func (suite *TeamRepositoryTestSuite) TestCreate_DuplicateName() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	team1 := suite.factories.Team.WithName("duplicate-team")
	team1.GroupID = group.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	// Act - Try to create second team with same name in same group
	team2 := suite.factories.Team.WithName("duplicate-team")
	team2.GroupID = group.ID
	err = suite.repo.Create(team2)

	// Assert - Expect error due to unique constraint on (name, group_id)
	suite.Error(err)
	suite.Contains(err.Error(), "teams_name_group_id_unique")
}

func (suite *TeamRepositoryTestSuite) TestCreate_SameNameDifferentGroup() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	// Act - Create teams with same name in different groups
	team1 := suite.factories.Team.WithName("same-team")
	team1.GroupID = group1.ID
	err = suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("same-team")
	team2.GroupID = group2.ID
	err = suite.repo.Create(team2)

	// Assert - Should succeed (different groups)
	suite.NoError(err)
	suite.NotEqual(team1.ID, team2.ID)
}

func (suite *TeamRepositoryTestSuite) TestCreate_NilTeam() {
	// Act
	err := suite.repo.Create(nil)

	// Assert
	suite.Error(err)
}

// ============================================================================
// GetByID Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetByID_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	retrievedTeam, err := suite.repo.GetByID(team.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedTeam)
	suite.Equal(team.ID, retrievedTeam.ID)
	suite.Equal(team.Name, retrievedTeam.Name)
	suite.Equal(team.Title, retrievedTeam.Title)
	suite.Equal(team.GroupID, retrievedTeam.GroupID)
}

func (suite *TeamRepositoryTestSuite) TestGetByID_NotFound() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	team, err := suite.repo.GetByID(nonExistentID)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(team)
}

func (suite *TeamRepositoryTestSuite) TestGetByID_NilUUID() {
	// Arrange
	nilID := uuid.Nil

	// Act
	team, err := suite.repo.GetByID(nilID)

	// Assert
	suite.Error(err)
	suite.Nil(team)
}

// ============================================================================
// GetByName Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetByName_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.WithName("unique-team-name")
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	retrievedTeam, err := suite.repo.GetByName(group.ID, "unique-team-name")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedTeam)
	suite.Equal(team.ID, retrievedTeam.ID)
	suite.Equal("unique-team-name", retrievedTeam.Name)
}

func (suite *TeamRepositoryTestSuite) TestGetByName_NotFound() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	// Act
	team, err := suite.repo.GetByName(group.ID, "nonexistent-team")

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(team)
}

func (suite *TeamRepositoryTestSuite) TestGetByName_WrongGroup() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	team := suite.factories.Team.WithName("team-in-group1")
	team.GroupID = group1.ID
	err = suite.repo.Create(team)
	suite.NoError(err)

	// Act - Try to find team in wrong group
	result, err := suite.repo.GetByName(group2.ID, "team-in-group1")

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(result)
}

func (suite *TeamRepositoryTestSuite) TestGetByName_EmptyName() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	// Act
	team, err := suite.repo.GetByName(group.ID, "")

	// Assert
	suite.Error(err)
	suite.Nil(team)
}

func (suite *TeamRepositoryTestSuite) TestGetByName_CaseSensitive() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.WithName("TestTeam")
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act - Try with different case
	result, err := suite.repo.GetByName(group.ID, "testteam")

	// Assert - Should not find (case sensitive)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(result)
}

// ============================================================================
// GetByNameGlobal Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetByNameGlobal_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.WithName("global-unique-team")
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	retrievedTeam, err := suite.repo.GetByNameGlobal("global-unique-team")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedTeam)
	suite.Equal(team.ID, retrievedTeam.ID)
	suite.Equal("global-unique-team", retrievedTeam.Name)
}

func (suite *TeamRepositoryTestSuite) TestGetByNameGlobal_NotFound() {
	// Act
	team, err := suite.repo.GetByNameGlobal("nonexistent-global-team")

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(team)
}

func (suite *TeamRepositoryTestSuite) TestGetByNameGlobal_FirstMatch() {
	// Arrange - Create two teams with same name in different groups
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	team1 := suite.factories.Team.WithName("duplicate-name")
	team1.GroupID = group1.ID
	err = suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("duplicate-name")
	team2.GroupID = group2.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act
	result, err := suite.repo.GetByNameGlobal("duplicate-name")

	// Assert - Should return first match
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal("duplicate-name", result.Name)
	// Should be one of the two teams
	suite.True(result.ID == team1.ID || result.ID == team2.ID)
}

func (suite *TeamRepositoryTestSuite) TestGetByNameGlobal_EmptyName() {
	// Act
	team, err := suite.repo.GetByNameGlobal("")

	// Assert
	suite.Error(err)
	suite.Nil(team)
}

// ============================================================================
// GetByGroupID Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetByGroupID_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	team1 := suite.factories.Team.WithName("team-1")
	team1.GroupID = group.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("team-2")
	team2.GroupID = group.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act
	teams, total, err := suite.repo.GetByGroupID(group.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(teams, 2)
	suite.Equal(int64(2), total)
}

func (suite *TeamRepositoryTestSuite) TestGetByGroupID_EmptyGroup() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	// Act
	teams, total, err := suite.repo.GetByGroupID(group.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(teams)
	suite.Equal(int64(0), total)
}

func (suite *TeamRepositoryTestSuite) TestGetByGroupID_NonExistentGroup() {
	// Arrange
	nonExistentGroupID := uuid.New()

	// Act
	teams, total, err := suite.repo.GetByGroupID(nonExistentGroupID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(teams)
	suite.Equal(int64(0), total)
}

// ============================================================================
// GetByOrganizationID Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetByOrganizationID_Success() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	team1 := suite.factories.Team.WithName("team-1")
	team1.GroupID = group1.ID
	err = suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("team-2")
	team2.GroupID = group1.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	team3 := suite.factories.Team.WithName("team-3")
	team3.GroupID = group2.ID
	err = suite.repo.Create(team3)
	suite.NoError(err)

	// Act
	teams, total, err := suite.repo.GetByOrganizationID(org.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(teams, 3)
	suite.Equal(int64(3), total)
	suite.Equal("team-1", teams[0].Name)
	suite.Equal("team-2", teams[1].Name)
	suite.Equal("team-3", teams[2].Name)

}

func (suite *TeamRepositoryTestSuite) TestGetByOrganizationID_WithPagination() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group := suite.factories.Group.WithOrganization(org.ID)
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group)
	suite.NoError(err)

	for i := 0; i < 5; i++ {
		team := suite.factories.Team.WithName("team-" + uuid.New().String()[:8])
		team.GroupID = group.ID
		err := suite.repo.Create(team)
		suite.NoError(err)
	}

	// Act - First page
	teams, total, err := suite.repo.GetByOrganizationID(org.ID, 2, 0)
	suite.NoError(err)
	suite.Len(teams, 2)
	suite.Equal(int64(5), total)

	// Act - Second page
	teams, total, err = suite.repo.GetByOrganizationID(org.ID, 2, 2)
	suite.NoError(err)
	suite.Len(teams, 2)
	suite.Equal(int64(5), total)

	// Act - Third page
	teams, total, err = suite.repo.GetByOrganizationID(org.ID, 2, 4)
	suite.NoError(err)
	suite.Len(teams, 1)
	suite.Equal(int64(5), total)
}

func (suite *TeamRepositoryTestSuite) TestGetByOrganizationID_EmptyOrganization() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Act
	teams, total, err := suite.repo.GetByOrganizationID(org.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(teams)
	suite.Equal(int64(0), total)
}

func (suite *TeamRepositoryTestSuite) TestGetByOrganizationID_NonExistentOrganization() {
	// Arrange
	nonExistentOrgID := uuid.New()

	// Act
	teams, total, err := suite.repo.GetByOrganizationID(nonExistentOrgID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(teams)
	suite.Equal(int64(0), total)
}

// ============================================================================
// GetAll Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestGetAll_Success() {
	// Arrange
	_, group1 := suite.createOrgAndGroup()
	_, group2 := suite.createOrgAndGroup()

	team1 := suite.factories.Team.WithName("team-1")
	team1.GroupID = group1.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("team-2")
	team2.GroupID = group2.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act
	teams, err := suite.repo.GetAll()

	// Assert
	suite.NoError(err)
	suite.GreaterOrEqual(len(teams), 2)
}

func (suite *TeamRepositoryTestSuite) TestGetAll_EmptyDatabase() {
	// Act
	teams, err := suite.repo.GetAll()

	// Assert
	suite.NoError(err)
	suite.Empty(teams)
	suite.NotNil(teams)
}

func (suite *TeamRepositoryTestSuite) TestGetAll_VerifyAllTeamsReturned() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	createdTeams := make([]string, 3)
	for i := 0; i < 3; i++ {
		teamName := "team-" + uuid.New().String()[:8]
		team := suite.factories.Team.WithName(teamName)
		team.GroupID = group.ID
		err := suite.repo.Create(team)
		suite.NoError(err)
		createdTeams[i] = teamName
	}

	// Act
	teams, err := suite.repo.GetAll()

	// Assert
	suite.NoError(err)
	suite.Len(teams, 3)

	// Verify all created teams are in result
	teamNames := make(map[string]bool)
	for _, team := range teams {
		teamNames[team.Name] = true
	}
	for _, name := range createdTeams {
		suite.True(teamNames[name], "Team %s should be in results", name)
	}
}

// ============================================================================
// Update Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestUpdate_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	team.Title = "Updated Team Display Name"
	team.Description = "Updated team description"
	err = suite.repo.Update(team)

	// Assert
	suite.NoError(err)

	// Verify
	updatedTeam, err := suite.repo.GetByID(team.ID)
	suite.NoError(err)
	suite.Equal("Updated Team Display Name", updatedTeam.Title)
	suite.Equal("Updated team description", updatedTeam.Description)
	suite.True(updatedTeam.UpdatedAt.After(updatedTeam.CreatedAt))
}

func (suite *TeamRepositoryTestSuite) TestUpdate_AllFields() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	team.Title = "New Title"
	team.Description = "New Description"
	team.Owner = "I99999"
	team.Email = "newemail@example.com"
	team.PictureURL = "https://example.com/newpic.png"
	err = suite.repo.Update(team)

	// Assert
	suite.NoError(err)

	// Verify
	updated, err := suite.repo.GetByID(team.ID)
	suite.NoError(err)
	suite.Equal("New Title", updated.Title)
	suite.Equal("New Description", updated.Description)
	suite.Equal("I99999", updated.Owner)
	suite.Equal("newemail@example.com", updated.Email)
	suite.Equal("https://example.com/newpic.png", updated.PictureURL)
}

func (suite *TeamRepositoryTestSuite) TestUpdate_PartialFields() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	team.Title = "Original Title"
	team.Description = "Original Description"
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act - Update only title
	team.Title = "Updated Title Only"
	err = suite.repo.Update(team)

	// Assert
	suite.NoError(err)

	// Verify other fields unchanged
	updated, err := suite.repo.GetByID(team.ID)
	suite.NoError(err)
	suite.Equal("Updated Title Only", updated.Title)
	suite.Equal("Original Description", updated.Description)
	suite.Equal(team.Owner, updated.Owner)
	suite.Equal(team.Email, updated.Email)
	suite.Equal(team.PictureURL, updated.PictureURL)
}

func (suite *TeamRepositoryTestSuite) TestUpdate_NonExistentTeam() {
	// Arrange
	team := suite.factories.Team.Create()
	team.ID = uuid.New() // Non-existent ID

	// Act
	err := suite.repo.Update(team)

	// Assert - GORM Save doesn't error on non-existent records, it creates them
	suite.NoError(err)
}

func (suite *TeamRepositoryTestSuite) TestUpdate_ChangeGroup() {
	// Arrange
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	team := suite.factories.Team.Create()
	team.GroupID = group1.ID
	err = suite.repo.Create(team)
	suite.NoError(err)

	// Act - Change group
	team.GroupID = group2.ID
	err = suite.repo.Update(team)

	// Assert
	suite.NoError(err)

	// Verify
	updated, err := suite.repo.GetByID(team.ID)
	suite.NoError(err)
	suite.Equal(group2.ID, updated.GroupID)
}

func (suite *TeamRepositoryTestSuite) TestUpdate_DuplicateName() {
	// Arrange
	_, group := suite.createOrgAndGroup()

	team1 := suite.factories.Team.WithName("team-1")
	team1.GroupID = group.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("team-2")
	team2.GroupID = group.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act - Try to update team2 with team1's name
	team2.Name = "team-1"
	err = suite.repo.Update(team2)

	// Assert - Unique constraint violation
	suite.Error(err)
	suite.Contains(err.Error(), "teams_name_group_id_unique")
}

func (suite *TeamRepositoryTestSuite) TestUpdate_NilTeam() {
	// Act
	err := suite.repo.Update(nil)

	// Assert
	suite.Error(err)
}

// ============================================================================
// Delete Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestDelete_Success() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	err = suite.repo.Delete(team.ID)

	// Assert
	suite.NoError(err)

	// Verify team is deleted
	_, err = suite.repo.GetByID(team.ID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

func (suite *TeamRepositoryTestSuite) TestDelete_NonExistentTeam() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	err := suite.repo.Delete(nonExistentID)

	// Assert - Should not error (GORM Delete doesn't error on non-existent)
	suite.NoError(err)
}

func (suite *TeamRepositoryTestSuite) TestDelete_NilUUID() {
	// Act
	err := suite.repo.Delete(uuid.Nil)

	// Assert
	suite.NoError(err)
}

func (suite *TeamRepositoryTestSuite) TestDelete_VerifyDeletion() {
	// Arrange
	_, group := suite.createOrgAndGroup()
	team1 := suite.factories.Team.WithName("team-1")
	team1.GroupID = group.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("team-2")
	team2.GroupID = group.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act - Delete team1
	err = suite.repo.Delete(team1.ID)
	suite.NoError(err)

	// Assert - team1 deleted, team2 still exists
	_, err = suite.repo.GetByID(team1.ID)
	suite.Error(err)

	retrieved, err := suite.repo.GetByID(team2.ID)
	suite.NoError(err)
	suite.Equal(team2.ID, retrieved.ID)
}

func (suite *TeamRepositoryTestSuite) TestDelete_InvalidUUID() {
	// Arrange - Create an invalid UUID by manipulating bytes
	// Note: In Go with uuid.UUID type, we can't really have an "illegal" UUID
	// since it's a fixed [16]byte array. However, we can test edge cases:

	// Test 1: All zeros UUID (which is uuid.Nil, already tested above)
	// Test 2: All ones UUID (valid but non-existent)
	allOnesUUID := uuid.UUID{
		0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
		0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	}

	// Act
	err := suite.repo.Delete(allOnesUUID)

	// Assert - Should not error even with unusual UUID (GORM Delete doesn't error on non-existent)
	suite.NoError(err)
}

// ============================================================================
// Search Tests
// ============================================================================

func (suite *TeamRepositoryTestSuite) TestSearch_ByName() {
	// Arrange
	org, group := suite.createOrgAndGroup()

	team1 := suite.factories.Team.WithName("search-team-alpha")
	team1.GroupID = group.ID
	err := suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("other-team")
	team2.GroupID = group.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "search-team", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("search-team-alpha", results[0].Name)
}

func (suite *TeamRepositoryTestSuite) TestSearch_ByDescription() {
	// Arrange
	org, group := suite.createOrgAndGroup()

	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	team.Description = "This team handles unique functionality"
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "unique functionality", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
}

func (suite *TeamRepositoryTestSuite) TestSearch_CaseInsensitive() {
	// Arrange
	org, group := suite.createOrgAndGroup()

	team := suite.factories.Team.WithName("TestTeam")
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act - Search with different case
	results, total, err := suite.repo.Search(org.ID, "testteam", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
}

func (suite *TeamRepositoryTestSuite) TestSearch_NoMatches() {
	// Arrange
	org, group := suite.createOrgAndGroup()

	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "nonexistent", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

func (suite *TeamRepositoryTestSuite) TestSearch_EmptyQuery() {
	// Arrange
	org, group := suite.createOrgAndGroup()

	team := suite.factories.Team.Create()
	team.GroupID = group.ID
	err := suite.repo.Create(team)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

func (suite *TeamRepositoryTestSuite) TestSearch_OnlyInSpecifiedOrganization() {
	// Arrange - Create two organizations with teams
	org1 := suite.factories.Organization.WithName("org1")
	org2 := suite.factories.Organization.WithName("org2")
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org1)
	suite.NoError(err)
	err = orgRepo.Create(org2)
	suite.NoError(err)

	// Create groups in different organizations
	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org1.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org2.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	// Create teams with similar names in different organizations
	team1 := suite.factories.Team.WithName("search-team-org1")
	team1.GroupID = group1.ID
	err = suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("search-team-org2")
	team2.GroupID = group2.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act - Search in org1
	results, total, err := suite.repo.Search(org1.ID, "search-team", 10, 0)

	// Assert - Should only find org1's team
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("search-team-org1", results[0].Name)
}

func (suite *TeamRepositoryTestSuite) TestSearch_MultipleGroupsSameOrganization() {
	// Arrange - Create one organization with two groups
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	// Create two groups in the same organization
	group1 := suite.factories.Group.WithName("group1")
	group1.OrgID = org.ID
	group2 := suite.factories.Group.WithName("group2")
	group2.OrgID = org.ID
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group1)
	suite.NoError(err)
	err = groupRepo.Create(group2)
	suite.NoError(err)

	// Create teams with similar names in different groups of the same org
	team1 := suite.factories.Team.WithName("search-team-group1")
	team1.GroupID = group1.ID
	err = suite.repo.Create(team1)
	suite.NoError(err)

	team2 := suite.factories.Team.WithName("search-team-group2")
	team2.GroupID = group2.ID
	err = suite.repo.Create(team2)
	suite.NoError(err)

	// Act - Search in the organization (should find teams from both groups)
	results, total, err := suite.repo.Search(org.ID, "search-team", 10, 0)

	// Assert - Should find both teams since they're in the same organization
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Equal(int64(2), total)

	// Verify both teams are in results
	teamNames := make(map[string]bool)
	for _, team := range results {
		teamNames[team.Name] = true
	}
	suite.True(teamNames["search-team-group1"], "Should find team from group1")
	suite.True(teamNames["search-team-group2"], "Should find team from group2")
}

// Run the test suite
func TestTeamRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(TeamRepositoryTestSuite))
}
