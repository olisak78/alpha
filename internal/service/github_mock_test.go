package service_test

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	apperrors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/mocks"
	"developer-portal-backend/internal/service"

	"github.com/google/go-github/v57/github"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"golang.org/x/oauth2"
)

// Helper to create a GitHub Enterprise client pointing to a mock server.
// go-github requires Enterprise base URLs to include /api/v3 and /api/uploads suffixes.
func newMockEnterpriseGitHubClient(serverBaseURL string) (*github.Client, error) {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: "test-token"})
	httpClient := oauth2.NewClient(context.Background(), ts)
	return github.NewClient(httpClient).WithEnterpriseURLs(
		serverBaseURL+"/api/v3/",
		serverBaseURL+"/api/uploads/",
	)
}

// -----------------------------
// GetUserOpenPullRequests tests (uses CreateGitHubClient)
// -----------------------------

func TestGetUserOpenPullRequests_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// go-github Enterprise REST uses /api/v3
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/api/v3/search/issues", r.URL.Path)

		resp := map[string]interface{}{
			"total_count":        2,
			"incomplete_results": false,
			"items": []map[string]interface{}{
				{
					"id":       123456789,
					"number":   42,
					"title":    "Add new feature",
					"state":    "open",
					"html_url": "https://github.com/owner/test-repo/pull/42",
					"draft":    false,
					"user": map[string]interface{}{
						"login":      "testuser",
						"id":         12345,
						"avatar_url": "://avatars.githubusercontent.com/u/12345",
					},
					"pull_request": map[string]interface{}{
						"url": "https://api.github.com/repos/owner/test-repo/pulls/42",
					},
				},
				{
					"id":       987654321,
					"number":   43,
					"title":    "Fix critical bug",
					"state":    "open",
					"html_url": "https://github.com/owner/another-repo/pull/43",
					"draft":    true,
					"user": map[string]interface{}{
						"login":      "testuser",
						"id":         12345,
						"avatar_url": "https://avatars.githubusercontent.com/u/12345",
					},
					"pull_request": map[string]interface{}{
						"url": "https://api.github.com/repos/owner/another-repo/pulls/43",
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		GetAllProviders().
		Return(map[string]string{"githubtools": "https://github.tools.sap", "githubwdf": "https://github.wdf.sap.corp"}).
		Times(1)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.GetUserOpenPullRequests(context.Background(), "test-uuid", "githubtools", "open", "created", "desc", 30, 1)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, 2, result.Total)
	require.Len(t, result.PullRequests, 2)

	pr1 := result.PullRequests[0]
	assert.Equal(t, int64(123456789), pr1.ID)
	assert.Equal(t, 42, pr1.Number)
	assert.Equal(t, "Add new feature", pr1.Title)
	assert.Equal(t, "open", pr1.State)
	assert.Equal(t, "testuser", pr1.User.Login)
	assert.Equal(t, "test-repo", pr1.Repo.Name) // parsed from HTML URL
	assert.Equal(t, "owner", pr1.Repo.Owner)

	pr2 := result.PullRequests[1]
	assert.Equal(t, int64(987654321), pr2.ID)
	assert.Equal(t, 43, pr2.Number)
	assert.Equal(t, "Fix critical bug", pr2.Title)
	assert.True(t, pr2.Draft)
	assert.Equal(t, "another-repo", pr2.Repo.Name)
}

func TestGetUserOpenPullRequests_RateLimit(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api/v3/search/issues", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"message": "API rate limit exceeded"})
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		GetAllProviders().
		Return(map[string]string{"githubtools": "https://github.tools.sap", "githubwdf": "https://github.wdf.sap.corp"}).
		Times(1)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.GetUserOpenPullRequests(context.Background(), "test-uuid", "githubtools", "open", "created", "desc", 30, 1)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, apperrors.ErrGitHubAPIRateLimitExceeded)
}

// -----------------------------
// GetRepositoryContent tests (uses CreateGitHubClient)
// -----------------------------

func TestGetRepositoryContent_File(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	path := "README.md"
	content := "# Test Repository\nThis is a test README file."
	encoded := base64.StdEncoding.EncodeToString([]byte(content))

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/api/v3/repos/owner/repo/contents/"+path, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		resp := map[string]interface{}{
			"name":         "README.md",
			"path":         path,
			"sha":          "abc123",
			"size":         len(content),
			"url":          "https://api.github.com/repos/owner/repo/contents/" + path,
			"html_url":     "https://github.com/owner/repo/blob/main/" + path,
			"git_url":      "https://api.github.com/repos/owner/repo/git/blobs/abc",
			"download_url": "https://raw.githubusercontent.com/owner/repo/main/" + path,
			"type":         "file",
			"content":      encoded,
			"encoding":     "base64",
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.GetRepositoryContent(context.Background(), "test-uuid", "githubtools", "owner", "repo", path, "main")

	require.NoError(t, err)
	require.NotNil(t, result)

	fileResult, ok := result.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "file", fileResult["type"])
	assert.Equal(t, path, fileResult["path"])
	assert.Equal(t, content, fileResult["content"])
	assert.Equal(t, "base64", fileResult["encoding"])
	assert.NotEmpty(t, fileResult["sha"])
}

func TestGetRepositoryContent_Dir(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	path := "src"

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/api/v3/repos/owner/repo/contents/"+path, r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		resp := []map[string]interface{}{
			{
				"name":         "file1.txt",
				"path":         path + "/file1.txt",
				"sha":          "def456",
				"size":         100,
				"url":          "https://api.github.com/repos/owner/repo/contents/" + path + "/file1.txt",
				"html_url":     "https://github.com/owner/repo/blob/main/" + path + "/file1.txt",
				"git_url":      "https://api.github.com/repos/owner/repo/git/blobs/def456",
				"download_url": "https://raw.githubusercontent.com/owner/repo/main/" + path + "/file1.txt",
				"type":         "file",
			},
			{
				"name":         "subdir",
				"path":         path + "/subdir",
				"sha":          "ghi789",
				"size":         0,
				"url":          "https://api.github.com/repos/owner/repo/contents/" + path + "/subdir",
				"html_url":     "https://github.com/owner/repo/tree/main/" + path + "/subdir",
				"git_url":      "https://api.github.com/repos/owner/repo/git/trees/ghi789",
				"download_url": "https://github.com/owner/repo/archive/refs/heads/main.zip",
				"type":         "dir",
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.GetRepositoryContent(context.Background(), "test-uuid", "githubtools", "owner", "repo", path, "main")

	require.NoError(t, err)
	require.NotNil(t, result)

	dirResult, ok := result.([]map[string]interface{})
	require.True(t, ok)
	require.Len(t, dirResult, 2)
	assert.Equal(t, "file1.txt", dirResult[0]["name"])
	assert.Equal(t, "file", dirResult[0]["type"])
	assert.Equal(t, "subdir", dirResult[1]["name"])
	assert.Equal(t, "dir", dirResult[1]["type"])
}

// -----------------------------
// UpdateRepositoryFile tests (uses CreateGitHubClient)
// -----------------------------

func TestUpdateRepositoryFile_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	path := "README.md"
	message := "Update README"
	content := "# Updated README\n\nNew content here."
	sha := "abc123"
	branch := "main"

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "PUT", r.Method)
		assert.Equal(t, "/api/v3/repos/owner/repo/contents/"+path, r.URL.Path)

		var reqBody map[string]interface{}
		err := json.NewDecoder(r.Body).Decode(&reqBody)
		require.NoError(t, err)

		assert.Equal(t, message, reqBody["message"])
		assert.Equal(t, sha, reqBody["sha"])
		assert.Equal(t, branch, reqBody["branch"])

		// Content is base64 encoded by go-github client
		decoded, err := base64.StdEncoding.DecodeString(reqBody["content"].(string))
		require.NoError(t, err)
		assert.Equal(t, content, string(decoded))

		resp := map[string]interface{}{
			"content": map[string]interface{}{
				"name":         path,
				"path":         path,
				"sha":          "new-sha-after-update",
				"size":         len(content),
				"url":          "https://api.github.com/repos/owner/repo/contents/" + path,
				"html_url":     "https://github.com/owner/repo/blob/" + branch + "/" + path,
				"git_url":      "https://api.github.com/repos/owner/repo/git/blobs/new-sha",
				"download_url": "https://raw.githubusercontent.com/owner/repo/" + branch + "/" + path,
				"type":         "file",
			},
			"commit": map[string]interface{}{
				"sha":     "commit-sha-123",
				"message": message,
			},
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.UpdateRepositoryFile(
		context.Background(),
		"test-uuid",
		"githubtools",
		"owner",
		"repo",
		path,
		message,
		content,
		sha,
		branch,
	)

	require.NoError(t, err)
	require.NotNil(t, result)

	resultMap, ok := result.(map[string]interface{})
	require.True(t, ok)

	commit, ok := resultMap["commit"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "commit-sha-123", commit["sha"])
	assert.Equal(t, message, commit["message"])

	fileContent, ok := resultMap["content"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, path, fileContent["path"])
	assert.Equal(t, "file", fileContent["type"])
	assert.Equal(t, "new-sha-after-update", fileContent["sha"])
}

// -----------------------------
// ClosePullRequest tests (uses CreateGitHubClient)
// -----------------------------

func TestClosePullRequest_Success_OpenPR(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	owner := "test-owner"
	repo := "test-repo"
	prNumber := 42

	var getPRCalled, editPRCalled bool

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "GET" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			getPRCalled = true
			resp := map[string]interface{}{
				"id":       123456789,
				"number":   prNumber,
				"title":    "Test PR to close",
				"state":    "open",
				"html_url": "https://github.com/" + owner + "/" + repo + "/pull/" + fmt.Sprintf("%d", prNumber),
				"draft":    false,
				"user": map[string]interface{}{
					"login":      "testuser",
					"id":         12345,
					"avatar_url": "https://avatars.githubusercontent.com/u/12345",
				},
				"head": map[string]interface{}{
					"ref": "feature-branch",
					"repo": map[string]interface{}{
						"name": repo,
						"owner": map[string]interface{}{
							"login": owner,
						},
					},
				},
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		if r.Method == "PATCH" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			editPRCalled = true
			var reqBody map[string]interface{}
			_ = json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "closed", reqBody["state"])

			resp := map[string]interface{}{
				"id":       123456789,
				"number":   prNumber,
				"title":    "Test PR to close",
				"state":    "closed",
				"html_url": "https://github.com/" + owner + "/" + repo + "/pull/" + fmt.Sprintf("%d", prNumber),
				"draft":    false,
				"user": map[string]interface{}{
					"login":      "testuser",
					"id":         12345,
					"avatar_url": "https://avatars.githubusercontent.com/u/12345",
				},
				"head": map[string]interface{}{
					"ref": "feature-branch",
					"repo": map[string]interface{}{
						"name": repo,
						"owner": map[string]interface{}{
							"login": owner,
						},
					},
				},
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.ClosePullRequest(context.Background(), "test-uuid", "githubtools", owner, repo, prNumber, false)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.True(t, getPRCalled)
	assert.True(t, editPRCalled)
	assert.Equal(t, int64(123456789), result.ID)
	assert.Equal(t, prNumber, result.Number)
	assert.Equal(t, "Test PR to close", result.Title)
	assert.Equal(t, "closed", result.State)
	assert.False(t, result.Draft)
	assert.Equal(t, "testuser", result.User.Login)
}

func TestClosePullRequest_Success_DeleteBranch_SameRepo(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	owner := "test-owner"
	repo := "test-repo"
	prNumber := 99
	branchName := "feature-to-delete"

	var getPRCalled, editPRCalled, deleteBranchCalled bool

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "GET" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			getPRCalled = true
			resp := map[string]interface{}{
				"id":       999,
				"number":   prNumber,
				"title":    "PR with branch to delete",
				"state":    "open",
				"html_url": "https://github.com/" + owner + "/" + repo + "/pull/" + fmt.Sprintf("%d", prNumber),
				"draft":    false,
				"user": map[string]interface{}{
					"login":      "contributor",
					"id":         54321,
					"avatar_url": "https://avatars.githubusercontent.com/u/54321",
				},
				"head": map[string]interface{}{
					"ref": branchName,
					"repo": map[string]interface{}{
						"name": repo,
						"owner": map[string]interface{}{
							"login": owner,
						},
					},
				},
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		if r.Method == "PATCH" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			editPRCalled = true
			resp := map[string]interface{}{
				"id":       999,
				"number":   prNumber,
				"title":    "PR with branch to delete",
				"state":    "closed",
				"html_url": "https://github.com/" + owner + "/" + repo + "/pull/" + fmt.Sprintf("%d", prNumber),
				"draft":    false,
				"user": map[string]interface{}{
					"login":      "contributor",
					"id":         54321,
					"avatar_url": "https://avatars.githubusercontent.com/u/54321",
				},
				"head": map[string]interface{}{
					"ref": branchName,
					"repo": map[string]interface{}{
						"name": repo,
						"owner": map[string]interface{}{
							"login": owner,
						},
					},
				},
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		if r.Method == "DELETE" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/git/refs/heads/%s", owner, repo, branchName) {
			deleteBranchCalled = true
			w.WriteHeader(http.StatusNoContent)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.ClosePullRequest(context.Background(), "test-uuid", "githubtools", owner, repo, prNumber, true)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.True(t, getPRCalled)
	assert.True(t, editPRCalled)
	assert.True(t, deleteBranchCalled)
	assert.Equal(t, int64(999), result.ID)
	assert.Equal(t, "closed", result.State)
}

func TestClosePullRequest_AlreadyClosed(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	owner := "test-owner"
	repo := "test-repo"
	prNumber := 10

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "GET" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			resp := map[string]interface{}{
				"id":       100,
				"number":   prNumber,
				"title":    "Already closed PR",
				"state":    "closed",
				"html_url": "https://github.com/" + owner + "/" + repo + "/pull/" + fmt.Sprintf("%d", prNumber),
				"draft":    false,
				"user": map[string]interface{}{
					"login":      "testuser",
					"id":         12345,
					"avatar_url": "https://avatars.githubusercontent.com/u/12345",
				},
				"head": map[string]interface{}{
					"ref": "old-branch",
					"repo": map[string]interface{}{
						"name": repo,
						"owner": map[string]interface{}{
							"login": owner,
						},
					},
				},
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.ClosePullRequest(context.Background(), "test-uuid", "githubtools", owner, repo, prNumber, false)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, apperrors.ErrInvalidStatus)
	assert.Contains(t, err.Error(), "already closed")
}

func TestClosePullRequest_GetPR_RateLimit(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	owner := "test-owner"
	repo := "test-repo"
	prNumber := 42

	mockGitHubServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == "GET" && r.URL.Path == fmt.Sprintf("/api/v3/repos/%s/%s/pulls/%d", owner, repo, prNumber) {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"message": "API rate limit exceeded"})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockGitHubServer.Close()

	mockAuth := mocks.NewMockGitHubAuthService(ctrl)
	ghClient, err := newMockEnterpriseGitHubClient(mockGitHubServer.URL)
	require.NoError(t, err)

	mockAuth.EXPECT().
		CreateGitHubClient(gomock.Any(), "test-uuid", "githubtools").
		Return(ghClient, nil).
		Times(1)

	svc := service.NewGitHubServiceWithAdapter(mockAuth)
	result, err := svc.ClosePullRequest(context.Background(), "test-uuid", "githubtools", owner, repo, prNumber, false)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, apperrors.ErrGitHubAPIRateLimitExceeded)
}
