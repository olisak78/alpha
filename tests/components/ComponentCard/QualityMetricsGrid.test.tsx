import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QualityMetricsGrid } from '../../../src/components/ComponentCard/QualityMetricsGrid';
import type { Component } from '../../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock the useSonarMeasures hook
vi.mock('../../../src/hooks/api/useSonarMeasures', () => ({
  useSonarMeasures: vi.fn(),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: ({ className }: any) => <div data-testid="check-circle-icon" className={className} />,
}));

// Mock MetricItem component
vi.mock('../../../src/components/ComponentCard/MetricItem', () => ({
  MetricItem: ({ icon, iconColor, value, label, isLoading }: any) => (
    <div data-testid="metric-item">
      <div data-testid="metric-icon" className={iconColor}>{icon.name}</div>
      <div data-testid="metric-value">{isLoading ? '...' : value}</div>
      <div data-testid="metric-label">{label}</div>
    </div>
  ),
}));

describe('QualityMetricsGrid', () => {
  let queryClient: QueryClient;
  let mockUseSonarMeasures: any;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    project_id: 'proj-1',
    owner_id: 'team-1',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
  };

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Get the mocked function
    const { useSonarMeasures } = await import('../../../src/hooks/api/useSonarMeasures');
    mockUseSonarMeasures = vi.mocked(useSonarMeasures);

    // Default mock implementation
    mockUseSonarMeasures.mockReturnValue({
      data: {
        coverage: 85,
        codeSmells: 5,
        vulnerabilities: 2,
        qualityGate: 'Passed',
      },
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render all four metric items with correct values and labels', () => {
      const { container } = renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const gridContainer = container.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid', 'grid-cols-4', 'gap-2');

      const metricItems = screen.getAllByTestId('metric-item');
      expect(metricItems).toHaveLength(4);

      const metricValues = screen.getAllByTestId('metric-value');
      const metricLabels = screen.getAllByTestId('metric-label');

      expect(metricValues[0]).toHaveTextContent('85%');
      expect(metricLabels[0]).toHaveTextContent('Coverage');
      expect(metricValues[1]).toHaveTextContent('2');
      expect(metricLabels[1]).toHaveTextContent('Vulns');
      expect(metricValues[2]).toHaveTextContent('5');
      expect(metricLabels[2]).toHaveTextContent('Smells');
      expect(metricValues[3]).toHaveTextContent('Passed');
      expect(metricLabels[3]).toHaveTextContent('Gate');
    });

    it('should apply correct icon colors', () => {
      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const metricIcons = screen.getAllByTestId('metric-icon');
      expect(metricIcons[0]).toHaveClass('text-blue-600'); // Coverage
      expect(metricIcons[1]).toHaveClass('text-yellow-600'); // Vulnerabilities
      expect(metricIcons[2]).toHaveClass('text-orange-600'); // Code Smells
      expect(metricIcons[3]).toHaveClass('text-green-600'); // Quality Gate (Passed)
    });
  });

  describe('Loading State', () => {
    it('should show loading state for all metrics when Sonar is loading', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const metricValues = screen.getAllByTestId('metric-value');
      metricValues.forEach(value => {
        expect(value).toHaveTextContent('...');
      });
    });
  });

  describe('Null/Missing Values', () => {
    it('should render N/A for null or undefined values', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: {
          coverage: null,
          codeSmells: undefined,
          vulnerabilities: null,
          qualityGate: null,
        },
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const metricValues = screen.getAllByTestId('metric-value');
      expect(metricValues[0]).toHaveTextContent('N/A%');
      expect(metricValues[1]).toHaveTextContent('N/A');
      expect(metricValues[2]).toHaveTextContent('N/A');
      expect(metricValues[3]).toHaveTextContent('N/A');
    });

    it('should handle missing data gracefully', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const metricValues = screen.getAllByTestId('metric-value');
      metricValues.forEach(value => {
        expect(value).toHaveTextContent('N/A');
      });
    });
  });

  describe('Quality Gate Colors', () => {
    it('should apply green color for passed quality gate and red for failed', () => {
      const { rerender } = renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      let metricIcons = screen.getAllByTestId('metric-icon');
      expect(metricIcons[3]).toHaveClass('text-green-600');

      mockUseSonarMeasures.mockReturnValue({
        data: { coverage: 85, codeSmells: 5, vulnerabilities: 2, qualityGate: 'Failed' },
        isLoading: false,
        error: null,
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <QualityMetricsGrid component={mockComponent} />
        </QueryClientProvider>
      );

      metricIcons = screen.getAllByTestId('metric-icon');
      expect(metricIcons[3]).toHaveClass('text-red-500');
    });
  });

  describe('Hook Integration', () => {
    it('should call useSonarMeasures with correct parameters', () => {
      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);
      expect(mockUseSonarMeasures).toHaveBeenCalledWith(
        'https://sonar.example.com/dashboard?id=test-service',
        true
      );

      const componentWithoutSonar = { ...mockComponent, sonar: undefined };
      renderWithQueryClient(<QualityMetricsGrid component={componentWithoutSonar} />);
      expect(mockUseSonarMeasures).toHaveBeenCalledWith(null, true);
    });

    it('should handle API errors gracefully', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Sonar API error'),
      });

      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);
      expect(screen.getAllByTestId('metric-item')).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero and extreme values correctly', () => {
      mockUseSonarMeasures.mockReturnValue({
        data: {
          coverage: 0,
          codeSmells: 9999,
          vulnerabilities: 0,
          qualityGate: 'Unknown Status',
        },
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(<QualityMetricsGrid component={mockComponent} />);

      const metricValues = screen.getAllByTestId('metric-value');
      expect(metricValues[0]).toHaveTextContent('0%');
      expect(metricValues[1]).toHaveTextContent('0');
      expect(metricValues[2]).toHaveTextContent('9999');
      expect(metricValues[3]).toHaveTextContent('Unknown Status');

      // Non-"Passed" values should default to red
      const metricIcons = screen.getAllByTestId('metric-icon');
      expect(metricIcons[3]).toHaveClass('text-red-500');
    });
  });
});
