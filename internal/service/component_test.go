package service_test

import (
	"encoding/json"
	"errors"
	"testing"

	"developer-portal-backend/internal/database/models"
	apperrors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/mocks"
	"developer-portal-backend/internal/service"
	"developer-portal-backend/internal/testutils"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"go.uber.org/mock/gomock"
	"gorm.io/gorm"
)

// ComponentServiceTestSuite defines the test suite for ComponentService
type ComponentServiceTestSuite struct {
	suite.Suite
	ctrl              *gomock.Controller
	mockComponentRepo *mocks.MockComponentRepositoryInterface
	mockOrgRepo       *mocks.MockOrganizationRepositoryInterface
	mockProjectRepo   *mocks.MockProjectRepositoryInterface
	componentService  *service.ComponentService
	validator         *validator.Validate
	factories         *testutils.FactorySet
}

// SetupTest sets up the test suite
func (suite *ComponentServiceTestSuite) SetupTest() {
	suite.ctrl = gomock.NewController(suite.T())
	suite.mockComponentRepo = mocks.NewMockComponentRepositoryInterface(suite.ctrl)
	suite.mockOrgRepo = mocks.NewMockOrganizationRepositoryInterface(suite.ctrl)
	suite.mockProjectRepo = mocks.NewMockProjectRepositoryInterface(suite.ctrl)
	suite.validator = validator.New()
	suite.factories = testutils.NewFactorySet()

	// Create service with mock repositories
	suite.componentService = service.NewComponentService(
		suite.mockComponentRepo,
		suite.mockOrgRepo,
		suite.mockProjectRepo,
		suite.validator,
	)
}

// TearDownTest cleans up after each test
func (suite *ComponentServiceTestSuite) TearDownTest() {
	suite.ctrl.Finish()
}

// ============================================================================
// GetByProjectNameAllView Tests
// ============================================================================

// TestGetByProjectNameAllView_Success_NoMetadata tests successful retrieval with components having no metadata
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Success_NoMetadata() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	component1 := suite.factories.Component.WithName("component-1")
	component1.ProjectID = project.ID
	component1.OwnerID = uuid.New()
	component1.Metadata = nil

	component2 := suite.factories.Component.WithName("component-2")
	component2.ProjectID = project.ID
	component2.OwnerID = uuid.New()
	component2.Metadata = nil

	components := []models.Component{*component1, *component2}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(2), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 2)
	assert.Equal(suite.T(), component1.ID, result[0].ID)
	assert.Equal(suite.T(), component1.Name, result[0].Name)
	assert.Equal(suite.T(), component1.Title, result[0].Title)
	assert.Equal(suite.T(), component1.Description, result[0].Description)
	assert.Equal(suite.T(), component1.OwnerID, result[0].OwnerID)
	assert.Empty(suite.T(), result[0].QOS)
	assert.Empty(suite.T(), result[0].Sonar)
	assert.Empty(suite.T(), result[0].GitHub)
	assert.Nil(suite.T(), result[0].CentralService)
	assert.Nil(suite.T(), result[0].IsLibrary)
	assert.Nil(suite.T(), result[0].Health)
}

// TestGetByProjectNameAllView_Success_FullMetadata tests successful retrieval with all metadata fields
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Success_FullMetadata() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	// Create metadata with all fields
	metadata := map[string]interface{}{
		"ci": map[string]interface{}{
			"qos": "https://qos.example.com/dashboard",
		},
		"sonar": map[string]interface{}{
			"project_id": "my-sonar-project",
		},
		"github": map[string]interface{}{
			"url": "https://github.com/org/repo",
		},
		"central-service": true,
		"isLibrary":       false,
		"health":          true,
	}
	metadataJSON, _ := json.Marshal(metadata)

	component := suite.factories.Component.Create()
	component.ProjectID = project.ID
	component.Metadata = metadataJSON

	components := []models.Component{*component}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(1), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 1)
	assert.Equal(suite.T(), "https://qos.example.com/dashboard", result[0].QOS)
	assert.Equal(suite.T(), "https://sonar.tools.sap/dashboard?id=my-sonar-project", result[0].Sonar)
	assert.Equal(suite.T(), "https://github.com/org/repo", result[0].GitHub)
	assert.NotNil(suite.T(), result[0].CentralService)
	assert.True(suite.T(), *result[0].CentralService)
	assert.NotNil(suite.T(), result[0].IsLibrary)
	assert.False(suite.T(), *result[0].IsLibrary)
	assert.NotNil(suite.T(), result[0].Health)
	assert.True(suite.T(), *result[0].Health)
}

// TestGetByProjectNameAllView_Success_PartialMetadata tests successful retrieval with partial metadata
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Success_PartialMetadata() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	// Create metadata with only some fields
	metadata := map[string]interface{}{
		"ci": map[string]interface{}{
			"qos": "https://qos.example.com",
		},
		"health": true,
	}
	metadataJSON, _ := json.Marshal(metadata)

	component := suite.factories.Component.Create()
	component.ProjectID = project.ID
	component.Metadata = metadataJSON

	components := []models.Component{*component}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(1), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 1)
	assert.Equal(suite.T(), "https://qos.example.com", result[0].QOS)
	assert.Empty(suite.T(), result[0].Sonar)        // Not present in metadata
	assert.Empty(suite.T(), result[0].GitHub)       // Not present in metadata
	assert.Nil(suite.T(), result[0].CentralService) // Not present in metadata
	assert.Nil(suite.T(), result[0].IsLibrary)      // Not present in metadata
	assert.NotNil(suite.T(), result[0].Health)
	assert.True(suite.T(), *result[0].Health)
}

// TestGetByProjectNameAllView_Success_NoComponents tests successful retrieval when project has no components
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Success_NoComponents() {
	// Arrange
	projectName := "empty-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	components := []models.Component{}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(0), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Empty(suite.T(), result)
	assert.NotNil(suite.T(), result) // Should be empty array, not nil
}

// TestGetByProjectNameAllView_Success_EmptyProjectName tests that empty project name returns empty array
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Success_EmptyProjectName() {
	// Arrange
	projectName := ""

	// No mock expectations - should return early

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Empty(suite.T(), result)
	assert.NotNil(suite.T(), result) // Should be empty array, not nil
}

// TestGetByProjectNameAllView_Error_ProjectNotFound tests error when project doesn't exist
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Error_ProjectNotFound() {
	// Arrange
	projectName := "nonexistent-project"

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(nil, gorm.ErrRecordNotFound).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.True(suite.T(), errors.Is(err, apperrors.ErrProjectNotFound))
}

// TestGetByProjectNameAllView_Error_ProjectRepoFailure tests error when project repository fails
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Error_ProjectRepoFailure() {
	// Arrange
	projectName := "test-project"
	repoError := errors.New("database connection failed")

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(nil, repoError).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "failed to resolve project by name")
}

// TestGetByProjectNameAllView_Error_ComponentRepoFailure tests error when component repository fails
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_Error_ComponentRepoFailure() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()
	repoError := errors.New("database query timeout")

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(nil, int64(0), repoError).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "failed to get components by project")
}

// TestGetByProjectNameAllView_EdgeCase_InvalidJSONMetadata tests resilience to invalid JSON metadata
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_EdgeCase_InvalidJSONMetadata() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	component := suite.factories.Component.Create()
	component.ProjectID = project.ID
	component.Metadata = []byte("{invalid json}") // Invalid JSON

	components := []models.Component{*component}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(1), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err) // Should not fail, just skip metadata extraction
	assert.Len(suite.T(), result, 1)
	assert.Empty(suite.T(), result[0].QOS)
	assert.Empty(suite.T(), result[0].Sonar)
	assert.Empty(suite.T(), result[0].GitHub)
	assert.Nil(suite.T(), result[0].CentralService)
	assert.Nil(suite.T(), result[0].IsLibrary)
	assert.Nil(suite.T(), result[0].Health)
}

// TestGetByProjectNameAllView_EdgeCase_WrongMetadataTypes tests handling of wrong data types in metadata
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_EdgeCase_WrongMetadataTypes() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	// Create metadata with wrong types
	metadata := map[string]interface{}{
		"ci": "not-a-map", // Should be a map
		"sonar": map[string]interface{}{
			"project_id": 12345, // Should be string, is int
		},
		"central-service": "true", // Should be bool, is string
		"health":          "yes",  // Should be bool, is string
	}
	metadataJSON, _ := json.Marshal(metadata)

	component := suite.factories.Component.Create()
	component.ProjectID = project.ID
	component.Metadata = metadataJSON

	components := []models.Component{*component}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(1), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err) // Should not fail, type assertions will fail silently
	assert.Len(suite.T(), result, 1)
	assert.Empty(suite.T(), result[0].QOS)          // ci is not a map, so qos won't be extracted
	assert.Empty(suite.T(), result[0].Sonar)        // project_id is not string, won't build URL
	assert.Nil(suite.T(), result[0].CentralService) // Not a bool, won't be set
	assert.Nil(suite.T(), result[0].Health)         // Not a bool, won't be set
}

// TestGetByProjectNameAllView_EdgeCase_MissingNestedFields tests handling of missing nested metadata fields
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_EdgeCase_MissingNestedFields() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	// Create metadata with nested structures but missing fields
	metadata := map[string]interface{}{
		"ci":     map[string]interface{}{}, // Empty map, no qos
		"sonar":  map[string]interface{}{}, // Empty map, no project_id
		"github": map[string]interface{}{}, // Empty map, no url
	}
	metadataJSON, _ := json.Marshal(metadata)

	component := suite.factories.Component.Create()
	component.ProjectID = project.ID
	component.Metadata = metadataJSON

	components := []models.Component{*component}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(1), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 1)
	assert.Empty(suite.T(), result[0].QOS)
	assert.Empty(suite.T(), result[0].Sonar)
	assert.Empty(suite.T(), result[0].GitHub)
}

// TestGetByProjectNameAllView_EdgeCase_MixedMetadataQuality tests multiple components with varying metadata quality
func (suite *ComponentServiceTestSuite) TestGetByProjectNameAllView_EdgeCase_MixedMetadataQuality() {
	// Arrange
	projectName := "test-project"
	project := suite.factories.Project.WithName(projectName)
	project.ID = uuid.New()

	// Component 1: Full metadata
	metadata1 := map[string]interface{}{
		"ci":              map[string]interface{}{"qos": "https://qos1.example.com"},
		"central-service": true,
		"health":          true,
	}
	metadataJSON1, _ := json.Marshal(metadata1)
	component1 := suite.factories.Component.WithName("component-1")
	component1.ProjectID = project.ID
	component1.Metadata = metadataJSON1

	// Component 2: Invalid JSON
	component2 := suite.factories.Component.WithName("component-2")
	component2.ProjectID = project.ID
	component2.Metadata = []byte("{invalid}")

	// Component 3: No metadata
	component3 := suite.factories.Component.WithName("component-3")
	component3.ProjectID = project.ID
	component3.Metadata = nil

	// Component 4: Partial metadata with wrong types
	metadata4 := map[string]interface{}{
		"ci":     "not-a-map",
		"health": "true", // String instead of bool
	}
	metadataJSON4, _ := json.Marshal(metadata4)
	component4 := suite.factories.Component.WithName("component-4")
	component4.ProjectID = project.ID
	component4.Metadata = metadataJSON4

	components := []models.Component{*component1, *component2, *component3, *component4}

	suite.mockProjectRepo.EXPECT().
		GetByName(projectName).
		Return(project, nil).
		Times(1)

	suite.mockComponentRepo.EXPECT().
		GetComponentsByProjectID(project.ID, 1000000, 0).
		Return(components, int64(4), nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByProjectNameAllView(projectName)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 4)

	// Component 1: Full metadata extracted
	assert.Equal(suite.T(), "https://qos1.example.com", result[0].QOS)
	assert.NotNil(suite.T(), result[0].CentralService)
	assert.True(suite.T(), *result[0].CentralService)
	assert.NotNil(suite.T(), result[0].Health)
	assert.True(suite.T(), *result[0].Health)

	// Component 2: Invalid JSON, no metadata extracted
	assert.Empty(suite.T(), result[1].QOS)
	assert.Nil(suite.T(), result[1].CentralService)
	assert.Nil(suite.T(), result[1].Health)

	// Component 3: No metadata
	assert.Empty(suite.T(), result[2].QOS)
	assert.Nil(suite.T(), result[2].CentralService)
	assert.Nil(suite.T(), result[2].Health)

	// Component 4: Wrong types, no metadata extracted
	assert.Empty(suite.T(), result[3].QOS)
	assert.Nil(suite.T(), result[3].Health)
}

// ============================================================================
// GetProjectTitleByID Tests
// ============================================================================

// TestGetProjectTitleByID_Success tests successful retrieval of project title
func (suite *ComponentServiceTestSuite) TestGetProjectTitleByID_Success() {
	// Arrange
	projectID := uuid.New()
	project := suite.factories.Project.Create()
	project.ID = projectID
	project.Title = "My Awesome Project"

	suite.mockProjectRepo.EXPECT().
		GetByID(projectID).
		Return(project, nil).
		Times(1)

	// Act
	title, err := suite.componentService.GetProjectTitleByID(projectID)

	// Assert
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "My Awesome Project", title)
}

// TestGetProjectTitleByID_Error_ProjectNotFound tests error when project doesn't exist
func (suite *ComponentServiceTestSuite) TestGetProjectTitleByID_Error_ProjectNotFound() {
	// Arrange
	projectID := uuid.New()

	suite.mockProjectRepo.EXPECT().
		GetByID(projectID).
		Return(nil, gorm.ErrRecordNotFound).
		Times(1)

	// Act
	title, err := suite.componentService.GetProjectTitleByID(projectID)

	// Assert
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), title)
	assert.True(suite.T(), errors.Is(err, apperrors.ErrProjectNotFound))
}

// TestGetProjectTitleByID_Error_RepositoryFailure tests error when repository fails
func (suite *ComponentServiceTestSuite) TestGetProjectTitleByID_Error_RepositoryFailure() {
	// Arrange
	projectID := uuid.New()
	repoError := errors.New("database connection lost")

	suite.mockProjectRepo.EXPECT().
		GetByID(projectID).
		Return(nil, repoError).
		Times(1)

	// Act
	title, err := suite.componentService.GetProjectTitleByID(projectID)

	// Assert
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), title)
	assert.Contains(suite.T(), err.Error(), "failed to get project")
}

// ============================================================================
// GetByID Tests
// ============================================================================

// TestGetByID_Success tests successful retrieval of component by ID
func (suite *ComponentServiceTestSuite) TestGetByID_Success() {
	// Arrange
	componentID := uuid.New()
	component := suite.factories.Component.Create()
	component.ID = componentID

	suite.mockComponentRepo.EXPECT().
		GetByID(componentID).
		Return(component, nil).
		Times(1)

	// Act
	result, err := suite.componentService.GetByID(componentID)

	// Assert
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), componentID, result.ID)
	assert.Equal(suite.T(), component.Name, result.Name)
	assert.Equal(suite.T(), component.Title, result.Title)
	assert.Equal(suite.T(), component.Description, result.Description)
	assert.Equal(suite.T(), component.ProjectID, result.ProjectID)
	assert.Equal(suite.T(), component.OwnerID, result.OwnerID)
}

// TestGetByID_Error_ComponentNotFound tests error when component doesn't exist
func (suite *ComponentServiceTestSuite) TestGetByID_Error_ComponentNotFound() {
	// Arrange
	componentID := uuid.New()

	suite.mockComponentRepo.EXPECT().
		GetByID(componentID).
		Return(nil, gorm.ErrRecordNotFound).
		Times(1)

	// Act
	result, err := suite.componentService.GetByID(componentID)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.True(suite.T(), errors.Is(err, apperrors.ErrComponentNotFound))
}

// TestGetByID_Error_RepositoryFailure tests error when repository fails
func (suite *ComponentServiceTestSuite) TestGetByID_Error_RepositoryFailure() {
	// Arrange
	componentID := uuid.New()
	repoError := errors.New("network timeout")

	suite.mockComponentRepo.EXPECT().
		GetByID(componentID).
		Return(nil, repoError).
		Times(1)

	// Act
	result, err := suite.componentService.GetByID(componentID)

	// Assert
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "failed to get component")
}

// ============================================================================
// Test Suite Runner
// ============================================================================

// TestComponentServiceTestSuite runs the test suite
func TestComponentServiceTestSuite(t *testing.T) {
	suite.Run(t, new(ComponentServiceTestSuite))
}
