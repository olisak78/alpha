import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SettingsDialog from '../../../src/components/dialogs/SettingsDialog';
import { useProjectsContext } from '../../../src/contexts/ProjectsContext';
import { useProjectVisibility } from '../../../src/hooks/useProjectVisibility';
import { Project } from '../../../src/types/api';

// Mock the dependencies
vi.mock('../../../src/contexts/ProjectsContext', () => ({
  useProjectsContext: vi.fn()
}));

vi.mock('../../../src/hooks/useProjectVisibility', () => ({
  useProjectVisibility: vi.fn()
}));

// Mock the ProjectVisibilitySettings component
vi.mock('../../../src/components/ProjectVisibilitySettings', () => ({
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

/**
 * SettingsDialog Component Tests
 * 
 * Tests for the SettingsDialog component which provides a modal interface
 * for managing application settings, particularly project visibility settings.
 * This is the main settings interface for the developer portal.
 * 
 * Component Location: src/components/dialogs/SettingsDialog.tsx
 * Dependencies: ProjectsContext, useProjectVisibility hook, ProjectVisibilitySettings
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'cis20',
    title: 'CIS@2.0',
    description: 'CIS 2.0 Project',
    isVisible: true
  },
  {
    id: '2',
    name: 'usrv',
    title: 'Unified Services',
    description: 'Unified Services Project',
    isVisible: false
  },
  {
    id: '3',
    name: 'ca',
    title: 'Cloud Automation',
    description: 'Cloud Automation Project',
    isVisible: true
  }
];

const defaultProps = {
  open: true,
  onOpenChange: vi.fn()
};

const mockUseProjectsContext = useProjectsContext as ReturnType<typeof vi.fn>;
const mockUseProjectVisibility = useProjectVisibility as ReturnType<typeof vi.fn>;

/**
 * Helper function to render SettingsDialog with default props and mocks
 */
function renderSettingsDialog(props?: Partial<typeof defaultProps>) {
  const finalProps = { ...defaultProps, ...props };
  return render(<SettingsDialog {...finalProps} />);
}

/**
 * Helper function to setup default mocks
 */
function setupDefaultMocks() {
  mockUseProjectsContext.mockReturnValue({
    projects: mockProjects,
    isLoading: false,
    error: null,
    sidebarItems: []
  });

  mockUseProjectVisibility.mockReturnValue({
    isProjectVisible: vi.fn((project: Project) => project.isVisible || false),
    updateProjectVisibility: vi.fn(),
    getVisibleProjects: vi.fn(() => mockProjects.filter(p => p.isVisible)),
    resetToDefaults: vi.fn(),
    loadVisibilitySettings: vi.fn(() => ({}))
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
      expect(screen.getByRole('tab', { name: /sidebar settings/i })).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      
      // Child component
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
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
    it('should show loading state and hide content when projects are loading', () => {
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: true,
        error: null,
        sidebarItems: []
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
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize visibility state from hook', () => {
      const mockIsProjectVisible = vi.fn()
        .mockReturnValueOnce(true)  // project 1
        .mockReturnValueOnce(false) // project 2
        .mockReturnValueOnce(true); // project 3

      mockUseProjectVisibility.mockReturnValue({
        isProjectVisible: mockIsProjectVisible,
        updateProjectVisibility: vi.fn(),
        getVisibleProjects: vi.fn(),
        resetToDefaults: vi.fn(),
        loadVisibilitySettings: vi.fn()
      });

      renderSettingsDialog();
      
      // Check that isProjectVisible was called
      expect(mockIsProjectVisible).toHaveBeenCalledWith(mockProjects[0]);
      expect(mockIsProjectVisible).toHaveBeenCalledWith(mockProjects[1]);
      expect(mockIsProjectVisible).toHaveBeenCalledWith(mockProjects[2]);
      
      // Verify component renders properly
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
    });

    it('should handle null projects gracefully', () => {
      mockUseProjectsContext.mockReturnValue({
        projects: null as any,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      renderSettingsDialog();
      
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('should handle button interactions and save/cancel workflow', async () => {
      const mockUpdateProjectVisibility = vi.fn();
      const mockOnOpenChange = vi.fn();
      
      mockUseProjectVisibility.mockReturnValue({
        isProjectVisible: vi.fn(() => true),
        updateProjectVisibility: mockUpdateProjectVisibility,
        getVisibleProjects: vi.fn(),
        resetToDefaults: vi.fn(),
        loadVisibilitySettings: vi.fn()
      });

      renderSettingsDialog({ onOpenChange: mockOnOpenChange });
      
      // Initially save button should be disabled
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
      
      // Cancel should work immediately
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      
      // Reset mock for save test
      mockOnOpenChange.mockClear();
      
      // Make a change to enable save button
      const changeButton = screen.getByTestId('mock-visibility-change');
      fireEvent.click(changeButton);
      
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
      
      // Save should call updateProjectVisibility and close dialog
      fireEvent.click(saveButton);
      expect(mockUpdateProjectVisibility).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle ProjectVisibilitySettings interactions', () => {
      renderSettingsDialog();
      
      // Test individual visibility change
      const changeButton = screen.getByTestId('mock-visibility-change');
      fireEvent.click(changeButton);
      
      const visibilityState = screen.getByTestId('visibility-state');
      expect(visibilityState.textContent).toContain('"1":false');
      
      // Test select all
      const selectAllButton = screen.getByTestId('mock-select-all');
      fireEvent.click(selectAllButton);
      
      let state = JSON.parse(screen.getByTestId('visibility-state').textContent || '{}');
      expect(state['1']).toBe(true);
      expect(state['2']).toBe(true);
      expect(state['3']).toBe(true);
      
      // Test deselect all
      const deselectAllButton = screen.getByTestId('mock-deselect-all');
      fireEvent.click(deselectAllButton);
      
      state = JSON.parse(screen.getByTestId('visibility-state').textContent || '{}');
      expect(state['1']).toBe(false);
      expect(state['2']).toBe(false);
      expect(state['3']).toBe(false);
    });
  });


  // ==========================================================================
  // DIALOG BEHAVIOR TESTS
  // ==========================================================================

  describe('Dialog Behavior', () => {
    it('should handle dialog open/close state changes and reinitialize properly', () => {
      const { rerender } = renderSettingsDialog({ open: true });
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
      
      // Close dialog
      rerender(<SettingsDialog open={false} onOpenChange={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('project-visibility-settings')).not.toBeInTheDocument();
      
      // Reopen dialog - component should reinitialize
      rerender(<SettingsDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
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
      const tab = screen.getByRole('tab', { name: /sidebar settings/i });
      expect(tabList).toBeInTheDocument();
      expect(tab).toHaveAttribute('aria-selected', 'true');
      
      // Keyboard navigation
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle context errors and dynamic project changes gracefully', () => {
      // Test with context error
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: false,
        error: new Error('Failed to load projects'),
        sidebarItems: []
      });

      const { rerender } = renderSettingsDialog();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Test dynamic project changes
      const newProjects = [
        ...mockProjects,
        {
          id: '4',
          name: 'new-project',
          title: 'New Project',
          description: 'A new project',
          isVisible: false
        }
      ];

      mockUseProjectsContext.mockReturnValue({
        projects: newProjects,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      rerender(<SettingsDialog open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByTestId('project-visibility-settings')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow with complex state changes', async () => {
      const mockUpdateProjectVisibility = vi.fn();
      const mockOnOpenChange = vi.fn();

      mockUseProjectVisibility.mockReturnValue({
        isProjectVisible: vi.fn((project: Project) => project.isVisible || false),
        updateProjectVisibility: mockUpdateProjectVisibility,
        getVisibleProjects: vi.fn(),
        resetToDefaults: vi.fn(),
        loadVisibilitySettings: vi.fn()
      });

      renderSettingsDialog({ onOpenChange: mockOnOpenChange });
      
      // Make multiple changes in sequence
      const changeButton = screen.getByTestId('mock-visibility-change');
      const selectAllButton = screen.getByTestId('mock-select-all');
      const deselectAllButton = screen.getByTestId('mock-deselect-all');
      
      fireEvent.click(changeButton);
      fireEvent.click(selectAllButton);
      fireEvent.click(deselectAllButton);
      
      // Final state should have all projects hidden
      const visibilityState = screen.getByTestId('visibility-state');
      const state = JSON.parse(visibilityState.textContent || '{}');
      expect(state['1']).toBe(false);
      expect(state['2']).toBe(false);
      expect(state['3']).toBe(false);
      
      // Save button should be enabled and workflow should complete
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).toBeEnabled();
      });
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      expect(mockUpdateProjectVisibility).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
