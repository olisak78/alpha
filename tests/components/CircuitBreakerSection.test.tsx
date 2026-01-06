import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircuitBreakerSection } from '../../src/components/CircuitBreakerSection';
import type { ComponentHealth } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Shield: ({ className }: { className?: string }) => <div data-testid="shield-icon" className={className} />,
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right-icon" className={className} />,
  Activity: ({ className }: { className?: string }) => <div data-testid="activity-icon" className={className} />,
  TrendingUp: ({ className }: { className?: string }) => <div data-testid="trending-up-icon" className={className} />,
  TrendingDown: ({ className }: { className?: string }) => <div data-testid="trending-down-icon" className={className} />,
  Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

describe('CircuitBreakerSection', () => {
  const mockCircuitBreakerWithDetails: ComponentHealth = {
    status: 'UP',
    details: {
      'circuit-breaker-1': {
        status: 'UP',
        details: {
          bufferedCalls: 10,
          failedCalls: 2,
          failureRate: '20.0%',
          failureRateThreshold: '50.0%',
          notPermittedCalls: 0,
          slowCallRate: '10.0%',
          slowCallRateThreshold: '30.0%',
          slowCalls: 1,
          slowFailedCalls: 0,
          state: 'CLOSED',
        },
      },
      'circuit-breaker-2': {
        status: 'DOWN',
        details: {
          bufferedCalls: 5,
          failedCalls: 5,
          failureRate: '100.0%',
          failureRateThreshold: '50.0%',
          notPermittedCalls: 3,
          slowCallRate: '0.0%',
          slowCallRateThreshold: '30.0%',
          slowCalls: 0,
          slowFailedCalls: 2,
          state: 'OPEN',
        },
      },
    },
  };

  const mockCircuitBreakerEmpty: ComponentHealth = {
    status: 'UP',
    details: {},
  };

  const mockCircuitBreakerNoDetails: ComponentHealth = {
    status: 'UP',
  };

  it('should render circuit breaker section with title and overall status', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    expect(screen.getByText('Circuit Breakers')).toBeInTheDocument();
    expect(screen.getByText('Overall Status')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
  });

  it('should render circuit breaker list when data exists', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);
    
    expect(screen.getByText('circuit-breaker-1')).toBeInTheDocument();
    expect(screen.getByText('circuit-breaker-2')).toBeInTheDocument();
  });

  it('should display count badge with correct number', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
    const badge = screen.getByText('2').closest('[data-testid="badge"]');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
  });

  it('should show empty state when no circuit breakers exist', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerEmpty} />);
    
    expect(screen.getByText('No circuit breaker details available')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should show empty state when details property is missing', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerNoDetails} />);
    
    expect(screen.getByText('No circuit breaker details available')).toBeInTheDocument();
  });

  it('should display correct state badges', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should handle circuit breaker expansion toggle', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    const circuitBreakerButton = screen.getByText('circuit-breaker-1').closest('button');
    expect(circuitBreakerButton).toBeInTheDocument();

    // Initially collapsed
    expect(screen.getAllByTestId('chevron-right-icon')).toHaveLength(2);

    // Click to expand
    fireEvent.click(circuitBreakerButton!);

    // Should now be expanded
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });

  it('should display call statistics when expanded', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    const circuitBreakerButton = screen.getByText('circuit-breaker-1').closest('button');
    fireEvent.click(circuitBreakerButton!);

    expect(screen.getByText('Call Statistics')).toBeInTheDocument();
    expect(screen.getByText('Buffered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Slow')).toBeInTheDocument();
    expect(screen.getByText('Not Permitted')).toBeInTheDocument();
  });

  it('should display performance rates when expanded', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    const circuitBreakerButton = screen.getByText('circuit-breaker-1').closest('button');
    fireEvent.click(circuitBreakerButton!);

    expect(screen.getByText('Performance Rates')).toBeInTheDocument();
    expect(screen.getByText('Failure Rate')).toBeInTheDocument();
    expect(screen.getByText('Slow Call Rate')).toBeInTheDocument();
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // failureRate
    expect(screen.getByText('10.0%')).toBeInTheDocument(); // slowCallRate
  });

  it('should display call statistics values correctly', () => {
    render(<CircuitBreakerSection circuitBreakers={mockCircuitBreakerWithDetails} />);

    const circuitBreakerButton = screen.getByText('circuit-breaker-1').closest('button');
    fireEvent.click(circuitBreakerButton!);

    expect(screen.getByText('10')).toBeInTheDocument(); // bufferedCalls
    expect(screen.getAllByText('2')).toHaveLength(2); // failedCalls (appears in badge and metric)
    expect(screen.getByText('1')).toBeInTheDocument(); // slowCalls
    expect(screen.getByText('0')).toBeInTheDocument(); // notPermittedCalls
  });

  it('should handle HALF_OPEN state correctly', () => {
    const circuitBreakerHalfOpen: ComponentHealth = {
      status: 'UP',
      details: {
        'circuit-breaker-half-open': {
          status: 'UP',
          details: {
            bufferedCalls: 5,
            failedCalls: 1,
            failureRate: '20.0%',
            failureRateThreshold: '50.0%',
            notPermittedCalls: 0,
            slowCallRate: '0.0%',
            slowCallRateThreshold: '30.0%',
            slowCalls: 0,
            slowFailedCalls: 0,
            state: 'HALF_OPEN',
          },
        },
      },
    };

    render(<CircuitBreakerSection circuitBreakers={circuitBreakerHalfOpen} />);

    expect(screen.getByText('Half Open')).toBeInTheDocument();
  });

  it('should handle circuit breaker without expandable details', () => {
    const circuitBreakerNoExpandableDetails: ComponentHealth = {
      status: 'UP',
      details: {
        'simple-circuit-breaker': {
          status: 'UP',
        },
      },
    };

    render(<CircuitBreakerSection circuitBreakers={circuitBreakerNoExpandableDetails} />);

    expect(screen.getByText('simple-circuit-breaker')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
  });
});
