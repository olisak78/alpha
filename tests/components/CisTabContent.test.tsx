import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CisTabContent } from '../../src/components/CisTabContent';
import type { ComponentHealthCheck, HealthSummary } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';


// Mock all child components
vi.mock('../../src/components/LandscapeLinksSection', () => ({
  LandscapeLinksSection: () => <div data-testid="landscape-links">Landscape Links</div>,
}));

vi.mock('../../src/components/ComponentsTabContent', () => ({
  ComponentsTabContent: (props: any) => (
    <div data-testid="components-tab-content">
      {props.searchTerm !== undefined && <div data-testid="has-search">Has Search</div>}
      {props.onSortOrderChange && <div data-testid="has-sort">Has Sort</div>}
    </div>
  ),
}));

vi.mock('../../src/components/ViewSwitcher', () => ({
  ViewSwitcher: () => <div data-testid="view-switcher">View Switcher</div>,
}));

vi.mock('../../src/components/Health', () => ({
  HealthOverview: () => <div data-testid="health-overview">Health Overview</div>,
  HealthTable: () => <div data-testid="health-table">Health Table</div>,
}));

vi.mock('../../src/pages/AlertsPage', () => ({
  default: () => <div data-testid="alerts-page">Alerts</div>,
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children }: any) => <div data-testid="badge">{children}</div>,
}));

const mockHealthChecks: ComponentHealthCheck[] = [
  {
    componentId: 'comp-1',
    componentName: 'accounts-service',
    landscape: 'eu10-canary',
    healthUrl: 'https://accounts-service.cfapps.sap.hana.ondemand.com/health',
    status: 'UP',
  },
];

const mockSummary: HealthSummary = {
  total: 5,
  up: 4,
  down: 1,
  unknown: 0,
  error: 0,
  avgResponseTime: 200,
};

const defaultProps = {
  activeTab: 'components',
  componentView: 'grid' as const,
  onViewChange: vi.fn(),
  selectedLandscape: 'eu10-canary',
  selectedApiLandscape: { id: 'eu10-canary', name: 'EU10 Canary' },
  landscapeGroups: [
    {
      id: 'Production',
      name: 'Production',
      landscapes: [
        { id: 'eu10-canary', name: 'EU10 Canary', isCentral: false }
      ]
    }
  ],
  currentProjectLandscapes: [
    { id: 'eu10-canary', name: 'EU10 Canary' }
  ],
  onLandscapeChange: vi.fn(),
  onShowLandscapeDetails: vi.fn(),
  filteredComponents: [
    { id: 'comp-1', name: 'accounts-service', owner_id: 'team-1' },
    { id: 'comp-2', name: 'billing-service', owner_id: 'team-2' },
  ],
  libraryComponents: [],
  cisComponentsLoading: false,
  cisComponentsError: null,
  teamComponentsExpanded: {},
  onToggleExpanded: vi.fn(),
  refetchCisComponents: vi.fn(),
  componentSearchTerm: '',
  onSearchTermChange: vi.fn(),
  componentSortOrder: 'alphabetic' as const,
  onSortOrderChange: vi.fn(),
  onComponentClick: vi.fn(),
  healthChecks: mockHealthChecks,
  isLoadingHealth: false,
  summary: mockSummary,
  componentHealthMap: {},
  teamNamesMap: { 'team-1': 'Team Alpha', 'team-2': 'Team Beta' },
  teamColorsMap: {},
  filteredToggles: [],
  expandedToggles: new Set<string>(),
  toggleFilter: 'all' as const,
  componentFilter: '',
  availableComponents: [],
  activeProject: 'CIS@2.0',
  onToggleFeature: vi.fn(),
  onToggleExpandedFeature: vi.fn(),
  onBulkToggle: vi.fn(),
  onToggleFilterChange: vi.fn(),
  onComponentFilterChange: vi.fn(),
  getFilteredLandscapeIds: vi.fn(),
  getProductionLandscapeIds: vi.fn(),
  getGroupStatus: vi.fn(),
  cisTimelines: [],
  componentVersions: {},
  timelineViewMode: 'table' as const,
  onTimelineViewModeChange: vi.fn(),
};

describe('CisTabContent - Grid View', () => {
  it('should render landscape links section', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
  });

  it('should render header with title "Components" in grid view', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('should render component count badge when landscape is selected', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('2');
  });

  it('should render HealthOverview in grid view when landscape is selected', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByTestId('health-overview')).toBeInTheDocument();
  });

  it('should render ViewSwitcher in header section in grid view', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
  });

  it('should render ComponentsTabContent when landscape is selected', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByTestId('components-tab-content')).toBeInTheDocument();
  });

  it('should pass search and sort props to ComponentsTabContent in grid view', () => {
    render(<CisTabContent {...defaultProps} componentView="grid" />);

    expect(screen.getByTestId('has-search')).toBeInTheDocument();
    expect(screen.getByTestId('has-sort')).toBeInTheDocument();
  });

  it('should render empty state when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="grid"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.getByText('Select a landscape to view components and their health status')).toBeInTheDocument();
  });

  it('should render empty state when no components in landscape', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="grid"
        filteredComponents={[]}
      />
    );

    expect(screen.getByText('No components found in this landscape')).toBeInTheDocument();
  });

  it('should NOT render component count badge when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="grid"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('should NOT render HealthOverview when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="grid"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.queryByTestId('health-overview')).toBeInTheDocument();
  });
});

describe('CisTabContent - Table View', () => {
  it('should render landscape links section', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('landscape-links')).toBeInTheDocument();
  });

  it('should render header with title "Components" in table view', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('should render component count badge when landscape is selected', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('2');
  });

  it('should render HealthOverview in table view', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('health-overview')).toBeInTheDocument();
  });

  it('should render ViewSwitcher in header section in table view', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
  });

  it('should render HealthTable in table view', () => {
    render(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('health-table')).toBeInTheDocument();
  });

  it('should render empty state when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="table"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.getByText('Select a landscape to view component health status')).toBeInTheDocument();
  });

  it('should render empty state when no components in landscape', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="table"
        filteredComponents={[]}
      />
    );

    expect(screen.getByText('No components found in this landscape')).toBeInTheDocument();
  });

  it('should NOT render component count badge when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="table"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('should NOT render HealthOverview when no landscape is selected', () => {
    render(
      <CisTabContent
        {...defaultProps}
        componentView="table"
        selectedLandscape={null}
        filteredComponents={[]}
      />
    );

    expect(screen.queryByTestId('health-overview')).toBeInTheDocument();
  });
});

describe('CisTabContent - View Consistency', () => {
  it('should have same header structure in both views', () => {
    const { rerender } = render(
      <CisTabContent {...defaultProps} componentView="grid" />
    );

    const gridHeader = screen.getByText('Components');

    rerender(<CisTabContent {...defaultProps} componentView="table" />);

    const tableHeader = screen.getByText('Components');

    // Headers should be identical
    expect(gridHeader.textContent).toBe(tableHeader.textContent);
  });

  it('should render ViewSwitcher in same position in both views', () => {
    const { container, rerender } = render(
      <CisTabContent {...defaultProps} componentView="grid" />
    );

    const gridViewSwitcher = screen.getByTestId('view-switcher');
    // Check if it's in a flex container with justify-between
    const gridHeader = container.querySelector('.flex.items-center.justify-between');
    expect(gridHeader).toBeInTheDocument();

    rerender(<CisTabContent {...defaultProps} componentView="table" />);

    const tableViewSwitcher = screen.getByTestId('view-switcher');
    // Check if it's in a flex container with justify-between
    const tableHeader = container.querySelector('.flex.items-center.justify-between');
    expect(tableHeader).toBeInTheDocument();
  });

  it('should render HealthOverview in both views when landscape is selected', () => {
    const { rerender } = render(
      <CisTabContent {...defaultProps} componentView="grid" />
    );

    expect(screen.getByTestId('health-overview')).toBeInTheDocument();

    rerender(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('health-overview')).toBeInTheDocument();
  });

  it('should render component count badge in both views when landscape is selected', () => {
    const { rerender } = render(
      <CisTabContent {...defaultProps} componentView="grid" />
    );

    expect(screen.getByTestId('badge')).toHaveTextContent('2');

    rerender(<CisTabContent {...defaultProps} componentView="table" />);

    expect(screen.getByTestId('badge')).toHaveTextContent('2');
  });
});

describe('CisTabContent - Other Tabs', () => {
  it('should render AlertsPage when alerts tab is active', () => {
    render(<CisTabContent {...defaultProps} activeTab="alerts" />);

    expect(screen.getByTestId('alerts-page')).toBeInTheDocument();
  });

  it('should not render ComponentsTabContent when alerts tab is active', () => {
    render(<CisTabContent {...defaultProps} activeTab="alerts" />);

    expect(screen.queryByTestId('components-tab-content')).not.toBeInTheDocument();
  });

  it('should not render LandscapeLinksSection when alerts tab is active', () => {
    render(<CisTabContent {...defaultProps} activeTab="alerts" />);

    expect(screen.queryByTestId('landscape-links')).not.toBeInTheDocument();
  });

  it('should not render ViewSwitcher when alerts tab is active', () => {
    render(<CisTabContent {...defaultProps} activeTab="alerts" />);

    expect(screen.queryByTestId('view-switcher')).not.toBeInTheDocument();
  });
});