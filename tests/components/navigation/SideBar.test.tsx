import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { userEvent } from '@testing-library/user-event';
import { SideBar } from '@/components/Sidebar/SideBar';

// Mock stores
vi.mock('@/stores/sidebarStore', () => ({
  useSidebarStore: vi.fn(),
}));

vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
  useSidebarItems: vi.fn(),
  useProjectsLoading: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useProjectVisibility', () => ({
  useProjectVisibility: vi.fn(),
}));

vi.mock('@/hooks/api/usePlugins', () => ({
  usePlugins: vi.fn(),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock utilities
vi.mock('@/lib/utils', () => ({
  buildJiraFeedbackUrl: vi.fn(),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

// Mock environment utilities
vi.mock('@/utils/environment', () => ({
  isProduction: vi.fn(() => false),
}));

// Mock organization utilities
vi.mock('@/utils/organization-utils', () => ({
  isUserInSapCfsOrganization: vi.fn(() => true),
  getAllowedSidebarItemsForNonSapCfs: vi.fn(() => ['Home', 'AI Arena']),
}));

// Mock icons
vi.mock('@/components/icons/CloudAutomationIcon', () => ({
  CloudAutomationIcon: vi.fn(() => <div data-testid="cloud-automation-icon">CA</div>),
}));

vi.mock('@/components/icons/UnifiedServiceIcon', () => ({
  UnifiedServicesIcon: vi.fn(() => <div data-testid="unified-services-icon">USRV</div>),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Home: vi.fn(() => <div data-testid="home-icon">Home</div>),
    Users: vi.fn(() => <div data-testid="users-icon">Users</div>),
    Wrench: vi.fn(() => <div data-testid="wrench-icon">Wrench</div>),
    Link: vi.fn(() => <div data-testid="link-icon">Link</div>),
    Network: vi.fn(() => <div data-testid="network-icon">Network</div>),
    Brain: vi.fn(() => <div data-testid="brain-icon">Brain</div>),
    MessageSquare: vi.fn(() => <div data-testid="message-square-icon">Feedback</div>),
    ChevronLeft: vi.fn(() => <div data-testid="chevron-left">Left</div>),
    ChevronRight: vi.fn(() => <div data-testid="chevron-right">Right</div>),
    ChevronDown: vi.fn(() => <div data-testid="chevron-down">Down</div>),
    Puzzle: vi.fn(() => <div data-testid="puzzle-icon">Puzzle</div>),
    Store: vi.fn(() => <div data-testid="store-icon">Store</div>),
    Database: vi.fn(() => <div data-testid="database-icon">Database</div>),
    Settings: vi.fn(() => <div data-testid="settings-icon">Settings</div>),
    // Allow accessing any other icon (returns undefined, which the component handles)
    NonExistentIcon: undefined,
  };
});

import { useSidebarStore } from '@/stores/sidebarStore';
import { useProjects, useSidebarItems, useProjectsLoading } from '@/stores/projectsStore';
import { useProjectVisibility } from '@/hooks/useProjectVisibility';
import { usePlugins } from '@/hooks/api/usePlugins';
import { useAuth } from '@/contexts/AuthContext';
import { buildJiraFeedbackUrl } from '@/lib/utils';
import { isUserInSapCfsOrganization, getAllowedSidebarItemsForNonSapCfs } from '@/utils/organization-utils';

describe('SideBar', () => {
  const mockOnProjectChange = vi.fn();
  const mockToggle = vi.fn();
  const mockIsProjectVisible = vi.fn();

  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    organization: 'sap-cfs',
  };

  const mockProjects = [
    {
      id: 'proj-1',
      name: 'cis20',
      title: 'CIS 2.0',
      description: 'CIS Project',
    },
    {
      id: 'proj-2',
      name: 'ca',
      title: 'Cloud Automation',
      description: 'CA Project',
    },
    {
      id: 'proj-3',
      name: 'usrv',
      title: 'Unified Services',
      description: 'USRV Project',
    },
  ];

  const mockSidebarItems = [
    'Home',
    'Teams',
    'cis20',
    'ca',
    'usrv',
    'Self Service',
    'Links',
    'Plugin Marketplace',
  ];

  const mockPlugins = {
    plugins: [
      {
        id: 'plugin-1',
        name: 'Test Plugin',
        title: 'Test Plugin Title',
        subscribed: true,
        icon: 'Database',
      },
      {
        id: 'plugin-2',
        name: 'Another Plugin',
        title: 'Another Plugin Title',
        subscribed: true,
        icon: 'Settings',
      },
      {
        id: 'plugin-3',
        name: 'Unsubscribed Plugin',
        title: 'Unsubscribed',
        subscribed: false,
        icon: 'Cloud',
      },
    ],
  };

  const defaultProps = {
    activeProject: 'Home',
    onProjectChange: mockOnProjectChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useSidebarStore to handle selector pattern
    vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
      const state = {
        isExpanded: true,
        toggle: mockToggle,
        setIsExpanded: vi.fn(),
        getSidebarWidth: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useSidebarItems).mockReturnValue(mockSidebarItems);
    vi.mocked(useProjectsLoading).mockReturnValue(false);

    vi.mocked(useProjectVisibility).mockReturnValue({
      isProjectVisible: mockIsProjectVisible,
    } as any);

    vi.mocked(usePlugins).mockReturnValue({
      data: mockPlugins,
      isLoading: false,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(buildJiraFeedbackUrl).mockReturnValue('https://feedback.example.com');
    vi.mocked(isUserInSapCfsOrganization).mockReturnValue(true);

    mockIsProjectVisible.mockReturnValue(true);

    // Mock window.open
    global.window.open = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render sidebar', () => {
      render(<SideBar {...defaultProps} />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });

    it('should render all static projects', () => {
      const { container } = render(<SideBar {...defaultProps} />);

      // Get all project names from span.truncate elements (works for both buttons and divs)
      const spans = container.querySelectorAll('span.truncate');
      const projectNames = Array.from(spans).map(span => span.textContent).filter(Boolean);

      expect(projectNames).toContain('Home');
      expect(projectNames).toContain('Teams');
      expect(projectNames).toContain('Self Service');
      expect(projectNames).toContain('Links');
      expect(projectNames).toContain('Plugin Marketplace');
    });

    it('should render dynamic projects', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('cis20')).toBeInTheDocument();
      expect(screen.getByText('ca')).toBeInTheDocument();
      expect(screen.getByText('usrv')).toBeInTheDocument();
    });

    it('should render feedback button', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    });
  });

  describe('Expansion State', () => {
    it('should render expanded sidebar', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: true,
          toggle: mockToggle,
        };
        return selector ? selector(state) : state;
      });

      const { container } = render(<SideBar {...defaultProps} />);

      const sidebar = container.querySelector('.w-52');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render collapsed sidebar', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: false,
          toggle: mockToggle,
        };
        return selector(state);
      });

      const { container } = render(<SideBar {...defaultProps} />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should show "Expand sidebar" label when collapsed', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: false,
          toggle: mockToggle,
        };
        return selector(state);
      });

      render(<SideBar {...defaultProps} />);

      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('should show "Collapse sidebar" label when expanded', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: true,
          toggle: mockToggle,
        };
        return selector ? selector(state) : state;
      });

      render(<SideBar {...defaultProps} />);

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });

    it('should call toggle when toggle button is clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      await user.click(toggleButton);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should show loading message when projects are loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should show loading message when projects data is null', () => {
      vi.mocked(useProjects).mockReturnValue(null as any);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should not render project list when loading', () => {
      vi.mocked(useProjectsLoading).mockReturnValue(true);

      render(<SideBar {...defaultProps} />);

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show "No projects available" when sidebar items are empty', () => {
      vi.mocked(useSidebarItems).mockReturnValue([]);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('No projects available')).toBeInTheDocument();
    });

    it('should not render project list when sidebar items are empty', () => {
      vi.mocked(useSidebarItems).mockReturnValue([]);

      render(<SideBar {...defaultProps} />);

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('Active Project', () => {
    it('should highlight active project', () => {
      const { container } = render(<SideBar {...defaultProps} activeProject="Home" />);

      // Find the Home button by its span.truncate content
      const buttons = container.querySelectorAll('button');
      const homeButton = Array.from(buttons).find(button => {
        const span = button.querySelector('span.truncate');
        return span?.textContent === 'Home';
      });

      expect(homeButton).toHaveClass('font-medium');
    });

    it('should not highlight inactive projects', () => {
      render(<SideBar {...defaultProps} activeProject="Home" />);

      const teamsButton = screen.getByText('Teams').closest('button');
      expect(teamsButton).toHaveClass('text-muted-foreground');
    });

    it('should apply active styling to dynamic projects', () => {
      render(<SideBar {...defaultProps} activeProject="cis20" />);

      const cis20Button = screen.getByText('cis20').closest('button');
      expect(cis20Button).toHaveClass('font-medium');
    });
  });

  describe('Project Navigation', () => {
    it('should call onProjectChange when project is clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      const teamsButton = screen.getByText('Teams');
      await user.click(teamsButton);

      expect(mockOnProjectChange).toHaveBeenCalledWith('Teams');
    });

    it('should handle multiple project clicks', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      await user.click(screen.getByText('Teams'));
      await user.click(screen.getByText('Links'));
      await user.click(screen.getByText('cis20'));

      expect(mockOnProjectChange).toHaveBeenCalledTimes(3);
      expect(mockOnProjectChange).toHaveBeenNthCalledWith(1, 'Teams');
      expect(mockOnProjectChange).toHaveBeenNthCalledWith(2, 'Links');
      expect(mockOnProjectChange).toHaveBeenNthCalledWith(3, 'cis20');
    });
  });

  describe('Project Icons', () => {
    it('should render Home icon for Home project', () => {
      render(<SideBar {...defaultProps} />);

      const homeIcons = screen.getAllByTestId('home-icon');
      expect(homeIcons.length).toBeGreaterThan(0);
    });

    it('should render Users icon for Teams project', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('should render Wrench icon for Self Service project', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('wrench-icon')).toBeInTheDocument();
    });

    it('should render Link icon for Links project', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    });

    it('should render Network icon for cis20 project', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('network-icon')).toBeInTheDocument();
    });

    it('should render CloudAutomation icon for ca project', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('cloud-automation-icon')).toBeInTheDocument();
    });

  });

  describe('Plugin Marketplace', () => {
    it('should render Plugin Marketplace button', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Plugin Marketplace')).toBeInTheDocument();
    });

    it('should call onProjectChange when Plugin Marketplace is clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      const marketplaceButton = screen.getByText('Plugin Marketplace');
      await user.click(marketplaceButton);

      expect(mockOnProjectChange).toHaveBeenCalledWith('Plugin Marketplace');
    });

    it('should show expand/collapse chevron when subscribed plugins exist', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should not show chevron when no subscribed plugins', () => {
      vi.mocked(usePlugins).mockReturnValue({
        data: { plugins: [] },
        isLoading: false,
      } as any);

      render(<SideBar {...defaultProps} />);

      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('should show subscribed plugins when expanded', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Test Plugin Title')).toBeInTheDocument();
      expect(screen.getByText('Another Plugin Title')).toBeInTheDocument();
    });

    it('should not show unsubscribed plugins', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.queryByText('Unsubscribed')).not.toBeInTheDocument();
    });

    it('should toggle plugin list when chevron is clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Test Plugin Title')).toBeInTheDocument();

      const chevron = screen.getByLabelText('Collapse plugins');
      await user.click(chevron);

      await waitFor(() => {
        expect(screen.queryByText('Test Plugin Title')).not.toBeInTheDocument();
      });
    });

    it('should call onProjectChange with plugin slug when plugin is clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      const pluginButton = screen.getByText('Test Plugin Title');
      await user.click(pluginButton);

      expect(mockOnProjectChange).toHaveBeenCalledWith('plugins/test-plugin');
    });

    it('should highlight active plugin', () => {
      render(<SideBar {...defaultProps} activeProject="/plugins/test-plugin" />);

      const pluginButton = screen.getByText('Test Plugin Title').closest('button');
      expect(pluginButton).toHaveClass('font-medium');
    });
  });

  describe('Project Visibility', () => {
    it('should filter out invisible projects', () => {
      mockIsProjectVisible.mockImplementation((project) => {
        return project.name !== 'ca';
      });

      render(<SideBar {...defaultProps} />);

      expect(screen.queryByText('ca')).not.toBeInTheDocument();
      expect(screen.getByText('cis20')).toBeInTheDocument();
      expect(screen.getByText('usrv')).toBeInTheDocument();
    });

    it('should always show static projects for sap-cfs users', () => {
      mockIsProjectVisible.mockReturnValue(false);

      const { container } = render(<SideBar {...defaultProps} />);

      // Find project buttons by their span.truncate content
      const buttons = container.querySelectorAll('button');
      const projectNames = Array.from(buttons).map(button => {
        const span = button.querySelector('span.truncate');
        return span?.textContent;
      }).filter(Boolean);

      expect(projectNames).toContain('Home');
      expect(projectNames).toContain('Teams');
      expect(projectNames).toContain('Self Service');
    });

    it('should only show allowed items for non-sap-cfs users', () => {
      // Mock user as non-sap-cfs
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, organization: 'external-org' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      });

      vi.mocked(isUserInSapCfsOrganization).mockReturnValue(false);

      const { container } = render(<SideBar {...defaultProps} />);

      // Find project buttons by their span.truncate content
      const buttons = container.querySelectorAll('button');
      const projectNames = Array.from(buttons).map(button => {
        const span = button.querySelector('span.truncate');
        return span?.textContent;
      }).filter(Boolean);

      // Should only show allowed items for non-sap-cfs users
      expect(projectNames).toContain('Home');
      expect(projectNames).not.toContain('Teams');
      expect(projectNames).not.toContain('Self Service');
      expect(projectNames).not.toContain('Links');
      expect(projectNames).not.toContain('Plugin Marketplace');
      
      // Should not show dynamic projects
      expect(screen.queryByText('cis20')).not.toBeInTheDocument();
      expect(screen.queryByText('ca')).not.toBeInTheDocument();
      expect(screen.queryByText('usrv')).not.toBeInTheDocument();
    });

    it('should handle event listener lifecycle correctly', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<SideBar {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'projectVisibilityChanged',
        expect.any(Function)
      );
    });
  });

  describe('Feedback Button', () => {
    it('should render Send Feedback button', () => {
      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    });

    it('should build Jira feedback URL', () => {
      render(<SideBar {...defaultProps} />);

      expect(buildJiraFeedbackUrl).toHaveBeenCalledWith({
        summary: '[BUG|FeatReq] Tell Us How Can We Help!',
        description: '',
      });
    });

    it('should open feedback URL in new tab when clicked', async () => {
      const user = userEvent.setup();

      render(<SideBar {...defaultProps} />);

      const feedbackButton = screen.getByText('Send Feedback');
      await user.click(feedbackButton);

      expect(window.open).toHaveBeenCalledWith('https://feedback.example.com', '_blank');
    });
  });

  describe('Collapsed State Behavior', () => {
    it('should show tooltips and hide plugin list when collapsed', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: false,
          toggle: mockToggle,
        };
        return selector(state);
      });

      const { container } = render(<SideBar {...defaultProps} />);

      // Find the Home button by looking for buttons with the Home text in a span
      const buttons = container.querySelectorAll('button');
      const homeButton = Array.from(buttons).find(button => {
        const span = button.querySelector('span.truncate');
        return span?.textContent === 'Home';
      });

      expect(homeButton).toHaveAttribute('title', 'Home');
      expect(screen.queryByText('Test Plugin Title')).not.toBeInTheDocument();
    });

    it('should not show tooltips when expanded', () => {
      vi.mocked(useSidebarStore).mockImplementation((selector: any) => {
        const state = {
          isExpanded: true,
          toggle: mockToggle,
        };
        return selector(state);
      });

      const { container } = render(<SideBar {...defaultProps} />);

      // Find the Home button by looking for buttons with the Home text in a span
      const buttons = container.querySelectorAll('button');
      const homeButton = Array.from(buttons).find(button => {
        const span = button.querySelector('span.truncate');
        return span?.textContent === 'Home';
      });

      expect(homeButton).not.toHaveAttribute('title');
    });
  });

  describe('Edge Cases', () => {
    it('should handle plugins with missing icon', () => {
      vi.mocked(usePlugins).mockReturnValue({
        data: {
          plugins: [
            {
              id: 'plugin-1',
              name: 'Test Plugin',
              title: 'Test Plugin',
              subscribed: true,
              icon: undefined,
            },
          ],
        },
        isLoading: false,
      } as any);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('puzzle-icon')).toBeInTheDocument();
    });

    it('should handle plugins with invalid icon name', () => {
      vi.mocked(usePlugins).mockReturnValue({
        data: {
          plugins: [
            {
              id: 'plugin-1',
              name: 'Test Plugin',
              title: 'Test Plugin',
              subscribed: true,
              icon: 'NonExistentIcon',
            },
          ],
        },
        isLoading: false,
      } as any);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByTestId('puzzle-icon')).toBeInTheDocument();
    });

    it('should handle undefined plugins data', () => {
      vi.mocked(usePlugins).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText('Plugin Marketplace')).toBeInTheDocument();
    });

    it('should handle very long project names', () => {
      const longProjectName = 'Very Long Project Name That Should Be Truncated';

      vi.mocked(useProjects).mockReturnValue([
        ...mockProjects,
        {
          id: 'proj-long',
          name: longProjectName,
          title: longProjectName,
          description: 'Long name project',
        },
      ]);

      vi.mocked(useSidebarItems).mockReturnValue([
        'Home',
        longProjectName,
      ]);

      render(<SideBar {...defaultProps} />);

      expect(screen.getByText(longProjectName)).toBeInTheDocument();
    });
  });

});
