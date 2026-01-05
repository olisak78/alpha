package handlers_test

import (
	"bytes"
	"developer-portal-backend/internal/api/handlers"
	apperrors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/mocks"
	"developer-portal-backend/internal/service"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"go.uber.org/mock/gomock"
)

// GitHubPullRequestFactory provides methods to create test GitHub PullRequest data
type GitHubPullRequestFactory struct {
	id        int64
	number    int
	title     string
	state     string
	createdAt time.Time
	updatedAt time.Time
	htmlURL   string
	draft     bool
	userLogin string
	userID    int64
	avatarURL string
	repoName  string
	repoOwner string
	private   bool
}

// NewGitHubPullRequestFactory creates a new GitHubPullRequestFactory with default values
func NewGitHubPullRequestFactory() *GitHubPullRequestFactory {
	now := time.Now()
	return &GitHubPullRequestFactory{
		id:        123456789,
		number:    42,
		title:     "Add new feature",
		state:     "open",
		createdAt: now,
		updatedAt: now,
		htmlURL:   "https://github.com/owner/repo/pull/42",
		draft:     false,
		userLogin: "testuser",
		userID:    12345,
		avatarURL: "https://avatars.githubusercontent.com/u/12345",
		repoName:  "test-repo",
		repoOwner: "owner",
		private:   false,
	}
}

func (f *GitHubPullRequestFactory) WithNumber(number int) *GitHubPullRequestFactory {
	f.number = number
	return f
}

func (f *GitHubPullRequestFactory) WithTitle(title string) *GitHubPullRequestFactory {
	f.title = title
	return f
}

func (f *GitHubPullRequestFactory) WithState(state string) *GitHubPullRequestFactory {
	f.state = state
	return f
}

func (f *GitHubPullRequestFactory) WithRepo(owner, name string, private bool) *GitHubPullRequestFactory {
	f.repoOwner = owner
	f.repoName = name
	f.private = private
	return f
}

func (f *GitHubPullRequestFactory) Create() *service.PullRequest {
	return &service.PullRequest{
		ID:        f.id,
		Number:    f.number,
		Title:     f.title,
		State:     f.state,
		CreatedAt: f.createdAt,
		UpdatedAt: f.updatedAt,
		HTMLURL:   f.htmlURL,
		Draft:     f.draft,
		User: service.GitHubUser{
			Login:     f.userLogin,
			ID:        f.userID,
			AvatarURL: f.avatarURL,
		},
		Repo: service.Repository{
			Name:     f.repoName,
			FullName: f.repoOwner + "/" + f.repoName,
			Owner:    f.repoOwner,
			Private:  f.private,
		},
	}
}

// GitHubPullRequestsResponseFactory provides methods to create test PullRequestsResponse data
type GitHubPullRequestsResponseFactory struct {
	pullRequests []*service.PullRequest
	total        int
}

func NewGitHubPullRequestsResponseFactory() *GitHubPullRequestsResponseFactory {
	return &GitHubPullRequestsResponseFactory{
		pullRequests: []*service.PullRequest{},
		total:        0,
	}
}

func (f *GitHubPullRequestsResponseFactory) WithSinglePR() *GitHubPullRequestsResponseFactory {
	pr := NewGitHubPullRequestFactory().Create()
	f.pullRequests = append(f.pullRequests, pr)
	f.total = len(f.pullRequests)
	return f
}

func (f *GitHubPullRequestsResponseFactory) WithMultiplePRs(count int) *GitHubPullRequestsResponseFactory {
	for i := 0; i < count; i++ {
		pr := NewGitHubPullRequestFactory()
		pr.id = int64(i + 1)
		pr.number = i + 1
		pr.title = fmt.Sprintf("PR %d", i+1)
		f.pullRequests = append(f.pullRequests, pr.Create())
	}
	f.total = len(f.pullRequests)
	return f
}

func (f *GitHubPullRequestsResponseFactory) Create() *service.PullRequestsResponse {
	prs := make([]service.PullRequest, len(f.pullRequests))
	for i, pr := range f.pullRequests {
		prs[i] = *pr
	}
	return &service.PullRequestsResponse{
		PullRequests: prs,
		Total:        f.total,
	}
}

func CreateEmptyPRResponse() *service.PullRequestsResponse {
	return NewGitHubPullRequestsResponseFactory().Create()
}

func CreatePRResponse(count int) *service.PullRequestsResponse {
	return NewGitHubPullRequestsResponseFactory().WithMultiplePRs(count).Create()
}

// GitHubTotalContributionsResponseFactory provides methods to create test TotalContributionsResponse data
type GitHubTotalContributionsResponseFactory struct{}

func NewGitHubTotalContributionsResponseFactory() *GitHubTotalContributionsResponseFactory {
	return &GitHubTotalContributionsResponseFactory{}
}

func (f *GitHubTotalContributionsResponseFactory) Create() map[string]interface{} {
	now := time.Now()
	yearAgo := now.AddDate(-1, 0, 0)
	return map[string]interface{}{
		"total_contributions": 246,
		"contributions": []map[string]interface{}{
			{"provider_name": "github", "total_contributions": 123},
			{"provider_name": "githubtools", "total_contributions": 123},
		},
		"from": yearAgo.Format(time.RFC3339),
		"to":   now.Format(time.RFC3339),
	}
}

// GitHubAveragePRMergeTimeResponseFactory provides methods to create test AveragePRMergeTimeResponse data
type GitHubAveragePRMergeTimeResponseFactory struct {
	averageHours float64
	prCount      int
	period       string
	from         string
	to           string
	providers    []service.ProviderPRMergeTimeResponse
}

func NewGitHubAveragePRMergeTimeResponseFactory() *GitHubAveragePRMergeTimeResponseFactory {
	return &GitHubAveragePRMergeTimeResponseFactory{
		averageHours: 24.5,
		prCount:      15,
		period:       "30d",
		from:         "2024-10-03T00:00:00Z",
		to:           "2024-11-02T23:59:59Z",
		providers: []service.ProviderPRMergeTimeResponse{
			{
				ProviderName:            "githubtools",
				AveragePRMergeTimeHours: 22.0,
				PRCount:                 8,
				TimeSeries: []service.PRMergeTimeDataPoint{
					{
						WeekStart:    "2024-10-26",
						WeekEnd:      "2024-11-02",
						AverageHours: 18.5,
						PRCount:      3,
					},
				},
			},
			{
				ProviderName:            "githubwdf",
				AveragePRMergeTimeHours: 27.0,
				PRCount:                 7,
				TimeSeries: []service.PRMergeTimeDataPoint{
					{
						WeekStart:    "2024-10-26",
						WeekEnd:      "2024-11-02",
						AverageHours: 25.5,
						PRCount:      2,
					},
				},
			},
		},
	}
}

func (f *GitHubAveragePRMergeTimeResponseFactory) Create() *service.AveragePRMergeTimeResponse {
	return &service.AveragePRMergeTimeResponse{
		AveragePRMergeTimeHours: f.averageHours,
		PRCount:                 f.prCount,
		Period:                  f.period,
		From:                    f.from,
		To:                      f.to,
		Providers:               f.providers,
	}
}

// GitHubPRReviewCommentsResponseFactory provides methods to create test PRReviewCommentsResponse data
type GitHubPRReviewCommentsResponseFactory struct {
	totalComments int
	period        string
	from          string
	to            string
	providers     []service.ProviderPRReviewCommentsResponse
}

func NewGitHubPRReviewCommentsResponseFactory() *GitHubPRReviewCommentsResponseFactory {
	return &GitHubPRReviewCommentsResponseFactory{
		totalComments: 42,
		period:        "30d",
		from:          "2024-10-03T00:00:00Z",
		to:            "2024-11-02T23:59:59Z",
		providers: []service.ProviderPRReviewCommentsResponse{
			{ProviderName: "githubtools", TotalComments: 30},
			{ProviderName: "githubwdf", TotalComments: 12},
		},
	}
}

func (f *GitHubPRReviewCommentsResponseFactory) WithTotalComments(total int) *GitHubPRReviewCommentsResponseFactory {
	f.totalComments = total
	return f
}

func (f *GitHubPRReviewCommentsResponseFactory) WithPeriod(period string) *GitHubPRReviewCommentsResponseFactory {
	f.period = period
	return f
}

func (f *GitHubPRReviewCommentsResponseFactory) Create() *service.PRReviewCommentsResponse {
	return &service.PRReviewCommentsResponse{
		TotalComments: f.totalComments,
		Period:        f.period,
		From:          f.from,
		To:            f.to,
		Providers:     f.providers,
	}
}

// GitHubHandlerTestSuite defines the test suite for GitHubHandler
type GitHubHandlerTestSuite struct {
	suite.Suite
	router       *gin.Engine
	mockGitHubSv *mocks.MockGitHubServiceInterface
	handler      *handlers.GitHubHandler
	ctrl         *gomock.Controller
}

// SetupTest sets up the test suite
func (suite *GitHubHandlerTestSuite) SetupTest() {
	gin.SetMode(gin.TestMode)
	suite.ctrl = gomock.NewController(suite.T())
	suite.mockGitHubSv = mocks.NewMockGitHubServiceInterface(suite.ctrl)
	suite.handler = handlers.NewGitHubHandler(suite.mockGitHubSv)
	suite.router = gin.New()
}

// TearDownTest cleans up after each test
func (suite *GitHubHandlerTestSuite) TearDownTest() {
	suite.ctrl.Finish()
}

// TestGetMyPullRequests_Success tests successful PR retrieval
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_Success() {
	// Test both providers
	providers := []string{"githubtools", "githubwdf"}

	for _, provider := range providers {
		suite.T().Run(provider, func(t *testing.T) {
			// Setup mock expectation using factory
			expectedResponse := NewGitHubPullRequestsResponseFactory().
				WithSinglePR().
				Create()

			suite.mockGitHubSv.EXPECT().
				GetUserOpenPullRequests(gomock.Any(), gomock.Any(), provider, "open", "created", "desc", 30, 1).
				Return(expectedResponse, nil)

			// Setup route - using the actual route pattern from routes.go
			router := gin.New()
			router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
				c.Set("user_uuid", "test-uuid")
				suite.handler.GetMyPullRequests(c)
			})

			// Make request
			req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/github/%s/pull-requests", provider), nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert response
			assert.Equal(t, http.StatusOK, w.Code)

			var response service.PullRequestsResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, 1, response.Total)
			assert.Len(t, response.PullRequests, 1)
			assert.Equal(t, 42, response.PullRequests[0].Number)
			assert.Equal(t, "Add new feature", response.PullRequests[0].Title)
		})
	}
}

// TestGetMyPullRequests_Unauthorized tests missing authentication
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_Unauthorized() {
	// Setup route without auth claims
	suite.router.GET("/github/pull-requests", suite.handler.GetMyPullRequests)

	// Make request
	req, _ := http.NewRequest(http.MethodGet, "/github/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// The error is serialized as an object with a Message field
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), apperrors.ErrAuthenticationRequired.Error(), errorObj["Message"])
}

// TestGetMyPullRequests_ServiceError tests service error handling
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", "open", "created", "desc", 30, 1).
		Return(nil, fmt.Errorf("failed to fetch pull requests"))

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Failed to fetch pull requests")
}

// TestGetMyPullRequests_RateLimitError tests rate limit error handling
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_RateLimitError() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", "open", "created", "desc", 30, 1).
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "rate limit exceeded")
}

// TestGetMyPullRequests_WithQueryParameters tests query parameter handling
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_WithQueryParameters() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
		Return(CreateEmptyPRResponse(), nil).
		AnyTimes()

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.GetMyPullRequests(c)
	})

	testCases := []struct {
		name           string
		queryParams    string
		expectedStatus int
	}{
		{"ValidOpenState", "?state=open", http.StatusOK},
		{"ValidClosedState", "?state=closed", http.StatusOK},
		{"ValidAllState", "?state=all", http.StatusOK},
		{"InvalidState", "?state=invalid", http.StatusBadRequest},
		{"ValidSort", "?sort=created", http.StatusOK},
		{"ValidUpdatedSort", "?sort=updated", http.StatusOK},
		{"InvalidSort", "?sort=invalid", http.StatusBadRequest},
		{"ValidDirection", "?direction=asc", http.StatusOK},
		{"InvalidDirection", "?direction=invalid", http.StatusBadRequest},
		{"ValidPerPage", "?per_page=50", http.StatusOK},
		{"ValidPage", "?page=2", http.StatusOK},
		{"MultipleParams", "?state=closed&sort=updated&direction=asc&per_page=50&page=2", http.StatusOK},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests"+tc.queryParams, nil)
			w := httptest.NewRecorder()
			suite.router.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedStatus, w.Code)
		})
	}
}

// TestGetMyPullRequests_InvalidClaims tests invalid claims type
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_InvalidClaims() {
	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		// Set invalid claims type
		c.Set("user_uuid", "")
		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// The error is serialized as an object with a Message field
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "authentication required", errorObj["Message"])
}

// TestGetMyPullRequests_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_MissingProvider() {
	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		// Simulate missing provider by setting empty string
		c.Params = gin.Params{{Key: "provider", Value: ""}}
		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// TestGetMyPullRequests_EmptyResponse tests empty PR list
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_EmptyResponse() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", "open", "created", "desc", 30, 1).
		Return(CreateEmptyPRResponse(), nil)

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.PullRequestsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0, response.Total)
	assert.Empty(suite.T(), response.PullRequests)
}

// TestGetMyPullRequests_MultiplePRs tests response with multiple PRs
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_MultiplePRs() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", "open", "created", "desc", 30, 1).
		Return(CreatePRResponse(3), nil)

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetMyPullRequests(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.PullRequestsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 3, response.Total)
	assert.Len(suite.T(), response.PullRequests, 3)
}

// TestGetMyPullRequests_DefaultParameters tests default parameter values
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_DefaultParameters() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", "open", "created", "desc", 30, 1).
		Return(CreateEmptyPRResponse(), nil)

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetMyPullRequests(c)
	})

	// Request without any query parameters
	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestGetMyPullRequests_InvalidPerPage tests invalid per_page values
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_InvalidPerPage() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
		Return(CreateEmptyPRResponse(), nil).
		AnyTimes()

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetMyPullRequests(c)
	})

	testCases := []string{
		"?per_page=abc", // Non-numeric
		"?per_page=-1",  // Negative
		"?per_page=0",   // Zero
		"?per_page=200", // Too large
		"?per_page=",    // Empty
	}

	for _, queryParam := range testCases {
		req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests"+queryParam, nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		// Should still succeed with defaults
		assert.Equal(suite.T(), http.StatusOK, w.Code)
	}
}

// TestGetMyPullRequests_InvalidPage tests invalid page values
func (suite *GitHubHandlerTestSuite) TestGetMyPullRequests_InvalidPage() {
	suite.mockGitHubSv.EXPECT().
		GetUserOpenPullRequests(gomock.Any(), gomock.Any(), "githubtools", gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
		Return(CreateEmptyPRResponse(), nil).
		AnyTimes()

	suite.router.GET("/github/:provider/pull-requests", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetMyPullRequests(c)
	})

	testCases := []string{
		"?page=abc", // Non-numeric
		"?page=-1",  // Negative
		"?page=0",   // Zero
		"?page=",    // Empty
	}

	for _, queryParam := range testCases {
		req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/pull-requests"+queryParam, nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)

		// Should still succeed with defaults
		assert.Equal(suite.T(), http.StatusOK, w.Code)
	}
}

// TestNewGitHubHandler test handler creation
func (suite *GitHubHandlerTestSuite) TestNewGitHubHandler() {
	handler := handlers.NewGitHubHandler(suite.mockGitHubSv)

	assert.NotNil(suite.T(), handler)
}

// TestGetUserTotalContributions_Success tests successful contribution retrieval
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_Success() {
	// Use factory to create test data
	factory := NewGitHubTotalContributionsResponseFactory()
	expectedResponse := factory.Create()

	suite.mockGitHubSv.EXPECT().
		GetUserTotalContributions(gomock.Any(), gomock.Any()).
		Return(&service.TotalContributionsResponse{
			Providers: []service.ProviderContentResponse{
				{
					ProviderName:       expectedResponse["contributions"].([]map[string]interface{})[0]["provider_name"].(string),
					TotalContributions: expectedResponse["contributions"].([]map[string]interface{})[0]["total_contributions"].(int),
				},
				{
					ProviderName:       expectedResponse["contributions"].([]map[string]interface{})[1]["provider_name"].(string),
					TotalContributions: expectedResponse["contributions"].([]map[string]interface{})[1]["total_contributions"].(int),
				},
			},
			TotalContributions: expectedResponse["total_contributions"].(int),
			From:               expectedResponse["from"].(string),
			To:                 expectedResponse["to"].(string),
		}, nil)

	suite.router.GET("/github/contributions", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetUserTotalContributions(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.TotalContributionsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedResponse["total_contributions"].(int), response.TotalContributions)
	assert.NotEmpty(suite.T(), response.From)
	assert.NotEmpty(suite.T(), response.To)
}

// TestGetUserTotalContributions_Unauthorized tests missing authentication
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_Unauthorized() {
	// Setup route without auth claims
	suite.router.GET("/github/contributions", suite.handler.GetUserTotalContributions)

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// The error is serialized as an object with a Message field
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), apperrors.ErrAuthenticationRequired.Error(), errorObj["Message"])
}

// TestGetUserTotalContributions_InvalidClaims tests invalid claims type
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_InvalidClaims() {
	suite.router.GET("/github/contributions", func(c *gin.Context) {
		// Set invalid claims type
		c.Set("user_uuid", "")
		suite.handler.GetUserTotalContributions(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// The error is serialized as an object with a Message field
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "authentication required", errorObj["Message"])
}

// TestGetUserTotalContributions_RateLimit tests rate limit error handling
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_RateLimit() {
	suite.mockGitHubSv.EXPECT().
		GetUserTotalContributions(gomock.Any(), gomock.Any()).
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/contributions", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetUserTotalContributions(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "rate limit exceeded")
}

// TestGetUserTotalContributions_ServiceError tests service error handling
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetUserTotalContributions(gomock.Any(), gomock.Any()).
		Return(nil, fmt.Errorf("failed to fetch contributions"))

	suite.router.GET("/github/contributions", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetUserTotalContributions(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Failed to fetch contributions")
}

// TestGetUserTotalContributions_InvalidPeriodFormat tests invalid period format error
func (suite *GitHubHandlerTestSuite) TestGetUserTotalContributions_InvalidPeriodFormat() {
	suite.mockGitHubSv.EXPECT().
		GetUserTotalContributions(gomock.Any(), gomock.Any()).
		Return(nil, apperrors.ErrInvalidPeriodFormat)

	suite.router.GET("/github/contributions", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.GetUserTotalContributions(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/contributions", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "invalid period format")
}

// TestGetAveragePRMergeTime_Success tests successful average PR merge time retrieval
// Note: This endpoint aggregates data from all providers (githubtools and githubwdf)
func (suite *GitHubHandlerTestSuite) TestGetAveragePRMergeTime_Success() {
	expectedResponse := NewGitHubAveragePRMergeTimeResponseFactory().Create()

	suite.mockGitHubSv.EXPECT().
		GetAveragePRMergeTime(gomock.Any(), gomock.Any(), "30d").
		Return(expectedResponse, nil)

	suite.router.GET("/github/average-pr-time", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetAveragePRMergeTime(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/average-pr-time", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.AveragePRMergeTimeResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedResponse.AveragePRMergeTimeHours, response.AveragePRMergeTimeHours)
	assert.Equal(suite.T(), expectedResponse.PRCount, response.PRCount)
	assert.Equal(suite.T(), expectedResponse.From, response.From)
	assert.Equal(suite.T(), expectedResponse.To, response.To)
	assert.Len(suite.T(), response.Providers, len(expectedResponse.Providers))
}

// TestGetAveragePRMergeTime_NoAuthClaims tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestGetAveragePRMergeTime_NoAuthClaims() {
	suite.router.GET("/github/average-pr-time", suite.handler.GetAveragePRMergeTime)

	req, _ := http.NewRequest(http.MethodGet, "/github/average-pr-time", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// The error is serialized as an object with a Message field
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), apperrors.ErrAuthenticationRequired.Error(), errorObj["Message"])
}

// TestGetAveragePRMergeTime_ServiceError tests service error handling
func (suite *GitHubHandlerTestSuite) TestGetAveragePRMergeTime_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetAveragePRMergeTime(gomock.Any(), gomock.Any(), "30d").
		Return(nil, fmt.Errorf("GitHub API error"))

	suite.router.GET("/github/average-pr-time", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetAveragePRMergeTime(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/average-pr-time", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestGetAveragePRMergeTime_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestGetAveragePRMergeTime_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		GetAveragePRMergeTime(gomock.Any(), gomock.Any(), "30d").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/average-pr-time", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetAveragePRMergeTime(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/average-pr-time", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestGetAveragePRMergeTime_InvalidPeriod tests invalid period format
func (suite *GitHubHandlerTestSuite) TestGetAveragePRMergeTime_InvalidPeriod() {
	suite.mockGitHubSv.EXPECT().
		GetAveragePRMergeTime(gomock.Any(), gomock.Any(), "invalid").
		Return(nil, apperrors.ErrInvalidPeriodFormat)

	suite.router.GET("/github/average-pr-time", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetAveragePRMergeTime(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/average-pr-time?period=invalid", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ClosePullRequest handler tests

func (suite *GitHubHandlerTestSuite) TestClosePR_Success() {
	closedPR := NewGitHubPullRequestFactory().
		WithNumber(42).
		WithTitle("Closed PR").
		WithState("closed").
		WithRepo("owner", "repo", false).
		Create()

	suite.mockGitHubSv.EXPECT().
		ClosePullRequest(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", 42, false).
		Return(closedPR, nil)

	// Route for ClosePullRequest - now includes provider parameter
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	// Prepare request
	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var pr service.PullRequest
	err := json.Unmarshal(w.Body.Bytes(), &pr)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "closed", pr.State)
	assert.Equal(suite.T(), 42, pr.Number)
	assert.Equal(suite.T(), "owner/repo", pr.Repo.FullName)
}

func (suite *GitHubHandlerTestSuite) TestClosePR_NotFound() {
	suite.mockGitHubSv.EXPECT().
		ClosePullRequest(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", 99, false).
		Return(nil, apperrors.NewNotFoundError("pull request"))

	// Route for ClosePullRequest - now includes provider parameter
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.ClosePullRequest(c)
	})

	// Prepare request
	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/99", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestClosePR_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestClosePR_Unauthorized() {
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", suite.handler.ClosePullRequest)

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestClosePR_InvalidPRNumber tests invalid PR number
func (suite *GitHubHandlerTestSuite) TestClosePR_InvalidPRNumber() {
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/invalid", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestClosePR_InvalidRequestBody tests invalid JSON body
func (suite *GitHubHandlerTestSuite) TestClosePR_InvalidRequestBody() {
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestClosePR_MissingOwnerRepo tests missing owner/repo fields
func (suite *GitHubHandlerTestSuite) TestClosePR_MissingOwnerRepo() {
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestClosePR_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestClosePR_MissingProvider() {
	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "pr_number", Value: "42"},
		}
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github//pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// TestClosePR_InvalidStatus tests invalid status error
func (suite *GitHubHandlerTestSuite) TestClosePR_InvalidStatus() {
	suite.mockGitHubSv.EXPECT().
		ClosePullRequest(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", 42, false).
		Return(nil, apperrors.ErrInvalidStatus)

	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestClosePR_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestClosePR_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		ClosePullRequest(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", 42, false).
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestClosePR_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestClosePR_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		ClosePullRequest(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", 42, false).
		Return(nil, fmt.Errorf("service error"))

	suite.router.PATCH("/github/:provider/pull-requests/close/:pr_number", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.ClosePullRequest(c)
	})

	body := map[string]interface{}{
		"owner":         "owner",
		"repo":          "repo",
		"delete_branch": false,
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/github/githubtools/pull-requests/close/42", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// GetRepositoryContent handler tests

// TestGetRepositoryContent_Success tests successful file content retrieval
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_Success() {
	expectedContent := map[string]interface{}{
		"name":    "README.md",
		"path":    "README.md",
		"content": "base64content",
		"type":    "file",
	}

	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/README.md", "main").
		Return(expectedContent, nil)

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/README.md", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "README.md", response["name"])
}

// TestGetRepositoryContent_SuccessDirectory tests successful directory listing
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_SuccessDirectory() {
	expectedContent := []interface{}{
		map[string]interface{}{"name": "file1.txt", "type": "file"},
		map[string]interface{}{"name": "file2.txt", "type": "file"},
	}

	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/src", "main").
		Return(expectedContent, nil)

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/src", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestGetRepositoryContent_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_Unauthorized() {
	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", suite.handler.GetRepositoryContent)

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/file.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetRepositoryContent_InvalidClaims tests invalid claims type
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_InvalidClaims() {
	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "")
		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/file.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetRepositoryContent_NotFound test repository or path not found
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_NotFound() {
	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/notfound.txt", "main").
		Return(nil, apperrors.NewNotFoundError("file"))

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/notfound.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestGetRepositoryContent_RateLimitExceeded test rate limit error
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "main").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/file.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestGetRepositoryContent_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "main").
		Return(nil, fmt.Errorf("service error"))

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/file.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestGetRepositoryContent_EmptyPath tests root directory content
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_EmptyPath() {
	expectedContent := []interface{}{
		map[string]interface{}{"name": "README.md", "type": "file"},
	}

	suite.mockGitHubSv.EXPECT().
		GetRepositoryContent(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/", "main").
		Return(expectedContent, nil)

	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestGetRepositoryContent_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestGetRepositoryContent_MissingProvider() {
	suite.router.GET("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "owner", Value: "owner"},
			{Key: "repo", Value: "repo"},
			{Key: "path", Value: "/file.txt"},
		}
		suite.handler.GetRepositoryContent(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/githubtools/repos/owner/repo/contents/file.txt", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// GetGitHubAsset handler tests

// TestGetGitHubAsset_Success tests successful asset retrieval
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_Success() {
	assetData := []byte("image data")
	contentType := "image/png"

	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/owner/repo/raw/main/image.png").
		Return(assetData, contentType, nil)

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/owner/repo/raw/main/image.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), contentType, w.Header().Get("Content-Type"))
	assert.Equal(suite.T(), assetData, w.Body.Bytes())
}

// TestGetGitHubAsset_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_Unauthorized() {
	suite.router.GET("/github/asset", suite.handler.GetGitHubAsset)

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetGitHubAsset_InvalidClaims test invalid claims type
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_InvalidClaims() {
	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "")
		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetGitHubAsset_MissingURL tests missing url query parameter
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_MissingURL() {
	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Asset URL is required")
}

// TestGetGitHubAsset_NotFound tests asset not found
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_NotFound() {
	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/notfound.png").
		Return(nil, "", apperrors.NewNotFoundError("asset"))

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/notfound.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestGetGitHubAsset_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/test.png").
		Return(nil, "", apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestGetGitHubAsset_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/test.png").
		Return(nil, "", fmt.Errorf("service error"))

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestGetGitHubAsset_ContentType tests correct content-type header
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_ContentType() {
	assetData := []byte("svg data")
	contentType := "image/svg+xml"

	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/test.svg").
		Return(assetData, contentType, nil)

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.svg", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), contentType, w.Header().Get("Content-Type"))
}

// TestGetGitHubAsset_CacheHeaders tests cache-control headers
func (suite *GitHubHandlerTestSuite) TestGetGitHubAsset_CacheHeaders() {
	assetData := []byte("data")
	contentType := "image/png"

	suite.mockGitHubSv.EXPECT().
		GetGitHubAsset(gomock.Any(), gomock.Any(), "githubtools", "https://github.com/test.png").
		Return(assetData, contentType, nil)

	suite.router.GET("/github/asset", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetGitHubAsset(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/asset?url=https://github.com/test.png", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), "public, max-age=3600", w.Header().Get("Cache-Control"))
}

// UpdateRepositoryFile handler tests

// TestUpdateRepositoryFile_Success tests successful file update
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_Success() {
	expectedResponse := map[string]interface{}{
		"commit": map[string]interface{}{
			"sha":     "abc123",
			"message": "Update file",
		},
	}

	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "Update file", "content", "sha123", "").
		Return(expectedResponse, nil)

	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{
		"message": "Update file",
		"content": "content",
		"sha":     "sha123",
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateRepositoryFile_WithBranch tests update on specific branch
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_WithBranch() {
	expectedResponse := map[string]interface{}{"commit": map[string]interface{}{"sha": "abc123"}}

	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "Update", "content", "sha123", "develop").
		Return(expectedResponse, nil)

	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{
		"message": "Update",
		"content": "content",
		"sha":     "sha123",
		"branch":  "develop",
	}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestUpdateRepositoryFile_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_Unauthorized() {
	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", suite.handler.UpdateRepositoryFile)

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestUpdateRepositoryFile_InvalidClaims tests invalid claims type
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_InvalidClaims() {
	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "")
		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestUpdateRepositoryFile_InvalidRequestBody tests malformed JSON
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_InvalidRequestBody() {
	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateRepositoryFile_MissingMessage tests missing required message field
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_MissingMessage() {
	suite.router.PUT("/github/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateRepositoryFile_MissingContent tests missing required content field
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_MissingContent() {
	suite.router.PUT("/github/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateRepositoryFile_MissingSHA tests missing required SHA field
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_MissingSHA() {
	suite.router.PUT("/github/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestUpdateRepositoryFile_NotFound tests repository or path not found
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_NotFound() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/notfound.txt", "Update", "content", "sha123", "").
		Return(nil, apperrors.NewNotFoundError("file"))

	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/notfound.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestUpdateRepositoryFile_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "Update", "content", "sha123", "").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestUpdateRepositoryFile_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), gomock.Any(), "githubtools", "owner", "repo", "/file.txt", "Update", "content", "sha123", "").
		Return(nil, fmt.Errorf("service error"))

	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github/githubtools/repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// GetPRReviewComments handler tests

// TestGetPRReviewComments_Success tests successful review comments count retrieval
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_Success() {
	expectedResponse := NewGitHubPRReviewCommentsResponseFactory().Create()

	suite.mockGitHubSv.EXPECT().
		GetUserPRReviewComments(gomock.Any(), gomock.Any(), "30d").
		Return(expectedResponse, nil)

	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.PRReviewCommentsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedResponse.TotalComments, response.TotalComments)
	assert.Equal(suite.T(), expectedResponse.Period, response.Period)
	assert.NotEmpty(suite.T(), response.From)
	assert.NotEmpty(suite.T(), response.To)
	assert.Len(suite.T(), response.Providers, 2)
}

// TestGetPRReviewComments_WithPeriod tests custom period parameter
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_WithPeriod() {
	expectedResponse := NewGitHubPRReviewCommentsResponseFactory().
		WithTotalComments(100).
		WithPeriod("90d").
		Create()

	suite.mockGitHubSv.EXPECT().
		GetUserPRReviewComments(gomock.Any(), gomock.Any(), "90d").
		Return(expectedResponse, nil)

	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments?period=90d", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response service.PRReviewCommentsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 100, response.TotalComments)
	assert.Equal(suite.T(), "90d", response.Period)
}

// TestGetPRReviewComments_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_Unauthorized() {
	suite.router.GET("/github/pr-review-comments", suite.handler.GetPRReviewComments)

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetPRReviewComments_InvalidClaims tests invalid claims type
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_InvalidClaims() {
	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "")
		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestGetPRReviewComments_InvalidPeriod tests invalid period format
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_InvalidPeriod() {
	suite.mockGitHubSv.EXPECT().
		GetUserPRReviewComments(gomock.Any(), gomock.Any(), "invalid").
		Return(nil, apperrors.ErrInvalidPeriodFormat)

	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments?period=invalid", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestGetPRReviewComments_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		GetUserPRReviewComments(gomock.Any(), gomock.Any(), "30d").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestGetPRReviewComments_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestGetPRReviewComments_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		GetUserPRReviewComments(gomock.Any(), gomock.Any(), "30d").
		Return(nil, fmt.Errorf("service error"))

	suite.router.GET("/github/pr-review-comments", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")

		suite.handler.GetPRReviewComments(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/github/pr-review-comments", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestCreateRepositoryFile_Success tests successful file creation
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_Success() {
	expectedResponse := map[string]interface{}{
		"commit": map[string]string{
			"sha": "abc123",
		},
		"content": map[string]string{
			"name": "test.md",
			"path": "docs/test.md",
		},
	}

	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Create test.md", "# Test content", "", "").
		Return(expectedResponse, nil)

	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)
}

// TestCreateRepositoryFile_InvalidRequest tests invalid request body
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_InvalidRequest() {
	suite.router.POST("/github/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	// Missing required fields
	body := map[string]string{}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestCreateRepositoryFile_FileAlreadyExists tests file already exists error
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_FileAlreadyExists() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Create test.md", "# Test content", "", "").
		Return(nil, apperrors.ErrFileAlreadyExists)

	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

// TestCreateRepositoryFile_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_Unauthorized() {
	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", suite.handler.CreateRepositoryFile)

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestCreateRepositoryFile_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_MissingProvider() {
	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "owner", Value: "test-owner"},
			{Key: "repo", Value: "test-repo"},
			{Key: "path", Value: "/docs/test.md"},
		}
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github//repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// TestCreateRepositoryFile_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Create test.md", "# Test content", "", "").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestCreateRepositoryFile_NotFound tests not found error
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_NotFound() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Create test.md", "# Test content", "", "").
		Return(nil, apperrors.NewNotFoundError("repository"))

	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestCreateRepositoryFile_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestCreateRepositoryFile_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		UpdateRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Create test.md", "# Test content", "", "").
		Return(nil, fmt.Errorf("service error"))

	suite.router.POST("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.CreateRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Create test.md",
		"content": "# Test content",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestDeleteRepositoryFile_Success tests successful file deletion
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_Success() {
	expectedResponse := map[string]interface{}{
		"commit": map[string]string{
			"sha": "abc123",
		},
	}

	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Delete test.md", "file-sha-123", "").
		Return(expectedResponse, nil)

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestDeleteRepositoryFile_InvalidRequest tests invalid request body
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_InvalidRequest() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFile(c)
	})

	// Missing required fields
	body := map[string]string{}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteRepositoryFile_NotFound test file not found error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_NotFound() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Delete test.md", "file-sha-123", "").
		Return(nil, apperrors.NewNotFoundError("file"))

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestDeleteRepositoryFile_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Delete test.md", "file-sha-123", "").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestDeleteRepositoryFolder_Success tests successful folder deletion
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_Success() {
	expectedResponse := map[string]interface{}{
		"commit": map[string]string{
			"sha": "abc123",
		},
	}

	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFolder(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test-folder", "Delete folder test-folder", "").
		Return(expectedResponse, nil)

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// TestDeleteRepositoryFolder_NonEmptyDirectory tests non-empty directory error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_NonEmptyDirectory() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFolder(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test-folder", "Delete folder test-folder", "").
		Return(nil, fmt.Errorf("cannot delete non-empty directory: contains file.md"))

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteRepositoryFolder_InvalidRequest tests invalid request body
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_InvalidRequest() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	// Missing required fields
	body := map[string]string{}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestDeleteRepositoryFolder_NotFound tests folder not found error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_NotFound() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFolder(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test-folder", "Delete folder test-folder", "").
		Return(nil, apperrors.NewNotFoundError("folder"))

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// TestDeleteRepositoryFile_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_Unauthorized() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", suite.handler.DeleteRepositoryFile)

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestDeleteRepositoryFile_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_MissingProvider() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "owner", Value: "test-owner"},
			{Key: "repo", Value: "test-repo"},
			{Key: "path", Value: "/docs/test.md"},
		}
		suite.handler.DeleteRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github//repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// TestDeleteRepositoryFile_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFile_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFile(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test.md", "Delete test.md", "file-sha-123", "").
		Return(nil, fmt.Errorf("service error"))

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFile(c)
	})

	body := map[string]string{
		"message": "Delete test.md",
		"sha":     "file-sha-123",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/contents/docs/test.md", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestDeleteRepositoryFolder_Unauthorized tests missing auth claims
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_Unauthorized() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", suite.handler.DeleteRepositoryFolder)

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// TestDeleteRepositoryFolder_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_MissingProvider() {
	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "owner", Value: "test-owner"},
			{Key: "repo", Value: "test-repo"},
			{Key: "path", Value: "/docs/test-folder"},
		}
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github//repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// TestDeleteRepositoryFolder_RateLimitExceeded tests rate limit error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_RateLimitExceeded() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFolder(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test-folder", "Delete folder test-folder", "").
		Return(nil, apperrors.ErrGitHubAPIRateLimitExceeded)

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
}

// TestDeleteRepositoryFolder_ServiceError tests generic service error
func (suite *GitHubHandlerTestSuite) TestDeleteRepositoryFolder_ServiceError() {
	suite.mockGitHubSv.EXPECT().
		DeleteRepositoryFolder(gomock.Any(), "test-uuid", "githubtools", "test-owner", "test-repo", "/docs/test-folder", "Delete folder test-folder", "").
		Return(nil, fmt.Errorf("service error"))

	suite.router.DELETE("/github/:provider/repos/:owner/:repo/folders/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		suite.handler.DeleteRepositoryFolder(c)
	})

	body := map[string]string{
		"message": "Delete folder test-folder",
	}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodDelete, "/github/githubtools/repos/test-owner/test-repo/folders/docs/test-folder", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadGateway, w.Code)
}

// TestUpdateRepositoryFile_MissingProvider tests missing provider parameter
func (suite *GitHubHandlerTestSuite) TestUpdateRepositoryFile_MissingProvider() {
	suite.router.PUT("/github/:provider/repos/:owner/:repo/contents/*path", func(c *gin.Context) {
		c.Set("user_uuid", "test-uuid")
		c.Params = gin.Params{
			{Key: "provider", Value: ""},
			{Key: "owner", Value: "owner"},
			{Key: "repo", Value: "repo"},
			{Key: "path", Value: "/file.txt"},
		}
		suite.handler.UpdateRepositoryFile(c)
	})

	body := map[string]interface{}{"message": "Update", "content": "content", "sha": "sha123"}
	payload, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/github//repos/owner/repo/contents/file.txt", bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	errorObj, ok := response["error"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "provider", errorObj["Field"])
	assert.Equal(suite.T(), "provider cannot be empty", errorObj["Message"])
}

// Run the test suite
func TestGitHubHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(GitHubHandlerTestSuite))
}
