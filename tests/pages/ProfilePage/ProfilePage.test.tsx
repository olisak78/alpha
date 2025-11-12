import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../../src/pages/ProfilePage';
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock all the hooks
vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useGetUserDetails', () => ({
  useGetUserDetails: vi.fn(),
}));

vi.mock('../../../src/hooks/useScheduleData', () => ({
  useScheduleData: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
  useMember: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeam: vi.fn(),
  useTeamById: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useJira', () => ({
  useMyJiraIssuesCount: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useGitHubContributions', () => ({
  useGitHubContributions: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useGitHubHeatmap', () => ({
  useGitHubHeatmap: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useComponents', () => ({
  useComponentsByTeam: vi.fn(),
}));

// Mock components to simplify testing
vi.mock('../../../src/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => <img data-testid="avatar-image" src={src} alt={alt} />,
  AvatarFallback: ({ children }: { children: ReactNode }) => <div data-testid="avatar-fallback">{children}</div>,
}));

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
}));

vi.mock('../../../src/components/Heatmap', () => ({
  __esModule: true,
  default: ({ title, totalCount, countLabel }: { title: string; totalCount: number; countLabel: string }) => (
    <div data-testid="heatmap">
      <div data-testid="heatmap-title">{title}</div>
      <div data-testid="heatmap-count">{totalCount} {countLabel}</div>
    </div>
  ),
}));

vi.mock('../../../src/components/GitHubHeatmap', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => (
    <div data-testid="github-heatmap">
      <div data-testid="github-heatmap-contributions">{data.total_contributions} contributions</div>
    </div>
  ),
}));

// Mock JSON data
vi.mock('../../../src/data/team/my-team.json', () => ({
  default: {
    members: [
      { id: 'user1', name: 'John Doe', email: 'john.doe@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane.smith@example.com' },
    ],
  },
}));

vi.mock('../../../src/data/team/jira-issues.json', () => ({
  default: [
    { id: 'JIRA-1', assigneeId: 'user1', status: 'Resolved' },
    { id: 'JIRA-2', assigneeId: 'user1', status: 'In Progress' },
    { id: 'JIRA-3', assigneeId: 'user2', status: 'Resolved' },
  ],
}));

vi.mock('../../../src/data/team/github-stats.json', () => ({
  default: [
    { memberId: 'user1', lines: 5000 },
    { memberId: 'user2', lines: 3000 },
  ],
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
};

const createWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('ProfilePage Component', () => {
  let mockUseAuth: any;
  let mockUseGetUserDetails: any;
  let mockUseCurrentUser: any;
  let mockUseMember: any;
  let mockUseTeam: any;
  let mockUseMyJiraIssuesCount: any;
  let mockUseGitHubContributions: any;
  let mockUseGitHubHeatmap: any;
  let mockUseComponentsByTeam: any;
  let mockUseScheduleData: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Get mock function references
    mockUseAuth = vi.mocked((await import('../../../src/contexts/AuthContext')).useAuth);
    mockUseGetUserDetails = vi.mocked((await import('../../../src/hooks/useGetUserDetails')).useGetUserDetails);
    mockUseCurrentUser = vi.mocked((await import('../../../src/hooks/api/useMembers')).useCurrentUser);
    mockUseMember = vi.mocked((await import('../../../src/hooks/api/useMembers')).useMember);
    mockUseTeam = vi.mocked((await import('../../../src/hooks/api/useTeams')).useTeamById);
    mockUseMyJiraIssuesCount = vi.mocked((await import('../../../src/hooks/api/useJira')).useMyJiraIssuesCount);
    mockUseGitHubContributions = vi.mocked((await import('../../../src/hooks/api/useGitHubContributions')).useGitHubContributions);
    mockUseGitHubHeatmap = vi.mocked((await import('../../../src/hooks/api/useGitHubHeatmap')).useGitHubHeatmap);
    mockUseComponentsByTeam = vi.mocked((await import('../../../src/hooks/api/useComponents')).useComponentsByTeam);
    mockUseScheduleData = vi.mocked((await import('../../../src/hooks/useScheduleData')).useScheduleData);

    // Set default mock implementations
    mockUseAuth.mockReturnValue({
      user: { name: 'user1', memberId: 'member-123' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    mockUseGetUserDetails.mockReturnValue({
      displayName: 'John Doe',
      displayEmail: 'john.doe@example.com',
      user: { name: 'user1', memberId: 'member-123' },
    });

    mockUseCurrentUser.mockReturnValue({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        team_id: 'team-123',
        organization_id: 'org-123',
        team_role: 'developer',
      },
      isLoading: false,
      error: null,
    });

    mockUseMember.mockReturnValue({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        team_id: 'team-123',
        organization_id: 'org-123',
      },
      isLoading: false,
      error: null,
    });

    mockUseTeam.mockReturnValue({
      data: {
        id: 'team-123',
        title: 'Engineering Team',
        name: 'engineering',
      },
      isLoading: false,
      error: null,
    });

    mockUseMyJiraIssuesCount.mockReturnValue({
      data: { count: 42 },
      isLoading: false,
      error: null,
    });

    mockUseGitHubContributions.mockReturnValue({
      data: { total_contributions: 1234 },
      isLoading: false,
      error: null,
    });

    mockUseGitHubHeatmap.mockReturnValue({
      data: {
        total_contributions: 183,
        weeks: [
          {
            first_day: '2024-11-03',
            contribution_days: [
              {
                date: '2024-11-03',
                contribution_count: 5,
                contribution_level: 'SECOND_QUARTILE',
                color: '#40c463',
              },
              {
                date: '2024-11-04',
                contribution_count: 3,
                contribution_level: 'FIRST_QUARTILE',
                color: '#9be9a8',
              },
            ],
          },
        ],
        from: '2024-11-02T22:00:00Z',
        to: '2025-11-03T21:59:59Z',
      },
      isLoading: false,
      error: null,
    });

    mockUseComponentsByTeam.mockReturnValue({
      data: {
        components: [
          {
            id: 'comp-1',
            name: 'component-1',
            title: 'Component 1',
            description: 'Test component 1',
            metadata: { system: 'unified-services' },
          },
          {
            id: 'comp-2',
            name: 'component-2',
            title: 'Component 2',
            description: 'Test component 2',
            metadata: { system: 'cis-2-0' },
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    mockUseScheduleData.mockReturnValue({
      onDuty: [
        { date: '2024-01-01', assigneeId: 'user1' },
        { date: '2024-01-02', assigneeId: 'user1' },
      ],
      onCall: [
        { date: '2024-01-01', assigneeId: 'user1' },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================
  // BASIC RENDERING TESTS
  // =========================================

  describe('Basic Rendering', () => {
    it('renders the profile page without crashing', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('displays user name from member data', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('displays user initials in avatar fallback', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
    });

    it('displays team name', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      });
    });

    it('displays user email', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });
    });
  });

  // =========================================
  // KPI CARDS TESTS
  // =========================================

  describe('KPI Cards', () => {
    it('displays Jira issues resolved count', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Jira Issues Resolved')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('displays total contributions count', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Total Contributions')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
      });
    });

    it('shows loading state for Jira KPI', async () => {
      mockUseMyJiraIssuesCount.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Jira Issues Resolved')).toBeInTheDocument();
      });
    });

    it('shows error state for Jira KPI', async () => {
      mockUseMyJiraIssuesCount.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    it('shows loading state for GitHub contributions KPI', async () => {
      mockUseGitHubContributions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Total Contributions')).toBeInTheDocument();
      });
    });

    it('shows error state for GitHub contributions KPI', async () => {
      mockUseGitHubContributions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  // =========================================
  // GITHUB HEATMAP TESTS
  // =========================================

  describe('GitHub Heatmap Section', () => {

    it('shows loading state for GitHub heatmap', async () => {
      mockUseGitHubHeatmap.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.queryByTestId('github-heatmap')).not.toBeInTheDocument();
      });
    });

    it('does not show heatmap when data is null', async () => {
      mockUseGitHubHeatmap.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.queryByTestId('github-heatmap')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================
  // TEAM COMPONENTS TESTS
  // =========================================

  describe('Team Components Section', () => {
    it('displays team components section title', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('My Team Components')).toBeInTheDocument();
      });
    });

    it('displays component descriptions', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Test component 1')).toBeInTheDocument();
        expect(screen.getByText('Test component 2')).toBeInTheDocument();
      });
    });

    it('shows loading state for components', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Loading components...')).toBeInTheDocument();
      });
    });

    it('shows error state for components', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load components')).toBeInTheDocument();
      });
    });

    it('shows empty state when no components', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: { components: [] },
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('No components found for your team')).toBeInTheDocument();
      });
    });
  });

  // =========================================
  // USER INFO TESTS
  // =========================================

  describe('User Information Display', () => {
    it('shows loading state for team name', () => {
      mockUseTeam.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles missing member data gracefully', () => {
      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      // Should still render with fallback values
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('uses display name from useGetUserDetails when member data unavailable', () => {
      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('prioritizes member data for user name', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      // Should show "John Doe" from member data first_name and last_name
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays user role when available', async () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('developer')).toBeInTheDocument();
      });
    });
  });

  // =========================================
  // AUTHENTICATION TESTS
  // =========================================

  describe('Authentication Context', () => {
    it('uses auth user memberId', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(mockUseAuth).toHaveBeenCalled();
    });

    it('handles missing auth user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });
  });

  // =========================================
  // TEAM QUERY TESTS
  // =========================================

  describe('Team Data Fetching', () => {
    it('fetches team data with correct team_id', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(mockUseTeam).toHaveBeenCalledWith(
        'team-123',
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('disables team query when no team_id', () => {
      mockUseCurrentUser.mockReturnValue({
        data: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          team_id: '',
          organization_id: 'org-123',
        },
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(mockUseTeam).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  // =========================================
  // EDGE CASES
  // =========================================

  describe('Edge Cases', () => {
    it('handles components with missing descriptions', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: {
          components: [
            {
              id: 'comp-1',
              name: 'component-1',
              title: 'Component 1',
              metadata: { system: 'test-group' },
            },
          ],
        },
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('No description')).toBeInTheDocument();
      });
    });

    it('handles components without title', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: {
          components: [
            {
              id: 'comp-1',
              name: 'component-1',
              description: 'Test',
              metadata: { system: 'test-group' },
            },
          ],
        },
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('component-1')).toBeInTheDocument();
      });
    });

    it('handles empty auth user memberId', () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'user1', memberId: '' },
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('handles components with missing metadata', async () => {
      mockUseComponentsByTeam.mockReturnValue({
        data: {
          components: [
            {
              id: 'comp-1',
              name: 'component-1',
              title: 'Component 1',
              description: 'Test',
            },
          ],
        },
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Component 1')).toBeInTheDocument();
      });
    });
  });

  // =========================================
  // USER INITIALS TESTS
  // =========================================

  describe('User Initials', () => {
    it('generates initials from first and last name', () => {
      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
    });

    it('falls back to display name when member data unavailable', () => {
      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockUseGetUserDetails.mockReturnValue({
        displayName: 'Alice Wonderland',
        displayEmail: 'alice@example.com',
        user: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('AW');
    });

    it('handles single name gracefully', () => {
      mockUseGetUserDetails.mockReturnValue({
        displayName: 'Alice',
        displayEmail: 'alice@example.com',
        user: null,
      });

      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });
  });
});
