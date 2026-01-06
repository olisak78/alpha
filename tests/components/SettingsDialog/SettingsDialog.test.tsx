import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SettingsDialog from '../../../src/components/dialogs/SettingsDialog';
import { useSettings } from '../../../src/hooks/useSettings';

// Mock the useSettings hook
vi.mock('../../../src/hooks/useSettings', () => ({
  useSettings: vi.fn()
}));

// Mock the CustomizationAppearanceSettings component
vi.mock('../../../src/components/settings/CustomizationAppearanceSettings', () => ({
  default: ({ visibilityState, onVisibilityChange, onSelectAll, onDeselectAll }: any) => (
    <div data-testid="project-visibility-settings">
      <div data-testid="visibility-state">{JSON.stringify(visibilityState)}</div>
      <button onClick={() => onVisibilityChange('1', false)} data-testid="mock-visibility-change">
        Change Visibility
      </button>
      <button onClick={onSelectAll} data-testid="mock-select-all">
        Select All
      </button>
      <button onClick={onDeselectAll} data-testid="mock-deselect-all">
        Deselect All
      </button>
    </div>
  )
}));

// Mock the UserInformationSettings component
vi.mock('../../../src/components/UserInformationSettings', () => ({
  default: ({ fullName, email, team, role }: any) => (
    <div data-testid="user-information-settings">
      <div data-testid="user-info">{JSON.stringify({ fullName, email, team, role })}</div>
    </div>
  )
}));

/**
 * SettingsDialog Component Tests
 * 
 * Tests for the SettingsDialog component which provides a modal interface
 * for managing application settings. The component now uses the useSettings hook
 * for all logic and state management.
 * 
 * Component Location: src/components/dialogs/SettingsDialog.tsx
 * Dependencies: useSettings hook, CustomizationAppearanceSettings, UserInformationSettings
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

const defaultProps = {
  open: true,
  onOpenChange: vi.fn()
};

const mockUseSettings = useSettings as ReturnType<typeof vi.fn>;

/**
 * Helper function to render SettingsDialog with default props and mocks
 */
function renderSettingsDialog(props?: Partial<typeof defaultProps>) {
  const finalProps = { ...defaultProps, ...props };
  return render(<SettingsDialog {...finalProps} />);
}

/**
 * Helper function to setup default mocks for useSettings hook
 */
function setupDefaultMocks() {
  mockUseSettings.mockReturnValue({
    hasChanges: false,
    visibilityState: {
      '1': true,
      '2': false,
      '3': true
    },
    processedUserInfo: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      team: 'Engineering Team',
      role: 'Owner'
    },
    isLoading: false,
    defaultVisibleProjects: ['cis20', 'usrv', 'ca'],
    handleVisibilityChange: vi.fn(),
    handleSelectAll: vi.fn(),
    handleDeselectAll: vi.fn(),
    handleSave: vi.fn(),
    handleCancel: vi.fn(),
    resetChanges: vi.fn()
  });
}

// ============================================================================
// COMPONENT TESTS
// ============================================================================

describe('SettingsDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render complete dialog structure when open', () => {
      renderSettingsDialog();
      
      // Main dialog elements
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Customize your developer portal experience.')).toBeInTheDocument();
      
      // Tabs structure
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /user information/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /customization/i })).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      
      // Child components - User Information should be visible by default
      expect(screen.getByTestId('user-information-settings')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderSettingsDialog({ open: false });
      
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('should show loading state and hide content when settings are loading', () => {
      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        isLoading: true
      });

      renderSettingsDialog();
      
      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
      expect(screen.queryByText('Customize your developer portal experience.')).not.toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('should handle cancel button correctly and call hook cancel handler', () => {
      const mockOnOpenChange = vi.fn();
      const mockHandleCancel = vi.fn();
      
      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        handleCancel: mockHandleCancel
      });
      
      renderSettingsDialog({ onOpenChange: mockOnOpenChange });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockHandleCancel).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle save button correctly and call hook save handler', () => {
      const mockOnOpenChange = vi.fn();
      const mockHandleSave = vi.fn();
      
      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        hasChanges: true,
        handleSave: mockHandleSave
      });
      
      renderSettingsDialog({ onOpenChange: mockOnOpenChange });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeEnabled();
      
      fireEvent.click(saveButton);
      
      expect(mockHandleSave).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should have save button disabled when no changes', () => {
      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        hasChanges: false
      });
      
      renderSettingsDialog();
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should have save button enabled when there are changes', () => {
      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        hasChanges: true
      });
      
      renderSettingsDialog();
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeEnabled();
    });
  });


  // ==========================================================================
  // DIALOG BEHAVIOR TESTS
  // ==========================================================================

  describe('Dialog Behavior', () => {
    it('should handle dialog open/close state changes', () => {
      const { rerender } = renderSettingsDialog({ open: true });
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('user-information-settings')).toBeInTheDocument();
      
      // Close dialog
      rerender(<SettingsDialog open={false} onOpenChange={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Reopen dialog - component should reinitialize
      rerender(<SettingsDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId('user-information-settings')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper accessibility structure and keyboard navigation', () => {
      renderSettingsDialog();
      
      // Dialog role and attributes
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Heading structure
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Settings');
      
      // Button roles and states
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(cancelButton).toBeEnabled();
      expect(saveButton).toBeDisabled(); // Initially disabled
      
      // Tab navigation
      const tabList = screen.getByRole('tablist');
      const userInfoTab = screen.getByRole('tab', { name: /user information/i });
      expect(tabList).toBeInTheDocument();
      expect(userInfoTab).toHaveAttribute('aria-selected', 'true');
      
      // Keyboard navigation
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle hook errors gracefully', () => {
      // Mock useSettings to return minimal valid state even with errors
      mockUseSettings.mockReturnValue({
        hasChanges: false,
        visibilityState: {},
        processedUserInfo: {
          fullName: 'Unknown',
          email: 'Unknown',
          team: 'Unknown',
          role: 'Unknown'
        },
        isLoading: false,
        defaultVisibleProjects: [],
        handleVisibilityChange: vi.fn(),
        handleSelectAll: vi.fn(),
        handleDeselectAll: vi.fn(),
        handleSave: vi.fn(),
        handleCancel: vi.fn(),
        resetChanges: vi.fn()
      });

      renderSettingsDialog();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByTestId('user-information-settings')).toBeInTheDocument();
    });

    it('should pass correct props to child components', () => {
      const mockProcessedUserInfo = {
        fullName: 'Test User',
        email: 'test@example.com',
        team: 'Test Team',
        role: 'Test Role'
      };

      mockUseSettings.mockReturnValue({
        ...mockUseSettings(),
        processedUserInfo: mockProcessedUserInfo
      });

      renderSettingsDialog();

      // Check that user info is passed correctly to UserInformationSettings
      const userInfoElement = screen.getByTestId('user-info');
      expect(userInfoElement).toHaveTextContent(JSON.stringify(mockProcessedUserInfo));

      // Verify that the tabs are working by checking tab structure
      const projectsTab = screen.getByRole('tab', { name: /customization/i });
      expect(projectsTab).toBeInTheDocument();
      
      // The component should be properly structured with tabs
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

});
