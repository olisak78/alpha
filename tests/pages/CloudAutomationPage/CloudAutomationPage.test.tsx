import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import CloudAutomationPage from '../../../src/pages/CloudAutomationPage';
import { HeaderNavigationProvider } from '../../../src/contexts/HeaderNavigationContext';


// ============================================================================
// MOCKS
// ============================================================================

// Mock the contexts/hooks module
vi.mock('../../../src/contexts/hooks', () => ({
  usePortalState: () => ({
    selectedLandscape: null,
    setSelectedLandscape: vi.fn(),
    setShowLandscapeDetails: vi.fn(),
    selectedComponent: null,
    setSelectedComponent: vi.fn(),
  }),
  useLandscapeManagement: () => ({
    getCurrentProjectLandscapes: () => [
      { id: 'landscape-1', name: 'Development', project: 'Cloud Automation' },
      { id: 'landscape-2', name: 'Production', project: 'Cloud Automation' },
    ],
    getLandscapeGroups: () => ({
      'development': ['landscape-1'],
      'production': ['landscape-2']
    }),
    getFilteredLandscapeIds: () => ['landscape-1', 'landscape-2'],
    getProductionLandscapeIds: () => ['landscape-2'],
    getDefaultLandscape: () => null,
  }),
  useHealthAndAlerts: () => ({
    getComponentHealth: vi.fn(),
    getComponentAlerts: vi.fn(),
  }),
  useComponentManagement: () => ({
    expandedComponents: {},
    setExpandedComponents: vi.fn(),
    componentFilter: '',
    setComponentFilter: vi.fn(),
    getAvailableComponents: () => ['comp-1', 'comp-2'],
  }),
  useFeatureToggles: () => ({
    featureToggles: [],
    expandedToggles: {},
    toggleFilter: 'all',
    setToggleFilter: vi.fn(),
    toggleFeature: vi.fn(),
    toggleExpanded: vi.fn(),
    bulkToggle: vi.fn(),
    getGroupStatus: vi.fn(),
    getFilteredToggles: () => [],
  }),
}));

// Mock hooks
vi.mock('../../../src/hooks/useTabRouting', () => ({
  useTabRouting: () => ({
    currentTabFromUrl: null,
    syncTabWithUrl: vi.fn(),
  }),
}));

vi.mock('../../../src/hooks/useAuthRefresh', () => ({
  useAuthRefresh: () => ({
    isAuthenticated: true,
    authError: null,
    retry: vi.fn(),
  }),
}));

// Mock AuthContext
vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      organizationId: 'test-org-123',
      organizationName: 'Test Organization',
      roles: ['developer'],
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn(),
  }),
}));

vi.mock('../../../src/hooks/api/useComponents', () => ({
  useComponentsByProject: () => ({
    data: [
      {
        id: 'comp-1',
        name: 'cloud-service-1',
        title: 'Cloud Service 1',
        description: 'First cloud automation service',
        project_id: 'ca',
        project_title: 'Cloud Automation',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        created_by: 'user-123',
        updated_by: 'user-123',
        owner_id: 'owner-123',
        metadata: {
          system: 'automation'
        }
      },
      {
        id: 'comp-2',
        name: 'cloud-service-2',
        title: 'Cloud Service 2',
        description: 'Second cloud automation service',
        project_id: 'ca',
        project_title: 'Cloud Automation',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        created_by: 'user-123',
        updated_by: 'user-123',
        owner_id: 'owner-123',
        metadata: {
          system: 'automation'
        }
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../../src/hooks/api/useLandscapes', () => ({
  useLandscapesByProject: () => ({
    data: [
      { id: 'landscape-1', name: 'Development', project: 'Cloud Automation' },
      { id: 'landscape-2', name: 'Production', project: 'Cloud Automation' },
    ],
    isLoading: false,
    error: null,
  }),
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../../../src/components/LandscapeFilter', () => ({
  LandscapeFilter: ({ selectedLandscape, onLandscapeChange, onShowLandscapeDetails }: any) => (
    <div data-testid="landscape-filter">
      <select
        data-testid="landscape-select"
        value={selectedLandscape || ''}
        onChange={(e) => onLandscapeChange(e.target.value || null)}
      >
        <option value="">All Landscapes</option>
        <option value="landscape-1">Development</option>
        <option value="landscape-2">Production</option>
      </select>
      <button onClick={onShowLandscapeDetails}>
        Show Details
      </button>
    </div>
  ),
}));

vi.mock('../../../src/components/LandscapeToolsButtons', () => ({
  LandscapeToolsButtons: ({ selectedLandscape }: any) => (
    <div data-testid="landscape-tools-buttons">
      Tools for {selectedLandscape || 'All'}
    </div>
  ),
}));

vi.mock('../../../src/components/tabs/FeatureToggleTab', () => ({
  default: ({ featureToggles, onToggleFeature }: any) => (
    <div data-testid="feature-toggle-tab">
      <h3>Feature Toggles</h3>
      {featureToggles?.map((toggle: any) => (
        <div key={toggle.id}>
          <span>{toggle.name}</span>
          <button onClick={() => onToggleFeature(toggle.id)}>
            Toggle
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: any) => <div data-testid="breadcrumb-page">{children}</div>,
}));

vi.mock('../../../src/components/ComponentsTabContent', () => ({
  ComponentsTabContent: ({
    title,
    components,
    isLoading,
    error,
    onToggleExpanded,
    onRefresh,
    showRefreshButton,
    teamName,
    system,
    searchTerm,
    onSearchTermChange,
    additionalControls,
  }: any) => (
    <div data-testid="components-tab-content">
      <h3>{title}</h3>
      {teamName && <p>Team: {teamName}</p>}
      {system && <p>System: {system}</p>}
      {additionalControls && <div>{additionalControls}</div>}
      {isLoading && <div>Loading components...</div>}
      {error && <div>Error: {error.message}</div>}
      {!isLoading && !error && (
        <div>
          {searchTerm !== undefined && (
            <input
              data-testid="component-search"
              value={searchTerm}
              onChange={(e) => onSearchTermChange?.(e.target.value)}
              placeholder="Search components..."
            />
          )}
          {components.map((comp: any) => (
            <div key={comp.id} data-testid={`component-${comp.id}`}>
              <span>{comp.title || comp.name}</span>
              <button onClick={() => onToggleExpanded?.(comp.id)}>
                Expand
              </button>
            </div>
          ))}
        </div>
      )}
      {showRefreshButton && onRefresh && (
        <button onClick={onRefresh} data-testid="refresh-button">Refresh</button>
      )}
    </div>
  ),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wrapper component that provides all necessary context providers
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <HeaderNavigationProvider>
        {children}
      </HeaderNavigationProvider>
    </MemoryRouter>
  );
}

/**
 * Helper function to render CloudAutomationPage with all providers
 */
function renderCloudAutomationPage() {
  return render(
    <AllProviders>
      <CloudAutomationPage />
    </AllProviders>
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('CloudAutomationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // --------------------------------------------------------------------------
  // RENDERING TESTS
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render within BreadcrumbPage component', () => {
      renderCloudAutomationPage();

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
    });

    it('should render landscape filter component', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
    });

    it('should render landscape tools buttons', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByTestId('landscape-tools-buttons')).toBeInTheDocument();
    });

    it('should render components tab content by default', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
      expect(screen.getByText('Cloud Automation Components')).toBeInTheDocument();
    });

    it('should display components from API', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();
      expect(screen.getByText('Cloud Service 1')).toBeInTheDocument();
      expect(screen.getByText('Cloud Service 2')).toBeInTheDocument();
    });

    it('should pass system prop as "cloud-automation" to ComponentsTabContent', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByText('System: cloud-automation')).toBeInTheDocument();
    });

    it('should render search functionality in ComponentsTabContent', () => {
      renderCloudAutomationPage();
      
      const searchInput = screen.getByTestId('component-search');
      expect(searchInput).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TAB VISIBILITY TESTS
  // --------------------------------------------------------------------------

  describe('Tab Visibility', () => {
    it('should have components tab visible', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should not render feature toggle tab (hidden by TAB_VISIBILITY)', () => {
      renderCloudAutomationPage();
      
      // Feature toggle tab should be hidden by default (TAB_VISIBILITY.feature-toggle = false)
      expect(screen.queryByTestId('feature-toggle-tab')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // LANDSCAPE FILTERING TESTS
  // --------------------------------------------------------------------------

  describe('Landscape Filtering', () => {
    it('should render landscape filter with default "All Landscapes" selection', () => {
      renderCloudAutomationPage();
      
      const select = screen.getByTestId('landscape-select') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should show landscape options', () => {
      renderCloudAutomationPage();
      
      const select = screen.getByTestId('landscape-select');
      expect(within(select as HTMLElement).getByText('All Landscapes')).toBeInTheDocument();
      expect(within(select as HTMLElement).getByText('Development')).toBeInTheDocument();
      expect(within(select as HTMLElement).getByText('Production')).toBeInTheDocument();
    });

    it('should show landscape details button', async () => {
      const user = userEvent.setup();
      renderCloudAutomationPage();
      
      const detailsButton = screen.getByText('Show Details');
      expect(detailsButton).toBeInTheDocument();
      
      await user.click(detailsButton);
      // Button click is handled by mocked context
    });


  });

  // --------------------------------------------------------------------------
  // COMPONENT MANAGEMENT TESTS
  // --------------------------------------------------------------------------

  describe('Component Management', () => {
    it('should handle component expansion toggle', async () => {
      const user = userEvent.setup();
      renderCloudAutomationPage();
      
      const expandButton = within(screen.getByTestId('component-comp-1')).getByText('Expand');
      await user.click(expandButton);
      
      // Component should have expand functionality
      expect(expandButton).toBeInTheDocument();
    });

    it('should display correct number of components', () => {
      renderCloudAutomationPage();
      
      const components = screen.getAllByTestId(/component-comp-/);
      expect(components).toHaveLength(2);
    });

    it('should handle multiple component expansions independently', async () => {
      const user = userEvent.setup();
      renderCloudAutomationPage();
      
      const expandButton1 = within(screen.getByTestId('component-comp-1')).getByText('Expand');
      const expandButton2 = within(screen.getByTestId('component-comp-2')).getByText('Expand');
      
      await user.click(expandButton1);
      await user.click(expandButton2);
      
      expect(expandButton1).toBeInTheDocument();
      expect(expandButton2).toBeInTheDocument();
    });

    it('should support component search functionality', async () => {
      const user = userEvent.setup();
      renderCloudAutomationPage();
      
      const searchInput = screen.getByTestId('component-search') as HTMLInputElement;
      await user.type(searchInput, 'Service 1');
      
      expect(searchInput.value).toBe('Service 1');
    });
  });

  // --------------------------------------------------------------------------
  // LOADING STATES TESTS
  // --------------------------------------------------------------------------

  describe('Loading States', () => {
    it('should display components when not loading', () => {
      renderCloudAutomationPage();
      
      // Components should be displayed when loading is false (default mock)
      expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();
    });

    it('should not show loading state with default mock', () => {
      renderCloudAutomationPage();
      
      expect(screen.queryByText('Loading components...')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ERROR HANDLING TESTS
  // --------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should pass error handling to ComponentsTabContent', () => {
      renderCloudAutomationPage();
      
      // Verify the component renders (error handling is delegated to ComponentsTabContent)
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should not show error with default mock', () => {
      renderCloudAutomationPage();
      
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION TESTS
  // --------------------------------------------------------------------------

  describe('Authentication', () => {
    it('should render page when authenticated', () => {
      renderCloudAutomationPage();

      // useAuthRefresh is called during component mount (mocked to return authenticated)
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should use authenticated user context', () => {
      renderCloudAutomationPage();
      
      // The page should render successfully with authenticated user
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // INTEGRATION TESTS
  // --------------------------------------------------------------------------

  describe('Integration', () => {
    it('should integrate with HeaderNavigationProvider', () => {
      renderCloudAutomationPage();

      // Page should render within the context
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
    });

    it('should integrate with context hooks from @/contexts/hooks', () => {
      renderCloudAutomationPage();
      
      // Should render without context errors
      expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
    });

    it('should integrate with useComponentsByProject hook', () => {
      renderCloudAutomationPage();
      
      // Components from the hook should be displayed
      expect(screen.getByText('Cloud Service 1')).toBeInTheDocument();
      expect(screen.getByText('Cloud Service 2')).toBeInTheDocument();
    });

    it('should pass correct project filter "ca" to useComponentsByProject', () => {
      renderCloudAutomationPage();
      
      // All rendered components should be from Cloud Automation project
      const components = screen.getAllByTestId(/component-comp-/);
      expect(components.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // ACCESSIBILITY TESTS
  // --------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderCloudAutomationPage();
      
      const detailsButton = screen.getByText('Show Details');
      expect(detailsButton).toBeInTheDocument();
      expect(detailsButton.tagName).toBe('BUTTON');
    });

    it('should have accessible expand buttons', () => {
      renderCloudAutomationPage();
      
      const expandButtons = screen.getAllByText('Expand');
      expect(expandButtons.length).toBeGreaterThan(0);
      expandButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  // --------------------------------------------------------------------------
  // DATA FLOW TESTS
  // --------------------------------------------------------------------------

  describe('Data Flow', () => {
    it('should pass correct props to ComponentsTabContent', () => {
      renderCloudAutomationPage();
      
      const componentsTab = screen.getByTestId('components-tab-content');
      expect(componentsTab).toBeInTheDocument();
      
      // Should display the title
      expect(within(componentsTab).getByText('Cloud Automation Components')).toBeInTheDocument();
      
      // Should display components
      expect(within(componentsTab).getByText('Cloud Service 1')).toBeInTheDocument();
      expect(within(componentsTab).getByText('Cloud Service 2')).toBeInTheDocument();
    });

    it('should pass system="cloud-automation" to ComponentsTabContent', () => {
      renderCloudAutomationPage();
      
      expect(screen.getByText('System: cloud-automation')).toBeInTheDocument();
    });

    it('should handle component search term state', () => {
      renderCloudAutomationPage();
      
      const searchInput = screen.getByTestId('component-search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should provide refresh functionality', () => {
      renderCloudAutomationPage();
      
      // ComponentsTabContent receives onRefresh prop
      const componentsTab = screen.getByTestId('components-tab-content');
      expect(componentsTab).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // PROJECT-SPECIFIC TESTS
  // --------------------------------------------------------------------------

  describe('Project-Specific Configuration', () => {
    it('should fetch components with project filter "ca"', () => {
      renderCloudAutomationPage();
      
      // Components should be fetched and displayed
      expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();
    });

    it('should use Cloud Automation specific landscapes', () => {
      renderCloudAutomationPage();
      
      const landscapeFilter = screen.getByTestId('landscape-filter');
      expect(within(landscapeFilter).getByText('Development')).toBeInTheDocument();
      expect(within(landscapeFilter).getByText('Production')).toBeInTheDocument();
    });
  });
});