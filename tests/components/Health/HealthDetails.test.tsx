import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthDetails } from '../../../src/components/Health/HealthDetails';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock the StatusBadge component
vi.mock('../../../src/components/Health/StatusBadge', () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

describe('HealthDetails', () => {
  const mockHealthResponse: HealthResponse = {
    status: 'UP',
    components: {
      database: {
        status: 'UP',
        description: 'Database connection is healthy',
        details: { connectionPool: 'active' },
      },
      circuitBreakers: {
        status: 'UP',
        components: {
          xsuaa: { status: 'UP' },
          redis: { status: 'DOWN' },
        },
      },
    },
  };

  it('should render component health information', () => {
    render(<HealthDetails response={mockHealthResponse} />);
    expect(screen.getByText('Health Components')).toBeTruthy();
    expect(screen.getByText('database')).toBeTruthy();
    expect(screen.getByText('circuitBreakers')).toBeTruthy();
  });

  it('should render nested components recursively', () => {
    render(<HealthDetails response={mockHealthResponse} />);
    expect(screen.getByText('xsuaa')).toBeTruthy();
    expect(screen.getByText('redis')).toBeTruthy();
  });

  it('should handle JSON expansion', () => {
    const responseWithComplexDetails: HealthResponse = {
      status: 'UP',
      components: {
        service: {
          status: 'UP',
          details: { config: { timeout: 5000 } },
        },
      },
    };

    render(<HealthDetails response={responseWithComplexDetails} />);
    const expandButton = screen.getByText('expand object');
    fireEvent.click(expandButton);
    expect(screen.getByText('collapse object')).toBeTruthy();
  });

  it('should show empty state when no components', () => {
    const emptyResponse: HealthResponse = { status: 'UP', components: {} };
    render(<HealthDetails response={emptyResponse} />);
    expect(screen.getByText('No detailed health information available')).toBeTruthy();
  });
});
