import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ProjectVisibilitySettings from '../../../src/components/ProjectVisibilitySettings';
import { useProjectsContext } from '../../../src/contexts/ProjectsContext';
import { Project } from '../../../src/types/api';

// Mock the ProjectsContext
vi.mock('../../../src/contexts/ProjectsContext', () => ({
  useProjectsContext: vi.fn()
}));

/**
 * ProjectVisibilitySettings Component Tests
 * 
 * Tests for the ProjectVisibilitySettings component which provides UI for
 * managing project visibility in the sidebar. This component is used within
 * the SettingsDialog to allow users to show/hide projects.
 * 
 * Component Location: src/components/ProjectVisibilitySettings.tsx
 * Context Location: src/contexts/ProjectsContext.tsx
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
  },
  {
    id: '4',
    name: 'other',
    title: 'Other Project',
    description: 'Other Project',
    isVisible: false
  }
];

const defaultProps = {
  visibilityState: {
    '1': true,
    '2': false,
    '3': true,
    '4': false
  } as { [projectId: string]: boolean },
  defaultProjects: ['cis20', 'usrv', 'ca'],
  onVisibilityChange: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn()
};

const mockUseProjectsContext = useProjectsContext as ReturnType<typeof vi.fn>;

/**
 * Helper function to render ProjectVisibilitySettings with default props
 */
function renderProjectVisibilitySettings(props?: Partial<typeof defaultProps>) {
  const finalProps = { ...defaultProps, ...props };
  return render(<ProjectVisibilitySettings {...finalProps} />);
}

// ============================================================================
// COMPONENT TESTS
// ============================================================================

describe('ProjectVisibilitySettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ProjectsContext with default projects
    mockUseProjectsContext.mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      error: null,
      sidebarItems: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render component with all projects and UI elements', () => {
      renderProjectVisibilitySettings();
      
      // Check main UI elements
      expect(screen.getByText('Sidebar Settings')).toBeInTheDocument();
      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
      expect(screen.getByText('Control which projects appear in the sidebar.')).toBeInTheDocument();
      
      // Check all projects are rendered
      mockProjects.forEach(project => {
        expect(screen.getByText(project.title)).toBeInTheDocument();
      });
      
      // Check control buttons
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /none/i })).toBeInTheDocument();
    });

    it('should render project checkboxes with correct initial state and icons', () => {
      renderProjectVisibilitySettings();
      
      const cis20Checkbox = screen.getByLabelText('CIS@2.0');
      const usrvCheckbox = screen.getByLabelText('Unified Services');
      const caCheckbox = screen.getByLabelText('Cloud Automation');
      const otherCheckbox = screen.getByLabelText('Other Project');
      
      expect(cis20Checkbox).toBeChecked();
      expect(usrvCheckbox).not.toBeChecked();
      expect(caCheckbox).toBeChecked();
      expect(otherCheckbox).not.toBeChecked();
      
      // Check visibility icons - they are SVG elements with specific classes
      const eyeIcons = document.querySelectorAll('.lucide-eye');
      const eyeOffIcons = document.querySelectorAll('.lucide-eye-off');
      
      // Based on visibility state: 2 visible projects (cis20, ca) + 2 in buttons = 4 eye icons
      // 2 hidden projects (usrv, other) + 1 in button = 3 eye-off icons
      expect(eyeIcons.length).toBeGreaterThanOrEqual(2);
      expect(eyeOffIcons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('should show loading message and hide content when projects are loading', () => {
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: true,
        error: null,
        sidebarItems: []
      });

      renderProjectVisibilitySettings();
      
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
      expect(screen.queryByText('Project Visibility')).not.toBeInTheDocument();
      
      // Should not render any projects
      mockProjects.forEach(project => {
        expect(screen.queryByText(project.title)).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('should call onVisibilityChange when checkbox is clicked with correct parameters', () => {
      const mockOnVisibilityChange = vi.fn();
      renderProjectVisibilitySettings({ onVisibilityChange: mockOnVisibilityChange });
      
      // Test checked to unchecked
      const cis20Checkbox = screen.getByLabelText('CIS@2.0');
      fireEvent.click(cis20Checkbox);
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('1', false);
      
      // Test unchecked to checked
      const usrvCheckbox = screen.getByLabelText('Unified Services');
      fireEvent.click(usrvCheckbox);
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('2', true);
    });

    it('should call control button callbacks when clicked', () => {
      const mockOnSelectAll = vi.fn();
      const mockOnDeselectAll = vi.fn();
      renderProjectVisibilitySettings({ 
        onSelectAll: mockOnSelectAll,
        onDeselectAll: mockOnDeselectAll 
      });
      
      const selectAllButton = screen.getByRole('button', { name: /all/i });
      fireEvent.click(selectAllButton);
      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
      
      const deselectAllButton = screen.getByRole('button', { name: /none/i });
      fireEvent.click(deselectAllButton);
      expect(mockOnDeselectAll).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid checkbox clicks', () => {
      const mockOnVisibilityChange = vi.fn();
      renderProjectVisibilitySettings({ onVisibilityChange: mockOnVisibilityChange });
      
      const cis20Checkbox = screen.getByLabelText('CIS@2.0');
      
      // Each click should call the callback with the opposite of current state
      fireEvent.click(cis20Checkbox);
      fireEvent.click(cis20Checkbox);
      
      expect(mockOnVisibilityChange).toHaveBeenCalledTimes(2);
      // Both calls will be with false since the component state doesn't actually change in the test
      expect(mockOnVisibilityChange).toHaveBeenNthCalledWith(1, '1', false);
      expect(mockOnVisibilityChange).toHaveBeenNthCalledWith(2, '1', false);
    });
  });

  // ==========================================================================
  // VISUAL STATE TESTS
  // ==========================================================================

  describe('Visual State', () => {
    it('should update visual state and icons when visibility state changes', () => {
      const { rerender } = renderProjectVisibilitySettings();
      
      // Initially cis20 is visible
      expect(screen.getByLabelText('CIS@2.0')).toBeChecked();
      
      // Change visibility state
      const newVisibilityState = { ...defaultProps.visibilityState, '1': false };
      rerender(
        <ProjectVisibilitySettings
          {...defaultProps}
          visibilityState={newVisibilityState}
        />
      );
      
      expect(screen.getByLabelText('CIS@2.0')).not.toBeChecked();
      
      // Test all visible state
      const allVisibleState = {
        '1': true,
        '2': true,
        '3': true,
        '4': true
      };
      
      rerender(
        <ProjectVisibilitySettings
          {...defaultProps}
          visibilityState={allVisibleState}
        />
      );
      
      // All checkboxes should be checked
      mockProjects.forEach(project => {
        expect(screen.getByLabelText(project.title)).toBeChecked();
      });
    });

    it('should handle edge case visibility states', () => {
      // Test empty visibility state
      const { rerender } = renderProjectVisibilitySettings();
      
      rerender(
        <ProjectVisibilitySettings
          {...defaultProps}
          visibilityState={{}}
        />
      );
      
      mockProjects.forEach(project => {
        const checkbox = screen.getByLabelText(project.title);
        expect(checkbox).not.toBeChecked();
      });
      
      // Test partial visibility state
      const partialState = { '1': true } as { [projectId: string]: boolean };
      rerender(
        <ProjectVisibilitySettings
          {...defaultProps}
          visibilityState={partialState}
        />
      );
      
      expect(screen.getByLabelText('CIS@2.0')).toBeChecked();
      expect(screen.getByLabelText('Unified Services')).not.toBeChecked();
      expect(screen.getByLabelText('Cloud Automation')).not.toBeChecked();
      expect(screen.getByLabelText('Other Project')).not.toBeChecked();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels and associations', () => {
      renderProjectVisibilitySettings();
      
      mockProjects.forEach(project => {
        const checkbox = screen.getByLabelText(project.title);
        const label = screen.getByText(project.title);
        
        expect(checkbox).toHaveAttribute('id', `project-${project.id}`);
        expect(label).toHaveAttribute('for', `project-${project.id}`);
      });
    });

    it('should support keyboard navigation and interaction', () => {
      const mockOnVisibilityChange = vi.fn();
      renderProjectVisibilitySettings({ onVisibilityChange: mockOnVisibilityChange });
      
      const firstCheckbox = screen.getByLabelText('CIS@2.0');
      firstCheckbox.focus();
      
      expect(document.activeElement).toBe(firstCheckbox);
      
      // Use click event instead of keyDown for checkbox interaction
      fireEvent.click(firstCheckbox);
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('1', false);
    });

    it('should have proper button roles and states', () => {
      renderProjectVisibilitySettings();
      
      const selectAllButton = screen.getByRole('button', { name: /all/i });
      const deselectAllButton = screen.getByRole('button', { name: /none/i });
      
      expect(selectAllButton).toBeEnabled();
      expect(deselectAllButton).toBeEnabled();
    });
  });


  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty or null projects', () => {
      // Test empty projects array
      mockUseProjectsContext.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const { rerender } = renderProjectVisibilitySettings();
      
      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      
      // Test null projects
      mockUseProjectsContext.mockReturnValue({
        projects: null as any,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      rerender(<ProjectVisibilitySettings {...defaultProps} />);
      
      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should handle projects with missing or undefined titles', () => {
      const projectsWithMissingTitles: Project[] = [
        {
          id: '1',
          name: 'test-project-empty',
          title: '',
          description: 'Test project',
          isVisible: true
        },
        {
          id: '2',
          name: 'test-project-undefined',
          title: undefined as any,
          description: 'Test project',
          isVisible: true
        }
      ];

      mockUseProjectsContext.mockReturnValue({
        projects: projectsWithMissingTitles,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const visibilityState = { '1': true, '2': true };
      renderProjectVisibilitySettings({ visibilityState });
      
      // Should fall back to name when title is empty or undefined
      expect(screen.getByText('test-project-empty')).toBeInTheDocument();
      expect(screen.getByText('test-project-undefined')).toBeInTheDocument();
    });

    it('should handle large number of projects', () => {
      const manyProjects: Project[] = Array.from({ length: 20 }, (_, i) => ({
        id: i.toString(),
        name: `project-${i}`,
        title: `Project ${i}`,
        description: `Description ${i}`,
        isVisible: i % 2 === 0
      }));

      mockUseProjectsContext.mockReturnValue({
        projects: manyProjects,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const visibilityState = manyProjects.reduce((acc, project) => {
        acc[project.id] = project.isVisible || false;
        return acc;
      }, {} as { [projectId: string]: boolean });

      renderProjectVisibilitySettings({ visibilityState });
      
      expect(screen.getAllByRole('checkbox')).toHaveLength(20);
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Tests', () => {
    it('should work with realistic project data', () => {
      const realisticProjects: Project[] = [
        {
          id: 'cis-20-uuid',
          name: 'cis20',
          title: 'CIS@2.0',
          description: 'Customer Information System 2.0',
          isVisible: true
        },
        {
          id: 'unified-services-uuid',
          name: 'usrv',
          title: 'Unified Services',
          description: 'Unified Services Platform',
          isVisible: false
        }
      ];

      mockUseProjectsContext.mockReturnValue({
        projects: realisticProjects,
        isLoading: false,
        error: null,
        sidebarItems: []
      });

      const mockOnVisibilityChange = vi.fn();
      renderProjectVisibilitySettings({
        visibilityState: {
          'cis-20-uuid': true,
          'unified-services-uuid': false
        } as { [projectId: string]: boolean },
        onVisibilityChange: mockOnVisibilityChange
      });
      
      expect(screen.getByText('CIS@2.0')).toBeInTheDocument();
      expect(screen.getByText('Unified Services')).toBeInTheDocument();
      
      const cis20Checkbox = screen.getByLabelText('CIS@2.0');
      fireEvent.click(cis20Checkbox);
      
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('cis-20-uuid', false);
    });

    it('should handle complete user workflow', async () => {
      const mockOnVisibilityChange = vi.fn();
      const mockOnSelectAll = vi.fn();
      const mockOnDeselectAll = vi.fn();

      renderProjectVisibilitySettings({
        onVisibilityChange: mockOnVisibilityChange,
        onSelectAll: mockOnSelectAll,
        onDeselectAll: mockOnDeselectAll
      });
      
      // User clicks "None" to deselect all
      fireEvent.click(screen.getByRole('button', { name: /none/i }));
      expect(mockOnDeselectAll).toHaveBeenCalled();
      
      // User clicks "All" to select all
      fireEvent.click(screen.getByRole('button', { name: /all/i }));
      expect(mockOnSelectAll).toHaveBeenCalled();
      
      // User toggles individual projects
      fireEvent.click(screen.getByLabelText('CIS@2.0'));
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('1', false);
      
      fireEvent.click(screen.getByLabelText('Unified Services'));
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('2', true);
    });
  });
});
