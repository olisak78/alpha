import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchGitHubPullRequests, fetchGitHubContributions } from '../../src/services/githubApi';
import { apiClient } from '../../src/services/ApiClient';
import type { GitHubPRQueryParams, GitHubPullRequestsResponse } from '../../src/types/developer-portal';
import type { GitHubContributionsResponse } from '../../src/types/api';

// Mock the apiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('githubApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // fetchGitHubPullRequests TESTS
  // ============================================================================

  describe('fetchGitHubPullRequests', () => {
    it('should fetch pull requests without parameters', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 1,
            number: 123,
            title: 'Add new feature',
            state: 'open',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-02T10:00:00Z',
            html_url: 'https://github.com/org/repo/pull/123',
            user: {
              login: 'johndoe',
              id: 1,
              avatar_url: 'https://github.com/avatars/1',
            },
            repository: {
              name: 'my-repo',
              full_name: 'org/my-repo',
              owner: 'org',
              private: false,
            },
            draft: false,
          },
        ],
        total: 1,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests();

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch pull requests with all query parameters', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const params: GitHubPRQueryParams = {
        state: 'open',
        sort: 'created',
        direction: 'desc',
        per_page: 50,
        page: 2,
      };

      await fetchGitHubPullRequests(params);

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: {
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 50,
          page: 2,
        },
      });
    });

    it('should fetch open pull requests', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 1,
            number: 100,
            title: 'Open PR',
            state: 'open',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
            html_url: 'https://github.com/org/repo/pull/100',
            user: {
              login: 'user1',
              id: 1,
              avatar_url: 'https://github.com/avatars/1',
            },
            repository: {
              name: 'repo',
              full_name: 'org/repo',
              owner: 'org',
              private: false,
            },
            draft: false,
          },
        ],
        total: 1,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests({ state: 'open' });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { state: 'open' },
      });
      expect(result.pull_requests).toHaveLength(1);
      expect(result.pull_requests[0].state).toBe('open');
    });

    it('should fetch closed pull requests', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 2,
            number: 101,
            title: 'Closed PR',
            state: 'closed',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
            html_url: 'https://github.com/org/repo/pull/101',
            user: {
              login: 'user2',
              id: 2,
              avatar_url: 'https://github.com/avatars/2',
            },
            repository: {
              name: 'repo',
              full_name: 'org/repo',
              owner: 'org',
              private: false,
            },
            draft: false,
          },
        ],
        total: 1,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests({ state: 'closed' });

      expect(result.pull_requests[0].state).toBe('closed');
    });

    it('should fetch all pull requests regardless of state', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 1,
            number: 100,
            title: 'Open PR',
            state: 'open',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
            html_url: 'https://github.com/org/repo/pull/100',
            user: {
              login: 'user1',
              id: 1,
              avatar_url: 'https://github.com/avatars/1',
            },
            repository: {
              name: 'repo',
              full_name: 'org/repo',
              owner: 'org',
              private: false,
            },
            draft: false,
          },
          {
            id: 2,
            number: 101,
            title: 'Closed PR',
            state: 'closed',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
            html_url: 'https://github.com/org/repo/pull/101',
            user: {
              login: 'user2',
              id: 2,
              avatar_url: 'https://github.com/avatars/2',
            },
            repository: {
              name: 'repo',
              full_name: 'org/repo',
              owner: 'org',
              private: false,
            },
            draft: false,
          },
        ],
        total: 2,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests({ state: 'all' });

      expect(result.pull_requests).toHaveLength(2);
    });

    it('should sort pull requests by created date', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests({ sort: 'created', direction: 'asc' });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { sort: 'created', direction: 'asc' },
      });
    });

    it('should sort pull requests by updated date', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests({ sort: 'updated', direction: 'desc' });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { sort: 'updated', direction: 'desc' },
      });
    });

    it('should sort by popularity', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests({ sort: 'popularity' });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { sort: 'popularity' },
      });
    });

    it('should sort by long-running', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests({ sort: 'long-running' });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { sort: 'long-running' },
      });
    });

    it('should handle pagination with per_page parameter', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 100,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests({ per_page: 25, page: 3 });

      expect(apiClient.get).toHaveBeenCalledWith('/github/pull-requests', {
        params: { per_page: 25, page: 3 },
      });
    });

    it('should handle empty response', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests();

      expect(result.pull_requests).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle draft pull requests', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 1,
            number: 100,
            title: 'Draft PR',
            state: 'open',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
            html_url: 'https://github.com/org/repo/pull/100',
            user: {
              login: 'user1',
              id: 1,
              avatar_url: 'https://github.com/avatars/1',
            },
            repository: {
              name: 'repo',
              full_name: 'org/repo',
              owner: 'org',
              private: false,
            },
            draft: true,
          },
        ],
        total: 1,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests();

      expect(result.pull_requests[0].draft).toBe(true);
    });

    it('should handle private repositories', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [
          {
            id: 1,
            number: 100,
            title: 'Private repo PR',
            state: 'open',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
            html_url: 'https://github.com/org/private-repo/pull/100',
            user: {
              login: 'user1',
              id: 1,
              avatar_url: 'https://github.com/avatars/1',
            },
            repository: {
              name: 'private-repo',
              full_name: 'org/private-repo',
              owner: 'org',
              private: true,
            },
            draft: false,
          },
        ],
        total: 1,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests();

      expect(result.pull_requests[0].repository.private).toBe(true);
    });

    it('should handle API errors', async () => {
      const error = new Error('GitHub API Error');
      (apiClient.get as any).mockRejectedValueOnce(error);

      await expect(fetchGitHubPullRequests()).rejects.toThrow('GitHub API Error');
    });

    it('should pass correct endpoint', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubPullRequests();

      expect(apiClient.get).toHaveBeenCalledWith(
        '/github/pull-requests',
        expect.any(Object)
      );
    });

    it('should handle multiple pull requests', async () => {
      const mockResponse: GitHubPullRequestsResponse = {
        pull_requests: new Array(10).fill(null).map((_, i) => ({
          id: i + 1,
          number: 100 + i,
          title: `PR ${i + 1}`,
          state: 'open',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: `https://github.com/org/repo/pull/${100 + i}`,
          user: {
            login: `user${i + 1}`,
            id: i + 1,
            avatar_url: `https://github.com/avatars/${i + 1}`,
          },
          repository: {
            name: 'repo',
            full_name: 'org/repo',
            owner: 'org',
            private: false,
          },
          draft: false,
        })),
        total: 10,
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubPullRequests();

      expect(result.pull_requests).toHaveLength(10);
      expect(result.total).toBe(10);
    });
  });

  // ============================================================================
  // fetchGitHubContributions TESTS
  // ============================================================================

  describe('fetchGitHubContributions', () => {
    it('should fetch GitHub contributions', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 1234,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(apiClient.get).toHaveBeenCalledWith('/github/contributions');
      expect(result).toEqual(mockResponse);
    });

    it('should return total contributions count', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 500,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(result.total_contributions).toBe(500);
    });

    it('should return period information', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 100,
        period: 'last_year',
        from: '2023-01-01',
        to: '2023-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(result.period).toBe('last_year');
      expect(result.from).toBe('2023-01-01');
      expect(result.to).toBe('2023-12-31');
    });

    it('should handle zero contributions', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 0,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(result.total_contributions).toBe(0);
    });

    it('should handle large contribution counts', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 999999,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(result.total_contributions).toBe(999999);
    });

    it('should handle API errors', async () => {
      const error = new Error('Contributions API Error');
      (apiClient.get as any).mockRejectedValueOnce(error);

      await expect(fetchGitHubContributions()).rejects.toThrow('Contributions API Error');
    });

    it('should pass correct endpoint', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 100,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubContributions();

      expect(apiClient.get).toHaveBeenCalledWith('/github/contributions');
    });

    it('should not pass any parameters', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 100,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchGitHubContributions();

      // Verify no params object is passed
      expect(apiClient.get).toHaveBeenCalledWith('/github/contributions');
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle different date formats', async () => {
      const mockResponse: GitHubContributionsResponse = {
        total_contributions: 250,
        period: 'custom',
        from: '2024-06-01',
        to: '2024-06-30',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchGitHubContributions();

      expect(result.from).toBe('2024-06-01');
      expect(result.to).toBe('2024-06-30');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle multiple API calls in sequence', async () => {
      const prResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 0,
      };

      const contributionsResponse: GitHubContributionsResponse = {
        total_contributions: 100,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any)
        .mockResolvedValueOnce(prResponse)
        .mockResolvedValueOnce(contributionsResponse);

      const prs = await fetchGitHubPullRequests();
      const contributions = await fetchGitHubContributions();

      expect(prs.total).toBe(0);
      expect(contributions.total_contributions).toBe(100);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle parallel API calls', async () => {
      const prResponse: GitHubPullRequestsResponse = {
        pull_requests: [],
        total: 5,
      };

      const contributionsResponse: GitHubContributionsResponse = {
        total_contributions: 200,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      (apiClient.get as any)
        .mockResolvedValueOnce(prResponse)
        .mockResolvedValueOnce(contributionsResponse);

      const [prs, contributions] = await Promise.all([
        fetchGitHubPullRequests(),
        fetchGitHubContributions(),
      ]);

      expect(prs.total).toBe(5);
      expect(contributions.total_contributions).toBe(200);
    });
  });
});