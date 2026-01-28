import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DynamicProjectPage } from '@/pages/DynamicProjectPage';
import type { Project } from '@/types/api';

// Mock ProjectLayout
vi.mock('@/components/ProjectLayout', () => ({
  ProjectLayout: vi.fn((props) => (
    <div data-testid="project-layout">
      <div data-testid="project-name">{props.projectName}</div>
      <div data-testid="project-id">{props.projectId}</div>
      <div data-testid="default-tab">{props.defaultTab}</div>
      <div data-testid="tabs">{props.tabs.join(',')}</div>
      <div data-testid="system">{props.system}</div>
      <div data-testid="show-landscape-filter">{String(props.showLandscapeFilter)}</div>
      <div data-testid="alerts-url">{props.alertsUrl || 'none'}</div>
      <div data-testid="components-title">{props.componentsTitle}</div>
      <div data-testid="empty-state-message">{props.emptyStateMessage}</div>
    </div>
  )),
}));

// Mock projectsStore
vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
}));

import { useProjects } from '@/stores/projectsStore';
import { ProjectLayout } from '@/components/ProjectLayout';

describe('DynamicProjectPage', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'cis20',
      title: 'CIS 2.0',
      description: 'CIS Project',
      health: true,
      monitoring: true,
      deployment: true,
      alerts: 'https://alerts.example.com/cis20',
    },
    {
      id: 'proj-2',
      name: 'platform',
      title: 'Platform Services',
      description: 'Platform Project',
      health: false,
      monitoring: false,
      alerts: '',
    },
    {
      id: 'proj-3',
      name: 'infrastructure',
      title: 'Infrastructure',
      description: 'Infrastructure Project',
      // No health or monitoring metadata
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProjects).mockReturnValue(mockProjects);
  });

  describe('Project Found', () => {
    it('should render ProjectLayout when project is found', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-layout')).toBeInTheDocument();
    });

    it('should pass correct project name to ProjectLayout', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('CIS 2.0');
    });

    it('should pass correct project id to ProjectLayout', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-id')).toHaveTextContent('cis20');
    });

    it('should always use "components" as default tab', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('default-tab')).toHaveTextContent('components');
    });

    it('should set system to project name', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('system')).toHaveTextContent('cis20');
    });

    it('should enable landscape filter by default', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('show-landscape-filter')).toHaveTextContent('true');
    });

    it('should pass correct components title', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('components-title')).toHaveTextContent('CIS 2.0 Components');
    });

    it('should pass correct empty state message', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('empty-state-message')).toHaveTextContent(
        'No CIS 2.0 components found for this organization.'
      );
    });
  });

  describe('Project Not Found', () => {
    it('should show error message when project is not found', () => {
      render(<DynamicProjectPage projectName="nonexistent" />);

      expect(screen.getByText('Error: Project nonexistent not found')).toBeInTheDocument();
    });

    it('should not render ProjectLayout when project is not found', () => {
      render(<DynamicProjectPage projectName="nonexistent" />);

      expect(screen.queryByTestId('project-layout')).not.toBeInTheDocument();
    });

    it('should have destructive text styling on error', () => {
      const { container } = render(<DynamicProjectPage projectName="nonexistent" />);

      const errorMessage = container.querySelector('.text-destructive');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should center error message', () => {
      const { container } = render(<DynamicProjectPage projectName="nonexistent" />);

      const errorMessage = container.querySelector('.text-center');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Dynamic Tab Configuration', () => {
    describe('Components Tab', () => {
      it('should always include components tab', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('components');
      });

      it('should have components as first tab', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        const tabs = screen.getByTestId('tabs').textContent?.split(',') || [];
        expect(tabs[0]).toBe('components');
      });
    });

    describe('Health Tab', () => {
      it('should include health tab when health metadata is true', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('health');
      });

      it('should not include health tab when health metadata is false', () => {
        render(<DynamicProjectPage projectName="platform" />);

        expect(screen.getByTestId('tabs').textContent).not.toContain('health');
      });

      it('should not include health tab when health metadata is missing', () => {
        render(<DynamicProjectPage projectName="infrastructure" />);

        expect(screen.getByTestId('tabs').textContent).not.toContain('health');
      });

      it('should include health tab when health metadata exists (truthy)', () => {
        const projectsWithHealth = [
          {
            id: 'proj-1',
            name: 'test',
            title: 'Test',
            description: 'Test',
            health: 'enabled', // Truthy but not boolean
          } as any,
        ];

        vi.mocked(useProjects).mockReturnValue(projectsWithHealth);

        render(<DynamicProjectPage projectName="test" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('health');
      });
    });

    describe('Monitoring Tab', () => {
      it('should include monitoring tab when monitoring metadata is true', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('monitoring');
      });

      it('should not include monitoring tab when monitoring metadata is false', () => {
        render(<DynamicProjectPage projectName="platform" />);

        expect(screen.getByTestId('tabs').textContent).not.toContain('monitoring');
      });

      it('should not include monitoring tab when monitoring metadata is missing', () => {
        render(<DynamicProjectPage projectName="infrastructure" />);

        expect(screen.getByTestId('tabs').textContent).not.toContain('monitoring');
      });

      it('should include monitoring tab when monitoring metadata exists (truthy)', () => {
        const projectsWithMonitoring = [
          {
            id: 'proj-1',
            name: 'test',
            title: 'Test',
            description: 'Test',
            monitoring: 'enabled', // Truthy but not boolean
          } as any,
        ];

        vi.mocked(useProjects).mockReturnValue(projectsWithMonitoring);

        render(<DynamicProjectPage projectName="test" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('monitoring');
      });

      it('should pass alerts URL to ProjectLayout when available', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        expect(screen.getByTestId('alerts-url')).toHaveTextContent('https://alerts.example.com/cis20');
      });

      it('should not pass alerts URL when alerts is empty', () => {
        render(<DynamicProjectPage projectName="platform" />);

        expect(screen.getByTestId('alerts-url')).toHaveTextContent('none');
      });

      it('should not pass alerts URL when alerts is not a string', () => {
        const projectsWithNonStringAlerts = [
          {
            id: 'proj-1',
            name: 'test',
            title: 'Test',
            description: 'Test',
            alerts: { url: 'test' }, // Object, not string
          } as any,
        ];

        vi.mocked(useProjects).mockReturnValue(projectsWithNonStringAlerts);

        render(<DynamicProjectPage projectName="test" />);

        expect(screen.getByTestId('alerts-url')).toHaveTextContent('none');
      });
    });

    describe('Tab Combinations', () => {
      it('should have only components tab when no metadata', () => {
        render(<DynamicProjectPage projectName="infrastructure" />);

        expect(screen.getByTestId('tabs')).toHaveTextContent('components');
        expect(screen.getByTestId('tabs').textContent).not.toContain('health');
        expect(screen.getByTestId('tabs').textContent).not.toContain('monitoring');
      });

      it('should have components and health tabs when only health is enabled', () => {
        const projectsWithOnlyHealth = [
          {
            id: 'proj-1',
            name: 'test',
            title: 'Test',
            description: 'Test',
            health: true,
          },
        ];

        vi.mocked(useProjects).mockReturnValue(projectsWithOnlyHealth);

        render(<DynamicProjectPage projectName="test" />);

        const tabs = screen.getByTestId('tabs').textContent?.split(',') || [];
        expect(tabs).toEqual(['components', 'health']);
      });

      it('should have components and monitoring tabs when only monitoring is configured', () => {
        const projectsWithOnlyMonitoring = [
          {
            id: 'proj-1',
            name: 'test',
            title: 'Test',
            description: 'Test',
            monitoring: true,
          },
        ];

        vi.mocked(useProjects).mockReturnValue(projectsWithOnlyMonitoring);

        render(<DynamicProjectPage projectName="test" />);

        const tabs = screen.getByTestId('tabs').textContent?.split(',') || [];
        expect(tabs).toEqual(['components', 'monitoring']);
      });

      it('should have all four tabs when both health and monitoring are configured for cis20', () => {
        render(<DynamicProjectPage projectName="cis20" />);

        const tabs = screen.getByTestId('tabs').textContent?.split(',') || [];
        expect(tabs).toEqual(['components', 'health', 'monitoring', 'deployment']);
      });
    });
  });

  describe('Different Projects', () => {
    it('should render correctly for cis20 project', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('CIS 2.0');
      expect(screen.getByTestId('project-id')).toHaveTextContent('cis20');
      expect(screen.getByTestId('tabs')).toHaveTextContent('components,health,monitoring,deployment');
    });

    it('should render correctly for platform project', () => {
      render(<DynamicProjectPage projectName="platform" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('Platform Services');
      expect(screen.getByTestId('project-id')).toHaveTextContent('platform');
      expect(screen.getByTestId('tabs')).toHaveTextContent('components');
    });

    it('should render correctly for infrastructure project', () => {
      render(<DynamicProjectPage projectName="infrastructure" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('Infrastructure');
      expect(screen.getByTestId('project-id')).toHaveTextContent('infrastructure');
      expect(screen.getByTestId('tabs')).toHaveTextContent('components');
    });
  });

  describe('Integration with Store', () => {
    it('should call useProjects hook', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(useProjects).toHaveBeenCalled();
    });

    it('should find project by name from store', () => {
      render(<DynamicProjectPage projectName="platform" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('Platform Services');
    });

    it('should handle when projects store returns empty array', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByText('Error: Project cis20 not found')).toBeInTheDocument();
    });
  });

  describe('ProjectLayout Props', () => {
    it('should call ProjectLayout with correct props', () => {
      render(<DynamicProjectPage projectName="cis20" />);

      expect(ProjectLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: 'CIS 2.0',
          projectId: 'cis20',
          defaultTab: 'components',
          tabs: ['components', 'health', 'monitoring', 'deployment'],
          componentsTitle: 'CIS 2.0 Components',
          emptyStateMessage: 'No CIS 2.0 components found for this organization.',
          system: 'cis20',
          showLandscapeFilter: true,
          alertsUrl: 'https://alerts.example.com/cis20',
        }),
        expect.anything()
      );
    });

    it('should pass undefined alertsUrl when not configured', () => {
      render(<DynamicProjectPage projectName="infrastructure" />);

      expect(ProjectLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          alertsUrl: undefined,
        }),
        expect.anything()
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle project with no title', () => {
      const projectsWithoutTitle = [
        {
          id: 'proj-1',
          name: 'test-project',
          description: 'Test',
        } as any,
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithoutTitle);

      render(<DynamicProjectPage projectName="test-project" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('');
    });

    it('should handle project with special characters in name', () => {
      const projectsWithSpecialChars = [
        {
          id: 'proj-1',
          name: 'test-project-v2',
          title: 'Test Project V2',
          description: 'Test',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithSpecialChars);

      render(<DynamicProjectPage projectName="test-project-v2" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project V2');
    });

    it('should be case-sensitive when matching project name', () => {
      render(<DynamicProjectPage projectName="CIS20" />);

      expect(screen.getByText('Error: Project CIS20 not found')).toBeInTheDocument();
    });

    it('should handle alerts URL with query parameters', () => {
      const projectsWithParams = [
        {
          id: 'proj-1',
          name: 'test',
          title: 'Test',
          description: 'Test',
          alerts: 'https://alerts.example.com?project=test&env=prod',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithParams);

      render(<DynamicProjectPage projectName="test" />);

      expect(screen.getByTestId('alerts-url')).toHaveTextContent(
        'https://alerts.example.com?project=test&env=prod'
      );
    });

    it('should handle very long project titles', () => {
      const projectsWithLongTitle = [
        {
          id: 'proj-1',
          name: 'test',
          title: 'This is a very long project title that might cause layout issues',
          description: 'Test',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(projectsWithLongTitle);

      render(<DynamicProjectPage projectName="test" />);

      expect(screen.getByTestId('components-title')).toHaveTextContent(
        'This is a very long project title that might cause layout issues Components'
      );
    });
  });

  describe('Re-rendering', () => {
    it('should update when projectName prop changes', () => {
      const { rerender } = render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('CIS 2.0');

      rerender(<DynamicProjectPage projectName="platform" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('Platform Services');
    });

    it('should show error when projectName changes to non-existent project', () => {
      const { rerender } = render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-layout')).toBeInTheDocument();

      rerender(<DynamicProjectPage projectName="nonexistent" />);

      expect(screen.getByText('Error: Project nonexistent not found')).toBeInTheDocument();
    });

    it('should update when projects in store change', () => {
      const { rerender } = render(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('CIS 2.0');

      const updatedProjects = [
        {
          id: 'proj-1',
          name: 'cis20',
          title: 'CIS 2.0 Updated',
          description: 'Updated',
          health: true,
          alerts: 'https://alerts.example.com/cis20',
        },
      ];

      vi.mocked(useProjects).mockReturnValue(updatedProjects);

      rerender(<DynamicProjectPage projectName="cis20" />);

      expect(screen.getByTestId('project-name')).toHaveTextContent('CIS 2.0 Updated');
    });
  });
});
