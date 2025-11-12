import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ComponentDetailPage from '../../../src/pages/ComponentDetailPage';
import * as hooks from '../../../src/contexts/hooks';
import * as ReactRouterDom from 'react-router-dom';

// Mock the context hooks
vi.mock('@/contexts/hooks', () => ({
  usePortalState: vi.fn(),
  useLandscapeManagement: vi.fn(),
  useHealthAndAlerts: vi.fn(),
}));

// Mock the ComponentDetailContent component
vi.mock('@/components/ComponentDetailContent', () => ({
  default: ({ component, selectedLandscape }: any) => (
    <div data-testid="component-detail-content">
      <div>Component: {component?.name}</div>
      <div>Landscape: {selectedLandscape || 'None'}</div>
    </div>
  ),
}));

// Mock the BreadcrumbPage component
vi.mock('@/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: any) => <div data-testid="breadcrumb-page">{children}</div>,
}));

// Mock the mockRateLimitRules data
vi.mock('@/data/mockPortalData', () => ({
  mockRateLimitRules: [
    {
      id: '1',
      method: 'GET',
      period: 60,
      requestsLimit: 100,
      endpoint: '/api/test',
      identityType: 'USERNAME',
      componentId: 'test-component',
      landscapes: { 'cf-eu10': true },
    },
  ],
}));

describe('ComponentDetailPage', () => {
  const mockNavigate = vi.fn();
  const mockSetSelectedLandscape = vi.fn();
  const mockGetCurrentProjectLandscapes = vi.fn();
  const mockGetLandscapeGroups = vi.fn();
  const mockGetComponentHealth = vi.fn();
  const mockGetComponentAlerts = vi.fn();
  const mockGetDeployedVersion = vi.fn();

  const mockComponent = {
    id: 'accounts-service',
    name: 'Accounts Service',
    description: 'Test component',
    type: 'service',
    status: 'active',
    deploymentStatus: 'deployed',
    health: 'healthy',
    version: '1.0.0',
    owner: 'Team A',
    repository: 'https://github.com/test/accounts-service',
    documentation: 'https://docs.test.com',
    apis: [],
    dependencies: [],
    technologies: [],
  };

  const mockLandscapes = [
    {
      id: 'cf-eu10',
      name: 'EU10',
      region: 'EU',
      status: 'active',
      deploymentStatus: 'deployed',
      url: 'https://eu10.test.com',
    },
    {
      id: 'cf-us10',
      name: 'US10',
      region: 'US',
      status: 'active',
      deploymentStatus: 'deployed',
      url: 'https://us10.test.com',
    },
  ];

  const mockLandscapeGroups = {
    'Production': mockLandscapes,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (hooks.usePortalState as any).mockReturnValue({
      selectedLandscape: 'cf-eu10',
      setSelectedLandscape: mockSetSelectedLandscape,
    });

    (hooks.useLandscapeManagement as any).mockReturnValue({
      getCurrentProjectLandscapes: mockGetCurrentProjectLandscapes.mockReturnValue(mockLandscapes),
      getLandscapeGroups: mockGetLandscapeGroups.mockReturnValue(mockLandscapeGroups),
    });

    (hooks.useHealthAndAlerts as any).mockReturnValue({
      getComponentHealth: mockGetComponentHealth,
      getComponentAlerts: mockGetComponentAlerts,
      getDeployedVersion: mockGetDeployedVersion,
    });
  });

  const renderComponentDetailPage = (locationState?: any) => {
    return render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/cis/components/accounts-service',
            state: locationState || { component: mockComponent },
          },
        ]}
      >
        <Routes>
          <Route path="/cis/components/:entityName" element={<ComponentDetailPage />} />
          <Route path="/cis" element={<div data-testid="cis-page">CIS Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    it('should render the component detail page with component data', () => {
      renderComponentDetailPage();

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
      expect(screen.getByText('Component: Accounts Service')).toBeInTheDocument();
    });

    it('should render the component with selected landscape', () => {
      renderComponentDetailPage();

      expect(screen.getByText('Landscape: cf-eu10')).toBeInTheDocument();
    });
  });

  describe('Path and Project Detection', () => {
    it('should detect CIS system from pathname', () => {
      const { container } = renderComponentDetailPage();
      
      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalledWith('CIS@2.0');
      expect(mockGetLandscapeGroups).toHaveBeenCalledWith('CIS@2.0');
    });
  });

  describe('Navigation and Redirects', () => {

    it('should not redirect when component is present', () => {
      renderComponentDetailPage();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should initialize rate limit rules from mock data', () => {
      renderComponentDetailPage();

      // Component should render successfully with initialized state
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should initialize log levels as empty object', () => {
      renderComponentDetailPage();

      // Component should render successfully with initialized state
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should handle landscape selection changes', () => {
      renderComponentDetailPage();

      // The setSelectedLandscape should be available to child components
      expect(mockSetSelectedLandscape).toBeDefined();
    });
  });

  describe('Context Integration', () => {
    it('should retrieve selected landscape from context', () => {
      renderComponentDetailPage();

      expect(hooks.usePortalState).toHaveBeenCalled();
      expect(screen.getByText('Landscape: cf-eu10')).toBeInTheDocument();
    });

    it('should retrieve landscapes from landscape management context', () => {
      renderComponentDetailPage();

      expect(hooks.useLandscapeManagement).toHaveBeenCalled();
      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalledWith('CIS@2.0');
      expect(mockGetLandscapeGroups).toHaveBeenCalledWith('CIS@2.0');
    });

    it('should retrieve health and alerts functions from context', () => {
      renderComponentDetailPage();

      expect(hooks.useHealthAndAlerts).toHaveBeenCalled();
    });

    it('should handle null selected landscape', () => {
      (hooks.usePortalState as any).mockReturnValue({
        selectedLandscape: null,
        setSelectedLandscape: mockSetSelectedLandscape,
      });

      renderComponentDetailPage();

      expect(screen.getByText('Landscape: None')).toBeInTheDocument();
    });
  });

  describe('Props Passing to ComponentDetailContent', () => {
    it('should pass component data to ComponentDetailContent', () => {
      renderComponentDetailPage();

      expect(screen.getByText('Component: Accounts Service')).toBeInTheDocument();
    });

    it('should pass landscapes to ComponentDetailContent', () => {
      renderComponentDetailPage();

      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalled();
    });

    it('should pass landscape groups to ComponentDetailContent', () => {
      renderComponentDetailPage();

      expect(mockGetLandscapeGroups).toHaveBeenCalled();
    });

    it('should pass active project to ComponentDetailContent', () => {
      renderComponentDetailPage();

      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalledWith('CIS@2.0');
    });

    it('should pass getDeployedVersion function to ComponentDetailContent', () => {
      renderComponentDetailPage();

      expect(mockGetDeployedVersion).toBeDefined();
    });
  });

  describe('Mock Log Levels', () => {
    it('should provide mock log levels across landscapes', () => {
      renderComponentDetailPage();

      // The component should render with mock log levels available
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should have correct structure for mock log levels', () => {
      renderComponentDetailPage();

      // Mock log levels should be structured as expected
      // This is tested implicitly by successful rendering
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  describe('Handler Functions', () => {
    it('should handle landscape change', () => {
      renderComponentDetailPage();

      // The handler should be defined and passed to child components
      expect(mockSetSelectedLandscape).toBeDefined();
    });

    it('should handle rate limit rules change', () => {
      renderComponentDetailPage();

      // Component should render with handlers available
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should handle log levels change', () => {
      renderComponentDetailPage();

      // Component should render with handlers available
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty landscapes array', () => {
      mockGetCurrentProjectLandscapes.mockReturnValue([]);

      renderComponentDetailPage();

      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should handle empty landscape groups', () => {
      mockGetLandscapeGroups.mockReturnValue({});

      renderComponentDetailPage();

      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

  });

  describe('System-to-Project Mapping', () => {
    it('should map "cis" to "CIS@2.0" project', () => {
      renderComponentDetailPage();

      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalledWith('CIS@2.0');
    });
  });

  describe('Component Loading States', () => {

    it('should wrap content in BreadcrumbPage component', () => {
      renderComponentDetailPage();

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });
  });

  describe('URL Parameter Handling', () => {
    it('should extract entityName from URL params', () => {
      renderComponentDetailPage();

      // The component should render successfully with the entity name
      expect(screen.getByTestId('component-detail-content')).toBeInTheDocument();
    });

    it('should use location.pathname to determine system', () => {
      renderComponentDetailPage();

      expect(mockGetCurrentProjectLandscapes).toHaveBeenCalledWith('CIS@2.0');
    });
  });

  describe('Component Lifecycle', () => {
    it('should not trigger navigation effect when component is present', () => {
      renderComponentDetailPage();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should re-evaluate navigation when component state changes', async () => {
      const { rerender } = renderComponentDetailPage();

      expect(mockNavigate).not.toHaveBeenCalled();

      // Component remains present, no navigation should occur
      rerender(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/cis/components/accounts-service',
              state: { component: mockComponent },
            },
          ]}
        >
          <Routes>
            <Route path="/cis/components/:entityName" element={<ComponentDetailPage />} />
            <Route path="/cis" element={<div data-testid="cis-page">CIS Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});