import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PortalContainer } from '@/components/PortalContainer';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
  useSidebarItems: vi.fn(),
}));

// Mock contexts
vi.mock('@/contexts/PortalProviders', () => ({
  PortalProviders: vi.fn(({ children }) => (
    <div data-testid="portal-providers">{children}</div>
  )),
}));

// Mock components
vi.mock('@/components/PortalContent', () => ({
  PortalContent: vi.fn(({ activeProject, projects, onProjectChange }) => (
    <div data-testid="portal-content">
      <div data-testid="active-project">{activeProject}</div>
      <div data-testid="projects-count">{projects.length}</div>
      <button onClick={() => onProjectChange('Teams')} data-testid="change-to-teams">
        Teams
      </button>
      <button onClick={() => onProjectChange('plugins/test-plugin')} data-testid="change-to-plugin">
        Plugin
      </button>
      <button onClick={() => onProjectChange('cis20')} data-testid="change-to-cis20">
        CIS 2.0
      </button>
    </div>
  )),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

import { useProjects, useSidebarItems } from '@/stores/projectsStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { PortalProviders } from '@/contexts/PortalProviders';
import { PortalContent } from '@/components/PortalContent';

describe('PortalContainer', () => {
  const mockNavigate = vi.fn();

  const mockProjects = [
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
  ];

  const mockSidebarItems = [
    'Home',
    'Teams',
    'cis20',
    'platform',
    'Self Service',
    'Links',
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset PortalContent mock to default implementation
    vi.mocked(PortalContent).mockImplementation(({ activeProject, projects, onProjectChange }) => (
      <div data-testid="portal-content">
        <div data-testid="active-project">{activeProject}</div>
        <div data-testid="projects-count">{projects.length}</div>
        <button onClick={() => onProjectChange('Teams')} data-testid="change-to-teams">
          Teams
        </button>
        <button onClick={() => onProjectChange('plugins/test-plugin')} data-testid="change-to-plugin">
          Plugin
        </button>
        <button onClick={() => onProjectChange('cis20')} data-testid="change-to-cis20">
          CIS 2.0
        </button>
      </div>
    ));

    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useSidebarItems).mockReturnValue(mockSidebarItems);
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  const renderWithRouter = (initialPath = '/') => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: initialPath,
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <PortalContainer />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render PortalProviders', () => {
      renderWithRouter();

      expect(screen.getByTestId('portal-providers')).toBeInTheDocument();
    });

    it('should render PortalContent inside providers', () => {
      renderWithRouter();

      expect(screen.getByTestId('portal-content')).toBeInTheDocument();
    });

    it('should pass projects to PortalContent', () => {
      renderWithRouter();

      expect(screen.getByTestId('projects-count')).toHaveTextContent('6');
    });
  });

  describe('Static Route Detection - Home', () => {
    it('should set activeProject to Home for root path', () => {
      renderWithRouter('/');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Home');
    });

    it('should set activeProject to Home initially', async () => {
      renderWithRouter('/');

      await waitFor(() => {
        expect(screen.getByTestId('active-project')).toHaveTextContent('Home');
      });
    });
  });

  describe('Static Route Detection - Other Pages', () => {
    it('should detect Teams page', () => {
      renderWithRouter('/teams');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Teams');
    });

    it('should detect Teams sub-routes', () => {
      renderWithRouter('/teams/team-alpha');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Teams');
    });

    it('should detect Links page', () => {
      renderWithRouter('/links');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Links');
    });

    it('should detect Self Service page', () => {
      renderWithRouter('/self-service');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Self Service');
    });

    it('should detect AI Arena page', () => {
      renderWithRouter('/ai-arena');

      expect(screen.getByTestId('active-project')).toHaveTextContent('AI Arena');
    });

    it('should detect AI Arena sub-routes', () => {
      renderWithRouter('/ai-arena/chat');

      expect(screen.getByTestId('active-project')).toHaveTextContent('AI Arena');
    });
  });

  describe('Dynamic Project Route Detection', () => {
    it('should detect dynamic project route', () => {
      renderWithRouter('/cis20');

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 2.0');
    });

    it('should detect dynamic project sub-routes', () => {
      renderWithRouter('/cis20/components');

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 2.0');
    });

    it('should detect another dynamic project', () => {
      renderWithRouter('/platform');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Platform Services');
    });

    it('should use project name if title is missing', () => {
      vi.mocked(useProjects).mockReturnValue([
        {
          id: 'proj-1',
          name: 'testproject',
          title: '',
          description: 'Test',
        },
      ]);

      renderWithRouter('/testproject');

      expect(screen.getByTestId('active-project')).toHaveTextContent('testproject');
    });
  });

  describe('Plugin Route Detection', () => {
    it('should detect plugin route', () => {
      renderWithRouter('/plugins/test-plugin');

      expect(screen.getByTestId('active-project')).toHaveTextContent('/plugins/test-plugin');
    });

    it('should detect different plugin routes', () => {
      renderWithRouter('/plugins/another-plugin');

      expect(screen.getByTestId('active-project')).toHaveTextContent('/plugins/another-plugin');
    });

    it('should not treat /plugins index as plugin route', () => {
      renderWithRouter('/plugins');

      // Should not match as a plugin route
      expect(screen.getByTestId('active-project')).not.toHaveTextContent('/plugins/');
    });
  });

  describe('Project Change Handling - Static Routes', () => {
    it('should navigate to Teams page', async () => {
      const user = userEvent.setup();

      renderWithRouter('/');

      const teamsButton = screen.getByTestId('change-to-teams');
      await user.click(teamsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/teams');
    });

    it('should update activeProject when navigating to Teams', async () => {
      const user = userEvent.setup();

      renderWithRouter('/');

      const teamsButton = screen.getByTestId('change-to-teams');
      await user.click(teamsButton);

      // The component would update activeProject in state
      expect(mockNavigate).toHaveBeenCalledWith('/teams');
    });
  });

  describe('Project Change Handling - Dynamic Projects', () => {
    it('should navigate to dynamic project', async () => {
      const user = userEvent.setup();

      // Update the PortalContent mock button to use the project title
      vi.mocked(PortalContent).mockImplementation(({ activeProject, projects, onProjectChange }) => (
        <div data-testid="portal-content">
          <div data-testid="active-project">{activeProject}</div>
          <div data-testid="projects-count">{projects.length}</div>
          <button onClick={() => onProjectChange('Teams')} data-testid="change-to-teams">
            Teams
          </button>
          <button onClick={() => onProjectChange('plugins/test-plugin')} data-testid="change-to-plugin">
            Plugin
          </button>
          <button onClick={() => onProjectChange('CIS 2.0')} data-testid="change-to-cis20">
            CIS 2.0
          </button>
        </div>
      ));

      renderWithRouter('/');

      const cis20Button = screen.getByTestId('change-to-cis20');
      await user.click(cis20Button);

      expect(mockNavigate).toHaveBeenCalledWith('/cis20');
    });
  });

  describe('Project Change Handling - Plugins', () => {
    it('should navigate to plugin route', async () => {
      const user = userEvent.setup();

      renderWithRouter('/');

      const pluginButton = screen.getByTestId('change-to-plugin');
      await user.click(pluginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/plugins/test-plugin');
    });

    it('should handle plugin route format correctly', async () => {
      const user = userEvent.setup();

      renderWithRouter('/');

      const pluginButton = screen.getByTestId('change-to-plugin');
      await user.click(pluginButton);

      // Should navigate with leading slash
      expect(mockNavigate).toHaveBeenCalledWith('/plugins/test-plugin');
    });
  });

  describe('Route Updates', () => {
    it('should update activeProject when location changes', () => {
      const { rerender } = renderWithRouter('/');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Home');

      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams',
        search: '',
        hash: '',
        state: null,
        key: 'new-key',
      });

      rerender(
        <MemoryRouter initialEntries={['/teams']}>
          <PortalContainer />
        </MemoryRouter>
      );

      expect(screen.getByTestId('active-project')).toHaveTextContent('Teams');
    });

    it('should update when projects array changes', () => {
      const { rerender } = renderWithRouter('/cis20');

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 2.0');

      vi.mocked(useProjects).mockReturnValue([
        {
          id: 'proj-1',
          name: 'cis20',
          title: 'CIS 3.0', // Changed title
          description: 'CIS Project',
        },
      ]);

      rerender(
        <MemoryRouter initialEntries={['/cis20']}>
          <PortalContainer />
        </MemoryRouter>
      );

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 3.0');
    });
  });

  describe('Fallback Behavior', () => {
    it('should return empty string for unknown route', () => {
      renderWithRouter('/unknown-route');

      expect(screen.getByTestId('active-project')).toHaveTextContent('');
    });

    it('should navigate to home for unknown project', async () => {
      const user = userEvent.setup();

      // Mock PortalContent to allow changing to unknown project
      vi.mocked(PortalContent).mockImplementation(({ onProjectChange }) => (
        <div data-testid="portal-content">
          <button onClick={() => onProjectChange('UnknownProject')} data-testid="unknown-project">
            Unknown
          </button>
        </div>
      ));

      renderWithRouter('/');

      const unknownButton = screen.getByTestId('unknown-project');
      await user.click(unknownButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Integration', () => {
    it('should call useProjects', () => {
      renderWithRouter('/');

      expect(useProjects).toHaveBeenCalled();
    });

    it('should call useSidebarItems', () => {
      renderWithRouter('/');

      expect(useSidebarItems).toHaveBeenCalled();
    });

    it('should call useNavigate', () => {
      renderWithRouter('/');

      expect(useNavigate).toHaveBeenCalled();
    });

    it('should call useLocation', () => {
      renderWithRouter('/');

      expect(useLocation).toHaveBeenCalled();
    });

    it('should call PortalProviders with children', () => {
      renderWithRouter('/');

      expect(PortalProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          children: expect.anything(),
        }),
        expect.anything()
      );
    });

    it('should call PortalContent with correct props', () => {
      renderWithRouter('/');

      expect(PortalContent).toHaveBeenCalledWith(
        expect.objectContaining({
          activeProject: expect.any(String),
          projects: mockSidebarItems,
          onProjectChange: expect.any(Function),
        }),
        expect.anything()
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projects array', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      renderWithRouter('/');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Home');
    });

    it('should handle empty sidebar items', () => {
      vi.mocked(useSidebarItems).mockReturnValue([]);

      renderWithRouter('/');

      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
    });

    it('should handle route with trailing slash', () => {
      renderWithRouter('/teams/');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Teams');
    });

    it('should handle deeply nested routes', () => {
      renderWithRouter('/cis20/components/details/advanced');

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 2.0');
    });

    it('should handle project with special characters in name', () => {
      vi.mocked(useProjects).mockReturnValue([
        {
          id: 'proj-1',
          name: 'test-project',
          title: 'Test & Project <Special>',
          description: 'Test',
        },
      ]);

      renderWithRouter('/test-project');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Test & Project <Special>');
    });

    it('should handle plugin with dashes in slug', () => {
      renderWithRouter('/plugins/my-awesome-plugin');

      expect(screen.getByTestId('active-project')).toHaveTextContent('/plugins/my-awesome-plugin');
    });

    it('should handle plugin with underscores in slug', () => {
      renderWithRouter('/plugins/my_plugin_name');

      expect(screen.getByTestId('active-project')).toHaveTextContent('/plugins/my_plugin_name');
    });
  });

  describe('Route Priority', () => {
    it('should check plugin routes before dynamic projects', () => {
      // If there's a project named "plugins", the plugin route should take priority
      vi.mocked(useProjects).mockReturnValue([
        ...mockProjects,
        {
          id: 'proj-3',
          name: 'plugins',
          title: 'Plugins Project',
          description: 'Test',
        },
      ]);

      renderWithRouter('/plugins/test-plugin');

      // Should detect as plugin route, not as "Plugins Project"
      expect(screen.getByTestId('active-project')).toHaveTextContent('/plugins/test-plugin');
    });

    it('should check dynamic projects before static routes for exact matches', () => {
      renderWithRouter('/cis20');

      expect(screen.getByTestId('active-project')).toHaveTextContent('CIS 2.0');
    });

    it('should handle home route specially', () => {
      renderWithRouter('/');

      expect(screen.getByTestId('active-project')).toHaveTextContent('Home');
    });
  });
});