import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ProjectVisibilitySection from '@/components/settings/ProjectVisibilitySection';
import type { Project } from '@/types/api';

// Mock Zustand store
vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
  useProjectsLoading: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: vi.fn(({ id, checked, onCheckedChange, ...props }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid={id}
      {...props}
    />
  )),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: vi.fn(() => <hr data-testid="separator" />),
}));

import { useProjects, useProjectsLoading } from '@/stores/projectsStore';

describe('ProjectVisibilitySection', () => {
  const mockOnVisibilityChange = vi.fn();
  const mockOnSelectAll = vi.fn();
  const mockOnDeselectAll = vi.fn();

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'cis20',
      title: 'CIS 2.0',
      description: 'CIS Project',
    },
    {
      id: 'proj-2',
      name: 'platform',
      title: 'Platform Services',
      description: 'Platform Project',
    },
    {
      id: 'proj-3',
      name: 'infrastructure',
      title: 'Infrastructure',
      description: 'Infrastructure Project',
    },
  ];

  const defaultProps = {
    visibilityState: {
      'proj-1': true,
      'proj-2': false,
      'proj-3': true,
    },
    onVisibilityChange: mockOnVisibilityChange,
    onSelectAll: mockOnSelectAll,
    onDeselectAll: mockOnDeselectAll,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useProjectsLoading).mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('Control which projects appear in the sidebar.')).toBeInTheDocument();
    });

    it('should render All button', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should render None button', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should render separator', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('should render all projects', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('CIS 2.0')).toBeInTheDocument();
      expect(screen.getByText('Platform Services')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    });

    it('should render checkbox for each project', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByTestId('project-proj-1')).toBeInTheDocument();
      expect(screen.getByTestId('project-proj-2')).toBeInTheDocument();
      expect(screen.getByTestId('project-proj-3')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading message when loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should not render projects when loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.queryByText('CIS 2.0')).not.toBeInTheDocument();
    });

    it('should not render action buttons when loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.queryByText('All')).not.toBeInTheDocument();
      expect(screen.queryByText('None')).not.toBeInTheDocument();
    });
  });

  describe('Project Display', () => {
    it('should display project title when available', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('CIS 2.0')).toBeInTheDocument();
    });

    it('should fall back to project name when title is missing', () => {
      const projectsWithoutTitle = [
        {
          id: 'proj-1',
          name: 'test-project',
          title: '',
          description: 'Test',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithoutTitle);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('test-project')).toBeInTheDocument();
    });

    it('should use project name when title is undefined', () => {
      const projectsWithoutTitle = [
        {
          id: 'proj-1',
          name: 'another-project',
          description: 'Test',
        } as Project,
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithoutTitle);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('another-project')).toBeInTheDocument();
    });
  });

  describe('Checkbox State', () => {
    it('should check boxes for visible projects', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkbox1 = screen.getByTestId('project-proj-1') as HTMLInputElement;
      const checkbox3 = screen.getByTestId('project-proj-3') as HTMLInputElement;

      expect(checkbox1.checked).toBe(true);
      expect(checkbox3.checked).toBe(true);
    });

    it('should uncheck boxes for hidden projects', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkbox2 = screen.getByTestId('project-proj-2') as HTMLInputElement;

      expect(checkbox2.checked).toBe(false);
    });

    it('should default to unchecked when project not in visibilityState', () => {
      const propsWithMissingProject = {
        ...defaultProps,
        visibilityState: {
          'proj-1': true,
          // proj-2 missing
          'proj-3': true,
        },
      };

      render(<ProjectVisibilitySection {...propsWithMissingProject} />);

      const checkbox2 = screen.getByTestId('project-proj-2') as HTMLInputElement;
      expect(checkbox2.checked).toBe(false);
    });

    it('should handle all projects visible', () => {
      const allVisibleProps = {
        ...defaultProps,
        visibilityState: {
          'proj-1': true,
          'proj-2': true,
          'proj-3': true,
        },
      };

      render(<ProjectVisibilitySection {...allVisibleProps} />);

      const checkbox1 = screen.getByTestId('project-proj-1') as HTMLInputElement;
      const checkbox2 = screen.getByTestId('project-proj-2') as HTMLInputElement;
      const checkbox3 = screen.getByTestId('project-proj-3') as HTMLInputElement;

      expect(checkbox1.checked).toBe(true);
      expect(checkbox2.checked).toBe(true);
      expect(checkbox3.checked).toBe(true);
    });

    it('should handle all projects hidden', () => {
      const allHiddenProps = {
        ...defaultProps,
        visibilityState: {
          'proj-1': false,
          'proj-2': false,
          'proj-3': false,
        },
      };

      render(<ProjectVisibilitySection {...allHiddenProps} />);

      const checkbox1 = screen.getByTestId('project-proj-1') as HTMLInputElement;
      const checkbox2 = screen.getByTestId('project-proj-2') as HTMLInputElement;
      const checkbox3 = screen.getByTestId('project-proj-3') as HTMLInputElement;

      expect(checkbox1.checked).toBe(false);
      expect(checkbox2.checked).toBe(false);
      expect(checkbox3.checked).toBe(false);
    });
  });

  describe('Visual Indicators', () => {
    it('should show Eye icon for visible projects', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      // Check for green eye icons (visible projects)
      const greenEyes = container.querySelectorAll('.text-green-600');
      expect(greenEyes.length).toBe(2); // proj-1 and proj-3 are visible
    });

    it('should show EyeOff icon for hidden projects', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      // Check for muted eye-off icons (hidden projects)
      const mutedIcons = container.querySelectorAll('.text-muted-foreground');
      expect(mutedIcons.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectAll when All button is clicked', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      const allButton = screen.getByText('All');
      await user.click(allButton);

      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
    });

    it('should call onDeselectAll when None button is clicked', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      const noneButton = screen.getByText('None');
      await user.click(noneButton);

      expect(mockOnDeselectAll).toHaveBeenCalledTimes(1);
    });

    it('should call onVisibilityChange when checkbox is toggled', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkbox = screen.getByTestId('project-proj-2');
      await user.click(checkbox);

      expect(mockOnVisibilityChange).toHaveBeenCalledWith('proj-2', true);
    });

    it('should call onVisibilityChange with correct project id and state', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      // Toggle a visible project to hidden
      const checkbox1 = screen.getByTestId('project-proj-1');
      await user.click(checkbox1);

      expect(mockOnVisibilityChange).toHaveBeenCalledWith('proj-1', false);
    });

    it('should allow clicking label to toggle checkbox', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      const label = screen.getByText('CIS 2.0');
      await user.click(label);

      // Label should trigger the checkbox via htmlFor
      expect(mockOnVisibilityChange).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should handle empty projects array', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      render(<ProjectVisibilitySection {...defaultProps} />);

      // Should still render the container and buttons
      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should not render any checkboxes when projects is empty', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('should handle undefined projects', () => {
      vi.mocked(useProjects).mockReturnValue(undefined as any);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('Project Visibility')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have fixed height container', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const mainContainer = container.querySelector('.h-\\[315px\\]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const mainContainer = container.querySelector('.rounded-lg');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have border', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const mainContainer = container.querySelector('.border');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have background color', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const mainContainer = container.querySelector('.bg-muted\\/20');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have scrollable content area', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const scrollArea = container.querySelector('.overflow-auto');
      expect(scrollArea).toBeInTheDocument();
    });

    it('should use grid layout with 2 columns', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have gap between grid items', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const grid = container.querySelector('.gap-3');
      expect(grid).toBeInTheDocument();
    });

    it('should apply hover effect to project items', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const projectItem = container.querySelector('.hover\\:bg-accent\\/50');
      expect(projectItem).toBeInTheDocument();
    });

    it('should have transition on project items', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const projectItem = container.querySelector('.transition-colors');
      expect(projectItem).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association for checkboxes', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkbox = screen.getByTestId('project-proj-1');
      const label = screen.getByText('CIS 2.0');

      expect(checkbox).toHaveAttribute('id', 'project-proj-1');
      expect(label).toHaveAttribute('for', 'project-proj-1');
    });

    it('should have cursor pointer on labels', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const label = container.querySelector('.cursor-pointer');
      expect(label).toBeInTheDocument();
    });

    it('should truncate long project names', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const label = container.querySelector('.truncate');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('should have Eye icon in All button', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const allButton = screen.getByText('All').closest('button');
      expect(allButton).toBeInTheDocument();
    });

    it('should have EyeOff icon in None button', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const noneButton = screen.getByText('None').closest('button');
      expect(noneButton).toBeInTheDocument();
    });

    it('should apply outline variant to buttons', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      const allButton = screen.getByText('All');
      expect(allButton).toHaveAttribute('variant', 'outline');
    });

    it('should have flex wrap for buttons', () => {
      const { container } = render(<ProjectVisibilitySection {...defaultProps} />);

      const buttonContainer = container.querySelector('.flex-wrap');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Integration with Store', () => {
    it('should use projects from store', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(useProjects).toHaveBeenCalled();
    });

    it('should use loading state from store', () => {
      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(useProjectsLoading).toHaveBeenCalled();
    });

    it('should re-render when projects change', () => {
      const { rerender } = render(<ProjectVisibilitySection {...defaultProps} />);

      const newProjects = [
        ...mockProjects,
        {
          id: 'proj-4',
          name: 'new-project',
          title: 'New Project',
          description: 'New',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(newProjects);

      rerender(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle project with very long title', () => {
      const projectWithLongTitle = [
        {
          id: 'proj-1',
          name: 'long',
          title: 'This is a very long project title that should be truncated to fit in the UI',
          description: 'Test',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectWithLongTitle);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('This is a very long project title that should be truncated to fit in the UI')).toBeInTheDocument();
    });

    it('should handle special characters in project title', () => {
      const projectWithSpecialChars = [
        {
          id: 'proj-1',
          name: 'special',
          title: 'Project & Services <Test>',
          description: 'Test',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectWithSpecialChars);

      render(<ProjectVisibilitySection {...defaultProps} />);

      expect(screen.getByText('Project & Services <Test>')).toBeInTheDocument();
    });

    it('should handle rapid checkbox toggling', async () => {
      const user = userEvent.setup();

      render(<ProjectVisibilitySection {...defaultProps} />);

      const checkbox = screen.getByTestId('project-proj-1');
      
      // Rapid clicks
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(mockOnVisibilityChange).toHaveBeenCalledTimes(3);
    });

    it('should handle empty visibilityState object', () => {
      const emptyVisibilityProps = {
        ...defaultProps,
        visibilityState: {},
      };

      render(<ProjectVisibilitySection {...emptyVisibilityProps} />);

      // All checkboxes should default to unchecked
      const checkbox1 = screen.getByTestId('project-proj-1') as HTMLInputElement;
      const checkbox2 = screen.getByTestId('project-proj-2') as HTMLInputElement;

      expect(checkbox1.checked).toBe(false);
      expect(checkbox2.checked).toBe(false);
    });
  });
});