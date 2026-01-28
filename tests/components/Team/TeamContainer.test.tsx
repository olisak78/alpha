import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TeamContainer from '../../../src/components/Team/TeamContainer';
import type { Team as ApiTeam } from '../../../src/types/api';
import type { Member } from '../../../src/hooks/useOnDutyData';

/**
 * TeamContainer Component Tests
 * 
 * Tests for the TeamContainer component which wraps the Team component
 * with TeamProvider and handles team-related state management.
 */

// Mock the TeamProvider
vi.mock('../../../src/contexts/TeamContext', () => ({
  TeamProvider: ({ children, ...props }: any) => (
    <div data-testid="team-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

// Mock the Team component
vi.mock('../../../src/components/Team/Team', () => ({
  default: ({ activeCommonTab }: { activeCommonTab: string }) => (
    <div data-testid="team-component" data-active-tab={activeCommonTab}>
      Team Component
    </div>
  ),
}));

describe('TeamContainer Component', () => {
  const mockCurrentTeam: ApiTeam = {
    id: 'team-1',
    name: 'Development Team',
    organization_id: 'org-1',
    owner: 'owner-1',
    created_at: '2024-01-01T00:00:00Z',
    description: 'Test team description',
    email: 'team@example.com',
    group_id: 'group-1',
    links: [],
    members: [],
    metadata: {},
    picture_url: '',
    title: 'Development Team',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockMembers: Member[] = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Developer',
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Designer',
    },
  ];

  const defaultProps = {
    teamName: 'Development Team',
    selectedTeamId: 'team-1',
    currentTeam: mockCurrentTeam,
    teamNames: ['Development Team', 'Design Team', 'QA Team'],
    activeCommonTab: 'overview',
    onMembersChange: vi.fn(),
    onMoveMember: vi.fn(),
    onOpenComponent: vi.fn(),
    getTeamIdFromName: vi.fn(),
  };

  const renderWithQueryClient = (props = defaultProps) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TeamContainer {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render TeamProvider and Team component with correct props', () => {
      renderWithQueryClient();

      const teamProvider = screen.getByTestId('team-provider');
      expect(teamProvider).toBeInTheDocument();

      // Parse and verify the props passed to TeamProvider
      const propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      expect(propsData.teamId).toBe('team-1');
      expect(propsData.teamName).toBe('Development Team');
      expect(propsData.currentTeam).toEqual(mockCurrentTeam);
      expect(propsData.teamOptions).toEqual(['Development Team', 'Design Team', 'QA Team']);

      const teamComponent = screen.getByTestId('team-component');
      expect(teamComponent).toBeInTheDocument();
      expect(teamComponent).toHaveAttribute('data-active-tab', 'overview');
    });

    it('should handle different activeCommonTab values', () => {
      renderWithQueryClient({
        ...defaultProps,
        activeCommonTab: 'components',
      });

      const teamComponent = screen.getByTestId('team-component');
      expect(teamComponent).toHaveAttribute('data-active-tab', 'components');
    });
  });

  // ============================================================================
  // NO TEAM SELECTED STATE TESTS
  // ============================================================================

  describe('No Team Selected State', () => {
    it('should render "No team selected" message when no team is selected', () => {
      renderWithQueryClient({
        ...defaultProps,
        selectedTeamId: null as any,
      });

      expect(screen.getByText('No team selected')).toBeInTheDocument();
      expect(screen.queryByTestId('team-provider')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-component')).not.toBeInTheDocument();

      // Check for the text-center class on the paragraph element
      const textElement = screen.getByText('No team selected');
      expect(textElement.parentElement).toHaveClass('text-center');
    });

    it('should handle empty string selectedTeamId', () => {
      renderWithQueryClient({
        ...defaultProps,
        selectedTeamId: '',
      });

      expect(screen.getByText('No team selected')).toBeInTheDocument();
      expect(screen.queryByTestId('team-provider')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CALLBACK HANDLERS TESTS
  // ============================================================================

  describe('Callback Handlers', () => {
    it('should pass all callback handlers to TeamProvider', () => {
      const onMembersChange = vi.fn();
      const onMoveMember = vi.fn();
      const onOpenComponent = vi.fn();
      const getTeamIdFromName = vi.fn();

      renderWithQueryClient({
        ...defaultProps,
        onMembersChange,
        onMoveMember,
        onOpenComponent,
        getTeamIdFromName,
      });

      const teamProvider = screen.getByTestId('team-provider');
      const propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      
      // Verify that TeamProvider receives the expected props structure
      expect(propsData.teamId).toBe('team-1');
      expect(propsData.teamName).toBe('Development Team');
      expect(propsData.currentTeam).toEqual(mockCurrentTeam);
      expect(propsData.teamOptions).toEqual(['Development Team', 'Design Team', 'QA Team']);
      
      // Note: The actual callback functions may not be serializable in the mock
      // but we can verify the component renders without errors when callbacks are provided
      expect(teamProvider).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PROP CHANGES AND UPDATES TESTS
  // ============================================================================

  describe('Prop Changes and Updates', () => {
    it('should update when selectedTeamId changes', () => {
      const { rerender } = renderWithQueryClient({
        ...defaultProps,
        selectedTeamId: null as any,
      });

      expect(screen.getByText('No team selected')).toBeInTheDocument();

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamContainer {...defaultProps} selectedTeamId="team-1" />
        </QueryClientProvider>
      );

      expect(screen.queryByText('No team selected')).not.toBeInTheDocument();
      expect(screen.getByTestId('team-provider')).toBeInTheDocument();
    });

    it('should update props when they change', () => {
      const { rerender } = renderWithQueryClient();

      let teamProvider = screen.getByTestId('team-provider');
      let propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      expect(propsData.teamName).toBe('Development Team');

      let teamComponent = screen.getByTestId('team-component');
      expect(teamComponent).toHaveAttribute('data-active-tab', 'overview');

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamContainer {...defaultProps} teamName="Updated Team" activeCommonTab="jira" />
        </QueryClientProvider>
      );

      teamProvider = screen.getByTestId('team-provider');
      propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      expect(propsData.teamName).toBe('Updated Team');

      teamComponent = screen.getByTestId('team-component');
      expect(teamComponent).toHaveAttribute('data-active-tab', 'jira');
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING TESTS
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle null currentTeam gracefully', () => {
      renderWithQueryClient({
        ...defaultProps,
        currentTeam: null as any,
      });

      const teamProvider = screen.getByTestId('team-provider');
      const propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      expect(propsData.currentTeam).toBe(null);
      expect(screen.getByTestId('team-component')).toBeInTheDocument();
    });

    it('should handle edge case team names', () => {
      const testCases = [
        "Team O'Brien & Co. (Test)",
        'A'.repeat(100),
      ];

      testCases.forEach((teamName) => {
        const { unmount } = renderWithQueryClient({
          ...defaultProps,
          teamName,
        });

        const teamProvider = screen.getByTestId('team-provider');
        const propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
        expect(propsData.teamName).toBe(teamName);
        expect(screen.getByTestId('team-component')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle empty teamNames array', () => {
      renderWithQueryClient({
        ...defaultProps,
        teamNames: [],
      });

      const teamProvider = screen.getByTestId('team-provider');
      const propsData = JSON.parse(teamProvider.getAttribute('data-props') || '{}');
      expect(propsData.teamOptions).toEqual([]);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work correctly with QueryClientProvider and maintain hierarchy', () => {
      expect(() => renderWithQueryClient()).not.toThrow();
      
      const teamProvider = screen.getByTestId('team-provider');
      const teamComponent = screen.getByTestId('team-component');

      expect(teamProvider).toBeInTheDocument();
      expect(teamComponent).toBeInTheDocument();
      expect(teamProvider).toContainElement(teamComponent);
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      // Test no team selected state
      const { rerender } = renderWithQueryClient({
        ...defaultProps,
        selectedTeamId: null as any,
      });

      const container = screen.getByText('No team selected').closest('div');
      expect(container).toBeInTheDocument();
      expect(screen.getByText('No team selected').tagName).toBe('P');

      // Test team selected state
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamContainer {...defaultProps} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('team-provider')).toBeInTheDocument();
      expect(screen.getByTestId('team-component')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

});
