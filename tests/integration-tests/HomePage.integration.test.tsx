import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { CategoriesApiResponse } from '../../src/types/api';

// Mock only the external API calls and browser APIs that can't run in test environment
vi.mock('../../src/services/JiraApi', () => ({
  fetchMyJiraIssuesCount: vi.fn(),
  fetchMyJiraIssues: vi.fn()
}));

vi.mock('../../src/services/githubApi', () => ({
  fetchGitHubContributions: vi.fn(),
  fetchGitHubAveragePRTime: vi.fn(),
  fetchGitHubPRReviewComments: vi.fn(),
  fetchGitHubPullRequests: vi.fn()
}));

vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

// Mock the categories API that AddLinkDialog uses (it's actually in useLinks.ts)
vi.mock('../../src/hooks/api/useLinks', () => ({
  useCategories: vi.fn(),
  useLinks: vi.fn()
}));

// Mock HeaderNavigationContext
vi.mock('../../src/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
  HeaderNavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock browser APIs that don't exist in test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Import the mocked API functions
import { fetchMyJiraIssuesCount, fetchMyJiraIssues } from '../../src/services/JiraApi';
import {
  fetchGitHubContributions,
  fetchGitHubAveragePRTime,
  fetchGitHubPRReviewComments,
  fetchGitHubPullRequests
} from '../../src/services/githubApi';
import { apiClient } from '../../src/services/ApiClient';
import { useHeaderNavigation } from '../../src/contexts/HeaderNavigationContext';

// Test data - realistic API responses
const mockUserData = {
  id: 'user-1',
  uuid: 'uuid-1',
  team_id: 'team-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  mobile: '+1234567890',
  team_domain: 'engineering',
  team_role: 'developer',
  link: [],
  portal_admin: false
};

const mockJiraCountResponse = {
  count: 15
};

const mockJiraIssuesResponse = {
  issues: [{
    id: '1',
    key: 'TEST-123',
    fields: {
      summary: 'Test Issue',
      status: { id: '1', name: 'Open' },
      issuetype: { id: '1', name: 'Bug' },
      priority: { id: '1', name: 'High' },
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-01T00:00:00Z'
    },
    project: 'TEST',
    link: 'https://jira.example.com/browse/TEST-123'
  }],
  total: 1,
  page: 1,
  limit: 50,
  hasMore: false
};

const mockGitHubContributionsResponse = {
  total_contributions: 245,
  period: '365d',
  from: '2023-01-01',
  to: '2023-12-31'
};

const mockGitHubAvgPRTimeResponse = {
  average_pr_merge_time_hours: 24,
  pr_count: 42,
  period: '365d',
  from: '2023-01-01',
  to: '2023-12-31',
  time_series: [
    { week_start: '2023-01-01', week_end: '2023-01-07', average_hours: 20, pr_count: 5 },
    { week_start: '2023-01-08', week_end: '2023-01-14', average_hours: 28, pr_count: 3 }
  ]
};

const mockGitHubPRReviewCommentsResponse = {
  total_comments: 89,
  period: '365d',
  from: '2023-01-01',
  to: '2023-12-31'
};

const mockGitHubPRsResponse = {
  data: [{
    id: 1,
    number: 123,
    title: 'Test PR',
    state: 'open',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }],
  total: 1,
  page: 1,
  per_page: 10
};

// Mock user for AuthContext
const mockUser = {
  name: 'test-user',
  email: 'test@example.com'
};

// Helper to render with real providers (not mocked)
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('HomePage Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue('links');

    // Setup API responses
    vi.mocked(fetchMyJiraIssuesCount).mockResolvedValue(mockJiraCountResponse);
    vi.mocked(fetchMyJiraIssues).mockResolvedValue(mockJiraIssuesResponse);
    vi.mocked(fetchGitHubContributions).mockResolvedValue(mockGitHubContributionsResponse);
    vi.mocked(fetchGitHubAveragePRTime).mockResolvedValue(mockGitHubAvgPRTimeResponse);
    vi.mocked(fetchGitHubPRReviewComments).mockResolvedValue(mockGitHubPRReviewCommentsResponse);
    vi.mocked(fetchGitHubPullRequests).mockResolvedValue(mockGitHubPRsResponse);
    vi.mocked(apiClient.get).mockResolvedValue(mockUserData);

    // Mock useHeaderNavigation hook
    vi.mocked(useHeaderNavigation).mockReturnValue({
      tabs: [],
      activeTab: null,
      setTabs: vi.fn(),
      setActiveTab: vi.fn(),
      isDropdown: false,
      setIsDropdown: vi.fn()
    });

    // Mock useCategories hook for AddLinkDialog (from useLinks.ts)
    const { useCategories } = await vi.importMock('../../src/hooks/api/useLinks') as {
      useCategories: ReturnType<typeof vi.fn>
    };
    vi.mocked(useCategories).mockReturnValue({
      data: {
        categories: [
          { id: '1', title: 'Development Tools' },
          { id: '2', title: 'Documentation' }
        ]
      },
      isLoading: false,
      error: null
    } as UseQueryResult<CategoriesApiResponse, Error>);

    // Mock localStorage for auth
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify({ user: mockUser, token: 'mock-token' })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Integration Tests', () => {
    it('should render HomePage with all main sections and API data', async () => {
      renderWithProviders(<HomePage />);

      // Wait for main sections to render
      await waitFor(() => {
        expect(screen.getByText('GitHub Contributions')).toBeInTheDocument();
        expect(screen.getByText('Jira Issues Resolved')).toBeInTheDocument();
        expect(screen.getByText('Average PR time')).toBeInTheDocument();
        expect(screen.getByText('Review Hero')).toBeInTheDocument();
      });

      // Verify API data is displayed
      await waitFor(() => {
        expect(screen.getByText('245')).toBeInTheDocument(); // GitHub contributions
        expect(screen.getByText('15')).toBeInTheDocument(); // Jira issues (number rendered as string)
        expect(screen.getByText('89')).toBeInTheDocument(); // Review comments
      });

      // Check main components are rendered
      expect(screen.getByText('Announcements')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('GitHub PRs')).toBeInTheDocument();
      expect(screen.getByText('Jira Issues')).toBeInTheDocument();
      expect(screen.getByText('CAM Profiles')).toBeInTheDocument();
    });

    it('should render all tab options', async () => {
      renderWithProviders(<HomePage />);

      // Wait for initial render and verify all tabs are present
      await waitFor(() => {
        expect(screen.getByText('Quick Links')).toBeInTheDocument();
        expect(screen.getByText('GitHub PRs')).toBeInTheDocument();
        expect(screen.getByText('Jira Issues')).toBeInTheDocument();
        expect(screen.getByText('CAM Profiles')).toBeInTheDocument();
      });

      // Verify tabs are clickable
      const githubTab = screen.getByText('GitHub PRs');
      expect(githubTab).toBeInTheDocument();
      fireEvent.click(githubTab);
      
      // Tab should still be present after click
      expect(screen.getByText('GitHub PRs')).toBeInTheDocument();
    });

    it('should handle API loading states', async () => {
      // Mock slow API response
      vi.mocked(fetchGitHubContributions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockGitHubContributionsResponse), 100))
      );

      renderWithProviders(<HomePage />);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Should show data after loading
      await waitFor(() => {
        expect(screen.getByText('245')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API errors
      vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('Network error'));
      vi.mocked(fetchMyJiraIssuesCount).mockRejectedValue(new Error('Jira API error'));

      renderWithProviders(<HomePage />);

      // Should show error states
      await waitFor(() => {
        expect(screen.getAllByText('N/A')).toHaveLength(2);
      });
    });

    it('should persist tab selection from session storage', async () => {
      // Set initial tab in session storage
      mockSessionStorage.getItem.mockReturnValue('jira');

      renderWithProviders(<HomePage />);

      // Should load the stored tab
      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('homepage-quick-access-tab');
      });
    });

    it('should clear header tabs on mount', async () => {
      const setTabsMock = vi.fn();
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: null,
        setTabs: setTabsMock,
        setActiveTab: vi.fn(),
        isDropdown: false,
        setIsDropdown: vi.fn()
      });

      renderWithProviders(<HomePage />);

      // Verify setTabs was called with empty array to clear header tabs
      await waitFor(() => {
        expect(setTabsMock).toHaveBeenCalledWith([]);
      });
    });
  });
});