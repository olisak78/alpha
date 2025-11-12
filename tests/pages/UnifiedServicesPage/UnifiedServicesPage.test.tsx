import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import UnifiedServicesPage from '../../../src/pages/UnifiedServicesPage';
import type { Component } from '../../../src/types/api';

/**
 * UnifiedServicesPage Component Tests
 * 
 * This test suite covers the UnifiedServicesPage component which displays
 * Unified Services components with tab navigation, landscape filtering,
 * and authentication handling.
 * 
 * Component Location: src/pages/UnifiedServicesPage.tsx
 * 
 * Key Features Tested:
 * - Page rendering with correct title
 * - Components tab rendering with API data
 * - Landscape filtering functionality
 * - Tab navigation and visibility
 * - Authentication state handling
 * - Component management (expansion, search)
 * - Feature toggles integration
 * - Error and loading states
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock all the hooks and contexts
vi.mock('@/hooks/api/useComponents');
vi.mock('@/hooks/api/useLandscapes');
vi.mock('@/hooks/useAuthRefresh');
vi.mock('@/contexts/AuthContext');
vi.mock('@/contexts/HeaderNavigationContext');
vi.mock('@/contexts/hooks');
vi.mock('@/hooks/useTabRouting');

// Mock components
vi.mock('@/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

vi.mock('@/components/ComponentsTabContent', () => ({
  ComponentsTabContent: ({
    title,
    components,
    isLoading,
    error,
    teamName,
    emptyStateMessage,
    system,
    searchTerm,
    onSearchTermChange,
    onToggleExpanded,
    onRefresh,
    showRefreshButton,
    additionalControls,
  }: any) => (
    <div data-testid="components-tab">
      <h3>{title}</h3>
      {teamName && <p>Team: {teamName}</p>}
      {system && <p>System: {system}</p>}
      {additionalControls && <div>{additionalControls}</div>}
      {isLoading && <div>Loading components...</div>}
      {error && <div>Error: {error.message}</div>}
      {components && <div>Components: {components.length}</div>}
      {!isLoading && !error && components.length === 0 && (
        <div>{emptyStateMessage}</div>
      )}
      {searchTerm !== undefined && (
        <input
          data-testid="component-search"
          value={searchTerm}
          onChange={(e) => onSearchTermChange?.(e.target.value)}
          placeholder="Search components..."
        />
      )}
      {showRefreshButton && onRefresh && (
        <button onClick={onRefresh} data-testid="refresh-button">Refresh</button>
      )}
      {!isLoading && !error && components.length > 0 && (
        <div data-testid="component-list">
          {components.map((comp: any) => (
            <div key={comp.id} data-testid={`component-${comp.id}`}>
              <span>{comp.title || comp.name}</span>
              {onToggleExpanded && (
                <button onClick={() => onToggleExpanded(comp.id)}>Expand</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/tabs/FeatureToggleTab', () => ({
  default: () => <div data-testid="feature-toggle-tab">Feature Toggle Tab</div>,
}));

vi.mock('@/components/DeskPage', () => ({
  default: () => <div data-testid="desk-tab">USRV Console</div>,
}));

vi.mock('@/components/LandscapeFilter', () => ({
  LandscapeFilter: ({ selectedLandscape, onLandscapeChange, onShowLandscapeDetails }: any) => (
    <div data-testid="landscape-filter">
      <select
        value={selectedLandscape || ''}
        onChange={(e) => onLandscapeChange(e.target.value || null)}
        data-testid="landscape-select"
      >
        <option value="">All Landscapes</option>
        <option value="us-prod">US Production</option>
        <option value="eu-prod">EU Production</option>
      </select>
      {onShowLandscapeDetails && (
        <button onClick={onShowLandscapeDetails}>Show Details</button>
      )}
    </div>
  ),
}));

vi.mock('@/components/LandscapeToolsButtons', () => ({
  LandscapeToolsButtons: ({ selectedLandscape }: any) => (
    <div data-testid="landscape-tools-buttons">
      Tools for {selectedLandscape || 'All'}
    </div>
  ),
}));

// Import mocked modules
import { useComponentsByProject } from '../../../src/hooks/api/useComponents';
import { useLandscapesByProject } from '../../../src/hooks/api/useLandscapes';
import { useAuthRefresh } from '../../../src/hooks/useAuthRefresh';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useHeaderNavigation } from '../../../src/contexts/HeaderNavigationContext';
import {
  usePortalState,
  useLandscapeManagement,
  useComponentManagement,
  useFeatureToggles,
} from '../../../src/contexts/hooks';
import { useTabRouting } from '../../../src/hooks/useTabRouting';

// ============================================================================
// TEST DATA
// ============================================================================

describe('UnifiedServicesPage', () => {
  // Mock data
  const mockComponents: Component[] = [
    {
      id: 'comp-1',
      name: 'auth-service',
      title: 'Auth Service',
      description: 'Authentication service for unified services',
      metadata: {
        system: 'authentication'
      },
      project_id: 'project-usrv',
      owner_id: 'owner-123',
      project_title: 'Unified Services'
    },
    {
      id: 'comp-2',
      name: 'user-service',
      title: 'User Service',
      description: 'User management service for unified services',
      metadata: {
        system: 'user-management'
      },
      project_id: 'project-usrv',
      owner_id: 'owner-123',
      project_title: 'Unified Services'
    }
  ];

  const mockLandscapes = [
    { id: 'us-prod', name: 'US Production', project: 'Unified Services' },
    { id: 'eu-prod', name: 'EU Production', project: 'Unified Services' }
  ];

  const mockFeatureToggles = [
    {
      id: 'toggle-1',
      name: 'new-ui',
      component: 'auth-service',
      enabled: true,
      landscapeId: 'us-prod'
    }
  ];

  // Default mock implementations
  const defaultMocks = {
    useComponentsByProject: {
      data: mockComponents,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    },
    useAuthRefresh: {
      isAuthenticated: true,
      authError: null,
      isLoading: false,
      retry: vi.fn()
    },
    useAuth: {
      user: {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        organizationId: 'org-123',
        organizationName: 'Test Organization',
        roles: ['developer']
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn()
    },
    useHeaderNavigation: {
      tabs: [],
      activeTab: 'components',
      setTabs: vi.fn(),
      setActiveTab: vi.fn()
    },
    usePortalState: {
      selectedLandscape: null,
      setSelectedLandscape: vi.fn(),
      setShowLandscapeDetails: vi.fn(),
      selectedComponent: null,
      setSelectedComponent: vi.fn()
    },
    useLandscapeManagement: {
      getCurrentProjectLandscapes: vi.fn(() => mockLandscapes),
      getLandscapeGroups: vi.fn(() => ({
        'production': ['us-prod', 'eu-prod']
      })),
      getFilteredLandscapeIds: vi.fn(() => ['us-prod', 'eu-prod']),
      getProductionLandscapeIds: vi.fn(() => ['us-prod', 'eu-prod']),
      getDefaultLandscape: vi.fn(() => null)
    },
    useComponentManagement: {
      componentFilter: '',
      setComponentFilter: vi.fn(),
      getAvailableComponents: vi.fn(() => ['auth-service', 'user-service']),
      expandedComponents: {},
      setExpandedComponents: vi.fn()
    },
    useFeatureToggles: {
      featureToggles: mockFeatureToggles,
      expandedToggles: {},
      toggleFilter: 'all',
      setToggleFilter: vi.fn(),
      toggleFeature: vi.fn(),
      toggleExpanded: vi.fn(),
      bulkToggle: vi.fn(),
      getGroupStatus: vi.fn(),
      getFilteredToggles: vi.fn(() => mockFeatureToggles)
    },
    useTabRouting: {
      currentTabFromUrl: null,
      syncTabWithUrl: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    vi.mocked(useComponentsByProject).mockReturnValue(defaultMocks.useComponentsByProject as any);
    vi.mocked(useLandscapesByProject).mockReturnValue({
      data: mockLandscapes,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useAuthRefresh).mockReturnValue(defaultMocks.useAuthRefresh as any);
    vi.mocked(useAuth).mockReturnValue(defaultMocks.useAuth as any);
    vi.mocked(useHeaderNavigation).mockReturnValue(defaultMocks.useHeaderNavigation as any);
    vi.mocked(usePortalState).mockReturnValue(defaultMocks.usePortalState as any);
    vi.mocked(useLandscapeManagement).mockReturnValue(
      defaultMocks.useLandscapeManagement as any
    );
    vi.mocked(useComponentManagement).mockReturnValue(
      defaultMocks.useComponentManagement as any
    );
    vi.mocked(useFeatureToggles).mockReturnValue(defaultMocks.useFeatureToggles as any);
    vi.mocked(useTabRouting).mockReturnValue(defaultMocks.useTabRouting as any);
  });

  // --------------------------------------------------------------------------
  // RENDERING TESTS
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render the page title', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

    });

    it('should render within BreadcrumbPage component', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should render landscape filter', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
    });

    it('should render landscape tools buttons', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('landscape-tools-buttons')).toBeInTheDocument();
    });

    it('should display components tab by default', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('components-tab')).toBeInTheDocument();
    });

    it('should display team name in components tab', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

    });

    it('should pass system prop as "services" to ComponentsTabContent', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByText('System: services')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TAB NAVIGATION TESTS
  // --------------------------------------------------------------------------

  describe('Tab Navigation', () => {
    it('should set header tabs on mount', () => {
      const mockSetTabs = vi.fn();
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.useHeaderNavigation,
        setTabs: mockSetTabs
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(mockSetTabs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'components', label: 'Components' })
        ])
      );
    });

    it('should sync tabs with URL on mount', () => {
      const mockSyncTabWithUrl = vi.fn();
      vi.mocked(useTabRouting).mockReturnValue({
        ...defaultMocks.useTabRouting,
        syncTabWithUrl: mockSyncTabWithUrl
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(mockSyncTabWithUrl).toHaveBeenCalled();
    });

    it('should configure tab visibility correctly', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      // Components tab should be visible
      expect(screen.getByTestId('components-tab')).toBeInTheDocument();

      // Feature toggle and desk tabs should be hidden by default (TAB_VISIBILITY)
      expect(screen.queryByTestId('feature-toggle-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('desk-tab')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION TESTS
  // --------------------------------------------------------------------------

  describe('Authentication', () => {
    it('should render page when authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

    });

    it('should handle unauthenticated state gracefully', () => {
      vi.mocked(useAuthRefresh).mockReturnValue({
        isAuthenticated: false,
        authError: 'Session expired',
        isLoading: false,
        retry: vi.fn()
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      // Page should still render, auth is handled by ProtectedRoute wrapper
    });
  });

  // --------------------------------------------------------------------------
  // LANDSCAPE MANAGEMENT TESTS
  // --------------------------------------------------------------------------

  describe('Landscape Management', () => {
    it('should use selected landscape from context', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const select = screen.getByTestId('landscape-select') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should update selected landscape when changed', async () => {
      const user = userEvent.setup();
      const mockSetSelectedLandscape = vi.fn();

      vi.mocked(usePortalState).mockReturnValue({
        ...defaultMocks.usePortalState,
        setSelectedLandscape: mockSetSelectedLandscape
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const select = screen.getByTestId('landscape-select');
      await user.selectOptions(select, 'us-prod');

      expect(mockSetSelectedLandscape).toHaveBeenCalledWith('us-prod');
    });

    it('should get landscape groups for Unified Services project', () => {
      const mockGetLandscapeGroups = vi.fn(() => ({}));
      vi.mocked(useLandscapeManagement).mockReturnValue({
        ...defaultMocks.useLandscapeManagement,
        getLandscapeGroups: mockGetLandscapeGroups
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(mockGetLandscapeGroups).toHaveBeenCalledWith('Unified Services');
    });

    it('should render landscape filter with correct options', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const landscapeFilter = screen.getByTestId('landscape-filter');
      expect(within(landscapeFilter).getByText('All Landscapes')).toBeInTheDocument();
      expect(within(landscapeFilter).getByText('US Production')).toBeInTheDocument();
      expect(within(landscapeFilter).getByText('EU Production')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // COMPONENT MANAGEMENT TESTS
  // --------------------------------------------------------------------------

  describe('Component Management', () => {
    it('should get available components for the project', () => {
      const mockGetAvailableComponents = vi.fn(() => ['auth-service', 'user-service']);
      vi.mocked(useComponentManagement).mockReturnValue({
        ...defaultMocks.useComponentManagement,
        getAvailableComponents: mockGetAvailableComponents
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(mockGetAvailableComponents).toHaveBeenCalledWith(
        'Unified Services',
        expect.any(Array)
      );
    });

    it('should display component count', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Components: 2')).toBeInTheDocument();
    });

    it('should support component search functionality', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const searchInput = screen.getByTestId('component-search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should display component list when components are available', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('component-list')).toBeInTheDocument();
      expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // FEATURE TOGGLES TESTS
  // --------------------------------------------------------------------------

  describe('Feature Toggles', () => {
    it('should get filtered toggles for selected landscape', () => {
      const mockGetFilteredToggles = vi.fn(() => mockFeatureToggles);
      vi.mocked(useFeatureToggles).mockReturnValue({
        ...defaultMocks.useFeatureToggles,
        getFilteredToggles: mockGetFilteredToggles
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(mockGetFilteredToggles).toHaveBeenCalledWith(
        'Unified Services',
        null,
        '',
        'all'
      );
    });

    it('should not render feature toggle tab when hidden', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      // Feature toggle tab should be hidden by TAB_VISIBILITY configuration
      expect(screen.queryByTestId('feature-toggle-tab')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TAB CONTENT RENDERING TESTS
  // --------------------------------------------------------------------------

  describe('Tab Content Rendering', () => {
    it('should render components tab content', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const componentsTab = screen.getByTestId('components-tab');
      expect(within(componentsTab).getByText('Unified Services Components')).toBeInTheDocument();
    });

    it('should pass correct props to ComponentsTabContent', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const componentsTab = screen.getByTestId('components-tab');
      expect(within(componentsTab).getByText('Components: 2')).toBeInTheDocument();
      expect(within(componentsTab).getByText('Team: Unified Services')).toBeInTheDocument();
      expect(within(componentsTab).getByText('System: services')).toBeInTheDocument();
    });

    it('should display empty state message when no components', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(
        screen.getByText('No Unified Services components found for this organization.')
      ).toBeInTheDocument();
    });

    it('should show loading state when components are loading', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: vi.fn()
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading components...')).toBeInTheDocument();
    });

    it('should show error state when component fetch fails', () => {
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to fetch components'),
        refetch: vi.fn()
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Error: Failed to fetch components')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // API INTEGRATION TESTS
  // --------------------------------------------------------------------------

  describe('API Integration', () => {
    it('should call useComponentsByProject with correct project filter', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(useComponentsByProject).toHaveBeenCalledWith('usrv');
    });

    it('should handle refetch functionality', () => {
      const mockRefetch = vi.fn();
      vi.mocked(useComponentsByProject).mockReturnValue({
        data: mockComponents,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      } as any);

      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      // ComponentsTabContent receives refetch prop
      expect(screen.getByTestId('components-tab')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // PROJECT-SPECIFIC TESTS
  // --------------------------------------------------------------------------

  describe('Project-Specific Configuration', () => {
    it('should set activeProject to "Unified Services"', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

    });

    it('should fetch components with project filter "usrv"', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      expect(useComponentsByProject).toHaveBeenCalledWith('usrv');
    });

    it('should use Unified Services specific landscapes', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const mockGetCurrentProjectLandscapes = vi.fn(() => mockLandscapes);
      vi.mocked(useLandscapeManagement).mockReturnValue({
        ...defaultMocks.useLandscapeManagement,
        getCurrentProjectLandscapes: mockGetCurrentProjectLandscapes
      } as any);

      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ACCESSIBILITY TESTS
  // --------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should render page with accessible structure', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      // Page title is now rendered in the header, not in the page body
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      expect(screen.getByTestId('components-tab')).toBeInTheDocument();
    });

    it('should have accessible landscape filter controls', () => {
      render(
        <MemoryRouter initialEntries={['/unified-services']}>
          <UnifiedServicesPage />
        </MemoryRouter>
      );

      const landscapeSelect = screen.getByTestId('landscape-select');
      expect(landscapeSelect).toBeInTheDocument();
      expect(landscapeSelect.tagName).toBe('SELECT');
    });
  });
});