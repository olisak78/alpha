import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ComponentViewPage } from '../../../src/pages/ComponentViewPage';
import type { Component } from '../../../src/types/api';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';


// Mock all hooks
vi.mock('../../../src/hooks/api/useComponents', () => ({
  useComponentsByProject: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useLandscapes', () => ({
  useLandscapesByProject: vi.fn(),
}));

vi.mock('../../../src/contexts/hooks', () => ({
  usePortalState: vi.fn(),
}));

vi.mock('../../../src/services/healthApi', () => ({
  fetchHealthStatus: vi.fn(),
  buildHealthEndpoint: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useSonarMeasures', () => ({
  useSonarMeasures: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useSwaggerUI', () => ({
  useSwaggerUI: vi.fn(),
}));

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
  beforeEach(() => {
    vi.clearAllMocks();

    const { useComponentsByProject } = require('../../../src/hooks/api/useComponents');
    const { useLandscapesByProject } = require('../../../src/hooks/api/useLandscapes');
    const { usePortalState } = require('../../../src/contexts/hooks');
    const { fetchHealthStatus, buildHealthEndpoint } = require('../../../src/services/healthApi');
    const { useSonarMeasures } = require('../../../src/hooks/api/useSonarMeasures');
    const { useSwaggerUI } = require('../../../src/hooks/api/useSwaggerUI');

    useComponentsByProject.mockReturnValue({
      data: [mockComponent],
    });

    useLandscapesByProject.mockReturnValue({
      data: mockLandscapes,
      isLoading: false,
    });

    usePortalState.mockReturnValue({
      selectedLandscape: 'eu10-canary',
    });

    buildHealthEndpoint.mockReturnValue('https://accounts-service.cfapps.sap.hana.ondemand.com/health');

    fetchHealthStatus.mockResolvedValue({
      status: 'success',
      data: mockHealthResponse,
      responseTime: 150,
    });

    useSonarMeasures.mockReturnValue({
      data: mockSonarData,
      isLoading: false,
    });

    useSwaggerUI.mockReturnValue({
      data: mockSwaggerData,
      isLoading: false,
      error: null,
    });
  });

  it('should render ComponentViewPage with BreadcrumbPage wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
  });

  it('should initialize with overview tab as default', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /overview/i, selected: true })).toBeInTheDocument();
    expect(screen.getByTestId('component-view-overview')).toBeInTheDocument();
  });

  it('should render API tab when clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    const apiTab = screen.getByRole('tab', { name: /api/i });
    fireEvent.click(apiTab);

    await waitFor(() => {
      expect(screen.getByTestId('component-view-api')).toBeInTheDocument();
    });
  });

  it('should fetch component data by name from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('component-name')).toHaveTextContent('accounts-service');
  });

  it('should pass selected landscape to overview component', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('eu10-canary');
  });

  it('should fetch health data on component mount', async () => {
    const { fetchHealthStatus } = require('@/services/healthApi');

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).toHaveBeenCalled();
      expect(screen.getByTestId('health-status')).toHaveTextContent('UP');
    });
  });

  it('should display health response time', async () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('response-time')).toHaveTextContent('150');
    });
  });

  it('should display status code', async () => {
    const { fetchHealthStatus } = require('../../../src/services/healthApi');
    fetchHealthStatus.mockResolvedValue({
      status: 'success',
      data: { ...mockHealthResponse, statusCode: 200 },
      responseTime: 150,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-code')).toHaveTextContent('200');
    });
  });

  it('should handle health fetch error', async () => {
    const { fetchHealthStatus } = require('../../../src/services/healthApi');
    fetchHealthStatus.mockResolvedValue({
      status: 'error',
      error: 'Failed to fetch health data',
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('health-error')).toHaveTextContent('Failed to fetch health data');
    });
  });

  it('should show health loading state', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    // Initially should be loading
    expect(screen.getByTestId('health-loading')).toHaveTextContent('loading');
  });

  it('should fetch Sonar measures for component', () => {
    const { useSonarMeasures } = require('../../../src/hooks/api/useSonarMeasures');

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(useSonarMeasures).toHaveBeenCalledWith('accounts-service-sonar', true);
    expect(screen.getByTestId('sonar-data')).toBeInTheDocument();
  });

  it('should not fetch Swagger data on overview tab', () => {
    const { useSwaggerUI } = require('../../../src/hooks/api/useSwaggerUI');
    useSwaggerUI.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(useSwaggerUI).toHaveBeenCalledWith(
      mockComponent,
      expect.any(Object),
      expect.objectContaining({
        enabled: false, // Should be disabled on overview tab
      })
    );
  });

  it('should fetch Swagger data when switching to API tab', async () => {
    const { useSwaggerUI } = require('@/hooks/api/useSwaggerUI');
    let enabledValue = false;

    useSwaggerUI.mockImplementation((component, landscape, options) => {
      enabledValue = options.enabled;
      return {
        data: enabledValue ? mockSwaggerData : null,
        isLoading: false,
        error: null,
      };
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    const apiTab = screen.getByRole('tab', { name: /api/i });
    fireEvent.click(apiTab);

    await waitFor(() => {
      expect(screen.getByTestId('component-view-api')).toBeInTheDocument();
    });
  });

  it('should sync tab with URL parameter', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service/api']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /api/i, selected: true })).toBeInTheDocument();
  });

  it('should handle component not found', () => {
    const { useComponentsByProject } = require('../../../src/hooks/api/useComponents');
    useComponentsByProject.mockReturnValue({
      data: [],
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/nonexistent-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('component-name')).toHaveTextContent('no-component');
  });

  it('should handle missing selected landscape', () => {
    const { usePortalState } = require('../../../src/contexts/hooks');
    usePortalState.mockReturnValue({
      selectedLandscape: null,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('selected-landscape')).toHaveTextContent('no-landscape');
  });

  it('should not fetch health when component is missing', async () => {
    const { useComponentsByProject } = require('../../../src/hooks/api/useComponents');
    const { fetchHealthStatus } = require('../../../src/services/healthApi');

    useComponentsByProject.mockReturnValue({
      data: [],
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/nonexistent-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).not.toHaveBeenCalled();
    });
  });

  it('should not fetch health when landscape is missing', async () => {
    const { usePortalState } = require('@/contexts/hooks');
    const { fetchHealthStatus } = require('@/services/healthApi');

    usePortalState.mockReturnValue({
      selectedLandscape: null,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).not.toHaveBeenCalled();
    });
  });

  it('should determine project name from system in URL', () => {
    const { useComponentsByProject } = require('../../../src/hooks/api/useComponents');

    render(
      <MemoryRouter initialEntries={['/unified-services/component/test-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(useComponentsByProject).toHaveBeenCalledWith('usrv');
  });

  it('should use CIS project for cis system', () => {
    const { useComponentsByProject } = require('@/hooks/api/useComponents');

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(useComponentsByProject).toHaveBeenCalledWith('cis20');
  });

  it('should build health endpoint with component and landscape data', async () => {
    const { buildHealthEndpoint } = require('../../../src/services/healthApi');

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        mockComponent,
        expect.objectContaining({
          name: 'EU10 Canary',
          route: 'cfapps.sap.hana.ondemand.com',
        })
      );
    });
  });

  it('should use landscape_url for health endpoint route', async () => {
    const { buildHealthEndpoint } = require('../../../src/services/healthApi');

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          route: 'cfapps.sap.hana.ondemand.com',
        })
      );
    });
  });

  it('should pass Swagger loading state to API component', async () => {
    const { useSwaggerUI } = require('../../../src/hooks/api/useSwaggerUI');
    useSwaggerUI.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service/api']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('api-loading')).toHaveTextContent('loading');
    });
  });

  it('should pass Swagger error to API component', async () => {
    const { useSwaggerUI } = require('@/hooks/api/useSwaggerUI');
    useSwaggerUI.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load API docs'),
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service/api']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('api-error')).toHaveTextContent('error');
    });
  });

  it('should refetch health data when landscape changes', async () => {
    const { usePortalState } = require('../../../src/contexts/hooks');
    const { fetchHealthStatus } = require('../../../src/services/healthApi');

    const { rerender } = render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).toHaveBeenCalledTimes(1);
    });

    // Change landscape
    usePortalState.mockReturnValue({
      selectedLandscape: 'eu10-live',
    });

    rerender(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchHealthStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('should display both tabs in TabsList', () => {
    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /api/i })).toBeInTheDocument();
  });

  it('should create landscape config with correct route priority', async () => {
    const { useLandscapesByProject } = require('../../../src/hooks/api/useLandscapes');
    useLandscapesByProject.mockReturnValue({
      data: [
        {
          id: 'eu10-canary',
          name: 'EU10 Canary',
          landscape_url: 'landscape-url.com',
          domain: 'domain.com',
        },
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/cis/component/accounts-service']}>
        <ComponentViewPage />
      </MemoryRouter>
    );

    // Should prioritize landscape_url over domain
    await waitFor(() => {
      const { buildHealthEndpoint } = require('../../../src/services/healthApi');
      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          route: expect.stringContaining('landscape-url.com'),
        })
      );
    });
  });
});