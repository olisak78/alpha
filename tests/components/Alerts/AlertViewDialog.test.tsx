import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AlertViewDialog, createPrometheusAlertData } from '../../../src/components/Alerts/AlertViewDialog';

// Mock the alertUtils utilities
vi.mock('../../../src/utils/alertUtils', () => ({
  formatDateTime: vi.fn((dateTime: string) => `Formatted: ${dateTime}`),
  getSeverityColor: vi.fn((severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === "critical") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (sev === "warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (sev === "info") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  }),
  getStatusColor: vi.fn((status: string) => {
    if (status === 'firing') return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (status === 'resolved') return "bg-green-500/10 text-green-600 dark:text-green-400";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  }),
}));

describe('AlertViewDialog Component', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prometheus Alerts', () => {
    const mockAlert = {
      alert: 'HighCPUUsage',
      expr: 'cpu_usage_percent > 80',
      for: '5m',
      labels: {
        severity: 'critical',
        team: 'platform',
        service: 'web-server',
      },
      annotations: {
        summary: 'High CPU usage detected',
        description: 'CPU usage has been above 80% for more than 5 minutes.',
      },
    };

    const mockFile = {
      name: 'cpu-alerts.yaml',
      category: 'performance',
    };

    const prometheusProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      alertData: createPrometheusAlertData(mockAlert, mockFile),
    };

    it('should render Prometheus alert with all sections', () => {
      render(<AlertViewDialog {...prometheusProps} />);

      // Title and file info
      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('cpu-alerts.yaml')).toBeInTheDocument();
      expect(screen.getByText('performance')).toBeInTheDocument();

      // Expression and duration
      expect(screen.getByText('Expression')).toBeInTheDocument();
      expect(screen.getByText('cpu_usage_percent > 80')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();

      // Annotations
      expect(screen.getByText('summary')).toBeInTheDocument();
      expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText(/CPU usage has been above 80%/)).toBeInTheDocument();
    });

    it('should not render sections when data is missing', () => {
      const minimalAlert = {
        alert: 'MinimalAlert',
      };
      const minimalProps = {
        ...prometheusProps,
        alertData: createPrometheusAlertData(minimalAlert as any, mockFile),
      };
      render(<AlertViewDialog {...minimalProps} />);

      expect(screen.getByText('MinimalAlert')).toBeInTheDocument();
      expect(screen.queryByText('Expression')).not.toBeInTheDocument();
      expect(screen.queryByText('Duration')).not.toBeInTheDocument();
      expect(screen.queryByText('Labels')).not.toBeInTheDocument();
    });
  });

  describe('Triggered Alerts', () => {
    const mockTriggeredAlert = {
      name: 'DatabaseConnectionFailure',
      severity: 'critical',
      status: 'firing',
      landscape: 'production',
      region: 'us-east-1',
      component: 'database-service',
      startsAt: '2023-12-14T10:00:00Z',
      endsAt: '2023-12-14T10:30:00Z',
      labels: {
        severity: 'critical',
        service: 'database',
        environment: 'prod',
      },
      annotations: {
        summary: 'Database connection failed',
        description: 'Unable to connect to the primary database instance.',
        runbook_url: 'https://runbooks.example.com/db-failure',
      },
    };

    const triggeredProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      alertData: mockTriggeredAlert,
    };

    it('should render triggered alert with all sections', () => {
      render(<AlertViewDialog {...triggeredProps} />);

      // Title and severity
      expect(screen.getByText('DatabaseConnectionFailure')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();

      // Status badge
      const statusBadge = screen.getByText('FIRING');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('text-red-600');

      // Time information
      expect(screen.getByText('Time Information')).toBeInTheDocument();
      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.getByText('Ended:')).toBeInTheDocument();
      expect(screen.getByText('14/12/2023 10:00')).toBeInTheDocument();
      expect(screen.getByText('14/12/2023 10:30')).toBeInTheDocument();

      // Annotations (without header)
      expect(screen.queryByText('Annotations')).not.toBeInTheDocument();
      expect(screen.getByText('summary')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the primary database instance.')).toBeInTheDocument();
      expect(screen.getByText('runbook url')).toBeInTheDocument();
      expect(screen.getByText('https://runbooks.example.com/db-failure')).toBeInTheDocument();

      // Should not display Prometheus-specific fields
      expect(screen.queryByText('Expression')).not.toBeInTheDocument();
      expect(screen.queryByText('Duration')).not.toBeInTheDocument();
    });

    it('should handle different status types with correct styling', () => {
      const resolvedAlert = {
        ...mockTriggeredAlert,
        status: 'resolved',
      };
      const resolvedProps = {
        ...triggeredProps,
        alertData: resolvedAlert,
      };
      render(<AlertViewDialog {...resolvedProps} />);

      const statusBadge = screen.getByText('RESOLVED');
      expect(statusBadge).toHaveClass('text-green-600');
    });

    it('should handle alert without end time', () => {
      const ongoingAlert = {
        ...mockTriggeredAlert,
        endsAt: undefined,
      };
      const ongoingProps = {
        ...triggeredProps,
        alertData: ongoingAlert,
      };
      render(<AlertViewDialog {...ongoingProps} />);

      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.queryByText('Ended:')).not.toBeInTheDocument();
    });
  });

  describe('Common functionality', () => {
    const basicAlertData = {
      name: 'TestAlert',
      severity: 'info',
      labels: {
        severity: 'info',
        team: 'platform',
        service: 'web-server',
      },
    };

    const basicProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      alertData: basicAlertData,
    };

    it('should not render when open is false', () => {
      render(<AlertViewDialog {...basicProps} open={false} />);

      expect(screen.queryByText('TestAlert')).not.toBeInTheDocument();
    });

    it('should display labels as badges for all alert types', () => {
      render(<AlertViewDialog {...basicProps} />);

      expect(screen.getByText('Labels')).toBeInTheDocument();
      expect(screen.getByText('severity')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('team')).toBeInTheDocument();
      expect(screen.getByText('platform')).toBeInTheDocument();
    });

    it('should handle different severity levels with correct styling', () => {
      const severityTests = [
        { severity: 'critical', expectedClass: 'text-red-600', expectedText: 'CRITICAL' },
        { severity: 'warning', expectedClass: 'text-amber-600', expectedText: 'WARNING' },
        { severity: 'info', expectedClass: 'text-blue-600', expectedText: 'INFO' },
        { severity: 'unknown', expectedClass: 'text-slate-700', expectedText: 'UNKNOWN' },
      ];

      severityTests.forEach(({ severity, expectedClass, expectedText }) => {
        const alertData = { ...basicAlertData, severity };
        const { unmount } = render(<AlertViewDialog {...basicProps} alertData={alertData} />);
        
        const severityBadge = screen.getByText(expectedText);
        expect(severityBadge).toHaveClass(expectedClass);
        
        unmount();
      });
    });

    it('should handle empty data gracefully', () => {
      const alertWithEmptyData = {
        name: 'EmptyAlert',
        labels: {},
        annotations: {},
      };
      render(<AlertViewDialog {...basicProps} alertData={alertWithEmptyData} />);

      expect(screen.getByText('EmptyAlert')).toBeInTheDocument();
      expect(screen.queryByText('Labels')).not.toBeInTheDocument();
      expect(screen.queryByText('Summary')).not.toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });
});
