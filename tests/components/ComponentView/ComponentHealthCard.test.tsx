import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentHealthCard } from '../../../src/components/ComponentView/ComponentHealthCard';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Activity: ({ className }: { className?: string }) => <div data-testid="activity-icon" className={className} />,
  Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
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

// Mock StatusDot and NestedHealthComponent
vi.mock('../../../src/components/ComponentView/StatusDot', () => ({
  StatusDot: ({ status }: { status?: string | boolean }) => (
    <div data-testid="status-dot" data-status={status?.toString()} />
  ),
}));

vi.mock('../../../src/components/ComponentView/NestedHealthComponent', () => ({
  NestedHealthComponent: ({ name, data }: { name: string; data: any }) => (
    <div data-testid="nested-health-component" data-name={name} data-status={data?.status} />
  ),
}));

describe('ComponentHealthCard', () => {
  const mockHealthData: HealthResponse = {
    status: 'UP',
    healthy: true,
    healthURL: 'https://test-service.cfapps.production/health',
    details: {
      components: {
        ping: { status: 'UP' },
        FetchAndRunJobsScheduler: { status: 'UP' },
        startup: { status: 'UP' },
        discoveryComposite: {
          status: 'UP',
          components: { 'discovery-client-1': { status: 'UP' } },
        },
        reactiveDiscoveryClients: {
          status: 'UP',
          components: { 'reactive-client-1': { status: 'UP' } },
        },
      },
    },
  };

  it('should render card structure with title and icon', () => {
    render(<ComponentHealthCard healthData={mockHealthData} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toHaveClass('pb-3');
    expect(screen.getByTestId('card-content')).toHaveClass('space-y-2');
    expect(screen.getByTestId('card-title')).toHaveClass('text-sm', 'font-semibold', 'flex', 'items-center', 'gap-2');
    // Get all activity icons and check that at least one exists
    const activityIcons = screen.getAllByTestId('activity-icon');
    expect(activityIcons.length).toBeGreaterThan(0);
    expect(screen.getByText('Component Health')).toBeInTheDocument();
  });

  it('should render basic health components when available', () => {
    render(<ComponentHealthCard healthData={mockHealthData} />);
    
    // Ping component
    expect(screen.getByText('Ping')).toBeInTheDocument();
    
    // Jobs Scheduler
    expect(screen.getByText('Jobs Scheduler')).toBeInTheDocument();
    
    // Startup
    expect(screen.getByText('Startup')).toBeInTheDocument();
    
    // Should have activity icons (multiple due to ping component and card title)
    const activityIcons = screen.getAllByTestId('activity-icon');
    expect(activityIcons.length).toBeGreaterThanOrEqual(2);
    
    // Should have Zap icons for scheduler and startup
    const zapIcons = screen.getAllByTestId('zap-icon');
    expect(zapIcons.length).toBeGreaterThanOrEqual(2);
    
    // Should have multiple status dots
    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots.length).toBeGreaterThanOrEqual(3);
  });

  it('should render nested health components', () => {
    render(<ComponentHealthCard healthData={mockHealthData} />);
    
    const nestedComponents = screen.getAllByTestId('nested-health-component');
    
    // Discovery Composite
    const discoveryComposite = nestedComponents.find(
      component => component.getAttribute('data-name') === 'Discovery Composite'
    );
    expect(discoveryComposite).toBeInTheDocument();
    expect(discoveryComposite?.getAttribute('data-status')).toBe('UP');
    
    // Reactive Discovery Clients
    const reactiveDiscoveryClients = nestedComponents.find(
      component => component.getAttribute('data-name') === 'Reactive Discovery Clients'
    );
    expect(reactiveDiscoveryClients).toBeInTheDocument();
    expect(reactiveDiscoveryClients?.getAttribute('data-status')).toBe('UP');
  });

  it('should handle missing components gracefully', () => {
    const healthDataWithEmptyComponents = {
      ...mockHealthData,
      details: { components: {} },
    };

    render(<ComponentHealthCard healthData={healthDataWithEmptyComponents} />);
    
    // Should still render the card structure
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Component Health')).toBeInTheDocument();
    
    // But no individual components
    expect(screen.queryByText('Ping')).not.toBeInTheDocument();
    expect(screen.queryByText('Jobs Scheduler')).not.toBeInTheDocument();
    expect(screen.queryByText('Startup')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nested-health-component')).not.toBeInTheDocument();
  });

  it('should handle different status values correctly', () => {
    const healthDataWithMixedStatus = {
      ...mockHealthData,
      details: {
        components: {
          ping: { status: 'DOWN' },
          FetchAndRunJobsScheduler: { status: 'UP' },
          startup: { status: 'UNKNOWN' },
        },
      },
    };

    render(<ComponentHealthCard healthData={healthDataWithMixedStatus} />);
    
    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots[0]).toHaveAttribute('data-status', 'DOWN');
    expect(statusDots[1]).toHaveAttribute('data-status', 'UP');
    expect(statusDots[2]).toHaveAttribute('data-status', 'UNKNOWN');
  });
});
