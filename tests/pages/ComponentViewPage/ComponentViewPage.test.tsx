import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComponentViewPage } from '../../../src/pages/ComponentViewPage';
import { useComponentsByProject } from '../../../src/hooks/api/useComponents';
import { useLandscapesByProject } from '../../../src/hooks/api/useLandscapes';
import { usePortalState } from '../../../src/contexts/hooks';
import { useComponentHealth } from '../../../src/hooks/api/useComponentHealth';
import { useSonarMeasures } from '../../../src/hooks/api/useSonarMeasures';
import { useSwaggerUI } from '../../../src/hooks/api/useSwaggerUI';
import type { Component } from '../../../src/types/api';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';


// Mock all hooks
vi.mock('../../../src/hooks/api/useComponents');
vi.mock('../../../src/hooks/api/useLandscapes');
vi.mock('../../../src/contexts/hooks');
vi.mock('../../../src/contexts/HeaderNavigationContext');
vi.mock('../../../src/hooks/api/useComponentHealth');
vi.mock('../../../src/services/LandscapesApi', () => ({
  getDefaultLandscapeId: vi.fn(),
}));
vi.mock('../../../src/hooks/api/useSonarMeasures');
vi.mock('../../../src/hooks/api/useSwaggerUI');

// Mock child components
vi.mock('../../../src/components/ComponentViewApi', () => ({
  ComponentViewApi: (props: any) => (
    <div data-testid="component-view-api">
      <div data-testid="api-loading">{props.isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="api-error">{props.error ? 'error' : 'no-error'}</div>
      {props.swaggerData && <div data-testid="swagger-data">Swagger Data Present</div>}
    </div>
  ),
}));

vi.mock('../../../src/components/ComponentViewOverview', () => ({
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

vi.mock('../../../src/components/LandscapeFilter', () => ({
  LandscapeFilter: (props: any) => (
    <div data-testid="landscape-filter">
      <div data-testid="selected-landscape-filter">{props.selectedLandscape || 'no-landscape'}</div>
    </div>
  ),
}));

vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

const mockComponent: Component = {
  id: 'comp-1',
  name: 'accounts-service',
  title: 'Accounts Service',
  description: 'Service for managing accounts',
      owner_ids: ['team-1'],
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
  healthy: true,
  details: {
    components: {
      db: {
        status: 'UP',
        details: { database: 'postgresql' },
      },
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
    const { useHeaderNavigation } = await import('../../../src/contexts/HeaderNavigationContext');
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

    vi.mocked(useComponentHealth).mockReturnValue({
      data: {
        status: 'success',
        data: mockHealthResponse,
        responseTime: 150,
      },
      isLoading: false,
      isError: false,
      error: null,
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

  it('should initialize with overview tab and fetch component data by name from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // ComponentViewPage should render the overview component by default
    expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
    // Component should be found and rendered in the overview
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

  it('should display health data including response time and status code', async () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('response-time')).toHaveTextContent('150');
      expect(screen.getByTestId('status-code')).toHaveTextContent('200');
    });
  });


  it('should handle health fetch error', async () => {
    vi.mocked(useComponentHealth).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: 'Failed to fetch health data' },
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('health-error')).toHaveTextContent('Failed to fetch health data');
    });
  });

  it('should show health loading state', () => {
    vi.mocked(useComponentHealth).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('health-loading')).toHaveTextContent('loading');
  });


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

    expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
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

    // Should show component not found message instead of component view
    await waitFor(() => {
      expect(screen.getByText('Component not found')).toBeInTheDocument();
      expect(screen.queryByTestId('component-view-overview')).not.toBeInTheDocument();
    });
  });

  it('should not fetch health when landscape is missing', async () => {
    vi.mocked(usePortalState).mockReturnValue({
      selectedLandscape: null,
      getSelectedLandscapeForProject: vi.fn().mockReturnValue(null),
      setSelectedLandscapeForProject: vi.fn(),
    } as any);

    vi.mocked(useComponentHealth).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Component should still render but without health data
    expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
    expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('no-landscape');
  });

  it('should determine project name from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/unified-services/component/test-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useComponentsByProject).toHaveBeenCalledWith('unified-services');
  });


  it('should handle CIS special route /cis/component/:componentId', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <Routes>
          <Route path="/cis/component/:componentId" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(useComponentsByProject).toHaveBeenCalledWith('cis20');
  });



  it('should fetch health when component and landscape are both present', async () => {
    render(
      <MemoryRouter initialEntries={['/cis20/component/accounts-service']}>
        <Routes>
          <Route path="/:projectName/component/:componentName" element={<ComponentViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // useComponentHealth hook should be called with the correct parameters
    expect(useComponentHealth).toHaveBeenCalledWith(
      mockComponent.id,
      'eu10-canary',
      false, // health property from component (component?.health === true)
      expect.objectContaining({
        enabled: true
      })
    );
  });

  it('should load Swagger data when API tab is active', async () => {
    // Mock the header navigation to return 'api' as active tab
    const { useHeaderNavigation } = await import('../../../src/contexts/HeaderNavigationContext');
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
      expect(screen.getByTestId('component-view-api')).toBeInTheDocument();
      expect(screen.getByTestId('swagger-data')).toBeInTheDocument();
    });
  });

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

  it('should work with cloud-automation project', () => {
    const caComponent: Component = {
      ...mockComponent,
      name: 'terraform-provider',
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

      vi.mocked(useComponentHealth).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
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
