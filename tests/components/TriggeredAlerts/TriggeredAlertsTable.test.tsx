import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TriggeredAlertsTable } from '../../../src/components/TriggeredAlerts/TriggeredAlertsTable';
import { TriggeredAlertsProvider } from '../../../src/contexts/TriggeredAlertsContext';
import type { TriggeredAlert } from '../../../src/types/api';

// Mock the utility functions
vi.mock('../../../src/utils/alertUtils', () => ({
  getAlertComponent: vi.fn((alert) => alert.component || 'test-component'),
  getSeverityColor: vi.fn((severity) => `severity-${severity.toLowerCase()}`),
  getStatusColor: vi.fn((status) => `status-${status.toLowerCase()}`),
  formatDateTime: vi.fn((dateTime) => {
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }),
}));

// Mock the sub-components
vi.mock('../../../src/components/TriggeredAlerts/AlertExpandedView', () => ({
  AlertExpandedView: ({ alertData }: any) => (
    <div data-testid="alert-expanded-view">
      <div>Expanded alert: {alertData?.name}</div>
    </div>
  ),
}));

vi.mock('../../../src/components/TriggeredAlerts/FilterButtons', () => ({
  FilterButtons: ({ filterType, value }: any) => (
    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ">
      <button title={`Filter by ${filterType}: ${value}`}>+</button>
      <button title={`Exclude ${filterType}: ${value}`}>-</button>
    </div>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Activity: ({ className }: any) => <svg className={`lucide-activity ${className}`} data-testid="activity-icon" />,
  ChevronDown: ({ className }: any) => <svg className={`lucide-chevron-down ${className}`} data-testid="chevron-down" />,
  ChevronRight: ({ className }: any) => <svg className={`lucide-chevron-right ${className}`} data-testid="chevron-right" />,
}));

// Mock the hook to return controlled data
const mockHookReturn = {
  filters: {
    searchTerm: '',
    selectedSeverity: 'all',
    selectedStatus: 'all',
    selectedLandscape: 'all',
    selectedRegion: 'all',
    selectedComponent: 'all',
    startDate: '',
    endDate: '',
    excludedSeverity: [],
    excludedStatus: [],
    excludedLandscape: [],
    excludedRegion: [],
    excludedComponent: [],
    excludedAlertname: [],
  },
  actions: {
    setSearchTerm: vi.fn(),
    setSelectedSeverity: vi.fn(),
    setSelectedStatus: vi.fn(),
    setSelectedLandscape: vi.fn(),
    setSelectedRegion: vi.fn(),
    setSelectedComponent: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    addExcludedSeverity: vi.fn(),
    addExcludedStatus: vi.fn(),
    addExcludedLandscape: vi.fn(),
    addExcludedRegion: vi.fn(),
    addExcludedComponent: vi.fn(),
    addExcludedAlertname: vi.fn(),
    handleDateRangeSelect: vi.fn(),
    resetFilters: vi.fn(),
    removeSearchTerm: vi.fn(),
    removeSeverity: vi.fn(),
    removeStatus: vi.fn(),
    removeLandscape: vi.fn(),
    removeRegion: vi.fn(),
    removeComponent: vi.fn(),
    removeDateRange: vi.fn(),
    removeExcludedSeverity: vi.fn(),
    removeExcludedStatus: vi.fn(),
    removeExcludedLandscape: vi.fn(),
    removeExcludedRegion: vi.fn(),
    removeExcludedComponent: vi.fn(),
    removeExcludedAlertname: vi.fn(),
    clearAllExcludedSeverity: vi.fn(),
    clearAllExcludedStatus: vi.fn(),
    clearAllExcludedLandscape: vi.fn(),
    clearAllExcludedRegion: vi.fn(),
    clearAllExcludedComponent: vi.fn(),
    clearAllExcludedAlertname: vi.fn(),
  },
  options: {
    severities: ['critical', 'warning', 'info'],
    statuses: ['firing', 'resolved'],
    landscapes: ['production', 'staging', 'development'],
    components: ['component-a', 'component-b', 'component-c'],
    regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
  },
  filteredAlerts: [],
  isLoading: false,
  filtersLoading: false,
  error: null,
  appliedFilters: [],
};

vi.mock('../../../src/hooks/useTriggeredAlertsFilters', () => ({
  useTriggeredAlertsFilters: vi.fn(() => mockHookReturn),
}));

// Import the mocked hook
import { useTriggeredAlertsFilters } from '../../../src/hooks/useTriggeredAlertsFilters';
const mockUseTriggeredAlertsFilters = vi.mocked(useTriggeredAlertsFilters);

// Helper function to render with provider
function renderWithProvider(component: React.ReactElement) {
  return render(
    <TriggeredAlertsProvider projectId="test-project">
      {component}
    </TriggeredAlertsProvider>
  );
}

describe('TriggeredAlertsTable', () => {
  const mockAlert: TriggeredAlert = {
    fingerprint: 'test-fingerprint-123',
    alertname: 'Test Alert',
    status: 'firing',
    severity: 'critical',
    landscape: 'production',
    region: 'us-east-1',
    startsAt: '2023-12-01T10:00:00Z',
    endsAt: '2023-12-01T11:00:00Z',
    labels: { service: 'test-service' },
    annotations: { description: 'Test alert description' },
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2023-12-01T10:30:00Z',
    component: 'test-component'
  };

  const mockAlerts: TriggeredAlert[] = [
    mockAlert,
    {
      ...mockAlert,
      fingerprint: 'test-fingerprint-456',
      alertname: 'Another Alert',
      status: 'resolved',
      severity: 'warning',
      landscape: 'staging',
      region: 'eu-west-1',
      endsAt: undefined, // Test case without end time
      component: undefined // Test case without component
    }
  ];

  it('should render empty state when no alerts provided', () => {
    // Mock empty alerts
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: []
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    expect(screen.getByText('No triggered alerts found')).toBeInTheDocument();
    // Check for SVG element instead of img role
    const activityIcon = document.querySelector('svg.lucide-activity');
    expect(activityIcon).toBeInTheDocument();
  });

  it('should render table headers correctly', () => {
    // Mock with alerts
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: mockAlerts
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    expect(screen.getByText('Alert Name')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Landscape')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
  });

  it('should render alert data correctly', () => {
    // Mock with single alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [mockAlert]
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('firing')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('test-component')).toBeInTheDocument();
  });

  it('should handle multiple alerts and missing data', () => {
    // Mock with multiple alerts
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: mockAlerts
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
    expect(screen.getByText('Another Alert')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByText('firing')).toBeInTheDocument();
    expect(screen.getByText('resolved')).toBeInTheDocument();
    
    // Should show dash for missing end time (second alert has undefined endsAt)
    const endTimeCells = screen.getAllByText('-');
    expect(endTimeCells.length).toBeGreaterThan(0);
  });

  it('should apply correct CSS classes for styling', () => {
    // Mock with single alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [mockAlert]
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    const tableContainer = screen.getByText('Test Alert').closest('.border');
    expect(tableContainer).toHaveClass('border', 'rounded-lg', 'overflow-hidden', 'bg-card');
    
    const headerRow = screen.getByText('Alert Name').closest('.grid');
    expect(headerRow).toHaveClass('grid-cols-10', 'px-4', 'py-3', 'border-b', 'bg-muted/30');
    
    const dataRow = screen.getByText('Test Alert').closest('.grid');
    expect(dataRow).toHaveClass('grid-cols-10', 'px-4', 'py-3', 'border-b', 'hover:bg-muted/50');
  });

  it('should truncate long alert names', () => {
    const longNameAlert = {
      ...mockAlert,
      alertname: 'This is a very long alert name that should be truncated'
    };
    
    // Mock with long name alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [longNameAlert]
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    const alertNameSpan = screen.getByText('This is a very long alert name that should be truncated');
    expect(alertNameSpan).toHaveClass('truncate');
  });

  it('should use unique keys for alert rows', () => {
    const duplicateNameAlerts = [
      { ...mockAlert, fingerprint: 'fp1' },
      { ...mockAlert, fingerprint: 'fp2' }
    ];
    
    // Mock with duplicate name alerts
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: duplicateNameAlerts
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    // Should render both alerts even with same name
    const alertElements = screen.getAllByText('Test Alert');
    expect(alertElements).toHaveLength(2);
  });

  it('should display formatted date times', () => {
    // Mock with single alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [mockAlert]
    });

    renderWithProvider(<TriggeredAlertsTable />);

    // The mock formatDateTime returns DD/MM/YYYY format - there are multiple instances (start and end time)
    const dateElements = screen.getAllByText('01/12/2023');
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should apply severity and status colors via utility functions', () => {
    // Mock with single alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [mockAlert]
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    const severityBadge = screen.getByText('critical').closest('.severity-critical');
    const statusBadge = screen.getByText('firing').closest('.status-firing');
    
    expect(severityBadge).toBeInTheDocument();
    expect(statusBadge).toBeInTheDocument();
  });

  it('should handle empty alert properties gracefully', () => {
    const minimalAlert: TriggeredAlert = {
      fingerprint: 'minimal',
      alertname: '',
      status: '',
      severity: '',
      landscape: '',
      region: '',
      startsAt: '2023-12-01T10:00:00Z',
      labels: {},
      annotations: {},
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T10:00:00Z'
    };
    
    // Mock with minimal alert
    mockUseTriggeredAlertsFilters.mockReturnValue({
      ...mockHookReturn,
      filteredAlerts: [minimalAlert]
    });
    
    renderWithProvider(<TriggeredAlertsTable />);
    
    // Should still render the row structure
    const tableRows = screen.getAllByRole('generic').filter(el => 
      el.className.includes('grid-cols-10') && el.className.includes('px-4')
    );
    expect(tableRows.length).toBeGreaterThan(0); // Header + data row
  });

  // Tests for specific callback functions
  describe('Callback Functions', () => {
    it('should handle expand alert correctly', () => {
      const mockAlert: TriggeredAlert = {
        fingerprint: 'test-fingerprint',
        alertname: 'Test Alert',
        status: 'firing',
        severity: 'critical',
        landscape: 'production',
        region: 'us-east-1',
        startsAt: '2023-12-01T10:00:00Z',
        labels: {},
        annotations: {},
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z'
      };

      mockUseTriggeredAlertsFilters.mockReturnValue({
        ...mockHookReturn,
        filteredAlerts: [mockAlert]
      });

      renderWithProvider(<TriggeredAlertsTable />);
      
      // Initially should show ChevronRight (collapsed)
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      
      // Click on alert row to expand
      const alertRow = screen.getByText('Test Alert').closest('.grid');
      fireEvent.click(alertRow!);
      
      // Should show ChevronDown (expanded) and the expanded view
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.getByTestId('alert-expanded-view')).toBeInTheDocument();
    });

    it('should render filter buttons for each alert field', () => {
      mockUseTriggeredAlertsFilters.mockReturnValue({
        ...mockHookReturn,
        filteredAlerts: [mockAlert]
      });

      renderWithProvider(<TriggeredAlertsTable />);
      
      // Should render filter buttons for alertname, severity, status, landscape, and region
      expect(screen.getByTitle('Filter by alertname: Test Alert')).toBeInTheDocument();
      expect(screen.getByTitle('Exclude alertname: Test Alert')).toBeInTheDocument();
      expect(screen.getByTitle('Filter by severity: critical')).toBeInTheDocument();
      expect(screen.getByTitle('Exclude severity: critical')).toBeInTheDocument();
      expect(screen.getByTitle('Filter by status: firing')).toBeInTheDocument();
      expect(screen.getByTitle('Exclude status: firing')).toBeInTheDocument();
      expect(screen.getByTitle('Filter by landscape: production')).toBeInTheDocument();
      expect(screen.getByTitle('Exclude landscape: production')).toBeInTheDocument();
      expect(screen.getByTitle('Filter by region: us-east-1')).toBeInTheDocument();
      expect(screen.getByTitle('Exclude region: us-east-1')).toBeInTheDocument();
    });
  });
});
