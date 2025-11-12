import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJiraIssues, fetchMyJiraIssues, fetchMyJiraIssuesCount } from '../../src/services/JiraApi';
import { apiClient } from '../../src/services/ApiClient';
import type { 
  JiraIssuesResponse, 
  JiraIssuesCountResponse,
  JiraIssuesParams,
  MyJiraIssuesParams,
  MyJiraIssuesCountParams 
} from '../../src/types/api';

// Mock the apiClient
vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('JiraApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchJiraIssues', () => {
    const mockResponse: JiraIssuesResponse = {
      issues: [
        {
          id: '10001',
          key: 'PROJ-123',
          fields: {
            summary: 'Test issue',
            status: { id: '1', name: 'Open' },
            issuetype: { id: '1', name: 'Bug' },
            priority: { id: '2', name: 'High' },
            assignee: {
              accountId: 'user123',
              displayName: 'John Doe',
              emailAddress: 'john@example.com',
            },
            reporter: {
              accountId: 'user456',
              displayName: 'Jane Smith',
              emailAddress: 'jane@example.com',
            },
            created: '2025-01-01T10:00:00Z',
            updated: '2025-01-15T14:30:00Z',
            resolved: '2025-01-20T16:00:00Z',
            description: 'Test description',
          },
          project: 'PROJ',
          link: 'https://jira.example.com/browse/PROJ-123',
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    };

    it('should fetch Jira issues without parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await fetchJiraIssues();

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with project filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        project: 'SAPBTPCFS',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          project: 'SAPBTPCFS',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with status filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        status: 'Open,In Progress,Re Opened',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          status: 'Open,In Progress,Re Opened',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with team filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        team: 'backend-team',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          team: 'backend-team',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with assignee filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        assignee: 'john.doe',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          assignee: 'john.doe',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with type filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        type: 'bug',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          type: 'bug',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with summary search', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        summary: 'authentication error',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          summary: 'authentication error',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with key search', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        key: 'PROJ-123',
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          key: 'PROJ-123',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        page: 2,
        limit: 25,
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          page: 2,
          limit: 25,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch Jira issues with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        project: 'SAPBTPCFS',
        status: 'Open,In Progress',
        team: 'backend-team',
        assignee: 'john.doe',
        type: 'bug',
        page: 1,
        limit: 50,
      };

      const result = await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.objectContaining({
          project: 'SAPBTPCFS',
          status: 'Open,In Progress',
          team: 'backend-team',
          assignee: 'john.doe',
          type: 'bug',
          page: 1,
          limit: 50,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty results', async () => {
      const emptyResponse: JiraIssuesResponse = {
        issues: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

      const result = await fetchJiraIssues({ project: 'NONEXISTENT' });

      expect(result).toEqual(emptyResponse);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('API request failed');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(fetchJiraIssues()).rejects.toThrow('API request failed');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(networkError);

      await expect(fetchJiraIssues({ project: 'TEST' })).rejects.toThrow('Network error');
    });
  });

  describe('fetchMyJiraIssues', () => {
    const mockResponse: JiraIssuesResponse = {
      issues: [
        {
          id: '10002',
          key: 'PROJ-456',
          fields: {
            summary: 'My assigned issue',
            status: { id: '2', name: 'In Progress' },
            issuetype: { id: '2', name: 'Task' },
            priority: { id: '3', name: 'Medium' },
            assignee: {
              accountId: 'currentUser',
              displayName: 'Current User',
              emailAddress: 'current@example.com',
            },
            created: '2025-01-10T09:00:00Z',
            updated: '2025-01-15T11:00:00Z',
          },
          project: 'PROJ',
          link: 'https://jira.example.com/browse/PROJ-456',
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    };

    it('should fetch my Jira issues without parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await fetchMyJiraIssues({});

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch my Jira issues with status filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: MyJiraIssuesParams = {
        status: 'In Progress',
      };

      const result = await fetchMyJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: expect.objectContaining({
          status: 'In Progress',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch my Jira issues with project filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: MyJiraIssuesParams = {
        project: 'SAPBTPCFS',
      };

      const result = await fetchMyJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: expect.objectContaining({
          project: 'SAPBTPCFS',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch my Jira issues with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: MyJiraIssuesParams = {
        page: 2,
        limit: 25,
      };

      const result = await fetchMyJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: expect.objectContaining({
          page: 2,
          limit: 25,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch my Jira issues with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: MyJiraIssuesParams = {
        status: 'Open,In Progress',
        project: 'SAPBTPCFS',
        page: 1,
        limit: 50,
      };

      const result = await fetchMyJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: expect.objectContaining({
          status: 'Open,In Progress',
          project: 'SAPBTPCFS',
          page: 1,
          limit: 50,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(fetchMyJiraIssues({})).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchMyJiraIssuesCount', () => {
    const mockCountResponse: JiraIssuesCountResponse = {
      count: 42,
    };

    it('should fetch my Jira issues count with required status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCountResponse);

      const params: MyJiraIssuesCountParams = {
        status: 'Resolved',
      };

      const result = await fetchMyJiraIssuesCount(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me/count', {
        params: expect.objectContaining({
          status: 'Resolved',
        }),
      });
      expect(result).toEqual(mockCountResponse);
      expect(result.count).toBe(42);
    });

    it('should fetch my Jira issues count with project filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCountResponse);

      const params: MyJiraIssuesCountParams = {
        status: 'Resolved',
        project: 'SAPBTPCFS',
      };

      const result = await fetchMyJiraIssuesCount(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me/count', {
        params: expect.objectContaining({
          status: 'Resolved',
          project: 'SAPBTPCFS',
        }),
      });
      expect(result).toEqual(mockCountResponse);
    });

    it('should fetch my Jira issues count with date filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCountResponse);

      const params: MyJiraIssuesCountParams = {
        status: 'Resolved',
        date: '2025-01-15',
      };

      const result = await fetchMyJiraIssuesCount(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me/count', {
        params: expect.objectContaining({
          status: 'Resolved',
          date: '2025-01-15',
        }),
      });
      expect(result).toEqual(mockCountResponse);
    });

    it('should fetch my Jira issues count with all parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCountResponse);

      const params: MyJiraIssuesCountParams = {
        status: 'Resolved',
        project: 'SAPBTPCFS',
        date: '2025-01-15',
      };

      const result = await fetchMyJiraIssuesCount(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me/count', {
        params: expect.objectContaining({
          status: 'Resolved',
          project: 'SAPBTPCFS',
          date: '2025-01-15',
        }),
      });
      expect(result).toEqual(mockCountResponse);
    });

    it('should handle zero count', async () => {
      const zeroCountResponse: JiraIssuesCountResponse = {
        count: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(zeroCountResponse);

      const result = await fetchMyJiraIssuesCount({ status: 'Closed' });

      expect(result.count).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('Bad request');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(
        fetchMyJiraIssuesCount({ status: 'Invalid' })
      ).rejects.toThrow('Bad request');
    });
  });

  describe('Type casting behavior', () => {
    it('should properly cast params to Record type for fetchJiraIssues', async () => {
      const mockResponse: JiraIssuesResponse = {
        issues: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: JiraIssuesParams = {
        project: 'TEST',
        status: 'Open',
        page: 1,
        limit: 10,
      };

      await fetchJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues', {
        params: expect.any(Object),
      });
    });

    it('should properly cast params to Record type for fetchMyJiraIssues', async () => {
      const mockResponse: JiraIssuesResponse = {
        issues: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params: MyJiraIssuesParams = {
        status: 'Open',
        page: 1,
      };

      await fetchMyJiraIssues(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me', {
        params: expect.any(Object),
      });
    });

    it('should properly cast params to Record type for fetchMyJiraIssuesCount', async () => {
      const mockCountResponse: JiraIssuesCountResponse = {
        count: 5,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockCountResponse);

      const params: MyJiraIssuesCountParams = {
        status: 'Resolved',
        project: 'TEST',
      };

      await fetchMyJiraIssuesCount(params);

      expect(apiClient.get).toHaveBeenCalledWith('/jira/issues/me/count', {
        params: expect.any(Object),
      });
    });
  });
});