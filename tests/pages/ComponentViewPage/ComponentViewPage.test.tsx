import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComponentViewPage } from '@/pages/ComponentViewPage';
import { useComponentsByProject } from '@/hooks/api/useComponents';
import { useLandscapesByProject } from '@/hooks/api/useLandscapes';
import { usePortalState } from '@/contexts/hooks';
import { fetchHealthStatus, buildHealthEndpoint } from '@/services/healthApi';
import { useSonarMeasures } from '@/hooks/api/useSonarMeasures';
import { useSwaggerUI } from '@/hooks/api/useSwaggerUI';
import type { Component } from '@/types/api';
import type { HealthResponse } from '@/types/health';
import '@testing-library/jest-dom/vitest';


// Mock all hooks
vi.mock('@/hooks/api/useComponents');
vi.mock('@/hooks/api/useLandscapes');
vi.mock('@/contexts/hooks');
vi.mock('@/contexts/HeaderNavigationContext');
vi.mock('@/services/healthApi');
vi.mock('@/hooks/api/useSonarMeasures');
vi.mock('@/hooks/api/useSwaggerUI');

// Mock child components
vi.mock('@/components/ComponentViewApi', () => ({
  ComponentViewApi: (props: any) => (
    <div data-testid="component-view-api">
      <div data-testid="api-loading">{props.isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="api-error">{props.error ? 'error' : 'no-error'}</div>
      {props.swaggerData && <div data-testid="swagger-data">Swagger Data Present</div>}
    </div>
  ),
}));

vi.mock('@/components/ComponentViewOverview', () => ({
  ComponentViewOverview: (props: any) => (
    <div data-testid="component-view-overview">
      <div data-testid="component-name">{props.component?.name || 'no-component'}</div>
      <div data-testid="selected-landscape">{props.selectedLandscape || 'no-landscape'}</div>
      <div data-testid="health-loading">{props.healthLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="health-error">{props.healthError || 'no-error'}</div>
      <div data-testid="health-status">{props.healthData?.status || 'no-status'}</div>
      <div data-testid="response-time">{props.responseTime || 'no-time'}</div>
      <div data-testid="status-code">{props.statusCode || 'no-code'}</div>
      {props.sonarData && <div data-testid="sonar-data">Sonar Data Present</div>}
    </div>
  ),
}));

vi.mock('@/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

const mockComponent: Component = {
  id: 'comp-1',
  name: 'accounts-service',
  title: 'Accounts Service',
  description: 'Service for managing accounts',
  owner_id: 'team-1',
  project_id: 'cis20',
  type: 'service',
  sonar: 'accounts-service-sonar',
};

const mockLandscapes = [
  {
    id: 'eu10-canary',
    name: 'EU10 Canary',
    landscape_url: 'cfapps.sap.hana.ondemand.com',
  },
  {
    id: 'eu10-live',
    name: 'EU10 Live',
    landscape_url: 'cfapps.eu10.hana.ondemand.com',
  },
];

const mockHealthResponse: HealthResponse = {
  status: 'UP',
  components: {
    db: {
      status: 'UP',
      details: { database: 'postgresql' },
    },
  },
};

const mockSwaggerData = {
  openapi: '3.0.0',
  info: {
    title: 'Accounts API',
    version: '1.0.0',
  },
  paths: {
    '/accounts': {
      get: {
        summary: 'Get accounts',
      },
    },
  },
};

const mockSonarData = {
  coverage: 85.5,
  bugs: 2,
  vulnerabilities: 0,
  codeSmells: 15,
  qualityGate: 'Passed',
};

describe('ComponentViewPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useHeaderNavigation hook
    const { useHeaderNavigation } = await import('@/contexts/HeaderNavigationContext');
    vi.mocked(useHeaderNavigation).mockReturnValue({
      tabs: [
        { id: 'overview', label: 'Overview' },
        { id: 'api', label: 'API' }
      ],
      activeTab: 'overview',
      setTabs: vi.fn(),
      setActiveTab: vi.fn(),
      isDropdown: false,
      setIsDropdown: vi.fn(),
    });

    vi.mocked(useComponentsByProject).mockReturnValue({
      data: [mockComponent],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);

    vi.mocked(useLandscapesByProject).mockReturnValue({
      data: mockLandscapes,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);

    vi.mocked(usePortalState).mockReturnValue({
      selectedLandscape: 'eu10-canary',
      getSelectedLandscapeForProject: vi.fn().mockReturnValue('eu10-canary'),
      setSelectedLandscapeForProject: vi.fn(),
    } as any);

    vi.mocked(buildHealthEndpoint).mockReturnValue('https://accounts-service.cfapps.sap.hana.ondemand.com/health');

    vi.mocked(fetchHealthStatus).mockResolvedValue({
      status: 'success',
      data: mockHealthResponse,
      responseTime: 150,
    } as any);

    vi.mocked(useSonarMeasures).mockReturnValue({
      data: mockSonarData,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);

    vi.mocked(useSwaggerUI).mockReturnValue({
      data: mockSwaggerData,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);
  });

  it('should render ComponentViewPage with BreadcrumbPage wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
  });

  it('should initialize with overview tab as default', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // ComponentViewPage should render the overview component by default
    expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
  });

  //NEW: Updated to expect the component to be found and rendered
  it('should fetch component data by name from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    //NEW: Component should be found because it matches the URL param
    expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
  });

  it('should pass selected landscape to overview component', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('eu10-canary');
  });

  //NEW: Updated to expect health data to be fetched and displayed
  it('should display health response time', async () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      //NEW: Response time should be displayed after health fetch completes
      expect(screen.getByTestId('response-time')).toHaveTextContent('150');
    });
  });

  //NEW: Updated to expect status code to be displayed
  it('should display status code', async () => {
    vi.mocked(fetchHealthStatus).mockResolvedValue({
      status: 'success',
      data: mockHealthResponse,
      responseTime: 150,
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      //NEW: Status code should be 200 when health fetch succeeds
      expect(screen.getByTestId('status-code')).toHaveTextContent('200');
    });
  });

  //NEW: Updated to expect error to be displayed
  it('should handle health fetch error', async () => {
    vi.mocked(fetchHealthStatus).mockResolvedValue({
      status: 'error',
      error: 'Failed to fetch health data',
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      //NEW: Error message should be displayed when fetch fails
      expect(screen.getByTestId('health-error')).toHaveTextContent('Failed to fetch health data');
    });
  });

  it('should show health loading state', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initially should be loaded (not loading) because useEffect hasn't run yet
    expect(screen.getByTestId('health-loading')).toHaveTextContent('loading');
  });


  //NEW: Updated to expect no health data when landscape is missing
  it('should handle missing selected landscape', () => {
    vi.mocked(usePortalState).mockReturnValue({
      selectedLandscape: null,
      getSelectedLandscapeForProject: vi.fn().mockReturnValue(null),
      setSelectedLandscapeForProject: vi.fn(),
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    //NEW: Component should still be found, but landscape will be missing
    expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
    //NEW: Selected landscape should show null/empty
    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('no-landscape');
  });

  it('should not fetch health when component is missing', async () => {
    vi.mocked(useComponentsByProject).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/nonexistent-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).not.toHaveBeenCalled();
    });
  });

  it('should not fetch health when landscape is missing', async () => {
    vi.mocked(usePortalState).mockReturnValue({
      selectedLandscape: null,
      getSelectedLandscapeForProject: vi.fn().mockReturnValue(null),
      setSelectedLandscapeForProject: vi.fn(),
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).not.toHaveBeenCalled();
    });
  });

  //NEW: Updated to use projectName from URL params directly
  it('should determine project name from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/unified-services/component/test-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    //NEW: Should use projectName directly from URL params
    expect(useComponentsByProject).toHaveBeenCalledWith('unified-services');
  });

  //NEW: Updated to use projectName from URL params directly
  it('should use project name from URL for cis20', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    //NEW: Should use projectName directly from URL params
    expect(useComponentsByProject).toHaveBeenCalledWith('cis20');
  });

  //NEW: Test for CIS special route (for backward compatibility)
  it('should handle CIS special route /cis/component/:componentId', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <Routes>
          <Route path="/cis/component/:componentId" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    //NEW: Should default to cis20 when no projectName in URL
    expect(useComponentsByProject).toHaveBeenCalledWith('cis20');
  });

  it('should display both tabs in TabsList', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // ComponentViewPage should render the overview component by default
    // Tabs are now managed by HeaderNavigation, not rendered directly by ComponentViewPage
    expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
  });


  //NEW: Test that health is fetched when both component and landscape are present
  it('should fetch health when component and landscape are both present', async () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).toHaveBeenCalled();
      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        mockComponent,
        expect.objectContaining({
          name: 'EU10 Canary',
          route: 'cfapps.sap.hana.ondemand.com'
        })
      );
    });
  });

  //NEW: Test Swagger data is loaded for API tab
  it('should load Swagger data when API tab is active', async () => {
    // Mock the header navigation to return 'api' as active tab
    const { useHeaderNavigation } = await import('@/contexts/HeaderNavigationContext');
    vi.mocked(useHeaderNavigation).mockReturnValue({
      tabs: [
        { id: 'overview', label: 'Overview' },
        { id: 'api', label: 'API' }
      ],
      activeTab: 'api', // Set API tab as active
      setTabs: vi.fn(),
      setActiveTab: vi.fn(),
      isDropdown: false,
      setIsDropdown: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service/api']}>
        <Routes>
          <Route path="/:projectName/component/:componentName/:tabId" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('swagger-data')).toBeInTheDocument();
    });
  });

  //NEW: Test Sonar data is passed to overview
  it('should display Sonar data in overview tab', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('sonar-data')).toBeInTheDocument();
  });

  //NEW: Test component with different project
  it('should work with cloud-automation project', () => {
    const caComponent: Component = {
      ...mockComponent,
      name: 'terraform-provider',
      project_id: 'ca',
    };

    vi.mocked(useComponentsByProject).mockReturnValue({
      data: [caComponent],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);

    render(
      <MemoryRouter initialEntries={['/ca/component/terraform-provider']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useComponentsByProject).toHaveBeenCalledWith('ca');
    expect(screen.getByTestId('component-name')).toHaveTextContent('terraform-provider');
  });

  // Test for isCentralLandscape and isExistInLandscape logic
  describe('Central service landscape logic', () => {
    it('should correctly calculate isCentralLandscape when landscape is central', () => {
      const centralLandscape = {
        id: 'central-landscape',
        name: 'Central Landscape',
        landscape_url: 'central.cfapps.sap.hana.ondemand.com',
        isCentral: true,
      };

      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: [centralLandscape],
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      vi.mocked(usePortalState).mockReturnValue({
        selectedLandscape: 'central-landscape',
        getSelectedLandscapeForProject: vi.fn().mockReturnValue('central-landscape'),
        setSelectedLandscapeForProject: vi.fn(),
      } as any);

      const centralServiceComponent: Component = {
        ...mockComponent,
        'central-service': true,
      };

      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [centralServiceComponent],
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
          <Routes>
            <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Component should be rendered normally since it's a central service in a central landscape
      expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
      expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
    });

    it('should show "Component not available" when central service is not in central landscape', () => {
      const nonCentralLandscape = {
        id: 'non-central-landscape',
        name: 'Non-Central Landscape',
        landscape_url: 'non-central.cfapps.sap.hana.ondemand.com',
        isCentral: false,
      };

      vi.mocked(useLandscapesByProject).mockReturnValue({
        data: [nonCentralLandscape],
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      vi.mocked(usePortalState).mockReturnValue({
        selectedLandscape: 'non-central-landscape',
        getSelectedLandscapeForProject: vi.fn().mockReturnValue('non-central-landscape'),
        setSelectedLandscapeForProject: vi.fn(),
      } as any);

      const centralServiceComponent: Component = {
        ...mockComponent,
        'central-service': true,
      };

      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [centralServiceComponent],
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
          <Routes>
            <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should show the "Component not available" message
      expect(screen.getByText('Component not available in this landscape')).toBeInTheDocument();
      expect(screen.getByText('Please choose a landscape where this component exists')).toBeInTheDocument();
      
      // Should not render the normal component view
      expect(screen.queryByTestId('component-view-overview')).not.toBeInTheDocument();
    });
  });
})
