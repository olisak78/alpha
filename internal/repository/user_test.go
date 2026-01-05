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

// UserRepositoryTestSuite tests the UserRepository
type UserRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *UserRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *UserRepositoryTestSuite) SetupSuite() {
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())
	suite.repo = NewUserRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *UserRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *UserRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *UserRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// Helper to create organization, group, and team hierarchy
func (suite *UserRepositoryTestSuite) createOrgGroupTeam() (*models.Organization, *models.Group, *models.Team) {
	org := suite.factories.Organization.Create()
	orgRepo := NewOrganizationRepository(suite.baseTestSuite.DB)
	err := orgRepo.Create(org)
	suite.NoError(err)

	group := suite.factories.Group.WithOrganization(org.ID)
	groupRepo := NewGroupRepository(suite.baseTestSuite.DB)
	err = groupRepo.Create(group)
	suite.NoError(err)

	team := suite.factories.Team.WithGroup(group.ID)
	teamRepo := NewTeamRepository(suite.baseTestSuite.DB)
	err = teamRepo.Create(team)
	suite.NoError(err)

	return org, group, team
}

// ============================================================================
// Create Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestCreate_Success() {
	// Arrange
	user := suite.factories.User.Create()

	// Act
	err := suite.repo.Create(user)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, user.ID)
	suite.NotZero(user.CreatedAt)
	suite.NotZero(user.UpdatedAt)
}

func (suite *UserRepositoryTestSuite) TestCreate_WithTeam() {
	// Arrange
	_, _, team := suite.createOrgGroupTeam()
	user := suite.factories.User.WithTeam(team.ID)

	// Act
	err := suite.repo.Create(user)

	// Assert
	suite.NoError(err)
	suite.NotNil(user.TeamID)
	suite.Equal(team.ID, *user.TeamID)
}

func (suite *UserRepositoryTestSuite) TestCreate_DuplicateEmail() {
	// Arrange
	user1 := suite.factories.User.WithEmail("duplicate@example.com")
	err := suite.repo.Create(user1)
	suite.NoError(err)

	// Act - Try to create second user with same email
	user2 := suite.factories.User.WithEmail("duplicate@example.com")
	err = suite.repo.Create(user2)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "duplicate key value")
}

func (suite *UserRepositoryTestSuite) TestCreate_WithAllFields() {
	// Arrange
	user := suite.factories.User.Create()
	user.UserID = "I123456"
	user.FirstName = "John"
	user.LastName = "Doe"
	user.Email = "john.doe@example.com"
	user.Mobile = "+1-555-1234"
	user.TeamDomain = models.TeamDomainDeveloper
	user.TeamRole = models.TeamRoleMember

	// Act
	err := suite.repo.Create(user)

	// Assert
	suite.NoError(err)
	suite.Equal("I123456", user.UserID)
	suite.Equal("John", user.FirstName)
	suite.Equal("Doe", user.LastName)
	suite.Equal("john.doe@example.com", user.Email)
	suite.Equal("+1-555-1234", user.Mobile)
	suite.Equal(models.TeamDomainDeveloper, user.TeamDomain)
	suite.Equal(models.TeamRoleMember, user.TeamRole)
}

// ============================================================================
// GetByID Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetByID_Success() {
	// Arrange
	user := suite.factories.User.Create()
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	retrievedUser, err := suite.repo.GetByID(user.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(user.ID, retrievedUser.ID)
	suite.Equal(user.Email, retrievedUser.Email)
	suite.Equal(user.FirstName, retrievedUser.FirstName)
	suite.Equal(user.LastName, retrievedUser.LastName)
}

func (suite *UserRepositoryTestSuite) TestGetByID_NotFound() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	user, err := suite.repo.GetByID(nonExistentID)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByID_NilUUID() {
	// Arrange
	nilID := uuid.Nil

	// Act
	user, err := suite.repo.GetByID(nilID)

	// Assert
	suite.Error(err)
	suite.Nil(user)
}

// ============================================================================
// GetByEmail Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetByEmail_Success() {
	// Arrange
	email := "test@example.com"
	user := suite.factories.User.WithEmail(email)
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	retrievedUser, err := suite.repo.GetByEmail(email)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(user.ID, retrievedUser.ID)
	suite.Equal(email, retrievedUser.Email)
}

func (suite *UserRepositoryTestSuite) TestGetByEmail_NotFound() {
	// Arrange
	nonExistentEmail := "nonexistent@example.com"

	// Act
	user, err := suite.repo.GetByEmail(nonExistentEmail)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByEmail_EmptyString() {
	// Arrange
	emptyEmail := ""

	// Act
	user, err := suite.repo.GetByEmail(emptyEmail)

	// Assert
	suite.Error(err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByEmail_CaseSensitive() {
	// Arrange
	email := "Test@Example.com"
	user := suite.factories.User.WithEmail(email)
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act - Try with different case
	retrievedUser, err := suite.repo.GetByEmail("test@example.com")

	// Assert - Should not find (case sensitive)
	suite.Error(err)
	suite.Nil(retrievedUser)
}

func (suite *UserRepositoryTestSuite) TestGetByEmail_SpecialCharacters() {
	// Arrange
	email := "user+test@example.com"
	user := suite.factories.User.WithEmail(email)
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	retrievedUser, err := suite.repo.GetByEmail(email)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(email, retrievedUser.Email)
}

// ============================================================================
// GetByName Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetByName_Success() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "unique-user-name"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	retrievedUser, err := suite.repo.GetByName("unique-user-name")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(user.ID, retrievedUser.ID)
	suite.Equal("unique-user-name", retrievedUser.Name)
}

func (suite *UserRepositoryTestSuite) TestGetByName_NotFound() {
	// Arrange
	nonExistentName := "nonexistent-name"

	// Act
	user, err := suite.repo.GetByName(nonExistentName)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByName_EmptyString() {
	// Arrange
	emptyName := ""

	// Act
	user, err := suite.repo.GetByName(emptyName)

	// Assert
	suite.Error(err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByName_CaseSensitive() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "TestUser"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act - Try with different case
	retrievedUser, err := suite.repo.GetByName("testuser")

	// Assert - Should find (case insensitive with ILIKE)
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(user.ID, retrievedUser.ID)
	suite.Equal("TestUser", retrievedUser.Name)
}

// ============================================================================
// GetByUserID Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetByUserID_Success() {
	// Arrange
	user := suite.factories.User.Create()
	user.UserID = "I123456"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	retrievedUser, err := suite.repo.GetByUserID("I123456")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedUser)
	suite.Equal(user.ID, retrievedUser.ID)
	suite.Equal("I123456", retrievedUser.UserID)
}

func (suite *UserRepositoryTestSuite) TestGetByUserID_NotFound() {
	// Arrange
	nonExistentUserID := "I999999"

	// Act
	user, err := suite.repo.GetByUserID(nonExistentUserID)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(user)
}

func (suite *UserRepositoryTestSuite) TestGetByUserID_DifferentPrefixes() {
	// Arrange
	userI := suite.factories.User.Create()
	userI.UserID = "I123456"
	userI.Email = "i-user@example.com"
	err := suite.repo.Create(userI)
	suite.NoError(err)

	userC := suite.factories.User.Create()
	userC.UserID = "C123456"
	userC.Email = "c-user@example.com"
	err = suite.repo.Create(userC)
	suite.NoError(err)

	// Act & Assert
	retrievedI, err := suite.repo.GetByUserID("I123456")
	suite.NoError(err)
	suite.Equal("I123456", retrievedI.UserID)

	retrievedC, err := suite.repo.GetByUserID("C123456")
	suite.NoError(err)
	suite.Equal("C123456", retrievedC.UserID)
}

// ============================================================================
// GetAll Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetAll_Success() {
	// Arrange
	user1 := suite.factories.User.WithEmail("user1@example.com")
	err := suite.repo.Create(user1)
	suite.NoError(err)

	user2 := suite.factories.User.WithEmail("user2@example.com")
	err = suite.repo.Create(user2)
	suite.NoError(err)

	user3 := suite.factories.User.WithEmail("user3@example.com")
	err = suite.repo.Create(user3)
	suite.NoError(err)

	// Act
	users, total, err := suite.repo.GetAll(10, 0)

	// Assert
	suite.NoError(err)
	suite.GreaterOrEqual(len(users), 3)
	suite.GreaterOrEqual(total, int64(3))
}

func (suite *UserRepositoryTestSuite) TestGetAll_EmptyDatabase() {
	// Act
	users, total, err := suite.repo.GetAll(10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(users)
	suite.Equal(int64(0), total)
}

func (suite *UserRepositoryTestSuite) TestGetAll_WithPagination() {
	// Arrange - Create 5 users
	for i := 0; i < 5; i++ {
		user := suite.factories.User.Create()
		user.Email = uuid.New().String() + "@example.com"
		err := suite.repo.Create(user)
		suite.NoError(err)
	}

	// Act - First page
	users, total, err := suite.repo.GetAll(2, 0)
	suite.NoError(err)
	suite.Len(users, 2)
	suite.Equal(int64(5), total)

	// Act - Second page
	users, total, err = suite.repo.GetAll(2, 2)
	suite.NoError(err)
	suite.Len(users, 2)
	suite.Equal(int64(5), total)

	// Act - Third page
	users, total, err = suite.repo.GetAll(2, 4)
	suite.NoError(err)
	suite.Len(users, 1)
	suite.Equal(int64(5), total)
}

// ============================================================================
// GetByTeamID Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestGetByTeamID_Success() {
	// Arrange
	_, _, team := suite.createOrgGroupTeam()

	user1 := suite.factories.User.WithEmail("team-user1@example.com")
	user1.TeamID = &team.ID
	err := suite.repo.Create(user1)
	suite.NoError(err)

	user2 := suite.factories.User.WithEmail("team-user2@example.com")
	user2.TeamID = &team.ID
	err = suite.repo.Create(user2)
	suite.NoError(err)

	// Act
	users, total, err := suite.repo.GetByTeamID(team.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(users, 2)
	suite.Equal(int64(2), total)
}

func (suite *UserRepositoryTestSuite) TestGetByTeamID_NoUsers() {
	// Arrange
	_, _, team := suite.createOrgGroupTeam()

	// Act
	users, total, err := suite.repo.GetByTeamID(team.ID, 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(users)
	suite.Equal(int64(0), total)
}

func (suite *UserRepositoryTestSuite) TestGetByTeamID_WithPagination() {
	// Arrange
	_, _, team := suite.createOrgGroupTeam()

	for i := 0; i < 5; i++ {
		user := suite.factories.User.Create()
		user.Email = uuid.New().String() + "@example.com"
		user.TeamID = &team.ID
		err := suite.repo.Create(user)
		suite.NoError(err)
	}

	// Act - First page
	users, total, err := suite.repo.GetByTeamID(team.ID, 2, 0)
	suite.NoError(err)
	suite.Len(users, 2)
	suite.Equal(int64(5), total)

	// Act - Second page
	users, total, err = suite.repo.GetByTeamID(team.ID, 2, 2)
	suite.NoError(err)
	suite.Len(users, 2)
	suite.Equal(int64(5), total)
}

// ============================================================================
// Update Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestUpdate_Success() {
	// Arrange
	user := suite.factories.User.Create()
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	user.FirstName = "Updated"
	user.LastName = "Name"
	user.Mobile = "+1-555-9999"
	user.TeamDomain = models.TeamDomainArchitect
	err = suite.repo.Update(user)

	// Assert
	suite.NoError(err)

	// Verify
	updatedUser, err := suite.repo.GetByID(user.ID)
	suite.NoError(err)
	suite.Equal("Updated", updatedUser.FirstName)
	suite.Equal("Name", updatedUser.LastName)
	suite.Equal("+1-555-9999", updatedUser.Mobile)
	suite.Equal(models.TeamDomainArchitect, updatedUser.TeamDomain)
	suite.True(updatedUser.UpdatedAt.After(updatedUser.CreatedAt))
}

func (suite *UserRepositoryTestSuite) TestUpdate_NonExistentUser() {
	// Arrange
	user := suite.factories.User.Create()
	user.ID = uuid.New() // Non-existent ID

	// Act
	err := suite.repo.Update(user)

	// Assert - GORM Save doesn't error on non-existent records, it creates them
	suite.NoError(err)
}

func (suite *UserRepositoryTestSuite) TestUpdate_PartialFields() {
	// Arrange
	user := suite.factories.User.Create()
	user.FirstName = "Original"
	user.LastName = "Name"
	user.Mobile = "+1-555-0000"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act - Update only mobile
	user.Mobile = "+1-555-1111"
	err = suite.repo.Update(user)

	// Assert
	suite.NoError(err)

	// Verify other fields unchanged
	updatedUser, err := suite.repo.GetByID(user.ID)
	suite.NoError(err)
	suite.Equal("Original", updatedUser.FirstName)
	suite.Equal("Name", updatedUser.LastName)
	suite.Equal("+1-555-1111", updatedUser.Mobile)
}

// ============================================================================
// Delete Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestDelete_Success() {
	// Arrange
	user := suite.factories.User.Create()
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	err = suite.repo.Delete(user.ID)

	// Assert
	suite.NoError(err)

	// Verify deletion
	_, err = suite.repo.GetByID(user.ID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

func (suite *UserRepositoryTestSuite) TestDelete_NonExistentUser() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	err := suite.repo.Delete(nonExistentID)

	// Assert - Should not error
	suite.NoError(err)
}

func (suite *UserRepositoryTestSuite) TestDelete_NilUUID() {
	// Arrange
	nilID := uuid.Nil

	// Act
	err := suite.repo.Delete(nilID)

	// Assert
	suite.NoError(err)
}

// ============================================================================
// RemoveFromTeam Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestRemoveFromTeam_Success() {
	// Arrange
	_, _, team := suite.createOrgGroupTeam()
	user := suite.factories.User.WithTeam(team.ID)
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	err = suite.repo.RemoveFromTeam(user.ID)

	// Assert
	suite.NoError(err)

	// Verify removal
	updatedUser, err := suite.repo.GetByID(user.ID)
	suite.NoError(err)
	suite.Nil(updatedUser.TeamID)
}

func (suite *UserRepositoryTestSuite) TestRemoveFromTeam_AlreadyNoTeam() {
	// Arrange
	user := suite.factories.User.Create()
	user.TeamID = nil
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	err = suite.repo.RemoveFromTeam(user.ID)

	// Assert
	suite.NoError(err)

	// Verify still no team
	updatedUser, err := suite.repo.GetByID(user.ID)
	suite.NoError(err)
	suite.Nil(updatedUser.TeamID)
}

func (suite *UserRepositoryTestSuite) TestRemoveFromTeam_NonExistentUser() {
	// Arrange
	nonExistentUserID := uuid.New()

	// Act
	err := suite.repo.RemoveFromTeam(nonExistentUserID)

	// Assert - Should not error
	suite.NoError(err)
}

// ============================================================================
// Search Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestSearch_ByFirstName() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	alice := suite.factories.User.WithEmail("alice@example.com")
	alice.TeamID = &team.ID
	alice.FirstName = "Alice"
	alice.LastName = "Smith"
	err := suite.repo.Create(alice)
	suite.NoError(err)

	bob := suite.factories.User.WithEmail("bob@example.com")
	bob.TeamID = &team.ID
	bob.FirstName = "Bob"
	bob.LastName = "Jones"
	err = suite.repo.Create(bob)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "alice", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("Alice", results[0].FirstName)
}

func (suite *UserRepositoryTestSuite) TestSearch_ByLastName() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	user := suite.factories.User.WithEmail("user@example.com")
	user.TeamID = &team.ID
	user.FirstName = "John"
	user.LastName = "Doe"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "doe", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("Doe", results[0].LastName)
}

func (suite *UserRepositoryTestSuite) TestSearch_ByEmail() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	user := suite.factories.User.WithEmail("john.doe@example.com")
	user.TeamID = &team.ID
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "john.doe", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("john.doe@example.com", results[0].Email)
}

func (suite *UserRepositoryTestSuite) TestSearch_CaseInsensitive() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	user := suite.factories.User.WithEmail("user@example.com")
	user.TeamID = &team.ID
	user.FirstName = "Alice"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act - Search with different case
	results, total, err := suite.repo.Search(org.ID, "ALICE", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
}

func (suite *UserRepositoryTestSuite) TestSearch_NoMatches() {
	// Arrange
	org, _, _ := suite.createOrgGroupTeam()

	// Act
	results, total, err := suite.repo.Search(org.ID, "nonexistent", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

func (suite *UserRepositoryTestSuite) TestSearch_EmptyQuery() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	user := suite.factories.User.WithEmail("user@example.com")
	user.TeamID = &team.ID
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.Search(org.ID, "", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

// ============================================================================
// SearchByOrganization Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestSearchByOrganization_Success() {
	// Arrange
	org, _, team := suite.createOrgGroupTeam()

	user := suite.factories.User.WithEmail("search@example.com")
	user.TeamID = &team.ID
	user.FirstName = "Searchable"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByOrganization(org.ID, "searchable", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
}

func (suite *UserRepositoryTestSuite) TestGetExistingUserIDs_Success() {
	// Arrange
	user1 := suite.factories.User.Create()
	user1.UserID = "I123456"
	user1.Email = "u1@example.com"
	err := suite.repo.Create(user1)
	suite.NoError(err)

	user2 := suite.factories.User.Create()
	user2.UserID = "I789012"
	user2.Email = "u2@example.com"
	err = suite.repo.Create(user2)
	suite.NoError(err)

	// Act
	results, err := suite.repo.GetExistingUserIDs([]string{"I123456", "I789012", "I999999"})

	// Assert
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Contains(results, "I123456")
	suite.Contains(results, "I789012")
	suite.NotContains(results, "I999999")
}

func (suite *UserRepositoryTestSuite) TestGetExistingUserIDs_EmptyInput() {
	// Act
	results, err := suite.repo.GetExistingUserIDs([]string{})

	// Assert
	suite.NoError(err)
	suite.Empty(results)
}

func (suite *UserRepositoryTestSuite) TestGetExistingUserIDs_NoneExist() {
	// Act
	results, err := suite.repo.GetExistingUserIDs([]string{"I999999", "I888888"})

	// Assert
	suite.NoError(err)
	suite.Empty(results)
}

func (suite *UserRepositoryTestSuite) TestGetExistingUserIDs_AllExist() {
	// Arrange
	user1 := suite.factories.User.Create()
	user1.UserID = "I111111"
	user1.Email = "u1@example.com"
	err := suite.repo.Create(user1)
	suite.NoError(err)

	user2 := suite.factories.User.Create()
	user2.UserID = "I222222"
	user2.Email = "u2@example.com"
	err = suite.repo.Create(user2)
	suite.NoError(err)

	// Act
	results, err := suite.repo.GetExistingUserIDs([]string{"I111111", "I222222"})

	// Assert
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Contains(results, "I111111")
	suite.Contains(results, "I222222")
}

// ============================================================================
// SearchByNameOrTitleGlobal Tests
// ============================================================================

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_ByName() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "unique-search-name"
	user.Title = "Some Title"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("unique-search", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("unique-search-name", results[0].Name)
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_ByTitle() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "some-name"
	user.Title = "Unique Search Title"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("unique search", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("Unique Search Title", results[0].Title)
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_EmptyQuery() {
	// Arrange
	user1 := suite.factories.User.Create()
	user1.Email = "u1@example.com"
	err := suite.repo.Create(user1)
	suite.NoError(err)

	user2 := suite.factories.User.Create()
	user2.Email = "u2@example.com"
	err = suite.repo.Create(user2)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("", 10, 0)

	// Assert
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 2)
	suite.GreaterOrEqual(total, int64(2))
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_CaseInsensitive() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "TestUser"
	user.Title = "Test Title"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("testuser", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_NoMatches() {
	// Arrange
	user := suite.factories.User.Create()
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("nonexistent-search-term", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Empty(results)
	suite.Equal(int64(0), total)
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_WithPagination() {
	// Arrange - Create 5 users with similar names
	for i := 0; i < 5; i++ {
		user := suite.factories.User.Create()
		user.Name = "search-user-" + uuid.New().String()[:8]
		user.Email = uuid.New().String() + "@example.com"
		err := suite.repo.Create(user)
		suite.NoError(err)
	}

	// Act - First page
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("search-user", 2, 0)
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Equal(int64(5), total)

	// Act - Second page
	results, total, err = suite.repo.SearchByNameOrTitleGlobal("search-user", 2, 2)
	suite.NoError(err)
	suite.Len(results, 2)
	suite.Equal(int64(5), total)

	// Act - Third page
	results, total, err = suite.repo.SearchByNameOrTitleGlobal("search-user", 2, 4)
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(5), total)
}

func (suite *UserRepositoryTestSuite) TestSearchByNameOrTitleGlobal_PartialMatch() {
	// Arrange
	user := suite.factories.User.Create()
	user.Name = "john-doe-developer"
	err := suite.repo.Create(user)
	suite.NoError(err)

	// Act - Search with partial name
	results, total, err := suite.repo.SearchByNameOrTitleGlobal("doe", 10, 0)

	// Assert
	suite.NoError(err)
	suite.Len(results, 1)
	suite.Equal(int64(1), total)
	suite.Equal("john-doe-developer", results[0].Name)
}

// Run the test suite
func TestUserRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(UserRepositoryTestSuite))
}
