import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import all hooks to test
import { useTeams, useTeam } from '../../src/hooks/api/useTeams';
import { useUsers, useCurrentUser, useLdapUserSearch } from '../../src/hooks/api/useMembers';
import { useComponentsByTeam, useComponentsByOrganization } from '../../src/hooks/api/useComponents';
import { useOrganizations, useOrganization, useOrganizationByName } from '../../src/hooks/api/useOrganizations';
import { useQuickLinks } from '../../src/hooks/api/useQuickLinks';
import { useJiraIssues, useMyJiraIssues, useMyJiraIssuesCount } from '../../src/hooks/api/useJira';
import { useGitHubPRs } from '../../src/hooks/api/useGitHubPRs';
import { useGitHubContributions } from '../../src/hooks/api/useGitHubContributions';

// Mock the API client
import { apiClient } from '../../src/services/ApiClient';
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock services
vi.mock('../../src/services/ComponentsApi', () => ({
  fetchComponentsByTeamId: vi.fn(),
  fetchComponentsByOrganization: vi.fn(),
}));

vi.mock('../../src/services/JiraApi', () => ({
  fetchJiraIssues: vi.fn(),
  fetchMyJiraIssues: vi.fn(),
  fetchMyJiraIssuesCount: vi.fn(),
}));

vi.mock('../../src/services/githubApi', () => ({
  fetchGitHubPullRequests: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { fetchComponentsByTeamId, fetchComponentsByOrganization } from '../../src/services/ComponentsApi';
import { fetchJiraIssues, fetchMyJiraIssues, fetchMyJiraIssuesCount } from '../../src/services/JiraApi';
import { fetchGitHubPullRequests, fetchGitHubContributions } from '../../src/services/githubApi';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a fresh QueryClient for each test to ensure isolation
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: 0, // Don't cache between tests (garbage collection time)
        staleTime: 0,
      },
    },
  });
}

/**
 * Wrapper component that provides QueryClient context
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockTeam = (overrides?: any) => ({
  id: 'team-123',
  organization_id: 'org-123',
  name: 'Test Team',
  display_name: 'Test Team',
  description: 'A test team',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockMember = (overrides?: any) => ({
  id: 'member-123',
  organization_id: 'org-123',
  team_id: 'team-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockComponent = (overrides?: any) => ({
  id: 'component-123',
  organization_id: 'org-123',
  name: 'test-service',
  display_name: 'Test Service',
  description: 'A test service',
  component_type: 'service',
  status: 'active',
  group_name: 'backend',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockOrganization = (overrides?: any) => ({
  id: 'org-123',
  name: 'Test Organization',
  display_name: 'Test Organization',
  description: 'A test organization',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockQuickLink = (overrides?: any) => ({
  url: 'https://example.com',
  title: 'Example Link',
  category: 'Development',
  ...overrides,
});

const createMockJiraIssue = (overrides?: any) => ({
  id: 'JIRA-123',
  key: 'JIRA-123',
  summary: 'Test Issue',
  status: 'In Progress',
  assignee: 'John Doe',
  created: '2025-01-01T00:00:00Z',
  updated: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockGitHubPR = (overrides?: any) => ({
  id: 123,
  number: 456,
  title: 'Test PR',
  state: 'open',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// ============================================================================
// TEAMS HOOKS TESTS
// ============================================================================

describe('Teams Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useTeams', () => {
    it('should fetch all teams successfully', async () => {
      const mockTeams = [createMockTeam(), createMockTeam({ id: 'team-456', name: 'Team 2' })];
      const mockResponse = {
        teams: mockTeams,
        total: 2,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTeams(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.teams).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/teams', { params: undefined });
    });

    it('should fetch teams with query parameters', async () => {
      const params = { organization_id: 'org-123', page: 1, page_size: 10 };
      const mockResponse = {
        teams: [createMockTeam()],
        total: 1,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTeams(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/teams', { params });
      expect(result.current.data?.teams).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch teams');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useTeams(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });

    it('should return empty teams array when no data', async () => {
      const mockResponse = {
        teams: [],
        total: 0,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTeams(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.teams).toHaveLength(0);
      expect(result.current.data?.total).toBe(0);
    });
  });

  describe('useTeam', () => {
    it('should fetch a single team by ID', async () => {
      const mockTeam = createMockTeam();
      vi.mocked(apiClient.get).mockResolvedValue(mockTeam);

      const { result } = renderHook(() => useTeam('team-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTeam);
      expect(apiClient.get).toHaveBeenCalledWith('/teams/team-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { result } = renderHook(() => useTeam(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle 404 errors', async () => {
      const error = new Error('Team not found');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useTeam('non-existent-team'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

});

// ============================================================================
// MEMBERS HOOKS TESTS
// ============================================================================

describe('Members Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useUsers', () => {
    it('should fetch users with organization_id', async () => {
      const mockUsers = [createMockMember(), createMockMember({ id: 'member-456' })];
      const mockResponse = {
        users: mockUsers,
        total: 2,
        limit: 20,
        offset: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useUsers({ organization_id: 'org-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.users).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/users', {
        params: { limit: 20, offset: 0, organization_id: 'org-123' },
      });
    });

    it('should fetch even with empty organization_id', async () => {
      const mockResponse = {
        users: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useUsers({ organization_id: '' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.users).toHaveLength(0);
      expect(apiClient.get).toHaveBeenCalledWith('/users', {
        params: { limit: 20, offset: 0, organization_id: '' },
      });
    });

    it('should handle filtering by team_id', async () => {
      const mockResponse = {
        users: [createMockMember()],
        total: 1,
        limit: 20,
        offset: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useUsers({ organization_id: 'org-123', team_id: 'team-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/users', {
        params: { limit: 20, offset: 0, organization_id: 'org-123', team_id: 'team-123' },
      });
    });
  });

  describe('useCurrentUser', () => {
    it('should fetch current user data', async () => {
      const mockUser = {
        id: 'current-user-123',
        uuid: 'uuid-123',
        team_id: 'team-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        mobile: '+1234567890',
        team_domain: 'developer',
        team_role: 'member',
        link: [],
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    });

    it('should handle API errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useLdapUserSearch', () => {
    it('should search LDAP users by cn', async () => {
      const mockApiResponse = {
        result: [
          { 
            id: 'john.doe',
            email: 'john@example.com', 
            first_name: 'John',
            last_name: 'Doe'
          },
          { 
            id: 'john.smith',
            email: 'john.smith@example.com',
            first_name: 'John',
            last_name: 'Smith'
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useLdapUserSearch('john'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.users).toHaveLength(2);
      expect(result.current.data?.users[0].cn).toBe('john.doe');
      expect(result.current.data?.users[0].email).toBe('john@example.com');
      expect(apiClient.get).toHaveBeenCalledWith('/users/search/new?name=john');
    });

    it('should not search with empty cn', async () => {
      const { result } = renderHook(() => useLdapUserSearch(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle search with no results', async () => {
      const mockApiResponse = {
        result: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useLdapUserSearch('nonexistent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.users).toHaveLength(0);
      expect(result.current.data?.total).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('LDAP search failed');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useLdapUserSearch('test'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});

// ============================================================================
// COMPONENTS HOOKS TESTS
// ============================================================================

describe('Components Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useComponentsByTeam', () => {
    it('should fetch components by team ID', async () => {
      const mockResponse = [createMockComponent(), createMockComponent({ id: 'component-456' })];

      vi.mocked(fetchComponentsByTeamId).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useComponentsByTeam('team-123', 'org-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.components).toHaveLength(2);
      expect(fetchComponentsByTeamId).toHaveBeenCalledWith('team-123');
    });

    it('should not fetch without team ID or organization ID', async () => {
      const { result } = renderHook(
        () => useComponentsByTeam('', ''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchComponentsByTeamId).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch components');
      vi.mocked(fetchComponentsByTeamId).mockRejectedValue(error);

      const { result } = renderHook(
        () => useComponentsByTeam('team-123', 'org-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useComponentsByOrganization', () => {
    it('should fetch all components for an organization', async () => {
      const mockResponse = [
        createMockComponent(),
        createMockComponent({ id: 'component-456', name: 'another-service' }),
      ];

      vi.mocked(fetchComponentsByOrganization).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useComponentsByOrganization('org-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(fetchComponentsByOrganization).toHaveBeenCalledWith('org-123');
    });

    it('should not fetch without organization ID', async () => {
      const { result } = renderHook(
        () => useComponentsByOrganization(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchComponentsByOrganization).not.toHaveBeenCalled();
    });

    it('should return empty components array', async () => {
      const mockResponse: any[] = [];

      vi.mocked(fetchComponentsByOrganization).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useComponentsByOrganization('org-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(0);
    });
  });
});

// ============================================================================
// ORGANIZATIONS HOOKS TESTS
// ============================================================================

describe('Organizations Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useOrganizations', () => {
    it('should fetch all organizations', async () => {
      const mockOrgs = [
        createMockOrganization(),
        createMockOrganization({ id: 'org-456', name: 'Org 2' }),
      ];
      const mockResponse = {
        organizations: mockOrgs,
        total: 2,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOrganizations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.organizations).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/organizations', { params: undefined });
    });

    it('should fetch organizations with pagination', async () => {
      const mockResponse = {
        organizations: [createMockOrganization()],
        total: 1,
        page: 2,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useOrganizations({ page: 2, page_size: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/organizations', {
        params: { page: 2, page_size: 10 },
      });
    });
  });

  describe('useOrganization', () => {
    it('should fetch a single organization by ID', async () => {
      const mockOrg = createMockOrganization();
      vi.mocked(apiClient.get).mockResolvedValue(mockOrg);

      const { result } = renderHook(() => useOrganization('org-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOrg);
      expect(apiClient.get).toHaveBeenCalledWith('/organizations/org-123');
    });

    it('should not fetch without organization ID', async () => {
      const { result } = renderHook(() => useOrganization(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useOrganizationByName', () => {
    it('should fetch organization by name', async () => {
      const mockOrg = createMockOrganization({ name: 'Test Org' });
      vi.mocked(apiClient.get).mockResolvedValue(mockOrg);

      const { result } = renderHook(() => useOrganizationByName('Test Org'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOrg);
      expect(apiClient.get).toHaveBeenCalledWith('/organizations/by-name/Test Org');
    });

    it('should not fetch without organization name', async () => {
      const { result } = renderHook(() => useOrganizationByName(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// QUICK LINKS HOOKS TESTS
// ============================================================================

describe('Quick Links Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useQuickLinks', () => {
    it('should fetch quick links for a member', async () => {
      const mockLinks = [
        createMockQuickLink(),
        createMockQuickLink({ url: 'https://github.com', title: 'GitHub' }),
      ];
      const mockResponse = {
        quick_links: mockLinks,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useQuickLinks('member-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.quick_links).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/members/member-123/quick-links');
    });

    it('should not fetch without member ID', async () => {
      const { result } = renderHook(() => useQuickLinks(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should save quick links to localStorage on success', async () => {
      const mockLinks = [createMockQuickLink()];
      const mockResponse = { quick_links: mockLinks };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useQuickLinks('member-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stored = localStorage.getItem('quick-links');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockLinks);
    });

    it('should return empty quick links array', async () => {
      const mockResponse = { quick_links: [] };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useQuickLinks('member-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.quick_links).toHaveLength(0);
    });
  });
});

// ============================================================================
// JIRA HOOKS TESTS
// ============================================================================

describe('Jira Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useJiraIssues', () => {
    it('should fetch Jira issues with default params', async () => {
      const mockIssues = [createMockJiraIssue(), createMockJiraIssue({ id: 'JIRA-456' })];
      const mockResponse = {
        issues: mockIssues,
        total: 2,
      };

      vi.mocked(fetchJiraIssues).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useJiraIssues(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.issues).toHaveLength(2);
      expect(fetchJiraIssues).toHaveBeenCalledWith({});
    });

    it('should fetch Jira issues with filter params', async () => {
      const params = { team: 'backend', status: 'In Progress' };
      const mockResponse = {
        issues: [createMockJiraIssue()],
        total: 1,
      };

      vi.mocked(fetchJiraIssues).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useJiraIssues(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchJiraIssues).toHaveBeenCalledWith(params);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch Jira issues');
      vi.mocked(fetchJiraIssues).mockRejectedValue(error);

      const { result } = renderHook(() => useJiraIssues(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useMyJiraIssues', () => {
    it('should fetch current user Jira issues', async () => {
      const mockIssues = [createMockJiraIssue()];
      const mockResponse = {
        issues: mockIssues,
        total: 1,
      };

      vi.mocked(fetchMyJiraIssues).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMyJiraIssues(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.issues).toHaveLength(1);
      expect(fetchMyJiraIssues).toHaveBeenCalledWith({});
    });

    it('should fetch with status filter', async () => {
      const params = { status: 'Resolved' };
      const mockResponse = {
        issues: [createMockJiraIssue({ status: 'Resolved' })],
        total: 1,
      };

      vi.mocked(fetchMyJiraIssues).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMyJiraIssues(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchMyJiraIssues).toHaveBeenCalledWith(params);
    });
  });

  describe('useMyJiraIssuesCount', () => {
    it('should fetch count of issues by status', async () => {
      const mockResponse = {
        count: 5,
        status: 'Resolved',
      };

      vi.mocked(fetchMyJiraIssuesCount).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useMyJiraIssuesCount({ status: 'Resolved' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.count).toBe(5);
      expect(fetchMyJiraIssuesCount).toHaveBeenCalledWith({ status: 'Resolved' });
    });

    it('should not fetch without status', async () => {
      const { result } = renderHook(
        () => useMyJiraIssuesCount({ status: '' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchMyJiraIssuesCount).not.toHaveBeenCalled();
    });

    it('should return zero count', async () => {
      const mockResponse = {
        count: 0,
        status: 'Resolved',
      };

      vi.mocked(fetchMyJiraIssuesCount).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useMyJiraIssuesCount({ status: 'Resolved' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.count).toBe(0);
    });
  });
});

// ============================================================================
// GITHUB HOOKS TESTS
// ============================================================================

describe('GitHub Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useGitHubPRs', () => {
    it('should fetch GitHub pull requests', async () => {
      const mockPRs = [createMockGitHubPR(), createMockGitHubPR({ id: 456, number: 789 })];
      const mockResponse = {
        pull_requests: mockPRs,
        total: 2,
      };

      vi.mocked(fetchGitHubPullRequests).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGitHubPRs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pull_requests).toHaveLength(2);
      expect(fetchGitHubPullRequests).toHaveBeenCalledWith(undefined);
    });

    it('should fetch PRs with filter params', async () => {
      const params = { state: 'open' as const, page: 1 };
      const mockResponse = {
        pull_requests: [createMockGitHubPR()],
        total: 1,
      };

      vi.mocked(fetchGitHubPullRequests).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGitHubPRs(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchGitHubPullRequests).toHaveBeenCalledWith(params);
    });

    it('should handle API errors', async () => {
      const error = new Error('GitHub API rate limit exceeded');
      vi.mocked(fetchGitHubPullRequests).mockRejectedValue(error);

      const { result } = renderHook(() => useGitHubPRs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useGitHubContributions', () => {
    it('should fetch GitHub contributions', async () => {
      const mockResponse = {
        total_contributions: 250,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      vi.mocked(fetchGitHubContributions).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGitHubContributions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.total_contributions).toBe(250);
      expect(fetchGitHubContributions).toHaveBeenCalled();
    });

    it('should handle zero contributions', async () => {
      const mockResponse = {
        total_contributions: 0,
        period: 'last_year',
        from: '2024-01-01',
        to: '2024-12-31',
      };

      vi.mocked(fetchGitHubContributions).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGitHubContributions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.total_contributions).toBe(0);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch contributions');
      vi.mocked(fetchGitHubContributions).mockRejectedValue(error);

      const { result } = renderHook(() => useGitHubContributions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});
