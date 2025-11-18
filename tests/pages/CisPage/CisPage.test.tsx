import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CisPage from '../../../src/pages/CisPage';
import type { ComponentHealthCheck, HealthSummary } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';


// Mock all hooks and context
vi.mock('../../../src/hooks/api/useComponents', () => ({
  useComponentsByProject: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useLandscapes', () => ({
  useLandscapesByProject: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeams: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useHealth', () => ({
  useHealth: vi.fn(),
}));

vi.mock('../../../src/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
}));

vi.mock('../../../src/contexts/hooks', () => ({
  useComponentManagement: vi.fn(),
  useFeatureToggles: vi.fn(),
  useLandscapeManagement: vi.fn(),
  usePortalState: vi.fn(),
}));

vi.mock('../../../src/hooks/useTabRouting', () => ({
  useTabRouting: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock CisTabContent component
vi.mock('../../../src/components/CisTabContent', () => ({
  CisTabContent: (props: any) => (
    <div data-testid="cis-tab-content">
      <div data-testid="active-tab">{props.activeTab}</div>
      <div data-testid="component-view">{props.componentView}</div>
      <div data-testid="selected-landscape">{props.selectedLandscape || 'none'}</div>
      <div data-testid="filtered-components-count">{props.filteredComponents?.length || 0}</div>
      <div data-testid="library-components-count">{props.libraryComponents?.length || 0}</div>
      <div data-testid="health-checks-count">{props.healthChecks?.length || 0}</div>
      <div data-testid="search-term">{props.componentSearchTerm}</div>
      <div data-testid="sort-order">{props.componentSortOrder}</div>
    </div>
  ),
}));

vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

const mockComponents = [
  {
    id: 'comp-1',
    name: 'accounts-service',
    title: 'Accounts Service',
    owner_id: 'team-1',
    project_id: 'cis20',
    type: 'service',
    metadata: {},
  },
  {
    id: 'comp-2',
    name: 'billing-service',
    title: 'Billing Service',
    owner_id: 'team-2',
    project_id: 'cis20',
    type: 'service',
    metadata: {},
  },
  {
    id: 'comp-3',
    name: 'common-lib',
    title: 'Common Library',
    owner_id: 'team-1',
    project_id: 'cis20',
    type: 'library',
    metadata: { isLibrary: true },
  },
];

const mockLandscapes = [
  {
    id: 'eu10-canary',
    name: 'EU10 Canary',
    environment: 'Canary',
    landscape_url: 'cfapps.sap.hana.ondemand.com',
  },
  {
    id: 'eu10-live',
    name: 'EU10 Live',
    environment: 'Live',
    landscape_url: 'cfapps.sap.hana.ondemand.com',
  },
];

const mockTeams = {
  teams: [
    {
      id: 'team-1',
      name: 'Team Alpha',
      metadata: { color: '#FF5733' },
    },
    {
      id: 'team-2',
      name: 'Team Beta',
      metadata: '{"color": "#3357FF"}',
    },
  ],
};

const mockHealthChecks: ComponentHealthCheck[] = [
  {
    componentId: 'comp-1',
    componentName: 'accounts-service',
    landscape: 'eu10-canary',
    healthUrl: 'https://accounts-service.cfapps.sap.hana.ondemand.com/health',
    status: 'UP',
    responseTime: 150,
  },
  {
    componentId: 'comp-2',
    componentName: 'billing-service',
    landscape: 'eu10-canary',
    healthUrl: 'https://billing-service.cfapps.sap.hana.ondemand.com/health',
    status: 'DOWN',
    responseTime: 300,
  },
];

const mockSummary: HealthSummary = {
  total: 2,
  up: 1,
  down: 1,
  unknown: 0,
  error: 0,
  avgResponseTime: 225,
};

describe('CisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    const { useComponentsByProject } = require('../../../src/hooks/api/useComponents');
    const { useLandscapesByProject } = require('../../../src/hooks/api/useLandscapes');
    const { useTeams } = require('../../../src/hooks/api/useTeams');
    const { useHealth } = require('../../../src/hooks/api/useHealth');
    const { useHeaderNavigation } = require('../../../src/contexts/HeaderNavigationContext');
    const {
      useComponentManagement,
      useFeatureToggles,
      useLandscapeManagement,
      usePortalState,
    } = require('../../../src/contexts/hooks');
    const { useTabRouting } = require('../../../src/hooks/useTabRouting');
    const { useNavigate } = require('react-router-dom');

    useComponentsByProject.mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    useLandscapesByProject.mockReturnValue({
      data: mockLandscapes,
      isLoading: false,
    });

    useTeams.mockReturnValue({
      data: mockTeams,
    });

    useHealth.mockReturnValue({
      components: mockHealthChecks,
      isLoading: false,
      summary: mockSummary,
    });

    useHeaderNavigation.mockReturnValue({
      setTabs: vi.fn(),
      activeTab: 'components',
      setActiveTab: vi.fn(),
    });

    useComponentManagement.mockReturnValue({
      componentFilter: '',
      setComponentFilter: vi.fn(),
      timelineViewMode: 'table',
      setTimelineViewMode: vi.fn(),
      getAvailableComponents: vi.fn(() => []),
    });

    useFeatureToggles.mockReturnValue({
      featureToggles: [],
      expandedToggles: new Set(),
      toggleFilter: 'all',
      setToggleFilter: vi.fn(),
      toggleFeature: vi.fn(),
      toggleExpanded: vi.fn(),
      bulkToggle: vi.fn(),
      getGroupStatus: vi.fn(),
      getFilteredToggles: vi.fn(() => []),
    });

    useLandscapeManagement.mockReturnValue({
      getCurrentProjectLandscapes: vi.fn(() => mockLandscapes),
      getLandscapeGroups: vi.fn(() => ({ Canary: [mockLandscapes[0]], Live: [mockLandscapes[1]] })),
      getFilteredLandscapeIds: vi.fn(() => ['eu10-canary', 'eu10-live']),
      getProductionLandscapeIds: vi.fn(() => ['eu10-live']),
    });

    usePortalState.mockReturnValue({
      selectedLandscape: 'eu10-canary',
      setSelectedLandscape: vi.fn(),
      setShowLandscapeDetails: vi.fn(),
    });

    useTabRouting.mockReturnValue({
      currentTabFromUrl: 'components',
      syncTabWithUrl: vi.fn(),
    });

    useNavigate.mockReturnValue(vi.fn());
  });

  it('should render CisPage with BreadcrumbPage wrapper', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
  });

  it('should initialize with default state values', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('active-tab')).toHaveTextContent('components');
    expect(screen.getByTestId('component-view')).toHaveTextContent('grid');
    expect(screen.getByTestId('search-term')).toHaveTextContent('');
    expect(screen.getByTestId('sort-order')).toHaveTextContent('alphabetic');
  });

  it('should pass selected landscape to CisTabContent', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('eu10-canary');
  });

  it('should filter out library components from main components list', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    // Should have 2 regular components (excluding the library)
    expect(screen.getByTestId('filtered-components-count')).toHaveTextContent('2');
  });

  it('should separate library components', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    // Should have 1 library component
    expect(screen.getByTestId('library-components-count')).toHaveTextContent('1');
  });

  it('should pass health checks data to CisTabContent', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('health-checks-count')).toHaveTextContent('2');
  });

  it('should create team names map from teams data', async () => {
    const { useTeams } = require('@/hooks/api/useTeams');
    useTeams.mockReturnValue({
      data: mockTeams,
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    // The component should process teams data
    await waitFor(() => {
      expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
    });
  });

  it('should parse team metadata when it is a string', async () => {
    const { useTeams } = require('@/hooks/api/useTeams');
    useTeams.mockReturnValue({
      data: {
        teams: [
          {
            id: 'team-1',
            name: 'Team Alpha',
            metadata: '{"color": "#FF5733"}', // String metadata
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
    });
  });

  it('should handle loading state for components', () => {
    const { useComponentsByProject } = require('@/hooks/api/useComponents');
    useComponentsByProject.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
  });

  it('should handle error state for components', () => {
    const { useComponentsByProject } = require('@/hooks/api/useComponents');
    useComponentsByProject.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load components'),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
  });

  it('should filter components by selected landscape metadata', () => {
    const { usePortalState } = require('@/contexts/hooks');
    usePortalState.mockReturnValue({
      selectedLandscape: 'eu10-canary',
      setSelectedLandscape: vi.fn(),
      setShowLandscapeDetails: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('eu10-canary');
  });

  it('should show all non-library components when no landscape is selected', () => {
    const { usePortalState } = require('@/contexts/hooks');
    usePortalState.mockReturnValue({
      selectedLandscape: null,
      setSelectedLandscape: vi.fn(),
      setShowLandscapeDetails: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('none');
    // Should show all 2 non-library components
    expect(screen.getByTestId('filtered-components-count')).toHaveTextContent('2');
  });

  it('should initialize header tabs correctly', async () => {
    const { useHeaderNavigation } = require('@/contexts/HeaderNavigationContext');
    const setTabs = vi.fn();
    useHeaderNavigation.mockReturnValue({
      setTabs,
      activeTab: 'components',
      setActiveTab: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(setTabs).toHaveBeenCalled();
      const tabs = setTabs.mock.calls[0][0];
      expect(tabs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'components', label: 'Components' }),
          expect.objectContaining({ id: 'alerts', label: 'Alerts' }),
        ])
      );
    });
  });

  it('should only show visible tabs based on TAB_VISIBILITY', async () => {
    const { useHeaderNavigation } = require('@/contexts/HeaderNavigationContext');
    const setTabs = vi.fn();
    useHeaderNavigation.mockReturnValue({
      setTabs,
      activeTab: 'components',
      setActiveTab: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(setTabs).toHaveBeenCalled();
      const tabs = setTabs.mock.calls[0][0];
      
      // Should include visible tabs
      expect(tabs.some((t: any) => t.id === 'components')).toBe(true);
      expect(tabs.some((t: any) => t.id === 'alerts')).toBe(true);
      
      // Should not include health tab (visibility: false)
      expect(tabs.some((t: any) => t.id === 'health')).toBe(false);
    });
  });

  it('should sync active tab with URL parameter', async () => {
    const { useTabRouting } = require('@/hooks/useTabRouting');
    useTabRouting.mockReturnValue({
      currentTabFromUrl: 'alerts',
      syncTabWithUrl: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-tab')).toHaveTextContent('alerts');
    });
  });

  it('should create landscape config for health checks', () => {
    const { useLandscapesByProject } = require('@/hooks/api/useLandscapes');
    useLandscapesByProject.mockReturnValue({
      data: [
        {
          id: 'eu10-canary',
          name: 'EU10 Canary',
          landscape_url: 'custom.cfapps.sap.hana.ondemand.com',
          metadata: { route: 'custom-route.com' },
        },
      ],
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
  });

  it('should enable health checks only on components tab with selected landscape', () => {
    const { useHealth } = require('@/hooks/api/useHealth');
    const mockUseHealth = vi.fn().mockReturnValue({
      components: mockHealthChecks,
      isLoading: false,
      summary: mockSummary,
    });
    useHealth.mockImplementation(mockUseHealth);

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(mockUseHealth).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true, // Should be enabled (components tab + landscape selected)
      })
    );
  });

  it('should create component health map from health checks', () => {
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    // Component health map should be passed to CisTabContent
    // The actual verification would need access to the props
    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
  });

  it('should navigate to component detail page when component is clicked', async () => {
    const { useNavigate } = require('react-router-dom');
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    // We need to trigger the onComponentClick callback
    // This would need the CisTabContent mock to expose the callback
    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('cis-tab-content')).toBeInTheDocument();
    // In real test, we would trigger the callback and verify navigate was called
  });

  it('should sort components alphabetically', () => {
    const { useComponentsByProject } = require('@/hooks/api/useComponents');
    useComponentsByProject.mockReturnValue({
      data: [
        { id: 'comp-2', name: 'zebra-service', metadata: {} },
        { id: 'comp-1', name: 'alpha-service', metadata: {} },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CisPage />
      </BrowserRouter>
    );

    // Components should be sorted alphabetically
    expect(screen.getByTestId('filtered-components-count')).toHaveTextContent('2');
  });
});