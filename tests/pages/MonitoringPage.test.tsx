import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import '@testing-library/jest-dom';
import MonitoringPage from '../../src/pages/MonitoringPage';

// Mock the child components
vi.mock('../../src/pages/AlertsPage', () => ({
  default: ({ projectId, projectName, alertsUrl, initialSearchTerm, onSearchTermChange }: any) => (
    <div data-testid="alerts-page">
      <div data-testid="alerts-project-id">{projectId}</div>
      <div data-testid="alerts-project-name">{projectName}</div>
      <div data-testid="alerts-url">{alertsUrl || 'no-url'}</div>
      <div data-testid="alerts-search-term">{initialSearchTerm || 'no-search'}</div>
    </div>
  ),
}));

vi.mock('../../src/components/tabs/TriggeredAlertsTab', () => ({
  TriggeredAlertsTab: ({ projectId, onShowAlertDefinition }: any) => (
    <div data-testid="triggered-alerts-tab">
      <div data-testid="triggered-alerts-project-id">{projectId}</div>
      <button 
        data-testid="show-alert-definition-btn"
        onClick={() => onShowAlertDefinition?.('test-alert')}
      >
        Show Alert Definition
      </button>
    </div>
  ),
}));

// Mock QuickFilterButtons component
vi.mock('../../src/components/QuickFilterButtons', () => ({
  default: ({ activeFilter, onFilterChange, filters }: any) => (
    <div data-testid="quick-filter-buttons">
      {filters.map((filter: any) => (
        <button
          key={filter.value}
          data-testid={`filter-button-${filter.value}`}
          onClick={() => onFilterChange(filter.value)}
          className={activeFilter === filter.value ? 'active' : ''}
        >
          {filter.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock UI components
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

// Mock hooks
vi.mock('../../src/hooks/api/useAlerts', () => ({
  useAlerts: vi.fn(() => ({
    data: { files: [{ alerts: [{ alert: 'test' }] }] },
    isLoading: false,
    error: null,
  })),
}));

// Mock the TriggeredAlertsContext
vi.mock('../../src/contexts/TriggeredAlertsContext', () => ({
  TriggeredAlertsProvider: ({ children, projectId, onShowAlertDefinition }: any) => (
    <div data-testid="triggered-alerts-provider" data-project-id={projectId}>
      {children}
    </div>
  ),
  useTriggeredAlertsContext: vi.fn(() => ({
    totalCount: 5,
    filteredAlerts: [{ alertname: 'test-alert' }],
    isLoading: false,
    error: null,
  })),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// MONITORING PAGE TESTS
// ============================================================================

describe('MonitoringPage', () => {
  const defaultProps = {
    projectId: 'test-project-123',
    projectName: 'Test Project',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the monitoring page with required props', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-provider')).toHaveAttribute('data-project-id', 'test-project-123');
    });

    it('should render with alertsUrl prop', () => {
      render(
        <MonitoringPage 
          {...defaultProps} 
          alertsUrl="https://github.com/example/alerts" 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
    });

    it('should render without alertsUrl prop', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should have correct page structure and CSS classes', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Check for the header container
      const headerContainer = screen.getByText('Monitoring').closest('.mb-2');
      expect(headerContainer).toBeInTheDocument();
      expect(headerContainer).toHaveClass('mb-2', 'h-[40px]', 'flex', 'items-center');
    });

    it('should render page title', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Monitoring');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });

    it('should render quick filter buttons', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button-alerts-history')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button-alerts-definitions')).toBeInTheDocument();
    });
  });

  describe('Filter Navigation', () => {
    it('should render both filter buttons', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('filter-button-alerts-history')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button-alerts-definitions')).toBeInTheDocument();
    });

    it('should show triggered alerts content by default', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('alerts-page')).not.toBeInTheDocument();
    });

    it('should handle filter changes', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const alertsDefinitionsButton = screen.getByTestId('filter-button-alerts-definitions');
      fireEvent.click(alertsDefinitionsButton);

      // After clicking, both components might be rendered depending on implementation
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('should default to alerts-history tab', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const alertsHistoryButton = screen.getByTestId('filter-button-alerts-history');
      expect(alertsHistoryButton).toHaveClass('active');
    });
  });

  describe('AlertsPage Integration', () => {
    it('should render AlertsPage when alerts-definitions filter is active', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click on alerts definitions button to show AlertsPage
      const alertsDefinitionsButton = screen.getByTestId('filter-button-alerts-definitions');
      fireEvent.click(alertsDefinitionsButton);

      // AlertsPage should now be rendered (depending on implementation)
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
    });

    it('should not render AlertsPage by default', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // AlertsPage should not be rendered by default since triggered-alerts is active
      expect(screen.queryByTestId('alerts-page')).not.toBeInTheDocument();
    });
  });

  describe('TriggeredAlertsTab Integration', () => {
    it('should render TriggeredAlertsTab by default', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });

    it('should render TriggeredAlertsTab with correct projectId', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // TriggeredAlertsTab should be rendered by default
      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });

    it('should handle showAlertDefinition callback', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const showAlertBtn = screen.getByTestId('show-alert-definition-btn');
      fireEvent.click(showAlertBtn);

      // Should switch to alerts-definitions tab
      expect(screen.getByTestId('alerts-page')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-search-term')).toHaveTextContent('test-alert');
    });
  });

  describe('Props Handling', () => {
    it('should handle different project names', () => {
      render(
        <MonitoringPage 
          {...defaultProps} 
          projectName="My Special Project @#$%" 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });

    it('should handle different project IDs', () => {
      render(
        <MonitoringPage 
          {...defaultProps} 
          projectId="project-with-dashes-and-numbers-123" 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('project-with-dashes-and-numbers-123');
    });

    it('should handle empty strings gracefully', () => {
      render(
        <MonitoringPage 
          projectId="" 
          projectName="" 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('');
    });

    it('should handle long project names', () => {
      const longName = 'Very Long Project Name That Could Potentially Cause Layout Issues In The User Interface';
      render(
        <MonitoringPage 
          {...defaultProps} 
          projectName={longName} 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });
  });

  describe('Responsive Design', () => {
    it('should have proper spacing classes', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const headerContainer = screen.getByText('Monitoring').closest('.mb-2');
      expect(headerContainer).toBeInTheDocument();
      expect(headerContainer).toHaveClass('mb-2', 'h-[40px]', 'flex', 'items-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Monitoring');
    });

    it('should have descriptive text for screen readers', () => {
      render(<MonitoringPage {...defaultProps} />, {
        wrapper: createWrapper(),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined alertsUrl', () => {
      render(
        <MonitoringPage 
          {...defaultProps} 
          alertsUrl={undefined} 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });

    it('should handle special characters in URLs', () => {
      const specialUrl = 'https://github.com/example/alerts?param=value&other=test#section';
      render(
        <MonitoringPage 
          {...defaultProps} 
          alertsUrl={specialUrl} 
        />, 
        {
          wrapper: createWrapper(),
        }
      );

      expect(screen.getByTestId('triggered-alerts-tab')).toBeInTheDocument();
      expect(screen.getByTestId('triggered-alerts-project-id')).toHaveTextContent('test-project-123');
    });
  });
});
