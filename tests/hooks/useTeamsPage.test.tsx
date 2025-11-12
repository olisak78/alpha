import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamsPage } from '../../src/hooks/useTeamsPage';

// Create simple mocks to avoid circular dependencies
const mockNavigate = vi.fn();
const mockSetTabs = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetSelectedComponent = vi.fn();
const mockSetIsDropdown = vi.fn();

// Mock data
const mockTeamsData = {
  teams: [
    {
      id: 'team-coe-id',
      name: 'team-coe',
      title: 'Team COE',
      display_name: 'Team COE'
    },
    {
      id: 'cfs-devops-id', 
      name: 'cfs-devops',
      title: 'CFS DevOps',
      display_name: 'CFS DevOps'
    },
    {
      id: 'platform-team-id',
      name: 'platform-team',
      title: 'Platform Team',
      display_name: 'Platform Team'
    }
  ]
};

const mockUserMemberData = {
  id: 'test-user-id',
  uuid: 'test-uuid',
  team_id: 'team-coe-id',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  mobile: '+1234567890',
  team_domain: 'developer',
  team_role: 'member',
  link: []
};

// Create simpler mocks
vi.mock('../../src/hooks/useAuthWithRole', () => ({
  useAuthWithRole: () => ({
    memberData: mockUserMemberData,
    memberError: null
  })
}));

vi.mock('../../src/hooks/api/useTeams', () => ({
  useTeams: () => ({
    data: mockTeamsData,
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock('../../src/contexts/hooks', () => ({
  usePortalState: () => ({
    setActiveTab: mockSetActiveTab,
    setSelectedComponent: mockSetSelectedComponent
  })
}));

const mockHeaderNavigation = {
  setTabs: mockSetTabs,
  activeTab: null as string | null,
  setIsDropdown: mockSetIsDropdown
};

vi.mock('../../src/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: () => mockHeaderNavigation
}));

const mockLocation = { pathname: '/teams' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate
  };
});

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('useTeamsPage - Effects Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaderNavigation.activeTab = null;
    mockLocation.pathname = '/teams';
  });

  describe('Basic functionality', () => {
    it('should load team data and sort team names alphabetically', async () => {
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      expect(result.current.teamNames).toEqual([
        'CFS DevOps',
        'Platform Team', 
        'Team COE'
      ]);
    });

    it('should provide utility functions', async () => {
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      // Test getTeamIdFromName function
      expect(result.current.getTeamIdFromName('Team COE')).toBe('team-coe-id');
      expect(result.current.getTeamIdFromName('CFS DevOps')).toBe('cfs-devops-id');
      expect(result.current.getTeamIdFromName('Platform Team')).toBe('platform-team-id');
      expect(result.current.getTeamIdFromName('Non-existent Team')).toBeUndefined();
    });
  });

  describe('URL-based navigation and default team selection (Effect 2)', () => {
    it('should redirect to default team when no team slug in URL', async () => {
      mockLocation.pathname = '/teams';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      // Should navigate to user's team (Team COE) since user has team_id: 'team-coe-id'
      expect(mockNavigate).toHaveBeenCalledWith('/teams/team-coe/overview', { replace: true });
    });

    it('should set selected team when valid team slug is in URL', async () => {
      mockLocation.pathname = '/teams/cfs-devops/overview';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
        expect(result.current.selectedTab).toBe('CFS DevOps');
      });
    });

    it('should redirect to default team when invalid team slug is in URL', async () => {
      mockLocation.pathname = '/teams/invalid-team-slug/overview';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      // Should redirect to user's team (Team COE) when invalid slug is provided
      expect(mockNavigate).toHaveBeenCalledWith('/teams/team-coe/overview', { replace: true });
    });

    it('should handle team slug with special characters correctly', async () => {
      mockLocation.pathname = '/teams/platform-team/components';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
        expect(result.current.selectedTab).toBe('Platform Team');
      });
    });

    it('should not navigate if already on the correct path', async () => {
      mockLocation.pathname = '/teams/team-coe/overview';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      // Should not call navigate since we're already on the correct path
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Header tab clicks handling (Effect 3)', () => {
    it('should update selected tab when header tab is clicked', async () => {
      mockLocation.pathname = '/teams/team-coe/overview';
      mockHeaderNavigation.activeTab = 'cfs-devops';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
        expect(result.current.selectedTab).toBe('CFS DevOps');
      });
    });

    it('should ignore invalid header tab clicks', async () => {
      mockLocation.pathname = '/teams/team-coe/overview';
      mockHeaderNavigation.activeTab = 'invalid-team-slug';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
        // Should remain Team COE since invalid slug should be ignored
        expect(result.current.selectedTab).toBe('Team COE');
      });
    });
  });

  describe('Common tab updates from URL (Effect 4)', () => {
    it('should set active common tab when valid tab is in URL', async () => {
      mockLocation.pathname = '/teams/team-coe/components';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activeCommonTab).toBe('components');
      });
    });

    it('should set active common tab for schedule tab', async () => {
      mockLocation.pathname = '/teams/team-coe/schedule';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activeCommonTab).toBe('schedule');
      });
    });

    it('should set active common tab for jira tab', async () => {
      mockLocation.pathname = '/teams/team-coe/jira';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activeCommonTab).toBe('jira');
      });
    });

    it('should set active common tab for docs tab', async () => {
      mockLocation.pathname = '/teams/team-coe/docs';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activeCommonTab).toBe('docs');
      });
    });

    it('should not update active common tab for invalid tab', async () => {
      mockLocation.pathname = '/teams/team-coe/invalid-tab';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Should remain as default
        expect(result.current.activeCommonTab).toBe('overview');
      });
    });

    it('should handle missing common tab in URL', async () => {
      mockLocation.pathname = '/teams/team-coe';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Should remain as default when no common tab specified
        expect(result.current.activeCommonTab).toBe('overview');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle complex URL navigation scenario', async () => {
      // Start with no team in URL
      mockLocation.pathname = '/teams';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
      });

      // Should redirect to default team
      expect(mockNavigate).toHaveBeenCalledWith('/teams/team-coe/overview', { replace: true });
    });

    it('should handle URL with both team and common tab correctly', async () => {
      mockLocation.pathname = '/teams/cfs-devops/components';
      
      const { result } = renderHook(() => useTeamsPage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.teamNames).toHaveLength(3);
        expect(result.current.selectedTab).toBe('CFS DevOps');
        expect(result.current.activeCommonTab).toBe('components');
      });

      // Should not navigate since URL is valid
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
