import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfrastructureCard } from '../../../src/components/ComponentView/InfrastructureCard';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Server: ({ className }: { className?: string }) => <div data-testid="server-icon" className={className} />,
  Database: ({ className }: { className?: string }) => <div data-testid="database-icon" className={className} />,
  HardDrive: ({ className }: { className?: string }) => <div data-testid="hard-drive-icon" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info-icon" className={className} />,
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

vi.mock('../../../src/components/ui/collapsible', () => ({
  Collapsible: ({ children, defaultOpen }: { children: React.ReactNode; defaultOpen?: boolean }) => (
    <div data-testid="collapsible" data-default-open={defaultOpen}>{children}</div>
  ),
  CollapsibleContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-content" className={className}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-trigger" className={className}>{children}</div>
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

describe('InfrastructureCard', () => {
  const mockHealthData: HealthResponse = {
    status: 'UP',
    healthy: true,
    healthURL: 'https://test-service.cfapps.production/health',
    details: {
      components: {
        db: {
          status: 'UP',
          details: {
            database: 'PostgreSQL',
            validationQuery: 'isValid()',
            result: 1,
          },
        },
        kafka: {
          status: 'UP',
          components: {
            'kafka-cluster-1': { status: 'UP' },
          },
        },
        redis: {
          status: 'UP',
          details: {
            version: '6.2.0',
            mode: 'standalone',
            memory: '1024MB',
          },
        },
      },
    },
  };

  it('should render card structure with title and icon', () => {
    render(<InfrastructureCard healthData={mockHealthData} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toHaveClass('pb-3');
    expect(screen.getByTestId('card-content')).toHaveClass('space-y-2');
    expect(screen.getByTestId('card-title')).toHaveClass('text-sm', 'font-semibold', 'flex', 'items-center', 'gap-2');
    expect(screen.getByTestId('server-icon')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
  });

  it('should render database component with details and collapsible behavior', () => {
    render(<InfrastructureCard healthData={mockHealthData} />);
    
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByTestId('database-icon')).toBeInTheDocument();
    // Get all info icons and check that at least one exists
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
    // Get all collapsible contents and check that at least one exists
    const collapsibleContents = screen.getAllByTestId('collapsible-content');
    expect(collapsibleContents.length).toBeGreaterThan(0);
    
    // Check collapsible is defaultOpen
    const collapsibles = screen.getAllByTestId('collapsible');
    expect(collapsibles[0]).toHaveAttribute('data-default-open', 'true');
  });

  it('should render Redis component with version display', () => {
    render(<InfrastructureCard healthData={mockHealthData} />);
    
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByTestId('hard-drive-icon')).toBeInTheDocument();
    expect(screen.getByText('v6.2.0')).toBeInTheDocument();
  });

  it('should handle Redis without version', () => {
    const healthDataWithoutRedisVersion = {
      ...mockHealthData,
      details: {
        components: {
          ...mockHealthData.details?.components,
          redis: { status: 'UP', details: { mode: 'standalone' } },
        },
      },
    };
    
    render(<InfrastructureCard healthData={healthDataWithoutRedisVersion} />);
    expect(screen.queryByText(/v\d+\.\d+\.\d+/)).not.toBeInTheDocument();
  });

  it('should render Kafka as nested component', () => {
    render(<InfrastructureCard healthData={mockHealthData} />);
    
    const nestedComponents = screen.getAllByTestId('nested-health-component');
    const kafkaComponent = nestedComponents.find(
      component => component.getAttribute('data-name') === 'Kafka'
    );
    
    expect(kafkaComponent).toBeInTheDocument();
    expect(kafkaComponent?.getAttribute('data-status')).toBe('UP');
  });

  it('should handle missing components gracefully', () => {
    const healthDataWithEmptyComponents = {
      ...mockHealthData,
      details: { components: {} },
    };

    render(<InfrastructureCard healthData={healthDataWithEmptyComponents} />);
    
    // Should still render the card structure
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    
    // But no individual components
    expect(screen.queryByText('Database')).not.toBeInTheDocument();
    expect(screen.queryByText('Redis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nested-health-component')).not.toBeInTheDocument();
  });

  it('should render multiple status dots with different statuses', () => {
    const healthDataWithMixedStatus = {
      ...mockHealthData,
      details: {
        components: {
          db: { status: 'DOWN', details: {} },
          redis: { status: 'UP', details: { version: '6.2.0' } },
          kafka: { status: 'UNKNOWN', components: {} },
        },
      },
    };

    render(<InfrastructureCard healthData={healthDataWithMixedStatus} />);
    
    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots.length).toBeGreaterThanOrEqual(2);
    
    // Check that different statuses are represented
    const statusValues = statusDots.map(dot => dot.getAttribute('data-status'));
    expect(statusValues).toContain('DOWN');
    expect(statusValues).toContain('UP');
  });
});
