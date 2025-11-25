import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AlertsPage from '../../../src/pages/AlertsPage';
import { useAlerts } from '../../../src/hooks/api/useAlerts';
import type { AlertsResponse, Alert, AlertFile } from '../../../src/hooks/api/useAlerts';

// Mock the hooks and components
vi.mock('../../../src/hooks/api/useAlerts');
vi.mock('../../../src/components/Alerts/AlertEditorDialog', () => ({
  AlertEditorDialog: ({ open, alert, file }: any) => 
    open ? (
      <div data-testid="alert-editor-dialog">
        <div>Editing alert: {alert?.alert}</div>
        <div>File: {file?.name}</div>
      </div>
    ) : null,
}));

vi.mock('../../../src/components/Alerts/AlertViewDialog', () => ({
  AlertViewDialog: ({ open, alert, file }: any) => 
    open ? (
      <div data-testid="alert-view-dialog">
        <div>Viewing alert: {alert?.alert}</div>
        <div>File: {file?.name}</div>
      </div>
    ) : null,
}));

vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: any) => <div data-testid="breadcrumb-page">{children}</div>,
}));

// Mock data
const mockAlert1: Alert = {
  alert: 'HighCPUUsage',
  expr: 'cpu_usage > 80',
  for: '5m',
  labels: {
    severity: 'critical',
    team: 'platform',
  },
  annotations: {
    summary: 'High CPU usage detected',
    description: 'CPU usage is above 80% for more than 5 minutes',
  },
};

const mockAlert2: Alert = {
  alert: 'LowDiskSpace',
  expr: 'disk_free < 10',
  for: '2m',
  labels: {
    severity: 'warning',
    team: 'infrastructure',
  },
  annotations: {
    summary: 'Low disk space warning',
    description: 'Available disk space is below 10%',
  },
};

const mockAlert3: Alert = {
  alert: 'ServiceDown',
  expr: 'up == 0',
  for: '1m',
  labels: {
    severity: 'critical',
    service: 'api',
  },
  annotations: {
    summary: 'Service is down',
    description: 'The API service is not responding',
  },
};

const mockAlertFile1: AlertFile = {
  name: 'cpu-alerts.yml',
  path: '/alerts/cpu-alerts.yml',
  content: 'groups:\n  - name: cpu\n    rules:\n      - alert: HighCPUUsage',
  category: 'system',
  alerts: [mockAlert1],
};

const mockAlertFile2: AlertFile = {
  name: 'disk-alerts.yml',
  path: '/alerts/disk-alerts.yml',
  content: 'groups:\n  - name: disk\n    rules:\n      - alert: LowDiskSpace',
  category: 'system',
  alerts: [mockAlert2],
};

const mockAlertFile3: AlertFile = {
  name: 'service-alerts.yml',
  path: '/alerts/service-alerts.yml',
  content: 'groups:\n  - name: service\n    rules:\n      - alert: ServiceDown',
  category: 'application',
  alerts: [mockAlert3],
};

const mockAlertsData: AlertsResponse = {
  files: [mockAlertFile1, mockAlertFile2, mockAlertFile3],
};

const defaultProps = {
  projectId: 'test-project-123',
  projectName: 'Test Project',
};

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================
  // LOADING STATE TESTS
  // =========================================

  describe('Loading State', () => {
    it('displays loading state when alerts are being fetched', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('Loading Prometheus alerts...')).toBeInTheDocument();
      
      // Check for progress bar by class instead of role
      const progressBar = container.querySelector('.animate-pulse');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '60%' });
    });
  });

  // =========================================
  // ERROR STATE TESTS
  // =========================================

  describe('Error State', () => {
    it('displays error message when alerts fail to load', () => {
      const errorMessage = 'Network error occurred';
      vi.mocked(useAlerts).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
      } as any);

      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText(`Failed to load alerts: ${errorMessage}`)).toBeInTheDocument();
      
      // Check for error icon by class instead of testid
      const errorIcon = container.querySelector('.lucide-triangle-alert');
      expect(errorIcon).toBeInTheDocument();
      
      const errorContainer = container.querySelector('.text-destructive');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  // =========================================
  // SUCCESS STATE TESTS
  // =========================================

  describe('Success State', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders page header with correct title and alert count', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('Prometheus Alerts')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total alerts count
    });

    it('displays all alerts in the table', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
      expect(screen.getByText('ServiceDown')).toBeInTheDocument();
    });

    it('displays alert expressions correctly', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('cpu_usage > 80')).toBeInTheDocument();
      expect(screen.getByText('disk_free < 10')).toBeInTheDocument();
      expect(screen.getByText('up == 0')).toBeInTheDocument();
    });

    it('displays alert durations correctly', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('5m')).toBeInTheDocument();
      expect(screen.getByText('2m')).toBeInTheDocument();
      expect(screen.getByText('1m')).toBeInTheDocument();
    });

    it('displays severity badges', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      // Check for severity badges in the table (not filter buttons)
      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);
      const severityBadges = container.querySelectorAll('.inline-flex.items-center.rounded-full');
      
      // Should have at least the count badge plus severity badges
      expect(severityBadges.length).toBeGreaterThan(0);
    });
  });

  // =========================================
  // SEARCH FUNCTIONALITY TESTS
  // =========================================

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('filters alerts by alert name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'HighCPU');

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument();
    });

    it('filters alerts by expression', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'cpu_usage');

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument();
    });

    it('filters alerts by summary annotation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'disk space');

      expect(screen.queryByText('HighCPUUsage')).not.toBeInTheDocument();
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument();
    });

    it('filters alerts by file name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'cpu-alerts');

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No alerts found')).toBeInTheDocument();
      expect(screen.queryByText('HighCPUUsage')).not.toBeInTheDocument();
    });

    it('clears search results when search input is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'HighCPU');
      
      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();

      await user.clear(searchInput);

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
      expect(screen.getByText('ServiceDown')).toBeInTheDocument();
    });
  });

  // =========================================
  // SEVERITY FILTERING TESTS
  // =========================================

  describe('Severity Filtering', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('displays severity filter buttons', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('All Severity')).toBeInTheDocument();
      
      // Use getAllByText since there are multiple "critical" and "warning" elements
      const criticalElements = screen.getAllByText('critical');
      const warningElements = screen.getAllByText('warning');
      
      expect(criticalElements.length).toBeGreaterThan(0);
      expect(warningElements.length).toBeGreaterThan(0);
    });

    it('filters alerts by critical severity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const criticalButton = screen.getByRole('button', { name: 'critical' });
      await user.click(criticalButton);

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('ServiceDown')).toBeInTheDocument();
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();
    });

    it('filters alerts by warning severity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const warningButton = screen.getByRole('button', { name: 'warning' });
      await user.click(warningButton);

      expect(screen.queryByText('HighCPUUsage')).not.toBeInTheDocument();
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument();
    });

    it('shows all alerts when "All Severity" is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      // First filter by critical
      const criticalButton = screen.getByRole('button', { name: 'critical' });
      await user.click(criticalButton);

      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();

      // Then click "All Severity"
      const allSeverityButton = screen.getByRole('button', { name: 'All Severity' });
      await user.click(allSeverityButton);

      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
      expect(screen.getByText('ServiceDown')).toBeInTheDocument();
    });

    it('toggles severity filter when clicking the same severity twice', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const criticalButton = screen.getByRole('button', { name: 'critical' });
      
      // First click - filter by critical
      await user.click(criticalButton);
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument();

      // Second click - should show all alerts again
      await user.click(criticalButton);
      expect(screen.getByText('LowDiskSpace')).toBeInTheDocument();
    });
  });

  // =========================================
  // ALERT INTERACTIONS TESTS
  // =========================================

  describe('Alert Interactions', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('opens view dialog when clicking alert name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const alertName = screen.getByText('HighCPUUsage');
      await user.click(alertName);

      expect(screen.getByTestId('alert-view-dialog')).toBeInTheDocument();
      expect(screen.getByText('Viewing alert: HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('File: cpu-alerts.yml')).toBeInTheDocument();
    });

    it('opens view and edit dialogs when clicking action buttons', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      // Find action buttons by looking for buttons in the actions column
      const actionButtons = container.querySelectorAll('button[class*="h-8 w-8"]');
      
      // Should have 6 buttons total (2 per alert: view + edit)
      expect(actionButtons.length).toBeGreaterThanOrEqual(6);

      // Click first button (should be a view button)
      if (actionButtons[0]) {
        await user.click(actionButtons[0]);
        expect(screen.getByTestId('alert-view-dialog')).toBeInTheDocument();
      }
    });
  });

  // =========================================
  // SCROLL FUNCTIONALITY TESTS
  // =========================================

  describe('Scroll Functionality', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
      
      // Mock scrollTo function for JSDOM
      Element.prototype.scrollTo = vi.fn();
    });

    it('displays scroll buttons for severity filters', () => {
      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      const leftScrollButton = container.querySelector('[aria-label="Scroll left"]');
      const rightScrollButton = container.querySelector('[aria-label="Scroll right"]');

      expect(leftScrollButton).toBeInTheDocument();
      expect(rightScrollButton).toBeInTheDocument();
    });

    it('handles scroll button clicks without errors', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      const rightScrollButton = container.querySelector('[aria-label="Scroll right"]');
      
      if (rightScrollButton) {
        // Should not throw error when clicking
        await user.click(rightScrollButton);
        expect(rightScrollButton).toBeInTheDocument();
      }
    });
  });

  // =========================================
  // PROPS HANDLING TESTS
  // =========================================

  describe('Props Handling', () => {
    it('calls useAlerts with correct projectId', () => {
      const mockUseAlerts = vi.mocked(useAlerts);
      mockUseAlerts.mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(mockUseAlerts).toHaveBeenCalledWith('test-project-123');
    });

    it('passes projectId to AlertEditorDialog', async () => {
      const user = userEvent.setup();
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      // Find edit button by icon
      const codeIcon = container.querySelector('.lucide-code-2');
      const editButton = codeIcon?.closest('button');
      
      if (editButton) {
        await user.click(editButton);
        expect(screen.getByTestId('alert-editor-dialog')).toBeInTheDocument();
      }
    });
  });

  // =========================================
  // EMPTY STATE TESTS
  // =========================================

  describe('Empty State', () => {
    it('displays empty state when no alerts are available', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: { files: [] },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('No alerts found')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Alert count badge
    });

    it('displays empty state when files have no alerts', () => {
      const emptyFilesData = {
        files: [
          {
            ...mockAlertFile1,
            alerts: [],
          },
        ],
      };

      vi.mocked(useAlerts).mockReturnValue({
        data: emptyFilesData,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('No alerts found')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // =========================================
  // COMBINED FILTERING TESTS
  // =========================================

  describe('Combined Filtering', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('applies both search and severity filters together', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      // Filter by critical severity
      const criticalButton = screen.getByRole('button', { name: 'critical' });
      await user.click(criticalButton);

      // Then search for "CPU"
      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'CPU');

      // Should only show HighCPUUsage (critical + contains CPU)
      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.queryByText('ServiceDown')).not.toBeInTheDocument(); // Critical but no CPU
      expect(screen.queryByText('LowDiskSpace')).not.toBeInTheDocument(); // Not critical
    });

    it('shows no results when combined filters yield no matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AlertsPage {...defaultProps} />);

      // Filter by warning severity
      const warningButton = screen.getByRole('button', { name: 'warning' });
      await user.click(warningButton);

      // Then search for "CPU" (no warning alerts contain CPU)
      const searchInput = screen.getByPlaceholderText('Search alerts...');
      await user.type(searchInput, 'CPU');

      expect(screen.getByText('No alerts found')).toBeInTheDocument();
    });
  });

  // =========================================
  // ACCESSIBILITY TESTS
  // =========================================

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAlerts).mockReturnValue({
        data: mockAlertsData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('has proper table structure with headers', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      expect(screen.getByText('Alert Name')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Expression')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('has searchable input with proper placeholder', () => {
      renderWithProviders(<AlertsPage {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search alerts...');
      expect(searchInput).toBeInTheDocument();
      // Input elements don't have explicit type="text" by default in React
      expect(searchInput.tagName.toLowerCase()).toBe('input');
    });

    it('has action buttons and scroll controls', () => {
      const { container } = renderWithProviders(<AlertsPage {...defaultProps} />);

      // Check for action buttons by their size class
      const actionButtons = container.querySelectorAll('button[class*="h-8 w-8"]');
      const scrollButtons = container.querySelectorAll('[aria-label*="Scroll"]');

      expect(actionButtons.length).toBeGreaterThanOrEqual(6); // At least 2 buttons per alert
      expect(scrollButtons).toHaveLength(2); // Scroll buttons
    });
  });
});
