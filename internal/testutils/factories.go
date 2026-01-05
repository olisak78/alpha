package testutils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"developer-portal-backend/internal/database/models"

	"github.com/google/uuid"
)

// OrganizationFactory provides methods to create test Organization data
type OrganizationFactory struct{}

// NewOrganizationFactory creates a new OrganizationFactory
func NewOrganizationFactory() *OrganizationFactory {
	return &OrganizationFactory{}
}

// Create creates a test Organization with default values
func (f *OrganizationFactory) Create() *models.Organization {
	return &models.Organization{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-org",
			Title:       "Test Organization Display Name",
			Description: "A test organization for testing purposes",
		},
		Owner: "I00001",
		Email: "org@test.com",
	}
}

// WithName sets a custom name for the organization
func (f *OrganizationFactory) WithName(name string) *models.Organization {
	org := f.Create()
	org.Name = name
	org.Title = name + " Display Name"
	return org
}

// WithDomain sets a custom domain for the organization
func (f *OrganizationFactory) WithDomain(domain string) *models.Organization {
	org := f.Create()
	// Domain field removed in a new model; approximate by setting email for tests
	org.Email = domain
	return org
}

// UserFactory (alias to User) provides methods to create test User data
type UserFactory struct{}

// NewUserFactory creates a new UserFactory
func NewUserFactory() *UserFactory {
	return &UserFactory{}
}

// Create creates a test User with default values
func (f *UserFactory) Create() *models.User {
	id := uuid.New()
	// Generate unique short user id using part of UUID to avoid conflicts
	userID := "I" + id.String()[:6]

	return &models.User{
		TeamID:     nil,
		UserID:     userID,
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@test.com",
		Mobile:     "+1-555-0123",
		TeamDomain: models.TeamDomainDeveloper,
		TeamRole:   models.TeamRoleMember,
	}
}

// WithTeam sets the team ID for the member (user)
func (f *UserFactory) WithTeam(teamID uuid.UUID) *models.User {
	member := f.Create()
	member.TeamID = &teamID
	return member
}

// WithEmail sets a custom email for the member
func (f *UserFactory) WithEmail(email string) *models.User {
	member := f.Create()
	member.Email = email
	return member
}

// WithRole sets a custom role for the member
func (f *UserFactory) WithRole(role models.TeamRole) *models.User {
	member := f.Create()
	member.TeamRole = role
	return member
}

// GroupFactory provides methods to create test Group data
type GroupFactory struct{}

// NewGroupFactory creates a new GroupFactory
func NewGroupFactory() *GroupFactory {
	return &GroupFactory{}
}

// Create creates a test Group with default values
func (f *GroupFactory) Create() *models.Group {
	return &models.Group{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-group",
			Title:       "Test Group",
			Description: "A test group for testing purposes",
		},
		OrgID:      uuid.New(),
		Owner:      "I00001",
		Email:      "group@test.com",
		PictureURL: "https://example.com/picture.png",
	}
}

// WithOrganization sets the organization ID for the group
func (f *GroupFactory) WithOrganization(orgID uuid.UUID) *models.Group {
	group := f.Create()
	group.OrgID = orgID
	return group
}

// WithName sets a custom name for the group
func (f *GroupFactory) WithName(name string) *models.Group {
	group := f.Create()
	group.Name = name
	group.Title = name + " Group"
	return group
}

// TeamFactory provides methods to create test Team data
type TeamFactory struct{}

// NewTeamFactory creates a new TeamFactory
func NewTeamFactory() *TeamFactory {
	return &TeamFactory{}
}

// Create creates a test Team with default values
func (f *TeamFactory) Create() *models.Team {
	return &models.Team{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-team",
			Title:       "Test Team",
			Description: "A test team for testing purposes",
		},
		GroupID:    uuid.New(),
		Owner:      "I00001",
		Email:      "team@test.com",
		PictureURL: "https://example.com/picture.png",
	}
}

// WithGroup sets the group ID for the team
func (f *TeamFactory) WithGroup(groupID uuid.UUID) *models.Team {
	team := f.Create()
	team.GroupID = groupID
	return team
}

// WithOrganization creates a team with a group in the specified organization
func (f *TeamFactory) WithOrganization(orgID uuid.UUID) *models.Team {
	// Create a default group for the organization
	groupFactory := NewGroupFactory()
	group := groupFactory.WithOrganization(orgID)

	team := f.Create()
	team.GroupID = group.ID
	return team
}

// WithName sets a custom name for the team
func (f *TeamFactory) WithName(name string) *models.Team {
	team := f.Create()
	team.Name = name
	team.Title = name + " Team"
	return team
}

// ProjectFactory provides methods to create test Project data
type ProjectFactory struct{}

// NewProjectFactory creates a new ProjectFactory
func NewProjectFactory() *ProjectFactory {
	return &ProjectFactory{}
}

// Create creates a test Project with default values
func (f *ProjectFactory) Create() *models.Project {
	return &models.Project{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-project",
			Title:       "Test Project",
			Description: "A test project for testing purposes",
		},
	}
}

// WithName sets a custom name for the project
func (f *ProjectFactory) WithName(name string) *models.Project {
	project := f.Create()
	project.Name = name
	project.Title = name + " Project"
	return project
}

// WithMetadata sets custom metadata for the project
func (f *ProjectFactory) WithMetadata(metadata map[string]interface{}) *models.Project {
	project := f.Create()
	metadataBytes, _ := json.Marshal(metadata)
	project.Metadata = metadataBytes
	return project
}

// WithAlertsRepo creates a project with alert repository metadata
func (f *ProjectFactory) WithAlertsRepo(alertsRepoURL string) *models.Project {
	metadata := map[string]interface{}{
		"alerts": alertsRepoURL,
	}
	return f.WithMetadata(metadata)
}

// ComponentFactory provides methods to create test Component data
type ComponentFactory struct{}

// NewComponentFactory creates a new ComponentFactory
func NewComponentFactory() *ComponentFactory {
	return &ComponentFactory{}
}

// Create creates a test Component with default values
func (f *ComponentFactory) Create() *models.Component {
	return &models.Component{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-component",
			Title:       "Test Component",
			Description: "A test component for testing purposes",
		},
		ProjectID: uuid.New(),
		OwnerID:   uuid.New(),
	}
}

// WithName sets a custom name for the component
func (f *ComponentFactory) WithName(name string) *models.Component {
	component := f.Create()
	component.Name = name
	component.Title = name + " Component"
	return component
}

// LandscapeFactory provides methods to create test Landscape data
type LandscapeFactory struct{}

// NewLandscapeFactory creates a new LandscapeFactory
func NewLandscapeFactory() *LandscapeFactory {
	return &LandscapeFactory{}
}

// Create creates a test Landscape with default values
func (f *LandscapeFactory) Create() *models.Landscape {
	return &models.Landscape{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-landscape",
			Title:       "Test Landscape",
			Description: "A test landscape for testing purposes",
		},
		ProjectID:   uuid.New(),
		Domain:      "example.com",
		Environment: "development",
	}
}

// WithName sets a custom name for the landscape
func (f *LandscapeFactory) WithName(name string) *models.Landscape {
	landscape := f.Create()
	// Truncate name to 40 chars (BaseModel.Name has max length 40)
	if len(name) > 40 {
		name = name[:40]
	}
	landscape.Name = name
	landscape.Title = name + " Landscape"
	return landscape
}

// ComponentDeploymentFactory provides methods to create test ComponentDeployment data
type ComponentDeploymentFactory struct{}

// NewComponentDeploymentFactory creates a new ComponentDeploymentFactory
func NewComponentDeploymentFactory() *ComponentDeploymentFactory {
	return &ComponentDeploymentFactory{}
}

// LinkFactory provides methods to create test Link data
type LinkFactory struct{}

// NewLinkFactory creates a new LinkFactory
func NewLinkFactory() *LinkFactory {
	return &LinkFactory{}
}

// Create creates a test Link with default values
func (f *LinkFactory) Create() *models.Link {
	return &models.Link{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-link",
			Title:       "Test Link",
			Description: "A test link for testing purposes",
		},
		Owner:      uuid.New(),
		URL:        "https://example.com",
		CategoryID: uuid.New(),
		Tags:       "test,link",
	}
}

// CreateWithOwner creates a link with a custom owner
func (f *LinkFactory) CreateWithOwner(owner uuid.UUID) *models.Link {
	link := f.Create()
	link.Owner = owner
	return link
}

// CreateWithCategory creates a link with a custom category
func (f *LinkFactory) CreateWithCategory(categoryID uuid.UUID) *models.Link {
	link := f.Create()
	link.CategoryID = categoryID
	return link
}

// CreateWithOwnerAndCategory creates a link with custom owner and category
func (f *LinkFactory) CreateWithOwnerAndCategory(owner, categoryID uuid.UUID) *models.Link {
	link := f.Create()
	link.Owner = owner
	link.CategoryID = categoryID
	return link
}

// CreateWithDetails creates a link with all custom details
func (f *LinkFactory) CreateWithDetails(owner, categoryID uuid.UUID, title, url, tags string) *models.Link {
	link := f.Create()
	link.Owner = owner
	link.CategoryID = categoryID
	link.Title = title
	// Truncate name to 40 characters to fit database constraint
	name := strings.ToLower(strings.ReplaceAll(title, " ", "-"))
	if len(name) > 40 {
		// Add unique suffix when truncating to avoid duplicates
		name = name[:34] + "-" + uuid.New().String()[:5]
	}
	link.Name = name
	link.URL = url
	link.Tags = tags
	return link
}

// CategoryFactory provides methods to create test Category data
type CategoryFactory struct{}

// NewCategoryFactory creates a new CategoryFactory
func NewCategoryFactory() *CategoryFactory {
	return &CategoryFactory{}
}

// Create creates a test Category with default values
func (f *CategoryFactory) Create() *models.Category {
	return &models.Category{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        "test-category",
			Title:       "Test Category",
			Description: "A test category for testing purposes",
		},
		Icon:  "test-icon",
		Color: "blue",
	}
}

// WithName sets a custom name for the category
func (f *CategoryFactory) WithName(name string) *models.Category {
	category := f.Create()
	category.Name = name
	category.Title = name + " Category"
	return category
}

// WithIconAndColor sets custom icon and color for the category
func (f *CategoryFactory) WithIconAndColor(icon, color string) *models.Category {
	category := f.Create()
	category.Icon = icon
	category.Color = color
	return category
}

// CreateWithDetails creates a category with all custom details
func (f *CategoryFactory) CreateWithDetails(name, title, icon, color string) *models.Category {
	return &models.Category{
		BaseModel: models.BaseModel{
			ID:          uuid.New(),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Name:        name,
			Title:       title,
			Description: "A test category for testing purposes",
		},
		Icon:  icon,
		Color: color,
	}
}

// FactorySet provides access to all factories
type FactorySet struct {
	Organization        *OrganizationFactory
	User                *UserFactory
	Group               *GroupFactory
	Team                *TeamFactory
	Project             *ProjectFactory
	Component           *ComponentFactory
	Landscape           *LandscapeFactory
	ComponentDeployment *ComponentDeploymentFactory
	Link                *LinkFactory
	Category            *CategoryFactory
}

// NewFactorySet creates a new FactorySet with all factories initialized
func NewFactorySet() *FactorySet {
	return &FactorySet{
		Organization:        NewOrganizationFactory(),
		User:                NewUserFactory(),
		Group:               NewGroupFactory(),
		Team:                NewTeamFactory(),
		Project:             NewProjectFactory(),
		Component:           NewComponentFactory(),
		Landscape:           NewLandscapeFactory(),
		ComponentDeployment: NewComponentDeploymentFactory(),
		Link:                NewLinkFactory(),
		Category:            NewCategoryFactory(),
	}
}

// GitHubGraphQLMockServerFactory provides methods to create mock GraphQL servers for testing
type GitHubGraphQLMockServerFactory struct{}

// NewGitHubGraphQLMockServerFactory creates a new GitHubGraphQLMockServerFactory
func NewGitHubGraphQLMockServerFactory() *GitHubGraphQLMockServerFactory {
	return &GitHubGraphQLMockServerFactory{}
}

// CreateContributionsServer creates a mock GraphQL server that returns contribution data
func (f *GitHubGraphQLMockServerFactory) CreateContributionsServer(totalContributions int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"data": map[string]interface{}{
				"viewer": map[string]interface{}{
					"contributionsCollection": map[string]interface{}{
						"startedAt": "2024-10-16T00:00:00Z",
						"endedAt":   "2025-10-16T23:59:59Z",
						"contributionCalendar": map[string]interface{}{
							"totalContributions": totalContributions,
						},
					},
				},
			},
		}
		err := json.NewEncoder(w).Encode(resp)
		if err != nil {
			return
		}
	}))
}

// CreatePRReviewCommentsServer creates a mock REST API server that returns PR review comments data
func (f *GitHubGraphQLMockServerFactory) CreatePRReviewCommentsServer(totalCount int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Mock GitHub search API response for PR review comments
		items := make([]map[string]interface{}, 0)
		for i := 0; i < totalCount && i < 100; i++ {
			items = append(items, map[string]interface{}{
				"id":     i + 1,
				"number": i + 1,
				"title":  "Test PR " + string(rune(i+1)),
			})
		}

		resp := map[string]interface{}{
			"total_count":        totalCount,
			"incomplete_results": false,
			"items":              items,
		}
		err := json.NewEncoder(w).Encode(resp)
		if err != nil {
			return
		}
	}))
}

// PRMergeTimeData represents a single PR with creation and merge times
type PRMergeTimeData struct {
	CreatedAt time.Time
	MergedAt  time.Time
}

// CreatePRMergeTimeServer creates a mock GraphQL server that returns PR merge time data
func (f *GitHubGraphQLMockServerFactory) CreatePRMergeTimeServer(prs []PRMergeTimeData) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Build nodes from PR data
		nodes := make([]map[string]interface{}, len(prs))
		for i, pr := range prs {
			nodes[i] = map[string]interface{}{
				"createdAt": pr.CreatedAt.Format(time.RFC3339),
				"mergedAt":  pr.MergedAt.Format(time.RFC3339),
			}
		}

		resp := map[string]interface{}{
			"data": map[string]interface{}{
				"search": map[string]interface{}{
					"pageInfo": map[string]interface{}{
						"hasNextPage": false,
						"endCursor":   nil,
					},
					"nodes": nodes,
				},
			},
		}
		err := json.NewEncoder(w).Encode(resp)
		if err != nil {
			return
		}
	}))
}

// CreatePRMergeTimeServerWithPagination creates a mock GraphQL server with pagination support
func (f *GitHubGraphQLMockServerFactory) CreatePRMergeTimeServerWithPagination(pages [][]PRMergeTimeData) *httptest.Server {
	currentPage := 0
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if currentPage >= len(pages) {
			currentPage = len(pages) - 1
		}

		prs := pages[currentPage]
		hasNextPage := currentPage < len(pages)-1

		// Build nodes from PR data
		nodes := make([]map[string]interface{}, len(prs))
		for i, pr := range prs {
			nodes[i] = map[string]interface{}{
				"createdAt": pr.CreatedAt.Format(time.RFC3339),
				"mergedAt":  pr.MergedAt.Format(time.RFC3339),
			}
		}

		var endCursor interface{}
		if hasNextPage {
			endCursor = fmt.Sprintf("cursor%d", currentPage+1)
		}

		resp := map[string]interface{}{
			"data": map[string]interface{}{
				"search": map[string]interface{}{
					"pageInfo": map[string]interface{}{
						"hasNextPage": hasNextPage,
						"endCursor":   endCursor,
					},
					"nodes": nodes,
				},
			},
		}
		err := json.NewEncoder(w).Encode(resp)
		if err != nil {
			return
		}
		currentPage++
	}))
}
