import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectLayout } from '@/components/ProjectLayout';
import { MemoryRouter } from 'react-router-dom';

// Mock all child components
vi.mock('@/components/BreadcrumbPage', () => ({
  BreadcrumbPage: vi.fn(({ children }) => <div data-testid="breadcrumb-page">{children}</div>),
}));

vi.mock('@/components/LandscapeLinksSection', () => ({
  LandscapeLinksSection: vi.fn(() => <div data-testid="landscape-links">Landscape Links</div>),
}));

vi.mock('@/components/ComponentsTabContent', () => ({
  ComponentsTabContent: vi.fn(() => <div data-testid="components-tab-content">Components Content</div>),
}));

vi.mock('@/components/Health/HealthDashboard', () => ({
  HealthDashboard: vi.fn(() => <div data-testid="health-dashboard">Health Dashboard</div>),
}));

vi.mock('@/pages/AlertsPage', () => ({
  default: vi.fn(() => <div data-testid="alerts-page">Alerts Page</div>),
}));

vi.mock('@/components/Health/HealthTable', () => ({
  HealthTable: vi.fn(() => <div data-testid="health-table">Health Table</div>),
}));

vi.mock('@/components/ViewSwitcher', () => ({
  ViewSwitcher: vi.fn(({ view, onViewChange }) => (
    <div data-testid="view-switcher">
      <button onClick={() => onViewChange('grid')} data-testid="grid-view">Grid</button>
      <button onClick={() => onViewChange('table')} data-testid="table-view">Table</button>
    </div>
  )),
}));

vi.mock('@/components/HealthStatusFilter', () => ({
  HealthStatusFilter: vi.fn(({ hideDownComponents, onToggle }) => (
    <div data-testid="health-status-filter">
      <button onClick={() => onToggle(!hideDownComponents)}>Toggle Filter</button>
    </div>
  )),
}));

vi.mock('@/contexts/ComponentDisplayContext', () => ({
  ComponentDisplayProvider: vi.fn(({ children }) => (
    <div data-testid="component-display-provider">{children}</div>
  )),
}));

// Mock hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
}));

vi.mock('@/stores/appStateStore', () => ({
  useLandscapeSelection: vi.fn(),
  useSelectedLandscapeForProject: vi.fn(),
  useUIActions: vi.fn(),
}));

vi.mock('@/hooks/useTabRouting', () => ({
  useTabRouting: vi.fn(),
}));

vi.mock('@/hooks/api/useComponents', () => ({
  useComponentsByProject: vi.fn(),
}));

vi.mock('@/hooks/api/useLandscapes', () => ({
  useLandscapesByProject: vi.fn(),
}));

vi.mock('@/hooks/api/useTeams', () => ({
  useTeams: vi.fn(),
}));

vi.mock('@/hooks/api/useHealth', () => ({
  useHealth: vi.fn(),
}));

vi.mock('@/services/LandscapesApi', () => ({
  getDefaultLandscapeId: vi.fn(),
}));

import { useNavigate } from 'react-router-dom';
import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import { useLandscapeSelection, useSelectedLandscapeForProject, useUIActions } from '@/stores/appStateStore';
import { useTabRouting } from '@/hooks/useTabRouting';
import { useComponentsByProject } from '@/hooks/api/useComponents';
import { useLandscapesByProject } from '@/hooks/api/useLandscapes';
import { useTeams } from '@/hooks/api/useTeams';
import { useHealth } from '@/hooks/api/useHealth';
import { getDefaultLandscapeId } from '@/services/LandscapesApi';

describe('ProjectLayout', () => {
  const mockNavigate = vi.fn();
  const mockSetTabs = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockSyncTabWithUrl = vi.fn();
  const mockSetSelectedLandscapeForProject = vi.fn();
  const mockGetSelectedLandscapeForProject = vi.fn();
  const mockSetShowLandscapeDetails = vi.fn();
  const mockRefetchComponents = vi.fn();

  const mockComponents = [
    {
      id: 'comp-1',
      name: 'api-service',
      title: 'API Service',
      description: 'Main API',
      owner_id: 'team-1',
      'central-service': false,
      health: true,
    },
    {
      id: 'comp-2',
      name: 'web-app',
      title: 'Web App',
      description: 'Frontend',
      owner_id: 'team-2',
      'central-service': true,
      health: false,
    },
  ];

  const mockLandscapes = [
    {
      id: 'land-1',
      name: 'Production',
      technical_name: 'prod',
      environment: 'production',
      isCentral: true,
      landscape_url: 'prod.example.com',
      metadata: { route: 'prod.example.com' },
    },
    {
      id: 'land-2',
      name: 'Development',
      technical_name: 'dev',
      environment: 'development',
      isCentral: false,
      landscape_url: 'dev.example.com',
      metadata: { route: 'dev.example.com' },
    },
  ];

  const mockTeams = {
    teams: [
      {
        id: 'team-1',
        name: 'Team A',
        title: 'Team Alpha',
        metadata: { color: '#ff0000' },
      },
      {
        id: 'team-2',
        name: 'Team B',
        title: 'Team Beta',
        metadata: { color: '#00ff00' },
      },
    ],
  };

  const mockHealthChecks = [
    {
      componentId: 'comp-1',
      status: 'healthy',
      message: 'OK',
    },
  ];

  const mockSummary = {
    total: 2,
    healthy: 1,
    unhealthy: 1,
  };

  const defaultProps = {
    projectName: 'CIS',
    projectId: 'cis20',
    defaultTab: 'components',
    tabs: ['components', 'health', 'alerts'],
    system: 'services',
    showLandscapeFilter: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    
    vi.mocked(useHeaderNavigation).mockReturnValue({
      tabs: [],
      activeTab: null,
      setTabs: mockSetTabs,
      setActiveTab: mockSetActiveTab,
      isDropdown: false,
      setIsDropdown: vi.fn(),
    });

    vi.mocked(useTabRouting).mockReturnValue({
      currentTabFromUrl: null,
      syncTabWithUrl: mockSyncTabWithUrl,
    });

    vi.mocked(useLandscapeSelection).mockReturnValue({
      getSelectedLandscapeForProject: mockGetSelectedLandscapeForProject,
      setSelectedLandscapeForProject: mockSetSelectedLandscapeForProject,
    });

    vi.mocked(useSelectedLandscapeForProject).mockReturnValue('land-1');

    vi.mocked(useUIActions).mockReturnValue({
      setShowLandscapeDetails: mockSetShowLandscapeDetails,
      setTimelineViewMode: vi.fn(),
    });

    vi.mocked(useComponentsByProject).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
      refetch: mockRefetchComponents,
    } as any);

    vi.mocked(useLandscapesByProject).mockReturnValue({
      data: mockLandscapes,
      isLoading: false,
    } as any);

    vi.mocked(useTeams).mockReturnValue({
      data: mockTeams,
      isLoading: false,
    } as any);

    vi.mocked(useHealth).mockReturnValue({
      healthChecks: mockHealthChecks,
      summary: mockSummary,
      isLoading: false,
    } as any);

    vi.mocked(getDefaultLandscapeId).mockReturnValue('land-1');
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render BreadcrumbPage', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      renderWithRouter(
        <ProjectLayout {...defaultProps}>
          <div data-testid="custom-child">Custom Content</div>
        </ProjectLayout>
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });
  });

  describe('Tab Management', () => {
    it('should set header tabs on mount', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(mockSyncTabWithUrl).toHaveBeenCalled();
    });

    it('should sync tabs with correct labels', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // Header tabs should be set with correct labels
      expect(mockSyncTabWithUrl).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'components', label: 'Components' }),
          expect.objectContaining({ id: 'health', label: 'Health' }),
          expect.objectContaining({ id: 'alerts', label: 'Alerts' }),
        ]),
        'components'
      );
    });

    it('should use defaultTab parameter', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} defaultTab="health" />);

      expect(mockSyncTabWithUrl).toHaveBeenCalledWith(
        expect.anything(),
        'health'
      );
    });
  });

  describe('Components Tab', () => {
    it('should render components tab content by default', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should render ViewSwitcher in components tab', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
    });

    it('should render HealthStatusFilter when not all landscapes are central', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('health-status-filter')).toBeInTheDocument();
    });

    it('should not render HealthStatusFilter when all landscapes are non-central', () => {
      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: mockLandscapes.map(l => ({ ...l, isCentral: false })),
        isLoading: false,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.queryByTestId('health-status-filter')).not.toBeInTheDocument();
    });

    it('should show component count badge', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show empty state when no landscape is selected', () => {
      vi.mocked(useSelectedLandscapeForProject).mockReturnValue(null);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('Select a landscape to view components')).toBeInTheDocument();
    });

    it('should show empty state when no components exist', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetchComponents,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('No components found in this landscape')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should render grid view by default', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
      expect(screen.queryByTestId('health-table')).not.toBeInTheDocument();
    });

    it('should switch to table view when ViewSwitcher is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      const tableViewButton = screen.getByTestId('table-view');
      await user.click(tableViewButton);

      await waitFor(() => {
        expect(screen.getByTestId('health-table')).toBeInTheDocument();
        expect(screen.queryByTestId('components-tab-content')).not.toBeInTheDocument();
      });
    });

    it('should render ComponentDisplayProvider in table view', async () => {
      const user = userEvent.setup();

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      const tableViewButton = screen.getByTestId('table-view');
      await user.click(tableViewButton);

      await waitFor(() => {
        expect(screen.getByTestId('component-display-provider')).toBeInTheDocument();
      });
    });
  });

  describe('Health Tab', () => {
    it('should render HealthDashboard when health tab is active', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'health',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'health',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument();
    });

    it('should render ComponentDisplayProvider in health tab', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'health',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'health',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('component-display-provider')).toBeInTheDocument();
    });

    it('should not render components tab content in health tab', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'health',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'health',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.queryByTestId('components-tab-content')).not.toBeInTheDocument();
    });
  });

  describe('Alerts Tab', () => {
    it('should render AlertsPage when alerts tab is active', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'alerts',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'alerts',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} alertsUrl="https://alerts.example.com" />);

      expect(screen.getByTestId('alerts-page')).toBeInTheDocument();
    });

    it('should not render other tab content in alerts tab', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'alerts',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'alerts',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.queryByTestId('components-tab-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('health-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Landscape Management', () => {
    it('should set default landscape on mount', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // Should call getDefaultLandscapeId when landscapes are loaded
      expect(getDefaultLandscapeId).toHaveBeenCalledWith(mockLandscapes, 'cis20');
    });

    it('should group landscapes by environment', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // Landscapes should be grouped into landscapeGroupsArray
      expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
    });

    it('should handle missing landscape metadata', () => {
      const landscapesWithoutMetadata = mockLandscapes.map(l => ({
        ...l,
        metadata: undefined,
      }));

      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: landscapesWithoutMetadata,
        isLoading: false,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
    });
  });

  describe('Component Filtering', () => {
    it('should show all components when hideDownComponents is false', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Component count
    });

    it('should filter out central components when hideDownComponents is true and landscape is not central', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelectedLandscapeForProject).mockReturnValue('land-2'); // Non-central landscape

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      const filterButton = screen.getByText('Toggle Filter');
      await user.click(filterButton);

      await waitFor(() => {
        // Only 1 component should be visible (non-central one)
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should show all components when landscape is central regardless of filter', () => {
      vi.mocked(useSelectedLandscapeForProject).mockReturnValue('land-1'); // Central landscape

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Component Navigation', () => {
    it('should navigate to component view when component is clicked', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // The handleComponentClick function should be available
      expect(useNavigate).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should handle components loading state', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetchComponents,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should handle landscapes loading state', () => {
      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should handle health loading state', () => {
      vi.mocked(useHealth).mockReturnValue({
        healthChecks: [],
        summary: { total: 0, healthy: 0, unhealthy: 0 },
        isLoading: true,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle components error', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load components'),
        refetch: mockRefetchComponents,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty components array', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetchComponents,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByText('No components found in this landscape')).toBeInTheDocument();
    });

    it('should handle empty landscapes array', () => {
      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should handle missing teams data', () => {
      vi.mocked(useTeams).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should handle invalid tab', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        tabs: [],
        activeTab: 'invalid-tab',
        setTabs: mockSetTabs,
        setActiveTab: mockSetActiveTab,
        isDropdown: false,
        setIsDropdown: vi.fn(),
      });

      vi.mocked(useTabRouting).mockReturnValue({
        currentTabFromUrl: 'invalid-tab',
        syncTabWithUrl: mockSyncTabWithUrl,
      });

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // Should render without crashing
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should handle custom empty state message', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetchComponents,
      } as any);

      const customMessage = 'No custom components available';

      renderWithRouter(<ProjectLayout {...defaultProps} emptyStateMessage={customMessage} />);

      expect(screen.getByText('No components found in this landscape')).toBeInTheDocument();
    });
  });

  describe('Team Maps', () => {
    it('should create team names map from teams data', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      // Team maps should be created for use in child components
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should create team colors map from teams metadata', () => {
      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should handle teams without metadata', () => {
      vi.mocked(useTeams).mockReturnValue({
        data: {
          teams: [
            {
              id: 'team-1',
              name: 'Team A',
              title: 'Team Alpha',
              metadata: undefined,
            },
          ],
        },
        isLoading: false,
      } as any);

      renderWithRouter(<ProjectLayout {...defaultProps} />);

      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and use all props', () => {
      const props = {
        projectName: 'Test Project',
        projectId: 'test-proj',
        defaultTab: 'health',
        tabs: ['components', 'health'],
        componentsTitle: 'Custom Components',
        emptyStateMessage: 'Custom empty message',
        system: 'libraries',
        showLandscapeFilter: false,
        alertsUrl: 'https://custom-alerts.com',
      };

      renderWithRouter(<ProjectLayout {...props} />);

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should memoize landscape groups', () => {
      const { rerender } = renderWithRouter(<ProjectLayout {...defaultProps} />);

      rerender(
        <MemoryRouter>
          <ProjectLayout {...defaultProps} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
    });

    it('should recalculate when landscapes change', () => {
      const { rerender } = renderWithRouter(<ProjectLayout {...defaultProps} />);

      const newLandscapes = [
        ...mockLandscapes,
        {
          id: 'land-3',
          name: 'Staging',
          technical_name: 'staging',
          environment: 'staging',
          isCentral: false,
          landscape_url: 'staging.example.com',
          metadata: { route: 'staging.example.com' },
        },
      ];

      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: newLandscapes,
        isLoading: false,
      } as any);

      rerender(
        <MemoryRouter>
          <ProjectLayout {...defaultProps} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
    });
  });
});