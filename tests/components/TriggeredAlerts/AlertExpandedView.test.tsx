import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlertExpandedView } from '../../../src/components/TriggeredAlerts/AlertExpandedView';

// Mock the utility functions
vi.mock('../../../src/utils/alertUtils', () => ({
  getSeverityColor: vi.fn((severity) => `severity-${severity.toLowerCase()}`),
  getStatusColor: vi.fn((status) => `status-${status.toLowerCase()}`),
}));

// Mock the Badge component
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <div className={`badge ${className} ${variant}`} data-testid="badge">
      {children}
    </div>
  ),
}));

describe('AlertExpandedView', () => {
  const baseAlertData = {
    name: 'Test Alert',
    severity: 'critical',
    status: 'firing',
    landscape: 'production',
    region: 'us-east-1',
    component: 'test-component',
    startsAt: '2023-12-01T10:00:00Z',
    endsAt: '2023-12-01T11:00:00Z',
    labels: {
      service: 'test-service',
      team: 'platform'
    },
    annotations: {
      description: 'This is a test alert description',
      summary: 'Test alert summary'
    }
  };

  describe('Basic Rendering', () => {
    it('should render the component with basic alert data', () => {
      render(<AlertExpandedView alertData={baseAlertData} />);

      expect(screen.getByText('FIRING')).toBeInTheDocument();
      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.getByText('Ended:')).toBeInTheDocument();
    });

    it('should apply correct container styling', () => {
      const { container } = render(<AlertExpandedView alertData={baseAlertData} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass(
        'bg-gradient-to-r',
        'from-blue-50/50',
        'to-indigo-50/50',
        'border-l-4',
        'border-l-blue-500'
      );
    });

    it('should render with minimal alert data', () => {
      const minimalData = { name: 'Minimal Alert' };
      const { container } = render(<AlertExpandedView alertData={minimalData} />);

      // Should not crash and should render the main container
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-gradient-to-r', 'from-blue-50/50', 'to-indigo-50/50');
    });
  });

  describe('Status Section', () => {
    it('should render status badge when status is provided', () => {
      render(<AlertExpandedView alertData={baseAlertData} />);

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('FIRING')).toBeInTheDocument();

      const statusBadge = screen.getByText('FIRING').closest('.status-firing');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should not render status section when status is not provided', () => {
      const dataWithoutStatus = { ...baseAlertData, status: undefined };

      render(<AlertExpandedView alertData={dataWithoutStatus} />);

      expect(screen.queryByText('Status:')).not.toBeInTheDocument();
      expect(screen.queryByText('FIRING')).not.toBeInTheDocument();
    });

    it('should handle different status values', () => {
      const resolvedAlert = { ...baseAlertData, status: 'resolved' };
      render(<AlertExpandedView alertData={resolvedAlert} />);
      
      expect(screen.getByText('RESOLVED')).toBeInTheDocument();
      const statusBadge = screen.getByText('RESOLVED').closest('.status-resolved');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Time Information', () => {
    it('should render start and end times with correct styling', () => {
      render(<AlertExpandedView alertData={baseAlertData} />);

      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.getByText('Ended:')).toBeInTheDocument();

      // Check for the actual formatted date-time strings (UTC)
      expect(screen.getByText('01/12/2023 10:00:00')).toBeInTheDocument();
      expect(screen.getByText('01/12/2023 11:00:00')).toBeInTheDocument();

      const startDateElement = screen.getByText('01/12/2023 10:00:00');
      const endDateElement = screen.getByText('01/12/2023 11:00:00');

      [startDateElement, endDateElement].forEach(element => {
        expect(element).toHaveClass(
          'font-mono',
          'text-foreground'
        );
      });
    });

    it('should conditionally render time sections', () => {
      const dataWithoutEndTime = { ...baseAlertData, endsAt: undefined };
      render(<AlertExpandedView alertData={dataWithoutEndTime} />);

      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.queryByText('Ended:')).not.toBeInTheDocument();
      expect(screen.getByText('01/12/2023 10:00:00')).toBeInTheDocument();
      expect(screen.queryByText('01/12/2023 01:00:00')).not.toBeInTheDocument();
    });
  });

  describe('Annotations Section', () => {
    it('should render annotations with formatted keys and handle different value types', () => {
      const dataWithMixedAnnotations = {
        ...baseAlertData,
        annotations: {
          alert_description: 'Test description',
          count: 42,
          enabled: true
        }
      };

      render(<AlertExpandedView alertData={dataWithMixedAnnotations} />);

      // Keys are formatted with underscores replaced by spaces and capitalized
      expect(screen.getByText(/alert description:/i)).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText(/count:/i)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/enabled:/i)).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('should not render annotations section when empty or not provided', () => {
      const dataWithoutAnnotations = { ...baseAlertData, annotations: {} };
      render(<AlertExpandedView alertData={dataWithoutAnnotations} />);
      
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('Prometheus Alert Specific Fields', () => {
    it('should render expression and duration with correct styling', () => {
      const prometheusAlert = { ...baseAlertData, expr: 'up == 0', for: '5m' };
      render(<AlertExpandedView alertData={prometheusAlert} />);
      expect(screen.getByText('Expression')).toBeInTheDocument();
      expect(screen.getByText('up == 0')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();

      const expressionElement = screen.getByText('up == 0');
      expect(expressionElement).toHaveClass('font-mono', 'text-xs', 'whitespace-pre-wrap', 'break-words', 'leading-relaxed');

      const durationElement = screen.getByText('5m');
      expect(durationElement).toHaveClass('font-mono', 'text-sm', 'px-2.5', 'py-1');
    });

    it('should not render Prometheus fields when not provided', () => {
      render(<AlertExpandedView alertData={baseAlertData} />);
      
      expect(screen.queryByText('Expression')).not.toBeInTheDocument();
      expect(screen.queryByText('Duration')).not.toBeInTheDocument();
    });
  });

  describe('Context Information', () => {
    it('should render context information with correct styling', () => {
      const alertWithContext = {
        ...baseAlertData,
        contextInfo: { fileName: 'alerts.yml', category: 'infrastructure' }
      };

      render(<AlertExpandedView alertData={alertWithContext} />);

      expect(screen.getByText('File:')).toBeInTheDocument();
      expect(screen.getByText('alerts.yml')).toBeInTheDocument();
      expect(screen.getByText('Category:')).toBeInTheDocument();
      expect(screen.getByText('infrastructure')).toBeInTheDocument();

      const fileNameElement = screen.getByText('alerts.yml');
      expect(fileNameElement).toHaveClass('font-mono', 'break-all');
    });

    it('should handle partial or missing context information', () => {
      const partialContext = { ...baseAlertData, contextInfo: { fileName: 'alerts.yml' } };
      render(<AlertExpandedView alertData={partialContext} />);

      expect(screen.getByText('File:')).toBeInTheDocument();
      expect(screen.queryByText('Category:')).not.toBeInTheDocument();
    });
  });

  describe('Labels Section', () => {
    it('should render labels with correct styling and handle different value types', () => {
      const dataWithMixedLabels = {
        ...baseAlertData,
        labels: { service: 'test-service', port: 8080, enabled: false }
      };
      
      render(<AlertExpandedView alertData={dataWithMixedLabels} />);
      
      expect(screen.getByText('Labels')).toBeInTheDocument();
      expect(screen.getByText('test-service')).toBeInTheDocument();
      expect(screen.getByText('8080')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
      
      // Labels now use colon format (key:) instead of equals
      expect(screen.getByText('service:')).toBeInTheDocument();
      expect(screen.getByText('port:')).toBeInTheDocument();
      expect(screen.getByText('enabled:')).toBeInTheDocument();

      const labelBadges = screen.getAllByTestId('badge').filter(badge =>
        badge.textContent && ['test-service', '8080', 'false'].includes(badge.textContent)
      );
      labelBadges.forEach(badge => {
        expect(badge).toHaveClass('font-mono', 'text-xs', 'px-2', 'py-0.5');
      });
    });

    it('should not render labels section when empty or not provided', () => {
      const dataWithoutLabels = { ...baseAlertData, labels: {} };
      render(<AlertExpandedView alertData={dataWithoutLabels} />);
      
      expect(screen.queryByText('Labels')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should apply correct responsive layout and styling', () => {
      const { container } = render(<AlertExpandedView alertData={baseAlertData} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4');

      const headerSection = container.querySelector('.flex.flex-wrap');
      expect(headerSection).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-3', 'text-xs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or invalid alert data gracefully', () => {
      const { container } = render(<AlertExpandedView alertData={{} as any} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-gradient-to-r', 'from-blue-50/50', 'to-indigo-50/50', 'dark:from-blue-950/20', 'dark:to-indigo-950/20', 'border-l-4', 'border-l-blue-500');
    });

    it('should handle special characters and long text content', () => {
      const specialAlert = {
        ...baseAlertData,
        labels: { 'special-key': 'value@with#special$chars' },
        annotations: {
          description: 'This is a very long description that should wrap properly. '.repeat(5)
        }
      };

      render(<AlertExpandedView alertData={specialAlert} />);

      expect(screen.getByText('special-key:')).toBeInTheDocument();
      expect(screen.getByText('value@with#special$chars')).toBeInTheDocument();

      const descriptionElement = screen.getByText(/This is a very long description/);
      expect(descriptionElement).toHaveClass('text-sm', 'leading-relaxed', 'whitespace-pre-wrap');
    });
  });

  describe('Utility Function Integration', () => {
    it('should apply utility functions correctly', () => {
      render(<AlertExpandedView alertData={baseAlertData} />);

      // Status color classes applied
      const statusBadge = screen.getByText('FIRING').closest('.status-firing');
      expect(statusBadge).toBeInTheDocument();

      // Date formatting applied - check for actual formatted date-time strings (UTC)
      expect(screen.getByText('01/12/2023 10:00:00')).toBeInTheDocument();
      expect(screen.getByText('01/12/2023 11:00:00')).toBeInTheDocument();
    });
  });
});
