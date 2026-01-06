import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamHeader } from '../../../src/components/Team/TeamHeader';
import type { Team } from '../../../src/types/api';

/**
 * TeamHeader Component Tests
 * 
 * Tests for the TeamHeader component which displays the team name
 * and provides color picker functionality for admin users.
 */

// Mock hooks
vi.mock('../../../src/hooks/api/mutations/useTeamMutations');
vi.mock('../../../src/hooks/use-toast');

// Import the mocked modules
import { useUpdateTeam } from '../../../src/hooks/api/mutations/useTeamMutations';
import { useToast } from '../../../src/hooks/use-toast';

const mockUseUpdateTeam = vi.mocked(useUpdateTeam);
const mockUseToast = vi.mocked(useToast);

// Mock TeamColorPicker
vi.mock('../../../src/components/Team/TeamColorPicker', () => ({
  TeamColorPicker: ({ currentColor, onColorChange, disabled }: any) => (
    <div data-testid="team-color-picker" data-current-color={currentColor} data-disabled={disabled}>
      <button onClick={() => onColorChange('#ff0000')}>Change Color</button>
    </div>
  ),
}));

describe('TeamHeader Component', () => {
  const mockCurrentTeam: Team = {
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
    metadata: {
      color: '#3b82f6',
    },
    picture_url: '',
    title: 'Development Team',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    teamName: 'Development',
    currentTeam: mockCurrentTeam,
    isAdmin: false,
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
        <TeamHeader {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseUpdateTeam.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      data: undefined,
      error: null,
      variables: undefined,
      status: 'idle',
      failureCount: 0,
      failureReason: null,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
    } as any);

    mockUseToast.mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: [],
    } as any);
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render header with correct structure and team name', () => {
      renderWithQueryClient();

      const header = screen.getByRole('banner');
      const heading = screen.getByRole('heading', { level: 1 });

      expect(header).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(header).toContainElement(heading);
      expect(heading).toHaveTextContent('Team Development');
    });

    it('should handle team name prefix correctly', () => {
      // Test without prefix
      const { rerender } = renderWithQueryClient({ ...defaultProps, teamName: 'Development' });
      let heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Development');

      // Test with existing prefix
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamHeader {...defaultProps} teamName="Team Development" />
        </QueryClientProvider>
      );
      
      heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Development');
    });
  });

  // ============================================================================
  // ADMIN FUNCTIONALITY TESTS
  // ============================================================================

  describe('Admin Functionality', () => {
    it('should render color picker only when isAdmin is true and currentTeam exists', () => {
      // Should render when admin with team
      const { unmount } = renderWithQueryClient({ ...defaultProps, isAdmin: true });
      expect(screen.getByTestId('team-color-picker')).toBeInTheDocument();
      unmount();

      // Should not render when not admin
      renderWithQueryClient({ ...defaultProps, isAdmin: false });
      expect(screen.queryByTestId('team-color-picker')).not.toBeInTheDocument();
    });

    it('should not render color picker when currentTeam is null', () => {
      renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: null as any
      });
      expect(screen.queryByTestId('team-color-picker')).not.toBeInTheDocument();
    });

    it('should pass correct props and handle pending state', () => {
      const { unmount } = renderWithQueryClient({ ...defaultProps, isAdmin: true });

      const colorPicker = screen.getByTestId('team-color-picker');
      expect(colorPicker).toHaveAttribute('data-current-color', '#3b82f6');
      expect(colorPicker).toHaveAttribute('data-disabled', 'false');
      unmount();

      // Test pending state
      mockUseUpdateTeam.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        isSuccess: false,
        isIdle: false,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'pending',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      renderWithQueryClient({ ...defaultProps, isAdmin: true });
      const disabledColorPicker = screen.getByTestId('team-color-picker');
      expect(disabledColorPicker).toHaveAttribute('data-disabled', 'true');
    });
  });

  // ============================================================================
  // COLOR HANDLING TESTS
  // ============================================================================

  describe('Color Handling', () => {
    it('should extract color from different metadata formats', () => {
      // Object metadata
      const teamWithObjectMetadata = {
        ...mockCurrentTeam,
        metadata: { color: '#10b981', otherProp: 'value' },
      };

      const { unmount } = renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: teamWithObjectMetadata 
      });

      let colorPicker = screen.getByTestId('team-color-picker');
      expect(colorPicker).toHaveAttribute('data-current-color', '#10b981');
      unmount();

      // String metadata
      const teamWithStringMetadata = {
        ...mockCurrentTeam,
        metadata: JSON.stringify({ color: '#ef4444' }) as any,
      };

      renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: teamWithStringMetadata 
      });

      colorPicker = screen.getByTestId('team-color-picker');
      expect(colorPicker).toHaveAttribute('data-current-color', '#ef4444');
    });

    it('should use default color for invalid or missing metadata', () => {
      const testCases = [
        { metadata: { otherProp: 'value' } }, // No color
        { metadata: {} }, // Empty
        { metadata: null }, // Null
        { metadata: 'invalid json string' }, // Invalid JSON
      ];

      testCases.forEach((testCase, index) => {
        const teamWithTestMetadata = {
          ...mockCurrentTeam,
          metadata: testCase.metadata as any,
        };

        const { unmount } = renderWithQueryClient({ 
          ...defaultProps, 
          isAdmin: true, 
          currentTeam: teamWithTestMetadata 
        });

        const colorPicker = screen.getByTestId('team-color-picker');
        expect(colorPicker).toHaveAttribute('data-current-color', '#6b7280');
        
        unmount();
      });
    });
  });

  // ============================================================================
  // COLOR CHANGE FUNCTIONALITY TESTS
  // ============================================================================

  describe('Color Change Functionality', () => {
    it('should call updateTeamMutation when color is changed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseUpdateTeam.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      renderWithQueryClient({ ...defaultProps, isAdmin: true });

      const changeColorButton = screen.getByText('Change Color');
      await user.click(changeColorButton);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'team-1',
        data: {
          display_name: 'Development Team',
          description: 'Test team description',
          metadata: {
            color: '#ff0000',
          },
        },
      });
    });

    it('should preserve existing metadata when changing color', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseUpdateTeam.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      const teamWithExtraMetadata = {
        ...mockCurrentTeam,
        metadata: {
          color: '#3b82f6',
          customProp: 'value',
          anotherProp: 123,
        },
      };

      renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: teamWithExtraMetadata 
      });

      const changeColorButton = screen.getByText('Change Color');
      await user.click(changeColorButton);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'team-1',
        data: {
          display_name: 'Development Team',
          description: 'Test team description',
          metadata: {
            color: '#ff0000',
            customProp: 'value',
            anotherProp: 123,
          },
        },
      });
    });

    it('should handle string metadata when changing color', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseUpdateTeam.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      const teamWithStringMetadata = {
        ...mockCurrentTeam,
        metadata: JSON.stringify({ color: '#3b82f6', existingProp: 'test' }) as any,
      };

      renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: teamWithStringMetadata 
      });

      const changeColorButton = screen.getByText('Change Color');
      await user.click(changeColorButton);

      expect(mockMutate).toHaveBeenCalledWith({
        id: 'team-1',
        data: {
          display_name: 'Development Team',
          description: 'Test team description',
          metadata: {
            color: '#ff0000',
            existingProp: 'test',
          },
        },
      });
    });

    it('should not call updateTeamMutation when currentTeam is null', () => {
      const mockMutate = vi.fn();
      
      mockUseUpdateTeam.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      // Test that color picker is not rendered when currentTeam is null
      renderWithQueryClient({ 
        ...defaultProps, 
        isAdmin: true, 
        currentTeam: null as any
      });
      
      expect(screen.queryByTestId('team-color-picker')).not.toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TOAST NOTIFICATIONS TESTS
  // ============================================================================

  describe('Toast Notifications', () => {
    it('should show success toast when color update succeeds', () => {
      const mockToast = vi.fn();

      mockUseUpdateTeam.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      mockUseToast.mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      } as any);

      // Simulate the onSuccess callback being called
      renderWithQueryClient({ ...defaultProps, isAdmin: true });

      // Get the onSuccess callback from the useUpdateTeam call
      const updateTeamCall = mockUseUpdateTeam.mock.calls[0]?.[0];
      if (updateTeamCall?.onSuccess) {
        updateTeamCall.onSuccess(
          { id: 'team-1', name: 'Test Team' }, 
          { id: 'team-1', data: { display_name: 'Test Team' } }, 
          undefined, 
          { client: {} as any, meta: {} }
        );
      }

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Team color updated',
        description: 'The team color has been successfully updated.',
      });
    });

    it('should show error toast when color update fails', () => {
      const mockToast = vi.fn();
      const mockError = new Error('Update failed');

      mockUseUpdateTeam.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      mockUseToast.mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      } as any);

      // Simulate the onError callback being called
      renderWithQueryClient({ ...defaultProps, isAdmin: true });

      // Get the onError callback from the useUpdateTeam call
      const updateTeamCall = mockUseUpdateTeam.mock.calls[0]?.[0];
      if (updateTeamCall?.onError) {
        updateTeamCall.onError(
          mockError, 
          { id: 'team-1', data: { display_name: 'Test Team' } }, 
          undefined, 
          { client: {} as any, meta: {} }
        );
      }

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to update team color',
        description: 'Update failed',
        variant: 'destructive',
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING TESTS
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle various team name edge cases', () => {
      const testCases = [
        { input: '', expected: 'Team' },
        { input: "O'Brien & Co. (Test) - 2024", expected: "Team O'Brien & Co. (Test) - 2024" },
        { input: 'Rocket Team 🚀 Développement', expected: 'Team Rocket Team 🚀 Développement' },
      ];

      testCases.forEach(({ input, expected }) => {
        const { unmount } = renderWithQueryClient({ ...defaultProps, teamName: input });
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent(expected);
        
        unmount();
      });
    });

    it('should handle null/undefined team names gracefully', () => {
      const { unmount } = renderWithQueryClient({ ...defaultProps, teamName: undefined as any });
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      unmount();

      renderWithQueryClient({ ...defaultProps, teamName: null as any });
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PROP CHANGES AND UPDATES TESTS
  // ============================================================================

  describe('Prop Changes and Updates', () => {
    it('should update when props change', () => {
      const { rerender } = renderWithQueryClient();

      let heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Development');
      expect(screen.queryByTestId('team-color-picker')).not.toBeInTheDocument();

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const updatedTeam = {
        ...mockCurrentTeam,
        metadata: { color: '#ef4444' },
      };

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamHeader {...defaultProps} teamName="Updated Team" isAdmin={true} currentTeam={updatedTeam} />
        </QueryClientProvider>
      );

      heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Updated Team');
      
      const colorPicker = screen.getByTestId('team-color-picker');
      expect(colorPicker).toHaveAttribute('data-current-color', '#ef4444');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper semantic structure and be keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithQueryClient({ ...defaultProps, isAdmin: true });

      const header = screen.getByRole('banner');
      const heading = screen.getByRole('heading', { level: 1 });
      const colorPicker = screen.getByTestId('team-color-picker');

      expect(header.tagName).toBe('HEADER');
      expect(heading.tagName).toBe('H1');
      expect(heading).toBeVisible();
      expect(header).toContainElement(heading);
      expect(header).toContainElement(colorPicker);

      // Test keyboard navigation
      const changeColorButton = screen.getByText('Change Color');
      changeColorButton.focus();
      expect(changeColorButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Color change functionality should work
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete color change workflow', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockToast = vi.fn();

      mockUseUpdateTeam.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
        mutateAsync: vi.fn(),
      } as any);

      mockUseToast.mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      } as any);

      renderWithQueryClient({ ...defaultProps, isAdmin: true });

      // Verify initial state and change color
      const colorPicker = screen.getByTestId('team-color-picker');
      expect(colorPicker).toHaveAttribute('data-current-color', '#3b82f6');

      const changeColorButton = screen.getByText('Change Color');
      await user.click(changeColorButton);

      // Verify mutation was called
      expect(mockMutate).toHaveBeenCalledWith({
        id: 'team-1',
        data: {
          display_name: 'Development Team',
          description: 'Test team description',
          metadata: {
            color: '#ff0000',
          },
        },
      });

      // Simulate success callback and verify toast
      const updateTeamCall = mockUseUpdateTeam.mock.calls[0]?.[0];
      if (updateTeamCall?.onSuccess) {
        updateTeamCall.onSuccess(
          { id: 'team-1', name: 'Test Team' }, 
          { id: 'team-1', data: { display_name: 'Test Team' } }, 
          undefined, 
          { client: {} as any, meta: {} }
        );
      }

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Team color updated',
        description: 'The team color has been successfully updated.',
      });
    });
  });
});
