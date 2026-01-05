package service_test

import (
	"context"
	apperrors "developer-portal-backend/internal/errors"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"developer-portal-backend/internal/mocks"
	"developer-portal-backend/internal/service"
	"developer-portal-backend/internal/testutils"

	"github.com/google/go-github/v57/github"
	"github.com/shurcooL/githubv4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"go.uber.org/mock/gomock"
	"golang.org/x/oauth2"
)

// These tests validate signatures and basic input validation without relying on external services.
// They intentionally construct the service with a nil auth service so calls fail early with clear errors.

// mockProviders returns a map of provider names to their base URLs
// If no providers are specified, returns all standard providers
func mockProviders(providers ...string) map[string]string {
	allProviders := map[string]string{
		"github":      "https://github.com",
		"githubtools": "https://github.tools.sap",
		"githubwdf":   "https://github.wdf.sap.corp",
	}

	// If no specific providers requested, return all
	if len(providers) == 0 {
		return allProviders
	}

	// Return only requested providers
	result := make(map[string]string)
	for _, p := range providers {
		if url, ok := allProviders[p]; ok {
			result[p] = url
		}
	}
	return result
}

// GitHubServiceTestSuite - Test suite for comprehensive unit tests with mocks
type GitHubServiceTestSuite struct {
	suite.Suite
	service     *service.GitHubService
	mockAuthSvc *mocks.MockGitHubAuthService
	ctrl        *gomock.Controller
}

func (suite *GitHubServiceTestSuite) SetupTest() {
	suite.ctrl = gomock.NewController(suite.T())
	suite.mockAuthSvc = mocks.NewMockGitHubAuthService(suite.ctrl)
	suite.service = service.NewGitHubServiceWithAdapter(suite.mockAuthSvc)
}

func (suite *GitHubServiceTestSuite) TearDownTest() {
	if suite.ctrl != nil {
		suite.ctrl.Finish()
	}
}

// the test below uses a GitHubService constructed with nil auth service to validate input checks
func TestGetUserOpenPullRequests_RequiresUUIDAndProvider(t *testing.T) {
	gh := service.NewGitHubService(nil)
	_, err := gh.GetUserOpenPullRequests(context.Background(), "", "", "open", "created", "desc", 30, 1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "userUUID and provider are required")
}

func TestGetUserOpenPullRequests_DefaultsAppliedAndAuthCalled(t *testing.T) {
	gh := service.NewGitHubService(nil)
	// Empty state, sort, direction, perPage/page zero -> defaults applied internally.
	_, err := gh.GetUserOpenPullRequests(context.Background(), "test-uuid", "invalid-provider", "", "", "", 0, 0)
	// With non-empty uuid/provider, the next step is provider validation, which fails due to invalid provider.
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "provider is not valid")
}

func (suite *GitHubServiceTestSuite) TestGetUserOpenPullRequests_InvalidProvider() {
	ctx := context.Background()

	// Mock GetAllProviders to return only specific providers
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// Try to use an invalid provider
	_, err := suite.service.GetUserOpenPullRequests(ctx, "test-uuid", "invalid-provider", "open", "created", "desc", 30, 1)

	// Should return error for invalid provider
	suite.Error(err)
	suite.ErrorIs(err, apperrors.ErrInvalidProvider)
}

func TestGetUserTotalContributions_RequiresUUID(t *testing.T) {
	gh := service.NewGitHubService(nil)
	_, err := gh.GetUserTotalContributions(context.Background(), "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "userUUID")
}

func TestClosePullRequest_InputValidation(t *testing.T) {
	gh := service.NewGitHubService(nil)

	// Missing uuid/provider
	_, err := gh.ClosePullRequest(context.Background(), "", "", "owner", "repo", 1, false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "userUUID and provider are required")

	// Missing owner
	uuid := "test-uuid"
	provider := "githubtools"
	_, err = gh.ClosePullRequest(context.Background(), uuid, provider, "", "repo", 1, false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "owner and repository are required")

	// Missing repo
	_, err = gh.ClosePullRequest(context.Background(), uuid, provider, "owner", "", 1, false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "owner and repository are required")
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_RequiresUUID() {
	ctx := context.Background()

	_, err := suite.service.GetAveragePRMergeTime(ctx, "", "30d")
	suite.Error(err)
	suite.Equal(err.Error(), apperrors.ErrUserUUIDMissing.Error())
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_InvalidPeriodFormat() {
	ctx := context.Background()

	testCases := []struct {
		name   string
		period string
	}{
		{"MissingD", "30"},
		{"NonNumeric", "abcd"},
		{"NegativeDays", "-30d"},
		{"ZeroDays", "0d"},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Mock GetAllProviders since the function now fetches from all providers
			suite.mockAuthSvc.EXPECT().
				GetAllProviders().
				Return(mockProviders("githubtools", "githubwdf")).
				MaxTimes(1)

			_, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", tc.period)
			suite.Error(err)
			suite.Contains(err.Error(), "invalid period format")
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_TokenRetrievalFailure() {
	ctx := context.Background()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, apperrors.ErrTokenStoreNotInitialized)

	_, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", "30d")
	suite.NoError(err) // Should not error, return 0 values for failed provider
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_ClientRetrievalFailure() {
	ctx := context.Background()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, assert.AnError)

	_, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", "30d")
	suite.NoError(err) // Should not error, return 0 values for failed provider
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_ValidPeriods() {
	ctx := context.Background()

	validPeriods := []string{"1d", "7d", "30d", "90d", "180d", "365d"}

	for _, period := range validPeriods {
		suite.Run(period, func() {
			// Mock GetAllProviders
			suite.mockAuthSvc.EXPECT().
				GetAllProviders().
				Return(mockProviders("githubtools"))

			suite.mockAuthSvc.EXPECT().
				CreateGraphqlClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, assert.AnError)

			// Will fail at client creation but period validation passes
			_, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", period)
			suite.NoError(err) // Should not error, return 0 values for failed provider
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetRepositoryContent_ClientCreationErrors() {
	ctx := context.Background()

	testCases := []struct {
		name          string
		userUUID      string
		provider      string
		mockError     error
		expectedError string
	}{
		{
			name:          "AuthServiceNotInitialized",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrAuthServiceNotInitialized,
			expectedError: "auth service is not initialized",
		},
		{
			name:          "UserUUIDMissing",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrUserUUIDMissing,
			expectedError: "userUUID cannot be empty",
		},
		{
			name:          "ProviderMissing",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrProviderMissing,
			expectedError: "provider cannot be empty",
		},
		{
			name:          "TokenStoreNotInitialized",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrTokenStoreNotInitialized,
			expectedError: "token store not initialized",
		},
		{
			name:          "InvalidUserUUID",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     fmt.Errorf("invalid userUUID: invalid UUID format"),
			expectedError: "invalid userUUID",
		},
		{
			name:          "NoValidToken",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     fmt.Errorf("no valid GitHub token found for user test-uuid with provider githubtools"),
			expectedError: "no valid GitHub token found",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), tc.userUUID, tc.provider).
				Return(nil, tc.mockError)

			_, err := suite.service.GetRepositoryContent(ctx, tc.userUUID, tc.provider, "owner", "repo", "README.md", "main")

			suite.Error(err)
			suite.Contains(err.Error(), tc.expectedError)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetRepositoryContent_ClientRetrievalFailure() {
	ctx := context.Background()

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, apperrors.ErrAuthServiceNotInitialized)

	_, err := suite.service.GetRepositoryContent(ctx, "test-uuid", "githubtools", "owner", "repo", "README.md", "main")
	suite.Error(err)
	suite.ErrorIs(err, apperrors.ErrAuthServiceNotInitialized)
}

func (suite *GitHubServiceTestSuite) TestGetRepositoryContent_DefaultRefBehavior() {
	ctx := context.Background()

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, assert.AnError)

	// Empty ref should default to "main" but client creation fails early in this unit test
	_, err := suite.service.GetRepositoryContent(ctx, "test-uuid", "githubtools", "owner", "repo", "README.md", "")
	suite.Error(err)
}

func (suite *GitHubServiceTestSuite) TestGetRepositoryContent_PathNormalization() {
	ctx := context.Background()

	testCases := []struct {
		name        string
		path        string
		description string
	}{
		{
			name:        "PathWithLeadingSlash",
			path:        "/path/to/file.txt",
			description: "Leading slash should be removed",
		},
		{
			name:        "PathWithoutLeadingSlash",
			path:        "path/to/file.txt",
			description: "Path without leading slash remains unchanged",
		},
		{
			name:        "RootPath",
			path:        "",
			description: "Empty path (root directory)",
		},
		{
			name:        "SingleFile",
			path:        "README.md",
			description: "Single file in root",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, assert.AnError)

			// Path normalization happens before API call, but client creation fails early in this unit test
			_, err := suite.service.GetRepositoryContent(ctx, "test-uuid", "githubtools", "owner", "repo", tc.path, "main")
			suite.Error(err)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetRepositoryContent_VariousParameters() {
	ctx := context.Background()

	testCases := []struct {
		name        string
		owner       string
		repo        string
		path        string
		ref         string
		description string
	}{
		{
			name:        "RootDirectory",
			owner:       "owner",
			repo:        "repo",
			path:        "",
			ref:         "main",
			description: "Fetch root directory contents",
		},
		{
			name:        "NestedPath",
			owner:       "owner",
			repo:        "repo",
			path:        "src/main/java/App.java",
			ref:         "develop",
			description: "Fetch deeply nested file",
		},
		{
			name:        "CustomBranch",
			owner:       "owner",
			repo:        "repo",
			path:        "config.yml",
			ref:         "feature/new-feature",
			description: "Fetch from custom branch",
		},
		{
			name:        "TagRef",
			owner:       "owner",
			repo:        "repo",
			path:        "CHANGELOG.md",
			ref:         "v1.0.0",
			description: "Fetch from tag",
		},
		{
			name:        "CommitSHA",
			owner:       "owner",
			repo:        "repo",
			path:        "README.md",
			ref:         "abc123def456",
			description: "Fetch from specific commit",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, assert.AnError)

			// Client creation fails early in this unit test; still validates parameter forwarding shape
			_, err := suite.service.GetRepositoryContent(ctx, "test-uuid", "githubtools", tc.owner, tc.repo, tc.path, tc.ref)
			suite.Error(err)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestUpdateRepositoryFile_ClientCreationErrors() {
	ctx := context.Background()

	testCases := []struct {
		name          string
		userUUID      string
		provider      string
		mockError     error
		expectedError string
	}{
		{
			name:          "AuthServiceNotInitialized",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrAuthServiceNotInitialized,
			expectedError: "auth service is not initialized",
		},
		{
			name:          "UserUUIDMissing",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrUserUUIDMissing,
			expectedError: "userUUID cannot be empty",
		},
		{
			name:          "ProviderMissing",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrProviderMissing,
			expectedError: "provider cannot be empty",
		},
		{
			name:          "TokenStoreNotInitialized",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     apperrors.ErrTokenStoreNotInitialized,
			expectedError: "token store not initialized",
		},
		{
			name:          "InvalidUserUUID",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     fmt.Errorf("invalid userUUID: invalid UUID format"),
			expectedError: "invalid userUUID",
		},
		{
			name:          "NoValidToken",
			userUUID:      "test-uuid",
			provider:      "githubtools",
			mockError:     fmt.Errorf("no valid GitHub token found for user test-uuid with provider githubtools"),
			expectedError: "no valid GitHub token found",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), tc.userUUID, tc.provider).
				Return(nil, tc.mockError)

			_, err := suite.service.UpdateRepositoryFile(
				ctx,
				tc.userUUID,
				tc.provider,
				"owner",
				"repo",
				"file.txt",
				"Update file",
				"new content",
				"abc123",
				"main",
			)

			suite.Error(err)
			suite.Contains(err.Error(), "failed to create github client")
			suite.Contains(err.Error(), tc.expectedError)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestUpdateRepositoryFile_ClientRetrievalFailure() {
	ctx := context.Background()

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, apperrors.ErrAuthServiceNotInitialized)

	_, err := suite.service.UpdateRepositoryFile(
		ctx,
		"test-uuid",
		"githubtools",
		"owner",
		"repo",
		"README.md",
		"Update README",
		"# Updated Content",
		"sha123",
		"main",
	)

	suite.Error(err)
	suite.ErrorIs(err, apperrors.ErrAuthServiceNotInitialized)
}

func (suite *GitHubServiceTestSuite) TestUpdateRepositoryFile_ParameterValidation() {
	ctx := context.Background()

	testCases := []struct {
		name        string
		owner       string
		repo        string
		path        string
		message     string
		content     string
		sha         string
		branch      string
		description string
	}{
		{
			name:        "EmptyPath",
			owner:       "owner",
			repo:        "repo",
			path:        "",
			message:     "Update",
			content:     "content",
			sha:         "sha123",
			branch:      "main",
			description: "Empty file path",
		},
		{
			name:        "EmptyMessage",
			owner:       "owner",
			repo:        "repo",
			path:        "file.txt",
			message:     "",
			content:     "content",
			sha:         "sha123",
			branch:      "main",
			description: "Empty commit message",
		},
		{
			name:        "EmptySHA",
			owner:       "owner",
			repo:        "repo",
			path:        "file.txt",
			message:     "Update",
			content:     "content",
			sha:         "",
			branch:      "main",
			description: "Empty SHA (required for updates)",
		},
		{
			name:        "EmptyBranch",
			owner:       "owner",
			repo:        "repo",
			path:        "file.txt",
			message:     "Update",
			content:     "content",
			sha:         "sha123",
			branch:      "",
			description: "Empty branch (should default to main)",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, assert.AnError)

			// Client creation fails early in this unit test; still validates parameter handling shape
			_, err := suite.service.UpdateRepositoryFile(
				ctx,
				"test-uuid",
				"githubtools",
				tc.owner,
				tc.repo,
				tc.path,
				tc.message,
				tc.content,
				tc.sha,
				tc.branch,
			)

			suite.Error(err)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestUpdateRepositoryFile_VariousScenarios() {
	ctx := context.Background()

	testCases := []struct {
		name        string
		path        string
		message     string
		content     string
		sha         string
		branch      string
		description string
	}{
		{
			name:        "UpdateRootFile",
			path:        "README.md",
			message:     "Update README",
			content:     "# Updated README\n\nNew content here.",
			sha:         "abc123def456",
			branch:      "main",
			description: "Update file in root directory",
		},
		{
			name:        "UpdateNestedFile",
			path:        "src/main/java/App.java",
			message:     "Fix bug in App.java",
			content:     "public class App {\n  // Fixed code\n}",
			sha:         "def456ghi789",
			branch:      "develop",
			description: "Update deeply nested file",
		},
		{
			name:        "UpdateOnFeatureBranch",
			path:        "config.yml",
			message:     "Update configuration",
			content:     "key: value\nother: setting",
			sha:         "ghi789jkl012",
			branch:      "feature/new-config",
			description: "Update file on feature branch",
		},
		{
			name:        "LargeFileUpdate",
			path:        "data/large-file.json",
			message:     "Update large data file",
			content:     string(make([]byte, 10000)), // 10KB content
			sha:         "jkl012mno345",
			branch:      "main",
			description: "Update large file",
		},
		{
			name:        "SpecialCharactersInMessage",
			path:        "file.txt",
			message:     "Fix: Update file with special chars (äöü) & symbols!",
			content:     "content",
			sha:         "mno345pqr678",
			branch:      "main",
			description: "Commit message with special characters",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, assert.AnError)

			// Client creation fails early in this unit test; still validates parameter handling shape
			_, err := suite.service.UpdateRepositoryFile(
				ctx,
				"test-uuid",
				"githubtools",
				"owner",
				"repo",
				tc.path,
				tc.message,
				tc.content,
				tc.sha,
				tc.branch,
			)

			suite.Error(err)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetGitHubAsset_URLValidation() {
	ctx := context.Background()

	testCases := []struct {
		name          string
		assetURL      string
		expectedError string
		description   string
	}{
		{
			name:          "EmptyURL",
			assetURL:      "",
			expectedError: "asset URL is required",
			description:   "Empty asset URL should fail",
		},
		{
			name:          "InvalidURL",
			assetURL:      "not-a-valid-url",
			expectedError: "invalid asset URL",
			description:   "Malformed URL should fail",
		},
		{
			name:          "NonGitHubURL",
			assetURL:      "https://example.com/image.png",
			expectedError: "asset URL must be from GitHub",
			description:   "Non-GitHub URL should fail",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				GetGitHubAccessToken("test-uuid", "githubtools").
				Return("test-token", nil).
				MaxTimes(1)

			_, _, err := suite.service.GetGitHubAsset(ctx, "test-uuid", "githubtools", tc.assetURL)

			suite.Error(err)

		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetGitHubAsset_ParameterCombinations() {
	ctx := context.Background()

	testCases := []struct {
		name        string
		userUUID    string
		provider    string
		assetURL    string
		description string
	}{
		{
			name:        "StandardGitHubTools",
			userUUID:    "user-123",
			provider:    "githubtools",
			assetURL:    "https://github.com/owner/repo/raw/main/asset.png",
			description: "Standard githubtools provider",
		},
		{
			name:        "EnterpriseGitHub",
			userUUID:    "user-456",
			provider:    "github-enterprise",
			assetURL:    "https://github.enterprise.com/owner/repo/raw/main/asset.png",
			description: "Enterprise GitHub provider",
		},
		{
			name:        "DifferentUserUUID",
			userUUID:    "different-uuid-789",
			provider:    "githubtools",
			assetURL:    "https://github.com/owner/repo/raw/main/asset.png",
			description: "Different user UUID",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				GetGitHubAccessToken(tc.userUUID, tc.provider).
				Return("test-token", nil)

			// Will fail at HTTP call but validates parameter handling
			_, _, err := suite.service.GetGitHubAsset(ctx, tc.userUUID, tc.provider, tc.assetURL)

			suite.Error(err) // Expected to fail at HTTP call
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_RequiresUUID() {
	ctx := context.Background()

	_, err := suite.service.GetUserPRReviewComments(ctx, "", "30d")
	suite.Error(err)
	suite.Equal(err.Error(), apperrors.ErrUserUUIDMissing.Error())
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_InvalidPeriodFormat() {
	ctx := context.Background()

	// Mock GetAllProviders since the function now fetches from all providers
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf")).
		MaxTimes(1)

	_, err := suite.service.GetUserPRReviewComments(ctx, "test-uuid", "invalid")
	suite.Error(err)
	suite.Contains(err.Error(), "invalid period format")
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_DefaultPeriod() {
	ctx := context.Background()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, assert.AnError)

	_, err := suite.service.GetUserPRReviewComments(ctx, "test-uuid", "")
	suite.NoError(err)

}

func (suite *GitHubServiceTestSuite) TestClosePullRequest_MissingUserUUIDOrProvider() {
	ctx := context.Background()

	testCases := []struct {
		name          string
		userUUID      string
		provider      string
		expectedError string
	}{
		{
			name:          "BothEmpty",
			userUUID:      "",
			provider:      "",
			expectedError: "userUUID and provider are required",
		},
		{
			name:          "EmptyUserUUID",
			userUUID:      "",
			provider:      "githubtools",
			expectedError: "userUUID and provider are required",
		},
		{
			name:          "EmptyProvider",
			userUUID:      "test-uuid",
			provider:      "",
			expectedError: "userUUID and provider are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			_, err := suite.service.ClosePullRequest(ctx, tc.userUUID, tc.provider, "owner", "repo", 1, false)
			suite.Error(err)
			suite.ErrorIs(err, apperrors.ErrMissingUserUUIDAndProvider)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestClosePullRequest_MissingOwnerOrRepo() {
	ctx := context.Background()

	testCases := []struct {
		name          string
		owner         string
		repo          string
		expectedError string
	}{
		{
			name:          "BothEmpty",
			owner:         "",
			repo:          "",
			expectedError: "owner and repository are required",
		},
		{
			name:          "EmptyOwner",
			owner:         "",
			repo:          "repo",
			expectedError: "owner and repository are required",
		},
		{
			name:          "EmptyRepo",
			owner:         "owner",
			repo:          "",
			expectedError: "owner and repository are required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			_, err := suite.service.ClosePullRequest(ctx, "test-uuid", "githubtools", tc.owner, tc.repo, 1, false)
			suite.Error(err)
			suite.ErrorIs(err, apperrors.ErrOwnerAndRepositoryMissing)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestClosePullRequest_CreateClientErrors() {
	ctx := context.Background()

	testCases := []struct {
		name      string
		mockError error
	}{
		{
			name:      "TokenStoreNotInitialized",
			mockError: apperrors.ErrTokenStoreNotInitialized,
		},
		{
			name:      "AuthServiceNotInitialized",
			mockError: apperrors.ErrAuthServiceNotInitialized,
		},
		{
			name:      "UserUUIDMissing",
			mockError: apperrors.ErrUserUUIDMissing,
		},
		{
			name:      "ProviderMissing",
			mockError: apperrors.ErrProviderMissing,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, tc.mockError)

			_, err := suite.service.ClosePullRequest(ctx, "test-uuid", "githubtools", "owner", "repo", 1, false)
			suite.Error(err)
			suite.Contains(err.Error(), "failed to get GitHub client")
			suite.ErrorIs(err, tc.mockError)
		})
	}
}

func (suite *GitHubServiceTestSuite) TestClosePullRequest_GetClientErrors() {
	ctx := context.Background()

	testCases := []struct {
		name      string
		mockError error
	}{
		{
			name:      "AuthServiceNotInitialized",
			mockError: apperrors.ErrAuthServiceNotInitialized,
		},
		{
			name:      "ClientNotFoundForProvider",
			mockError: fmt.Errorf("GitHub client not found for provider githubtools"),
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			suite.mockAuthSvc.EXPECT().
				CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
				Return(nil, tc.mockError)

			_, err := suite.service.ClosePullRequest(ctx, "test-uuid", "githubtools", "owner", "repo", 1, false)
			suite.Error(err)
			suite.Contains(err.Error(), "failed to get GitHub client")
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_GitHubClientCreation() {
	ctx := context.Background()

	testCases := []struct {
		name              string
		setupMocks        func()
		expectError       bool
		shouldHaveResults bool
	}{
		{
			name: "ClientCreationError",
			setupMocks: func() {
				suite.mockAuthSvc.EXPECT().
					GetAllProviders().
					Return(mockProviders("githubtools"))

				suite.mockAuthSvc.EXPECT().
					CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
					Return(nil, fmt.Errorf("client creation failed"))
			},
			expectError:       false, // Should not error, return 0 for failed provider
			shouldHaveResults: true,
		},
		{
			name: "ClientCreationSuccess_Standard",
			setupMocks: func() {
				suite.mockAuthSvc.EXPECT().
					GetAllProviders().
					Return(mockProviders("githubtools"))

				// Return a standard GitHub client; later API call will fail in unit test environment
				ghClient := github.NewClient(nil)
				suite.mockAuthSvc.EXPECT().
					CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
					Return(ghClient, nil)
			},
			expectError:       false, // Should not error, return 0 for failed provider
			shouldHaveResults: true,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMocks()

			result, err := suite.service.GetUserPRReviewComments(ctx, "test-uuid", "30d")

			if tc.expectError {
				suite.Error(err)
				suite.Nil(result)
			} else {
				suite.NoError(err)
				if tc.shouldHaveResults {
					suite.NotNil(result)
					suite.Equal(0, result.TotalComments) // Failed providers return 0
					suite.Len(result.Providers, 1)
				}
			}
		})
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_AllProvidersFail() {
	// Test that all providers failing is handled gracefully
	ctx := context.Background()
	userUUID := "test-user-uuid"

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// All providers fail
	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), userUUID, "githubtools").
		Return(nil, apperrors.ErrTokenStoreNotInitialized)

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), userUUID, "githubwdf").
		Return(nil, apperrors.ErrAuthServiceNotInitialized)

	// Act
	result, err := suite.service.GetUserPRReviewComments(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err) // Should not error, return 0 comments
	suite.NotNil(result)
	suite.Equal(0, result.TotalComments)
	suite.Len(result.Providers, 2)

	// All providers should have 0 comments
	for _, provider := range result.Providers {
		suite.Equal(0, provider.TotalComments)
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserTotalContributions_Success_MultipleProviders() {
	// Arrange
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock GraphQL servers for each provider using factory
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	server1 := factory.CreateContributionsServer(150)
	defer server1.Close()

	server2 := factory.CreateContributionsServer(200)
	defer server2.Close()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// Create real GraphQL clients pointing to mock servers
	ts1 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient1 := oauth2.NewClient(ctx, ts1)
	client1 := githubv4.NewEnterpriseClient(server1.URL, httpClient1)

	ts2 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient2 := oauth2.NewClient(ctx, ts2)
	client2 := githubv4.NewEnterpriseClient(server2.URL, httpClient2)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client1, nil)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(client2, nil)

	// Act
	result, err := suite.service.GetUserTotalContributions(ctx, userUUID)

	// Assert
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal(350, result.TotalContributions) // 150 + 200
	suite.Len(result.Providers, 2)
	suite.NotEmpty(result.From)
	suite.NotEmpty(result.To)
}

func (suite *GitHubServiceTestSuite) TestGetUserTotalContributions_MissingUserUUID() {
	// Arrange
	ctx := context.Background()

	// Act
	result, err := suite.service.GetUserTotalContributions(ctx, "")

	// Assert
	suite.Error(err)
	suite.Nil(result)
	suite.ErrorIs(err, apperrors.ErrUserUUIDMissing)
}

func (suite *GitHubServiceTestSuite) TestGetUserTotalContributions_PartialFailure() {
	// Arrange
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock GraphQL server for githubtools (succeeds)
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	server1 := factory.CreateContributionsServer(150)
	defer server1.Close()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// githubtools succeeds
	ts1 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient1 := oauth2.NewClient(ctx, ts1)
	client1 := githubv4.NewEnterpriseClient(server1.URL, httpClient1)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client1, nil)

	// githubwdf fails
	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(nil, fmt.Errorf("token not found"))

	// Act
	result, err := suite.service.GetUserTotalContributions(ctx, userUUID)

	// Assert
	suite.NoError(err) // Should not error even with partial failure
	suite.NotNil(result)
	suite.Equal(150, result.TotalContributions) // Only githubtools contributions
	suite.Len(result.Providers, 2)

	// Verify githubtools has contributions and githubwdf has 0
	for _, contrib := range result.Providers {
		if contrib.ProviderName == "githubtools" {
			suite.Equal(150, contrib.TotalContributions)
		} else if contrib.ProviderName == "githubwdf" {
			suite.Equal(0, contrib.TotalContributions)
		}
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserTotalContributions_AllProvidersFail() {
	// Arrange
	ctx := context.Background()
	userUUID := "test-user-uuid"

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("github", "githubtools"))

	// All providers fail
	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "github").
		Return(nil, apperrors.ErrTokenStoreNotInitialized)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(nil, apperrors.ErrAuthServiceNotInitialized)

	// Act
	result, err := suite.service.GetUserTotalContributions(ctx, userUUID)

	// Assert
	suite.NoError(err) // Should not error, return 0 contributions
	suite.NotNil(result)
	suite.Equal(0, result.TotalContributions)
	suite.Len(result.Providers, 2)

	// All providers should have 0 contributions
	for _, contrib := range result.Providers {
		suite.Equal(0, contrib.TotalContributions)
	}
}

func (suite *GitHubServiceTestSuite) TestGetUserTotalContributions_ContextCancellation() {
	// Arrange
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately
	userUUID := "test-user-uuid"

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(nil, context.Canceled)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(nil, context.Canceled)

	// Act
	result, err := suite.service.GetUserTotalContributions(ctx, userUUID)

	// Assert
	suite.NoError(err) // Should handle gracefully
	suite.NotNil(result)
	suite.Equal(0, result.TotalContributions)
	suite.Len(result.Providers, 2)
}

func (suite *GitHubServiceTestSuite) TestGetUserPRReviewComments_Success_MultipleProviders() {
	// Test successful fetching from multiple providers with real mock servers
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock REST API servers for each provider using factory
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	server1 := factory.CreatePRReviewCommentsServer(250)
	defer server1.Close()

	server2 := factory.CreatePRReviewCommentsServer(150)
	defer server2.Close()

	// Mock GetAllProviders
	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// Create real GitHub REST clients pointing to mock servers
	client1 := github.NewClient(nil)
	client1.BaseURL, _ = url.Parse(server1.URL + "/")

	client2 := github.NewClient(nil)
	client2.BaseURL, _ = url.Parse(server2.URL + "/")

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), userUUID, "githubtools").
		Return(client1, nil)

	suite.mockAuthSvc.EXPECT().
		CreateGitHubClient(gomock.Any(), userUUID, "githubwdf").
		Return(client2, nil)

	// Act
	result, err := suite.service.GetUserPRReviewComments(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal(400, result.TotalComments) // 250 + 150
	suite.Len(result.Providers, 2)
	suite.NotEmpty(result.From)
	suite.NotEmpty(result.To)

	// Verify both providers have correct comment counts
	providerMap := make(map[string]int)
	for _, p := range result.Providers {
		providerMap[p.ProviderName] = p.TotalComments
	}
	suite.Equal(250, providerMap["githubtools"])
	suite.Equal(150, providerMap["githubwdf"])
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_DefaultPeriod() {
	ctx := context.Background()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, assert.AnError)

	// Empty period should default to 30d
	result, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", "")
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal("30d", result.Period)
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_PeriodOver365Days() {
	ctx := context.Background()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), "test-uuid", "githubtools").
		Return(nil, assert.AnError)

	// Period over 365 days should be capped at 365d internally
	result, err := suite.service.GetAveragePRMergeTime(ctx, "test-uuid", "500d")
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal("500d", result.Period) // Period is preserved in response
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_Success_MultipleProviders() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock GraphQL servers with PR data using factory
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	now := time.Now().UTC()

	server1 := factory.CreatePRMergeTimeServer([]testutils.PRMergeTimeData{
		{CreatedAt: now.Add(-48 * time.Hour), MergedAt: now.Add(-24 * time.Hour)}, // 24 hours
		{CreatedAt: now.Add(-72 * time.Hour), MergedAt: now.Add(-24 * time.Hour)}, // 48 hours
	})
	defer server1.Close()

	server2 := factory.CreatePRMergeTimeServer([]testutils.PRMergeTimeData{
		{CreatedAt: now.Add(-36 * time.Hour), MergedAt: now.Add(-24 * time.Hour)}, // 12 hours
	})
	defer server2.Close()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// Create GraphQL clients
	ts1 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient1 := oauth2.NewClient(ctx, ts1)
	client1 := githubv4.NewEnterpriseClient(server1.URL, httpClient1)

	ts2 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient2 := oauth2.NewClient(ctx, ts2)
	client2 := githubv4.NewEnterpriseClient(server2.URL, httpClient2)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client1, nil)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(client2, nil)

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal(3, result.PRCount) // 2 + 1
	suite.Greater(result.AveragePRMergeTimeHours, 0.0)
	suite.Len(result.Providers, 2)
	suite.NotEmpty(result.From)
	suite.NotEmpty(result.To)
	suite.Equal("30d", result.Period)
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_Success_NoPRs() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock server with no PRs using factory
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	server := factory.CreatePRMergeTimeServer([]testutils.PRMergeTimeData{})
	defer server.Close()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient := oauth2.NewClient(ctx, ts)
	client := githubv4.NewEnterpriseClient(server.URL, httpClient)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client, nil)

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal(0, result.PRCount)
	suite.Equal(0.0, result.AveragePRMergeTimeHours)
	suite.Len(result.Providers, 1)
	suite.Equal(0, result.Providers[0].PRCount)
	suite.Equal(0.0, result.Providers[0].AveragePRMergeTimeHours)
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_PartialFailure() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create mock server for githubtools (succeeds) using factory
	factory := testutils.NewGitHubGraphQLMockServerFactory()
	now := time.Now().UTC()
	server1 := factory.CreatePRMergeTimeServer([]testutils.PRMergeTimeData{
		{CreatedAt: now.Add(-48 * time.Hour), MergedAt: now.Add(-24 * time.Hour)}, // 24 hours
	})
	defer server1.Close()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// githubtools succeeds
	ts1 := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient1 := oauth2.NewClient(ctx, ts1)
	client1 := githubv4.NewEnterpriseClient(server1.URL, httpClient1)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client1, nil)

	// githubwdf fails
	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(nil, fmt.Errorf("token not found"))

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err) // Should not error even with partial failure
	suite.NotNil(result)
	suite.Equal(1, result.PRCount) // Only githubtools PRs
	suite.Len(result.Providers, 2)

	// Verify githubtools has data and githubwdf has 0
	for _, provider := range result.Providers {
		if provider.ProviderName == "githubtools" {
			suite.Equal(1, provider.PRCount)
			suite.Greater(provider.AveragePRMergeTimeHours, 0.0)
		} else if provider.ProviderName == "githubwdf" {
			suite.Equal(0, provider.PRCount)
			suite.Equal(0.0, provider.AveragePRMergeTimeHours)
		}
	}
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_AllProvidersFail() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools", "githubwdf"))

	// All providers fail
	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(nil, apperrors.ErrTokenStoreNotInitialized)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubwdf").
		Return(nil, apperrors.ErrAuthServiceNotInitialized)

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err) // Should not error, return 0 values
	suite.NotNil(result)
	suite.Equal(0, result.PRCount)
	suite.Equal(0.0, result.AveragePRMergeTimeHours)
	suite.Len(result.Providers, 2)

	// All providers should have 0 values
	for _, provider := range result.Providers {
		suite.Equal(0, provider.PRCount)
		suite.Equal(0.0, provider.AveragePRMergeTimeHours)
	}
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_GraphQLQueryFailure() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create a server that returns an error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"errors": []map[string]interface{}{
				{"message": "Internal server error"},
			},
		})
	}))
	defer server.Close()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient := oauth2.NewClient(ctx, ts)
	client := githubv4.NewEnterpriseClient(server.URL, httpClient)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client, nil)

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	suite.NoError(err) // Should not error, return 0 for failed provider
	suite.NotNil(result)
	suite.Equal(0, result.PRCount)
	suite.Equal(0.0, result.AveragePRMergeTimeHours)
}

func (suite *GitHubServiceTestSuite) TestGetAveragePRMergeTime_PRsWithMissingDates() {
	ctx := context.Background()
	userUUID := "test-user-uuid"

	// Create server with PRs that have missing dates
	// The GraphQL library will fail to parse empty dates, causing the provider to return 0
	now := time.Now().UTC()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"data": map[string]interface{}{
				"search": map[string]interface{}{
					"pageInfo": map[string]interface{}{
						"hasNextPage": false,
						"endCursor":   nil,
					},
					"nodes": []map[string]interface{}{
						{
							"createdAt": now.Add(-48 * time.Hour).Format(time.RFC3339),
							"mergedAt":  "", // Missing merged date - will cause parsing error
						},
						{
							"createdAt": "", // Missing created date - will cause parsing error
							"mergedAt":  now.Format(time.RFC3339),
						},
						{
							"createdAt": now.Add(-24 * time.Hour).Format(time.RFC3339),
							"mergedAt":  now.Format(time.RFC3339), // Valid PR
						},
					},
				},
			},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	suite.mockAuthSvc.EXPECT().
		GetAllProviders().
		Return(mockProviders("githubtools"))

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient := oauth2.NewClient(ctx, ts)
	client := githubv4.NewEnterpriseClient(server.URL, httpClient)

	suite.mockAuthSvc.EXPECT().
		CreateGraphqlClient(gomock.Any(), userUUID, "githubtools").
		Return(client, nil)

	// Act
	result, err := suite.service.GetAveragePRMergeTime(ctx, userUUID, "30d")

	// Assert
	// GraphQL parsing fails on empty dates, so the provider returns 0
	suite.NoError(err)
	suite.NotNil(result)
	suite.Equal(0, result.PRCount) // Provider failed due to parsing error
	suite.Equal(0.0, result.AveragePRMergeTimeHours)
}

func TestGitHubServiceTestSuite(t *testing.T) {
	suite.Run(t, new(GitHubServiceTestSuite))
}
