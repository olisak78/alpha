//go:build integration

package repository

import (
	"encoding/json"
	"strings"
	"testing"

	"developer-portal-backend/internal/database/models"
	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

// ProjectRepositoryTestSuite tests the ProjectRepository
type ProjectRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *ProjectRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *ProjectRepositoryTestSuite) SetupSuite() {
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())
	suite.repo = NewProjectRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *ProjectRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *ProjectRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *ProjectRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// ============================================================================
// Create Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestCreate_Success() {
	// Arrange
	project := suite.factories.Project.Create()

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, project.ID)
	suite.NotZero(project.CreatedAt)
	suite.NotZero(project.UpdatedAt)
	suite.Equal("test-project", project.Name)
	suite.Equal("Test Project", project.Title)
}

func (suite *ProjectRepositoryTestSuite) TestCreate_DuplicateName() {
	// Arrange
	project1 := suite.factories.Project.WithName("duplicate-project")
	err := suite.repo.Create(project1)
	suite.NoError(err)

	// Act - Try to create second project with same name
	project2 := suite.factories.Project.WithName("duplicate-project")
	err = suite.repo.Create(project2)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "projects_name_unique")
}

func (suite *ProjectRepositoryTestSuite) TestCreate_WithNullMetadata() {
	// Arrange
	project := suite.factories.Project.Create()
	project.Metadata = []byte("null")

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, project.ID)
}

func (suite *ProjectRepositoryTestSuite) TestCreate_NameTooLong() {
	// Arrange - BaseModel.Name has max length 40
	project := suite.factories.Project.Create()
	project.Name = "this-is-a-very-long-project-name-that-exceeds-forty-characters"

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

func (suite *ProjectRepositoryTestSuite) TestCreate_TitleTooLong() {
	// Arrange - BaseModel.Title has max length 100
	project := suite.factories.Project.Create()
	project.Title = "This is a very long project title that exceeds one hundred characters limit and should cause a validation error when trying to save"

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

func (suite *ProjectRepositoryTestSuite) TestCreate_DescriptionTooLong() {
	// Arrange - BaseModel.Description has max length 200
	project := suite.factories.Project.Create()
	project.Description = strings.Repeat("a", 201) // 201 characters exceeds the 200 limit

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// ============================================================================
// GetByID Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestGetByID_Success() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrievedProject, err := suite.repo.GetByID(project.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedProject)
	suite.Equal(project.ID, retrievedProject.ID)
	suite.Equal(project.Name, retrievedProject.Name)
	suite.Equal(project.Title, retrievedProject.Title)
	suite.Equal(project.Description, retrievedProject.Description)
}

func (suite *ProjectRepositoryTestSuite) TestGetByID_NotFound() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	project, err := suite.repo.GetByID(nonExistentID)

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(project)
}

func (suite *ProjectRepositoryTestSuite) TestGetByID_NilUUID() {
	// Arrange
	nilID := uuid.Nil

	// Act
	project, err := suite.repo.GetByID(nilID)

	// Assert
	suite.Error(err)
	suite.Nil(project)
}

func (suite *ProjectRepositoryTestSuite) TestGetByID_WithMetadata() {
	// Arrange
	metadata := map[string]interface{}{
		"health": "https://health.example.com",
		"views":  []string{"grid"},
	}
	project := suite.factories.Project.WithMetadata(metadata)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrievedProject, err := suite.repo.GetByID(project.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedProject)
	suite.NotNil(retrievedProject.Metadata)

	var retrievedMetadata map[string]interface{}
	err = json.Unmarshal(retrievedProject.Metadata, &retrievedMetadata)
	suite.NoError(err)
	suite.Equal("https://health.example.com", retrievedMetadata["health"])
}

func (suite *ProjectRepositoryTestSuite) TestGetByID_VerifyTimestamps() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrievedProject, err := suite.repo.GetByID(project.ID)

	// Assert
	suite.NoError(err)
	suite.NotZero(retrievedProject.CreatedAt)
	suite.NotZero(retrievedProject.UpdatedAt)
	suite.True(retrievedProject.CreatedAt.Equal(retrievedProject.UpdatedAt) ||
		retrievedProject.UpdatedAt.After(retrievedProject.CreatedAt))
}

// ============================================================================
// GetByName Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestGetByName_Success() {
	// Arrange
	project := suite.factories.Project.WithName("unique-project-name")
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrievedProject, err := suite.repo.GetByName("unique-project-name")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedProject)
	suite.Equal(project.ID, retrievedProject.ID)
	suite.Equal("unique-project-name", retrievedProject.Name)
}

func (suite *ProjectRepositoryTestSuite) TestGetByName_NotFound() {
	// Act
	project, err := suite.repo.GetByName("nonexistent-project")

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(project)
}

func (suite *ProjectRepositoryTestSuite) TestGetByName_EmptyString() {
	// Act
	project, err := suite.repo.GetByName("")

	// Assert
	suite.Error(err)
	suite.Nil(project)
}

func (suite *ProjectRepositoryTestSuite) TestGetByName_CaseSensitive() {
	// Arrange
	project := suite.factories.Project.WithName("TestProject")
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act - Try with different case
	retrievedProject, err := suite.repo.GetByName("testproject")

	// Assert - Should not find (case sensitive)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
	suite.Nil(retrievedProject)
}

func (suite *ProjectRepositoryTestSuite) TestGetByName_WithMetadata() {
	// Arrange
	metadata := map[string]interface{}{
		"health": "https://health.example.com",
	}
	project := suite.factories.Project.WithMetadata(metadata)
	project.Name = "project-with-metadata"
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrievedProject, err := suite.repo.GetByName("project-with-metadata")

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedProject)
	suite.NotNil(retrievedProject.Metadata)
}

// ============================================================================
// Update Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestUpdate_Success() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	project.Name = "updated-name"
	project.Title = "Updated Title"
	project.Description = "Updated Description"
	metadata := map[string]interface{}{
		"health": "https://new-health.example.com",
	}
	metadataBytes, _ := json.Marshal(metadata)
	project.Metadata = metadataBytes

	err = suite.repo.Update(project)

	// Assert
	suite.NoError(err)

	// Verify
	updatedProject, err := suite.repo.GetByID(project.ID)
	suite.NoError(err)
	suite.Equal("updated-name", updatedProject.Name)
	suite.Equal("Updated Title", updatedProject.Title)
	suite.Equal("Updated Description", updatedProject.Description)
	suite.NotNil(updatedProject.Metadata)
	suite.True(updatedProject.UpdatedAt.After(updatedProject.CreatedAt))

}

func (suite *ProjectRepositoryTestSuite) TestUpdate_Metadata() {
	// Arrange
	originalMetadata := map[string]interface{}{
		"health": "https://original-health.example.com",
	}
	project := suite.factories.Project.WithMetadata(originalMetadata)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	newMetadata := map[string]interface{}{
		"health":        "https://new-health.example.com",
		"documentation": "https://docs.example.com",
	}
	metadataBytes, _ := json.Marshal(newMetadata)
	project.Metadata = metadataBytes
	err = suite.repo.Update(project)

	// Assert
	suite.NoError(err)

	// Verify
	updatedProject, err := suite.repo.GetByID(project.ID)
	suite.NoError(err)

	var updatedMetadata map[string]interface{}
	err = json.Unmarshal(updatedProject.Metadata, &updatedMetadata)
	suite.NoError(err)
	suite.Equal("https://new-health.example.com", updatedMetadata["health"])
	suite.Equal("https://docs.example.com", updatedMetadata["documentation"])
}

func (suite *ProjectRepositoryTestSuite) TestUpdate_NonExistentProject() {
	// Arrange
	project := suite.factories.Project.Create()
	project.ID = uuid.New() // Non-existent ID

	// Act
	err := suite.repo.Update(project)

	// Assert - GORM Save doesn't error on non-existent records, it creates them
	suite.NoError(err)
}

func (suite *ProjectRepositoryTestSuite) TestUpdate_DuplicateName() {
	// Arrange
	project1 := suite.factories.Project.WithName("project-one")
	err := suite.repo.Create(project1)
	suite.NoError(err)

	project2 := suite.factories.Project.WithName("project-two")
	err = suite.repo.Create(project2)
	suite.NoError(err)

	// Act - Try to update project2 to have same name as project1
	project2.Name = "project-one"
	err = suite.repo.Update(project2)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "projects_name_unique")
}

func (suite *ProjectRepositoryTestSuite) TestUpdate_NameTooLong() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	project.Name = "this-is-a-very-long-project-name-that-exceeds-forty-characters"
	err = suite.repo.Update(project)

	// Assert
	suite.Error(err)
	suite.Contains(err.Error(), "value too long")
}

// ============================================================================
// Delete Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestDelete_Success() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	err = suite.repo.Delete(project.ID)

	// Assert
	suite.NoError(err)

	// Verify deletion
	_, err = suite.repo.GetByID(project.ID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

func (suite *ProjectRepositoryTestSuite) TestDelete_NonExistentProject() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	err := suite.repo.Delete(nonExistentID)

	// Assert - Should not error
	suite.NoError(err)
}

func (suite *ProjectRepositoryTestSuite) TestDelete_NilUUID() {
	// Arrange
	nilID := uuid.Nil

	// Act
	err := suite.repo.Delete(nilID)

	// Assert
	suite.NoError(err)
}

func (suite *ProjectRepositoryTestSuite) TestDelete_VerifyPermanentDeletion() {
	// Arrange
	project := suite.factories.Project.Create()
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	err = suite.repo.Delete(project.ID)
	suite.NoError(err)

	// Assert - Verify it's permanently deleted (not soft delete)
	var count int64
	suite.baseTestSuite.DB.Model(&models.Project{}).Where("id = ?", project.ID).Count(&count)
	suite.Equal(int64(0), count)
}

func (suite *ProjectRepositoryTestSuite) TestDelete_MultipleProjects() {
	// Arrange
	project1 := suite.factories.Project.WithName("project-1")
	err := suite.repo.Create(project1)
	suite.NoError(err)

	project2 := suite.factories.Project.WithName("project-2")
	err = suite.repo.Create(project2)
	suite.NoError(err)

	// Act - Delete first project
	err = suite.repo.Delete(project1.ID)
	suite.NoError(err)

	// Assert - First project deleted, second still exists
	_, err = suite.repo.GetByID(project1.ID)
	suite.Error(err)

	retrievedProject2, err := suite.repo.GetByID(project2.ID)
	suite.NoError(err)
	suite.Equal(project2.ID, retrievedProject2.ID)
}

// ============================================================================
// GetHealthMetadata Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_WithHealth() {
	// Arrange
	project := suite.factories.Project.WithName("project-health-1")
	project.Metadata = []byte(`{"health":"https://health.ingress.{landscape_domain}{health_suffix}"}`)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("https://health.ingress.{landscape_domain}{health_suffix}", url)
	suite.Equal("", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_WithHealthAndRegex() {
	// Arrange
	project := suite.factories.Project.WithName("project-health-regex")
	project.Metadata = []byte(`{"health":"https://health.example.com","health_success_regex":"^200$"}`)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("https://health.example.com", url)
	suite.Equal("^200$", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_NoMetadata() {
	// Arrange
	project := suite.factories.Project.WithName("project-health-2")
	project.Metadata = nil
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("", url)
	suite.Equal("", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_NoHealthField() {
	// Arrange
	project := suite.factories.Project.WithName("project-health-3")
	project.Metadata = []byte(`{"views":["grid"]}`)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("", url)
	suite.Equal("", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_ProjectNotFound() {
	// Act
	_, _, err := suite.repo.GetHealthMetadata(uuid.New())

	// Assert
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_NilUUID() {
	// Act
	_, _, err := suite.repo.GetHealthMetadata(uuid.Nil)

	// Assert
	suite.Error(err)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_NullMetadataString() {
	// Arrange
	project := suite.factories.Project.WithName("project-null-metadata")
	project.Metadata = []byte("null")
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("", url)
	suite.Equal("", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_EmptyMetadata() {
	// Arrange
	project := suite.factories.Project.WithName("project-empty-metadata")
	project.Metadata = []byte("")
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("", url)
	suite.Equal("", regex)
}

func (suite *ProjectRepositoryTestSuite) TestGetHealthMetadata_ComplexMetadata() {
	// Arrange
	project := suite.factories.Project.WithName("project-complex-metadata")
	project.Metadata = []byte(`{
		"health": "https://health.example.com/check",
		"health_success_regex": "^(200|201)$",
		"alerts": "https://github.com/org/alerts",
		"views": ["grid", "list"],
		"tags": ["production", "critical"]
	}`)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	url, regex, err := suite.repo.GetHealthMetadata(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("https://health.example.com/check", url)
	suite.Equal("^(200|201)$", regex)
}

// ============================================================================
// GetAllProjects Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestGetAllProjects_Success() {
	// Arrange
	project1 := suite.factories.Project.WithName("project-1")
	err := suite.repo.Create(project1)
	suite.NoError(err)

	project2 := suite.factories.Project.WithName("project-2")
	err = suite.repo.Create(project2)
	suite.NoError(err)

	project3 := suite.factories.Project.WithName("project-3")
	err = suite.repo.Create(project3)
	suite.NoError(err)

	// Act
	results, err := suite.repo.GetAllProjects()

	// Assert
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 3)
}

func (suite *ProjectRepositoryTestSuite) TestGetAllProjects_EmptyDatabase() {
	// Act
	results, err := suite.repo.GetAllProjects()

	// Assert
	suite.NoError(err)
	suite.Empty(results)
}

func (suite *ProjectRepositoryTestSuite) TestGetAllProjects_MultipleProjects() {
	// Arrange - Create 10 projects
	for i := 0; i < 10; i++ {
		project := suite.factories.Project.Create()
		project.Name = "bulk-project-" + uuid.New().String()[:8]
		err := suite.repo.Create(project)
		suite.NoError(err)
	}

	// Act
	results, err := suite.repo.GetAllProjects()

	// Assert
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 10)
}

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

func (suite *ProjectRepositoryTestSuite) TestConcurrentCreates() {
	// Arrange
	done := make(chan error, 3)

	// Act - Create 3 projects concurrently
	for i := 0; i < 3; i++ {
		go func(index int) {
			project := suite.factories.Project.Create()
			project.Name = "concurrent-" + uuid.New().String()[:8]
			err := suite.repo.Create(project)
			done <- err
		}(i)
	}

	// Wait for all goroutines and check errors
	for i := 0; i < 3; i++ {
		err := <-done
		suite.NoError(err)
	}

	// Assert - All projects should be created
	results, err := suite.repo.GetAllProjects()
	suite.NoError(err)
	suite.GreaterOrEqual(len(results), 3)
}

func (suite *ProjectRepositoryTestSuite) TestCreateUpdateDeleteCycle() {
	// Arrange & Act - Create
	project := suite.factories.Project.WithName("lifecycle-test")
	err := suite.repo.Create(project)
	suite.NoError(err)
	createdID := project.ID

	// Act - Update
	project.Title = "Updated Lifecycle Test"
	err = suite.repo.Update(project)
	suite.NoError(err)

	// Verify update
	updated, err := suite.repo.GetByID(createdID)
	suite.NoError(err)
	suite.Equal("Updated Lifecycle Test", updated.Title)

	// Act - Delete
	err = suite.repo.Delete(createdID)
	suite.NoError(err)

	// Assert - Verify deletion
	_, err = suite.repo.GetByID(createdID)
	suite.Error(err)
	suite.Equal(gorm.ErrRecordNotFound, err)
}

func (suite *ProjectRepositoryTestSuite) TestMetadataJSONBOperations() {
	// Arrange
	metadata := map[string]interface{}{
		"health":        "https://health.example.com",
		"alerts":        "https://alerts.example.com",
		"documentation": "https://docs.example.com",
		"tags":          []string{"production", "critical"},
		"config": map[string]interface{}{
			"timeout": 30,
			"retries": 3,
		},
	}
	project := suite.factories.Project.WithMetadata(metadata)
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act - Retrieve and verify
	retrieved, err := suite.repo.GetByID(project.ID)
	suite.NoError(err)

	var retrievedMetadata map[string]interface{}
	err = json.Unmarshal(retrieved.Metadata, &retrievedMetadata)
	suite.NoError(err)

	// Assert - Verify complex nested structure
	suite.Equal("https://health.example.com", retrievedMetadata["health"])
	suite.Equal("https://alerts.example.com", retrievedMetadata["alerts"])
	suite.NotNil(retrievedMetadata["tags"])
	suite.NotNil(retrievedMetadata["config"])
}

func (suite *ProjectRepositoryTestSuite) TestUnicodeCharactersInFields() {
	// Arrange
	project := suite.factories.Project.Create()
	project.Name = "unicode-test"
	project.Title = "测试项目 🚀"
	project.Description = "Проект с юникодом и эмодзи 😊"
	err := suite.repo.Create(project)
	suite.NoError(err)

	// Act
	retrieved, err := suite.repo.GetByID(project.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("测试项目 🚀", retrieved.Title)
	suite.Equal("Проект с юникодом и эмодзи 😊", retrieved.Description)
}

func (suite *ProjectRepositoryTestSuite) TestBoundaryValues() {
	// Arrange - Test maximum allowed lengths
	project := suite.factories.Project.Create()
	project.Name = strings.Repeat("a", 40)         // Exactly 40 chars
	project.Title = strings.Repeat("1", 100)       // Exactly 100 chars
	project.Description = strings.Repeat("2", 200) // Exactly 200 chars

	// Act
	err := suite.repo.Create(project)

	// Assert
	suite.NoError(err)
	suite.Equal(40, len(project.Name))
	suite.Equal(100, len(project.Title))
	suite.Equal(200, len(project.Description))
}

// Run the test suite
func TestProjectRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(ProjectRepositoryTestSuite))
}
