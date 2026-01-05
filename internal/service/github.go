package service

import (
	"context"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"developer-portal-backend/internal/auth"
	apperrors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/logger"

	"github.com/google/go-github/v57/github"
	"github.com/shurcooL/githubv4"
	"golang.org/x/oauth2"
)

// GitHubService provides methods to interact with GitHub API
type GitHubService struct {
	authService GitHubAuthService
}

// NewGitHubService creates a new GitHub service
func NewGitHubService(authService *auth.AuthService) *GitHubService {
	return &GitHubService{
		authService: NewAuthServiceAdapter(authService),
	}
}

// NewGitHubServiceWithAdapter creates a new GitHub service with a custom auth service adapter
// This constructor is primarily for testing with mock auth services
func NewGitHubServiceWithAdapter(authService GitHubAuthService) *GitHubService {
	return &GitHubService{
		authService: authService,
	}
}

// PullRequest represents a GitHub pull request
type PullRequest struct {
	ID        int64      `json:"id" example:"1234567890"`
	Number    int        `json:"number" example:"42"`
	Title     string     `json:"title" example:"Add new feature"`
	State     string     `json:"state" example:"open"`
	CreatedAt time.Time  `json:"created_at" example:"2025-01-01T12:00:00Z"`
	UpdatedAt time.Time  `json:"updated_at" example:"2025-01-02T12:00:00Z"`
	HTMLURL   string     `json:"html_url" example:"https://github.com/owner/repo/pull/42"`
	User      GitHubUser `json:"user"`
	Repo      Repository `json:"repository"`
	Draft     bool       `json:"draft" example:"false"`
}

// GitHubUser represents a GitHub user
type GitHubUser struct {
	Login     string `json:"login" example:"johndoe"`
	ID        int64  `json:"id" example:"12345"`
	AvatarURL string `json:"avatar_url" example:"https://avatars.githubusercontent.com/u/12345"`
}

// Repository represents a GitHub repository
type Repository struct {
	Name     string `json:"name" example:"my-repo"`
	FullName string `json:"full_name" example:"owner/my-repo"`
	Owner    string `json:"owner" example:"owner"`
	Private  bool   `json:"private" example:"false"`
}

// PullRequestsResponse represents the response for pull requests
type PullRequestsResponse struct {
	PullRequests []PullRequest `json:"pull_requests"`
	Total        int           `json:"total"`
}

// ProviderContentResponse represents contributions from a single provider
type ProviderContentResponse struct {
	ProviderName       string `json:"provider_name"`
	TotalContributions int    `json:"total_contributions"`
}

// TotalContributionsResponse represents the response for user contributions
type TotalContributionsResponse struct {
	TotalContributions int                       `json:"total_contributions"`
	From               string                    `json:"from"`
	To                 string                    `json:"to"`
	Providers          []ProviderContentResponse `json:"Providers"`
}

// ProviderPRReviewCommentsResponse represents PR review comments from a single provider
type ProviderPRReviewCommentsResponse struct {
	ProviderName  string `json:"provider_name" example:"githubtools"`
	TotalComments int    `json:"total_comments" example:"42"`
}

// PRReviewCommentsResponse represents the response for PR review comments count
type PRReviewCommentsResponse struct {
	TotalComments int                                `json:"total_comments" example:"596"`
	From          string                             `json:"from" example:"2024-12-28T22:00:00Z"`
	To            string                             `json:"to" example:"2025-12-30T21:59:59Z"`
	Period        string                             `json:"period" example:"30d"`
	Providers     []ProviderPRReviewCommentsResponse `json:"providers"`
}

// ContributionDay represents contributions for a single day
type ContributionDay struct {
	Date              string `json:"date" example:"2025-01-15"`
	ContributionCount int    `json:"contribution_count" example:"5"`
	ContributionLevel string `json:"contribution_level" example:"SECOND_QUARTILE"`
	Color             string `json:"color" example:"#40c463"`
}

// ContributionWeek represents a week of contributions
type ContributionWeek struct {
	FirstDay         string            `json:"first_day" example:"2025-01-12"`
	ContributionDays []ContributionDay `json:"contribution_days"`
}

// ContributionsHeatmapResponse represents the response for contribution heatmap
type ContributionsHeatmapResponse struct {
	TotalContributions int                `json:"total_contributions" example:"1234"`
	Weeks              []ContributionWeek `json:"weeks"`
	From               string             `json:"from" example:"2024-10-16T00:00:00Z"`
	To                 string             `json:"to" example:"2025-10-16T23:59:59Z"`
}

// PRMergeTimeDataPoint represents a single data point for PR merge time metrics (weekly)
type PRMergeTimeDataPoint struct {
	WeekStart    string  `json:"week_start" example:"2024-10-15"`
	WeekEnd      string  `json:"week_end" example:"2024-10-21"`
	AverageHours float64 `json:"average_hours" example:"18.5"`
	PRCount      int     `json:"pr_count" example:"3"`
}

// ProviderPRMergeTimeResponse represents PR merge time data from a single provider
type ProviderPRMergeTimeResponse struct {
	ProviderName            string                 `json:"provider_name" example:"githubtools"`
	AveragePRMergeTimeHours float64                `json:"average_pr_merge_time_hours" example:"24.5"`
	PRCount                 int                    `json:"pr_count" example:"15"`
	TimeSeries              []PRMergeTimeDataPoint `json:"time_series"`
}

// AveragePRMergeTimeResponse represents the response for average PR merge time across all providers
type AveragePRMergeTimeResponse struct {
	AveragePRMergeTimeHours float64                       `json:"average_pr_merge_time_hours" example:"24.5"`
	PRCount                 int                           `json:"pr_count" example:"15"`
	Period                  string                        `json:"period" example:"30d"`
	From                    string                        `json:"from" example:"2024-10-03T00:00:00Z"`
	To                      string                        `json:"to" example:"2024-11-02T23:59:59Z"`
	Providers               []ProviderPRMergeTimeResponse `json:"providers"`
}

// parseRepositoryFromURL extracts repository information from a GitHub URL
// Handles URLs like: https://github.com/owner/repo/pull/123
// or https://github.enterprise.com/owner/repo/pull/123
func parseRepositoryFromURL(urlStr string) (owner, repoName, fullName string) {
	if urlStr == "" {
		return "", "", ""
	}

	// Remove protocol and split by /
	urlStr = strings.TrimPrefix(urlStr, "https://")
	urlStr = strings.TrimPrefix(urlStr, "http://")
	parts := strings.Split(urlStr, "/")

	// We need at least: domain/owner/repo/...
	if len(parts) < 3 {
		return "", "", ""
	}

	// parts[0] is the domain (GitHub.com or github.enterprise.com)
	// parts[1] is the owner
	// parts[2] is the repo name
	owner = parts[1]
	repoName = parts[2]
	fullName = owner + "/" + repoName

	return owner, repoName, fullName
}

// GetUserOpenPullRequests retrieves all open pull requests for the authenticated user
func (s *GitHubService) GetUserOpenPullRequests(ctx context.Context, userUUID, provider, state, sort, direction string, perPage, page int) (*PullRequestsResponse, error) {
	if userUUID == "" || provider == "" {
		return nil, apperrors.ErrMissingUserUUIDAndProvider
	}

	// Check if provider exists in the configured providers map
	providers := s.authService.GetAllProviders()
	if _, exists := providers[provider]; !exists {
		return nil, apperrors.ErrInvalidProvider
	}

	// Get GitHub client
	client, err := s.authService.CreateGitHubClient(ctx, userUUID, provider)
	if err != nil {
		return nil, fmt.Errorf("failed to get GitHub client: %w", err)
	}

	// Set default values
	if state == "" {
		state = "open"
	}
	if sort == "" {
		sort = "created"
	}
	if direction == "" {
		direction = "desc"
	}
	if perPage <= 0 || perPage > 100 {
		perPage = 30
	}
	if page <= 0 {
		page = 1
	}

	// Search for pull requests created by the authenticated user
	// Using search API for better filtering capabilities
	// Note: GitHub Search API doesn't support state:all - omit state qualifier to get all PRs
	var query string
	if state == "all" {
		query = "is:pr author:@me"
	} else {
		query = fmt.Sprintf("is:pr author:@me state:%s", state)
	}

	searchOpts := &github.SearchOptions{
		Sort:  sort,
		Order: direction,
		ListOptions: github.ListOptions{
			PerPage: perPage,
			Page:    page,
		},
	}

	result, resp, err := client.Search.Issues(ctx, query, searchOpts)
	if err != nil {
		// Check if it's a rate limit error
		if resp != nil && resp.StatusCode == 403 {
			return nil, apperrors.ErrGitHubAPIRateLimitExceeded
		}
		return nil, fmt.Errorf("failed to search pull requests: %w", err)
	}

	// Convert GitHub issues (PRs are issues in GitHub API) to our PR structure
	pullRequests := make([]PullRequest, 0, len(result.Issues))
	for _, issue := range result.Issues {
		if issue.PullRequestLinks == nil {
			continue // Skip if it's not actually a PR
		}

		pr := PullRequest{
			ID:        issue.GetID(),
			Number:    issue.GetNumber(),
			Title:     issue.GetTitle(),
			State:     issue.GetState(),
			CreatedAt: issue.GetCreatedAt().Time,
			UpdatedAt: issue.GetUpdatedAt().Time,
			HTMLURL:   issue.GetHTMLURL(),
			Draft:     issue.GetDraft(),
			User: GitHubUser{
				Login:     issue.GetUser().GetLogin(),
				ID:        issue.GetUser().GetID(),
				AvatarURL: issue.GetUser().GetAvatarURL(),
			},
		}

		// Parse repository info from the issue
		if issue.Repository != nil {
			pr.Repo = Repository{
				Name:     issue.Repository.GetName(),
				FullName: issue.Repository.GetFullName(),
				Private:  issue.Repository.GetPrivate(),
			}
			if issue.Repository.Owner != nil {
				pr.Repo.Owner = issue.Repository.Owner.GetLogin()
			}
		} else {
			// Fallback: parse repository info from the HTML URL
			// GitHub Search API often doesn't include the Repository field
			owner, repoName, fullName := parseRepositoryFromURL(issue.GetHTMLURL())
			if owner != "" && repoName != "" {
				pr.Repo = Repository{
					Name:     repoName,
					FullName: fullName,
					Owner:    owner,
					// Note: We can't determine if the repo is private from the URL alone
					// Default to false, but this could be enhanced with an additional API call if needed
					Private: false,
				}
			}
		}

		pullRequests = append(pullRequests, pr)
	}

	response := &PullRequestsResponse{
		PullRequests: pullRequests,
		Total:        result.GetTotal(),
	}

	return response, nil
}

// getUserTotalContributionsForProvider is a private helper that fetches contributions for a single provider
func (s *GitHubService) getUserTotalContributionsForProvider(ctx context.Context, userUUID, provider string) (int, time.Time, time.Time, error) {
	// Get GitHub graphql client
	client, err := s.authService.CreateGraphqlClient(ctx, userUUID, provider)
	if err != nil {
		return 0, time.Time{}, time.Time{}, fmt.Errorf("failed to create GitHub client: %w", err)
	}

	// GraphQL query shape (shurcooL/githubv4 generates the query from this struct)
	type contributionsDefaultQuery struct {
		Viewer struct {
			ContributionsCollection struct {
				StartedAt            githubv4.DateTime
				EndedAt              githubv4.DateTime
				ContributionCalendar struct {
					TotalContributions githubv4.Int
				}
			} `graphql:"contributionsCollection"`
		} `graphql:"viewer"`
	}

	var q contributionsDefaultQuery
	if err := client.Query(ctx, &q, nil); err != nil {
		return 0, time.Time{}, time.Time{}, fmt.Errorf("graphql query failed: %w", err)
	}

	started := q.Viewer.ContributionsCollection.StartedAt.Time
	ended := q.Viewer.ContributionsCollection.EndedAt.Time
	total := int(q.Viewer.ContributionsCollection.ContributionCalendar.TotalContributions)

	return total, started, ended, nil
}

// GetUserTotalContributions retrieves the total contributions for the authenticated user across all providers
func (s *GitHubService) GetUserTotalContributions(ctx context.Context, userUUID string) (*TotalContributionsResponse, error) {
	if userUUID == "" {
		return nil, apperrors.ErrUserUUIDMissing
	}

	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"user_uuid": userUUID,
	})

	// Get all available providers
	providersMap := s.authService.GetAllProviders()

	// Channel to collect results from goroutines
	type providerResult struct {
		provider      string
		contributions int
		startedAt     time.Time
		endedAt       time.Time
	}

	resultsChan := make(chan providerResult, len(providersMap))

	// Use WaitGroup to ensure all goroutines complete before closing the channel
	var wg sync.WaitGroup
	wg.Add(len(providersMap))

	// Launch goroutines to fetch contributions from each provider in parallel
	for providerName := range providersMap {
		go func(prov string) {
			defer wg.Done()

			provLog := log.WithField("provider", prov)
			provLog.Debug("Fetching contributions for provider")

			total, started, ended, err := s.getUserTotalContributionsForProvider(ctx, userUUID, prov)
			if err != nil {
				provLog.WithError(err).Warn("Failed to fetch contributions for provider, setting total to 0")
				total = 0
				started = time.Time{}
				ended = time.Time{}
			}

			resultsChan <- providerResult{
				provider:      prov,
				contributions: total,
				startedAt:     started,
				endedAt:       ended,
			}
		}(providerName)
	}

	// Close the channel after all goroutines complete
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results from all goroutines
	contributionsForProvider := make([]ProviderContentResponse, 0, len(providersMap))
	var firstStartedAt, firstEndedAt time.Time
	hasValidDates := false
	totalContributions := 0

	for result := range resultsChan {
		// Always add the provider to the response, even if there was an error
		contributionsForProvider = append(contributionsForProvider, ProviderContentResponse{
			ProviderName:       result.provider,
			TotalContributions: result.contributions,
		})

		// Sum up total contributions from all providers
		totalContributions += result.contributions

		// Track the date range (use the first successful provider's dates)
		if !result.startedAt.IsZero() && !hasValidDates {
			firstStartedAt = result.startedAt
			firstEndedAt = result.endedAt
			hasValidDates = true
		}
	}

	return &TotalContributionsResponse{
		TotalContributions: totalContributions,
		From:               firstStartedAt.Format(time.RFC3339),
		To:                 firstEndedAt.Format(time.RFC3339),
		Providers:          contributionsForProvider,
	}, nil
}

// getAveragePRMergeTimeForProvider is a private helper that fetches PR merge time data for a single provider
func (s *GitHubService) getAveragePRMergeTimeForProvider(ctx context.Context, userUUID, provider string, from time.Time) (float64, int, []PRMergeTimeDataPoint, error) {
	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"provider": provider,
	})

	client, err := s.authService.CreateGraphqlClient(ctx, userUUID, provider)
	if err != nil {
		log.Errorf("Failed to create GitHub GraphQL client: %v", err)
		return 0, 0, nil, fmt.Errorf("failed to create GitHub GraphQL client: %w", err)
	}

	// Build a search query for merged PRs
	searchQuery := fmt.Sprintf("is:pr author:@me is:merged merged:>=%s", from.Format("2006-01-02"))

	// Collect all PRs with pagination
	type prData struct {
		CreatedAt githubv4.DateTime
		MergedAt  githubv4.DateTime
	}

	type prTimesSearchQuery struct {
		Search struct {
			PageInfo struct {
				HasNextPage githubv4.Boolean
				EndCursor   githubv4.String
			}
			Nodes []struct {
				PR prData `graphql:"... on PullRequest"`
			}
		} `graphql:"search(query: $q, type: ISSUE, first: $first, after: $after)"`
	}

	allPRs := make([]struct{ CreatedAt, MergedAt time.Time }, 0, 256)
	var after *githubv4.String
	pageSize := 100

	for {
		var q prTimesSearchQuery
		vars := map[string]any{
			"q":     githubv4.String(searchQuery),
			"first": githubv4.Int(pageSize),
			"after": after, // nil for first page
		}

		if err := client.Query(ctx, &q, vars); err != nil {
			return 0, 0, nil, fmt.Errorf("graphql query failed: %w", err)
		}

		for _, n := range q.Search.Nodes {
			created := n.PR.CreatedAt.Time
			merged := n.PR.MergedAt.Time

			// Defensive: a query is:merged, but keep it safe.
			if merged.IsZero() || created.IsZero() {
				continue
			}

			allPRs = append(allPRs, struct{ CreatedAt, MergedAt time.Time }{
				CreatedAt: created,
				MergedAt:  merged,
			})
		}

		if !bool(q.Search.PageInfo.HasNextPage) {
			break
		}
		c := q.Search.PageInfo.EndCursor
		after = &c
	}

	// Calculate merge times and group by week
	type weekData struct {
		totalHours float64
		count      int
		weekStart  time.Time
		weekEnd    time.Time
	}

	// Define 4 weeks going back from today
	now := time.Now().UTC()
	weeks := make([]*weekData, 4)
	for i := 0; i < 4; i++ {
		weekEnd := now.AddDate(0, 0, -7*i)
		weekStart := weekEnd.AddDate(0, 0, -7)
		weeks[i] = &weekData{
			weekStart: weekStart,
			weekEnd:   weekEnd,
		}
	}

	var totalHours float64
	var validPRCount int

	for _, pr := range allPRs {
		// if pr mergedAt or createdAt are missing, skip
		if pr.MergedAt.IsZero() || pr.CreatedAt.IsZero() {
			continue
		}

		mergeTimeHours := pr.MergedAt.Sub(pr.CreatedAt).Hours()
		totalHours += mergeTimeHours
		validPRCount++

		// Assign PR to the appropriate week
		for _, week := range weeks {
			if (pr.MergedAt.Equal(week.weekStart) || pr.MergedAt.After(week.weekStart)) && pr.MergedAt.Before(week.weekEnd) {
				week.totalHours += mergeTimeHours
				week.count++
				break
			}
		}
	}

	log.Infof("Total merged PRs found: %d, successfully processed: %d", len(allPRs), validPRCount)

	// Calculate overall average and round to 2 decimal places
	var averageHours float64
	if validPRCount > 0 {
		averageHours = roundTo2Decimals(totalHours / float64(validPRCount))
	}

	// Build time series (always 4 weeks, newest to oldest)
	timeSeries := make([]PRMergeTimeDataPoint, 4)
	for i := 0; i < 4; i++ {
		week := weeks[i]
		var avgForWeek float64
		if week.count > 0 {
			avgForWeek = roundTo2Decimals(week.totalHours / float64(week.count))
		}
		timeSeries[i] = PRMergeTimeDataPoint{
			WeekStart:    week.weekStart.Format("2006-01-02"),
			WeekEnd:      week.weekEnd.Format("2006-01-02"),
			AverageHours: avgForWeek,
			PRCount:      week.count,
		}
	}

	return averageHours, validPRCount, timeSeries, nil
}

// GetAveragePRMergeTime retrieves the average time to merge PRs for the authenticated user across all providers
func (s *GitHubService) GetAveragePRMergeTime(ctx context.Context, userUUID, period string) (*AveragePRMergeTimeResponse, error) {
	if userUUID == "" {
		return nil, apperrors.ErrUserUUIDMissing
	}

	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"user_uuid": userUUID,
		"period":    period,
	})

	// Parse and validate period
	var from, to time.Time
	var parsedPeriod string
	var err error

	if period == "" {
		period = "30d"
	}

	from, to, parsedPeriod, err = parsePeriod(period)
	if err != nil {
		log.Errorf("Invalid period format: %s", period)
		return nil, fmt.Errorf("%w: %w", apperrors.ErrInvalidPeriodFormat, err)
	}

	log.Debugf("Querying merged PRs from %s to %s", from.Format(time.RFC3339), to.Format(time.RFC3339))

	// Get all available providers
	providersMap := s.authService.GetAllProviders()

	// Channel to collect results from goroutines
	type providerResult struct {
		provider     string
		averageHours float64
		prCount      int
		timeSeries   []PRMergeTimeDataPoint
		err          error
	}

	resultsChan := make(chan providerResult, len(providersMap))

	// Use WaitGroup to ensure all goroutines complete before closing the channel
	var wg sync.WaitGroup
	wg.Add(len(providersMap))

	// Launch goroutines to fetch PR merge time data from each provider in parallel
	for providerName := range providersMap {
		go func(providerName string) {
			defer wg.Done()

			provLog := log.WithField("provider", providerName)
			provLog.Debug("Fetching PR merge time data for provider")

			avgHours, count, series, err := s.getAveragePRMergeTimeForProvider(ctx, userUUID, providerName, from)
			if err != nil {
				provLog.WithError(err).Warn("Failed to fetch PR merge time data for provider, setting values to 0")
				avgHours = 0
				count = 0
				series = make([]PRMergeTimeDataPoint, 0)
			}

			resultsChan <- providerResult{
				provider:     providerName,
				averageHours: avgHours,
				prCount:      count,
				timeSeries:   series,
				err:          err,
			}
		}(providerName)
	}

	// Close the channel after all goroutines complete
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results from all goroutines
	providerResponses := make([]ProviderPRMergeTimeResponse, 0, len(providersMap))
	var totalHours float64
	var totalPRCount int

	for result := range resultsChan {
		// Always add the provider to the response, even if there was an error
		providerResponses = append(providerResponses, ProviderPRMergeTimeResponse{
			ProviderName:            result.provider,
			AveragePRMergeTimeHours: result.averageHours,
			PRCount:                 result.prCount,
			TimeSeries:              result.timeSeries,
		})

		// Accumulate totals for overall average calculation
		if result.prCount > 0 {
			totalHours += result.averageHours * float64(result.prCount)
			totalPRCount += result.prCount
		}
	}

	// Calculate overall average across all providers
	var overallAverage float64
	if totalPRCount > 0 {
		overallAverage = roundTo2Decimals(totalHours / float64(totalPRCount))
	}

	response := &AveragePRMergeTimeResponse{
		AveragePRMergeTimeHours: overallAverage,
		PRCount:                 totalPRCount,
		Period:                  parsedPeriod,
		From:                    from.Format(time.RFC3339),
		To:                      to.Format(time.RFC3339),
		Providers:               providerResponses,
	}

	log.Infof("Successfully calculated average PR merge time: %.2f hours across %d PRs from %d providers",
		overallAverage, totalPRCount, len(providersMap))

	return response, nil
}

// roundTo2Decimals rounds a float64 to 2 decimal places
func roundTo2Decimals(num float64) float64 {
	return math.Round(num*100) / 100
}

// parsePeriod parses a period string (e.g., "30d", "90d", "365d") and returns the from/to dates
// Default period is 365 days if not specified or invalid
func parsePeriod(period string) (from, to time.Time, parsedPeriod string, err error) {
	to = time.Now().UTC()

	// Default to 365 days if empty or invalid
	days := 365
	parsedPeriod = "365d"

	if period != "" {
		// Parse period format like "30d", "90d", "365d"
		if len(period) < 2 || period[len(period)-1] != 'd' {
			return time.Time{}, time.Time{}, "", fmt.Errorf("period must be in format '<number>d' (e.g., '30d', '90d', '365d')")
		}

		var parseErr error
		days, parseErr = strconv.Atoi(period[:len(period)-1])
		if parseErr != nil || days <= 0 {
			return time.Time{}, time.Time{}, "", fmt.Errorf("period must contain a positive number of days")
		}

		// GitHub API supports max 1 year of contributions
		if days > 365 {
			days = 365
		}

		parsedPeriod = period
	}

	from = to.AddDate(0, 0, -days)

	// Set from to start of day and to end of day
	from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, time.UTC)
	to = time.Date(to.Year(), to.Month(), to.Day(), 23, 59, 59, 0, time.UTC)

	return from, to, parsedPeriod, nil
}

// GetRepositoryContent fetches repository file or directory content from GitHub
func (s *GitHubService) GetRepositoryContent(ctx context.Context, userUUID, provider, owner, repo, path, ref string) (interface{}, error) {
	// Get GitHub client
	client, err := s.authService.CreateGitHubClient(ctx, userUUID, provider)
	if err != nil {
		return nil, err
	}

	// Set default ref if not provided
	if ref == "" {
		ref = "main"
	}

	// Remove all leading slashes from a path if present
	if len(path) > 0 && path[0] == '/' {
		path = strings.TrimLeft(path, "/")
	}

	// Fetch repository content
	fileContent, directoryContent, resp, err := client.Repositories.GetContents(
		ctx,
		owner,
		repo,
		path,
		&github.RepositoryContentGetOptions{
			Ref: ref,
		},
	)

	// Handle errors
	if err != nil {
		// Check for rate limit
		if resp != nil && resp.StatusCode == 403 {
			return nil, apperrors.ErrGitHubAPIRateLimitExceeded
		}
		// Check for not found
		if resp != nil && resp.StatusCode == 404 {
			return nil, apperrors.NewNotFoundError("repository content")
		}
		return nil, fmt.Errorf("failed to fetch repository content: %w", err)
	}

	// Return directory contents (array)
	if directoryContent != nil {
		result := make([]map[string]interface{}, len(directoryContent))
		for i, item := range directoryContent {
			result[i] = map[string]interface{}{
				"name":         item.GetName(),
				"path":         item.GetPath(),
				"sha":          item.GetSHA(),
				"size":         item.GetSize(),
				"url":          item.GetURL(),
				"html_url":     item.GetHTMLURL(),
				"git_url":      item.GetGitURL(),
				"download_url": item.GetDownloadURL(),
				"type":         item.GetType(),
				"_links": map[string]string{
					"self": item.GetURL(),
					"git":  item.GetGitURL(),
					"html": item.GetHTMLURL(),
				},
			}
		}
		return result, nil
	}

	// Return file content (object)
	if fileContent != nil {
		content, err := fileContent.GetContent()
		if err != nil {
			return nil, fmt.Errorf("failed to get file content: %w", err)
		}
		return map[string]interface{}{
			"name":         fileContent.GetName(),
			"path":         fileContent.GetPath(),
			"sha":          fileContent.GetSHA(),
			"size":         fileContent.GetSize(),
			"url":          fileContent.GetURL(),
			"html_url":     fileContent.GetHTMLURL(),
			"git_url":      fileContent.GetGitURL(),
			"download_url": fileContent.GetDownloadURL(),
			"type":         fileContent.GetType(),
			"content":      content,
			"encoding":     fileContent.GetEncoding(),
			"_links": map[string]string{
				"self": fileContent.GetURL(),
				"git":  fileContent.GetGitURL(),
				"html": fileContent.GetHTMLURL(),
			},
		}, nil
	}

	return nil, fmt.Errorf("unexpected response from GitHub API")
}

// UpdateRepositoryFile updates a file in a GitHub repository
func (s *GitHubService) UpdateRepositoryFile(ctx context.Context, userUUID, provider, owner, repo, path, message, content, sha, branch string) (interface{}, error) {
	// Get GitHub client
	client, err := s.authService.CreateGitHubClient(ctx, userUUID, provider)
	if err != nil {
		return nil, fmt.Errorf("failed to create github client: %w", err)
	}

	// Remove leading slash from a path if present
	if len(path) > 0 && path[0] == '/' {
		path = path[1:]
	}

	// Set the default branch if not provided
	if branch == "" {
		branch = "main"
	}

	// Create update options
	opts := &github.RepositoryContentFileOptions{
		Message: github.String(message),
		Content: []byte(content),
		SHA:     github.String(sha),
		Branch:  github.String(branch),
	}

	// Update the file
	result, resp, err := client.Repositories.UpdateFile(ctx, owner, repo, path, opts)
	if err != nil {
		// Check for rate limit
		if resp != nil && resp.StatusCode == 403 {
			return nil, apperrors.ErrGitHubAPIRateLimitExceeded
		}
		// Check for not found
		if resp != nil && resp.StatusCode == 404 {
			return nil, apperrors.NewNotFoundError("repository or file")
		}
		return nil, fmt.Errorf("failed to update repository file: %w", err)
	}

	// Return the result
	return map[string]interface{}{
		"content": map[string]interface{}{
			"name":         result.Content.GetName(),
			"path":         result.Content.GetPath(),
			"sha":          result.Content.GetSHA(),
			"size":         result.Content.GetSize(),
			"url":          result.Content.GetURL(),
			"html_url":     result.Content.GetHTMLURL(),
			"git_url":      result.Content.GetGitURL(),
			"download_url": result.Content.GetDownloadURL(),
			"type":         result.Content.GetType(),
		},
		"commit": map[string]interface{}{
			"sha":      result.Commit.GetSHA(),
			"url":      result.Commit.GetURL(),
			"html_url": result.Commit.GetHTMLURL(),
			"message":  result.Commit.GetMessage(),
			"author": map[string]interface{}{
				"name":  result.Commit.Author.GetName(),
				"email": result.Commit.Author.GetEmail(),
				"date":  result.Commit.Author.GetDate(),
			},
			"committer": map[string]interface{}{
				"name":  result.Commit.Committer.GetName(),
				"email": result.Commit.Committer.GetEmail(),
				"date":  result.Commit.Committer.GetDate(),
			},
		},
	}, nil
}

// DeleteRepositoryFile deletes a file from a GitHub repository
func (s *GitHubService) DeleteRepositoryFile(ctx context.Context, userUUID, provider, owner, repo, path, message, sha, branch string) (interface{}, error) {
	// Remove leading slash from a path if present
	if len(path) > 0 && path[0] == '/' {
		path = path[1:]
	}

	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"owner":    owner,
		"repo":     repo,
		"path":     path,
		"provider": provider,
	})

	// Get access token
	accessToken, err := s.authService.GetGitHubAccessToken(userUUID, provider)
	if err != nil {
		log.WithError(err).Error("Failed to get access token")
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	// Create GitHub client
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: accessToken})
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	// Set base URL for GitHub Enterprise
	if provider == "githubtools" {
		baseURL, _ := url.Parse("https://github.tools.sap/api/v3/")
		uploadURL, _ := url.Parse("https://github.tools.sap/api/uploads/")
		client.BaseURL = baseURL
		client.UploadURL = uploadURL
	} else if provider == "githubwdf" {
		baseURL, _ := url.Parse("https://github.wdf.sap.corp/api/v3/")
		uploadURL, _ := url.Parse("https://github.wdf.sap.corp/api/uploads/")
		client.BaseURL = baseURL
		client.UploadURL = uploadURL
	}

	// Prepare delete options
	opts := &github.RepositoryContentFileOptions{
		Message: github.String(message),
		SHA:     github.String(sha),
	}

	// Add branch if specified
	if branch != "" {
		opts.Branch = github.String(branch)
	}

	// Delete the file
	response, _, err := client.Repositories.DeleteFile(ctx, owner, repo, path, opts)
	if err != nil {
		log.WithError(err).Error("Failed to delete file in GitHub")
		return nil, fmt.Errorf("failed to delete file: %w", err)
	}

	log.Info("Successfully deleted file in GitHub")

	return map[string]interface{}{
		"commit": response.Commit,
		"sha":    response.SHA,
	}, nil
}

// DeleteRepositoryFolder deletes an empty folder from a GitHub repository
// Returns an error if the folder is not empty or doesn't exist
func (s *GitHubService) DeleteRepositoryFolder(ctx context.Context, userUUID, provider, owner, repo, path, message, branch string) (interface{}, error) {
	// Remove leading slash from a path if present
	if len(path) > 0 && path[0] == '/' {
		path = path[1:]
	}

	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"owner":    owner,
		"repo":     repo,
		"path":     path,
		"provider": provider,
	})

	// Get access token
	accessToken, err := s.authService.GetGitHubAccessToken(userUUID, provider)
	if err != nil {
		log.WithError(err).Error("Failed to get access token")
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	// Create GitHub client
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: accessToken})
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	// Set base URL for GitHub Enterprise
	if provider == "githubtools" {
		baseURL, _ := url.Parse("https://github.tools.sap/api/v3/")
		uploadURL, _ := url.Parse("https://github.tools.sap/api/uploads/")
		client.BaseURL = baseURL
		client.UploadURL = uploadURL
	} else if provider == "githubwdf" {
		baseURL, _ := url.Parse("https://github.wdf.sap.corp/api/v3/")
		uploadURL, _ := url.Parse("https://github.wdf.sap.corp/api/uploads/")
		client.BaseURL = baseURL
		client.UploadURL = uploadURL
	}

	// Set the default branch if not provided
	if branch == "" {
		branch = "main"
	}

	// First, check if the directory exists and get its contents
	_, directoryContent, _, err := client.Repositories.GetContents(ctx, owner, repo, path, &github.RepositoryContentGetOptions{
		Ref: branch,
	})
	if err != nil {
		log.WithError(err).Error("Failed to get directory contents")
		return nil, fmt.Errorf("failed to get directory contents: %w", err)
	}

	if directoryContent == nil {
		return nil, fmt.Errorf("path is not a directory")
	}

	// Check if the directory is empty (only .gitkeep is allowed)
	var gitkeepFile *github.RepositoryContent
	for _, item := range directoryContent {
		if item.GetName() == ".gitkeep" {
			gitkeepFile = item
		} else {
			// Found a file other than .gitkeep - directory is not empty
			log.WithField("file", item.GetName()).Error("Directory is not empty")
			return nil, fmt.Errorf("cannot delete non-empty directory: contains %s", item.GetName())
		}
	}

	// If no .gitkeep file found, directory is truly empty (shouldn't happen in our case)
	if gitkeepFile == nil {
		return nil, fmt.Errorf("directory is empty but has no .gitkeep file")
	}

	// Delete the .gitkeep file (which effectively deletes the folder)
	opts := &github.RepositoryContentFileOptions{
		Message: github.String(message),
		SHA:     github.String(gitkeepFile.GetSHA()),
		Branch:  github.String(branch),
	}

	gitkeepPath := path + "/.gitkeep"
	response, _, err := client.Repositories.DeleteFile(ctx, owner, repo, gitkeepPath, opts)
	if err != nil {
		log.WithError(err).Error("Failed to delete .gitkeep file")
		return nil, fmt.Errorf("failed to delete folder: %w", err)
	}

	log.Info("Successfully deleted empty folder in GitHub")

	return map[string]interface{}{
		"commit": response.Commit,
		"sha":    response.SHA,
	}, nil
}

// GetGitHubAsset fetches a GitHub asset (image, file, etc.) with authentication
func (s *GitHubService) GetGitHubAsset(ctx context.Context, userUUID, provider, assetURL string) ([]byte, string, error) {
	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"asset_url": assetURL,
		"provider":  provider,
		"user_uuid": userUUID,
	})

	// Get access token from auth service
	accessToken, err := s.authService.GetGitHubAccessToken(userUUID, provider)
	if err != nil {
		log.WithError(err).Error("Failed to get access token from claims")
		return nil, "", fmt.Errorf("failed to get access token: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "GET", assetURL, nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create request: %w", err)
	}

	// Add authorization header
	// GitHub asset URLs may require "token" prefix instead of "Bearer"
	req.Header.Set("Authorization", fmt.Sprintf("token %s", accessToken))
	req.Header.Set("Accept", "*/*")
	req.Header.Set("User-Agent", "Developer-Portal-Backend")

	// Make the request with redirect following
	// GitHub asset URLs redirect to media.github.tools.sap with a temporary token
	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Follow up to 10 redirects (default)
			if len(via) >= 10 {
				return fmt.Errorf("stopped after 10 redirects")
			}
			// Preserve Authorization header only for same host
			// Don't send OAuth token to media.github.tools.sap (it uses query param token)
			if req.URL.Host != via[0].URL.Host {
				req.Header.Del("Authorization")
			}
			return nil
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.WithError(err).Error("Failed to fetch GitHub asset")
		return nil, "", fmt.Errorf("failed to fetch asset: %w", err)
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {

		}
	}(resp.Body)

	// Log response for debugging
	log.WithFields(map[string]interface{}{
		"status_code":    resp.StatusCode,
		"content_type":   resp.Header.Get("Content-Type"),
		"content_length": resp.Header.Get("Content-Length"),
	}).Debug("GitHub asset response received")

	// Check response status
	if resp.StatusCode == 403 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.WithFields(map[string]interface{}{
			"response_body": string(bodyBytes),
		}).Warn("GitHub API rate limit exceeded for asset")
		return nil, "", apperrors.ErrGitHubAPIRateLimitExceeded
	}
	if resp.StatusCode == 404 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.WithFields(map[string]interface{}{
			"response_body": string(bodyBytes),
		}).Warn("GitHub asset not found")
		return nil, "", fmt.Errorf("GitHub asset not found at URL: %s", assetURL)
	}
	if resp.StatusCode == 401 {
		// Read the error body to see what GitHub says
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.WithFields(map[string]interface{}{
			"response_body": string(bodyBytes),
		}).Error("GitHub authentication failed with 'token' prefix")

		// Try with "Bearer" prefix instead of "token"
		req2, _ := http.NewRequestWithContext(ctx, "GET", assetURL, nil)
		req2.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
		req2.Header.Set("Accept", "*/*")
		req2.Header.Set("User-Agent", "Developer-Portal-Backend")

		resp2, err2 := client.Do(req2)
		if err2 != nil {
			return nil, "", fmt.Errorf("failed to fetch asset with Bearer auth: %w", err2)
		}
		defer func(Body io.ReadCloser) {
			err := Body.Close()
			if err != nil {

			}
		}(resp2.Body)

		if resp2.StatusCode != 200 {
			bodyBytes, _ := io.ReadAll(resp2.Body)
			log.WithFields(map[string]interface{}{
				"status_code": resp2.StatusCode,
				"body":        string(bodyBytes),
			}).Error("Authentication failed with both methods")
			return nil, "", fmt.Errorf("authentication failed with both token and Bearer: status %d", resp2.StatusCode)
		}

		resp = resp2
		log.Info("Successfully authenticated with 'Bearer' prefix")
	} else if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.WithFields(map[string]interface{}{
			"status_code": resp.StatusCode,
			"body":        string(bodyBytes),
		}).Error("Unexpected status code fetching asset")
		return nil, "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Read response body
	assetData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read asset data: %w", err)
	}

	// Get content type from response headers
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	log.WithFields(map[string]interface{}{
		"size":         len(assetData),
		"content_type": contentType,
	}).Info("Successfully fetched GitHub asset")
	return assetData, contentType, nil
}

func (s *GitHubService) ClosePullRequest(ctx context.Context, userUUID, provider, owner, repo string, prNumber int, deleteBranch bool) (*PullRequest, error) {
	if (userUUID == "") || (provider == "") {
		return nil, apperrors.ErrMissingUserUUIDAndProvider
	}
	if owner == "" || repo == "" {
		return nil, apperrors.ErrOwnerAndRepositoryMissing
	}

	// GitHub client
	client, err := s.authService.CreateGitHubClient(ctx, userUUID, provider)
	if err != nil {
		return nil, fmt.Errorf("failed to get GitHub client: %w", err)
	}

	// Fetch PR to ensure it exists and check current state, also get head branch
	pr, resp, err := client.PullRequests.Get(ctx, owner, repo, prNumber)
	if err != nil {
		if resp != nil && resp.StatusCode == 403 {
			return nil, apperrors.ErrGitHubAPIRateLimitExceeded
		}
		if resp != nil && resp.StatusCode == 404 {
			return nil, apperrors.NewNotFoundError("pull request")
		}
		return nil, fmt.Errorf("failed to get pull request: %w", err)
	}

	// Only close open PRs
	if strings.EqualFold(pr.GetState(), "closed") {
		return nil, fmt.Errorf("%w: pull request is already closed", apperrors.ErrInvalidStatus)
	}

	// Close the PR
	updated, resp, err := client.PullRequests.Edit(ctx, owner, repo, prNumber, &github.PullRequest{
		State: github.String("closed"),
	})
	if err != nil {
		if resp != nil && resp.StatusCode == 403 {
			return nil, apperrors.ErrGitHubAPIRateLimitExceeded
		}
		if resp != nil && resp.StatusCode == 404 {
			return nil, apperrors.NewNotFoundError("pull request")
		}
		return nil, fmt.Errorf("failed to close pull request: %w", err)
	}

	// Optionally delete the PR branch
	if deleteBranch {
		head := updated.GetHead()
		branch := head.GetRef()
		headRepo := head.GetRepo()
		headRepoName := repo
		headOwner := owner
		if headRepo != nil {
			if headRepo.GetName() != "" {
				headRepoName = headRepo.GetName()
			}
			if headRepo.GetOwner() != nil && headRepo.GetOwner().GetLogin() != "" {
				headOwner = headRepo.GetOwner().GetLogin()
			}
		}
		if branch != "" && headRepoName != "" && headOwner != "" {
			ref := fmt.Sprintf("heads/%s", branch)
			delResp, delErr := client.Git.DeleteRef(ctx, headOwner, headRepoName, ref)
			if delErr != nil {
				if delResp != nil && delResp.StatusCode == 403 {
					return nil, apperrors.ErrGitHubAPIRateLimitExceeded
				}
				// Ignore 404 (branch already deleted or not found)
				if delResp == nil || delResp.StatusCode != 404 {
					return nil, fmt.Errorf("failed to delete branch '%s' in %s/%s: %w", branch, headOwner, headRepoName, delErr)
				}
			}
		}
	}

	// Convert to our PullRequest structure
	result := PullRequest{
		ID:        updated.GetID(),
		Number:    updated.GetNumber(),
		Title:     updated.GetTitle(),
		State:     updated.GetState(),
		CreatedAt: updated.GetCreatedAt().Time,
		UpdatedAt: updated.GetUpdatedAt().Time,
		HTMLURL:   updated.GetHTMLURL(),
		Draft:     updated.GetDraft(),
		User: GitHubUser{
			Login:     updated.GetUser().GetLogin(),
			ID:        updated.GetUser().GetID(),
			AvatarURL: updated.GetUser().GetAvatarURL(),
		},
		Repo: Repository{
			Name:     repo,
			FullName: owner + "/" + repo,
			Owner:    owner,
			Private:  false,
		},
	}

	return &result, nil
}

// getPRReviewCommentsForProvider is a private helper that fetches PR review comments for a single provider
func (s *GitHubService) getPRReviewCommentsForProvider(ctx context.Context, userUUID, provider string, from, to time.Time) (int, error) {
	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"provider": provider,
	})

	// Create GitHub client
	client, err := s.authService.CreateGitHubClient(ctx, userUUID, provider)
	if err != nil {
		log.WithError(err).Error("Failed to create GitHub client")
		return 0, fmt.Errorf("failed to create GitHub client: %w", err)
	}

	// Search for pull request review comments by the user within the time period
	query := fmt.Sprintf("type:pr reviewed-by:@me created:%s..%s",
		from.Format("2006-01-02"),
		to.Format("2006-01-02"))

	searchOpts := &github.SearchOptions{
		ListOptions: github.ListOptions{
			PerPage: 100,
			Page:    1,
		},
	}

	totalComments := 0

	// Paginate through all results
	for {
		result, resp, err := client.Search.Issues(ctx, query, searchOpts)
		if err != nil {
			if resp != nil && resp.StatusCode == 403 {
				return 0, apperrors.ErrGitHubAPIRateLimitExceeded
			}
			return 0, fmt.Errorf("failed to search PR review comments: %w", err)
		}

		totalComments += result.GetTotal()

		// Check if there are more pages
		if resp.NextPage == 0 {
			break
		}
		searchOpts.Page = resp.NextPage
	}

	log.Infof("Found %d PR review comments for provider", totalComments)
	return totalComments, nil
}

// GetUserPRReviewComments gets the total number of PR review comments made by the authenticated user across all providers
func (s *GitHubService) GetUserPRReviewComments(ctx context.Context, userUUID, period string) (*PRReviewCommentsResponse, error) {
	if userUUID == "" {
		return nil, apperrors.ErrUserUUIDMissing
	}

	log := logger.WithContext(ctx).WithFields(map[string]interface{}{
		"user_uuid": userUUID,
		"period":    period,
	})

	// Parse period (default to 30 days)
	var from, to time.Time
	var err error

	if period == "" {
		period = "30d"
	}

	// Parse custom period and calculate date range
	from, to, _, err = parsePeriod(period)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", apperrors.ErrInvalidPeriodFormat, err)
	}

	// Get all available providers
	providersMap := s.authService.GetAllProviders()

	// Channel to collect results from goroutines
	type providerResult struct {
		provider string
		comments int
	}

	resultsChan := make(chan providerResult, len(providersMap))

	// Use WaitGroup to ensure all goroutines complete before closing the channel
	var wg sync.WaitGroup
	wg.Add(len(providersMap))

	// Launch goroutines to fetch PR review comments from each provider in parallel
	for providerName := range providersMap {
		go func(providerName string) {
			defer wg.Done()

			provLog := log.WithField("provider", providerName)
			provLog.Debug("Fetching PR review comments for provider")

			comments, err := s.getPRReviewCommentsForProvider(ctx, userUUID, providerName, from, to)
			if err != nil {
				provLog.WithError(err).Warn("Failed to fetch PR review comments for provider, setting count to 0")
				comments = 0
			}

			resultsChan <- providerResult{
				provider: providerName,
				comments: comments,
			}
		}(providerName)
	}

	// Close the channel after all goroutines complete
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results from all goroutines
	providerResponses := make([]ProviderPRReviewCommentsResponse, 0, len(providersMap))
	totalComments := 0

	for result := range resultsChan {
		// Always add the provider to the response, even if there was an error
		providerResponses = append(providerResponses, ProviderPRReviewCommentsResponse{
			ProviderName:  result.provider,
			TotalComments: result.comments,
		})

		// Sum up total comments from all providers
		totalComments += result.comments
	}

	response := &PRReviewCommentsResponse{
		TotalComments: totalComments,
		From:          from.Format(time.RFC3339),
		To:            to.Format(time.RFC3339),
		Period:        period,
		Providers:     providerResponses,
	}

	log.Infof("Successfully calculated total PR review comments: %d across %d providers", totalComments, len(providersMap))

	return response, nil
}
