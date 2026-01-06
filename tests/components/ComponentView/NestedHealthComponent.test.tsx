import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NestedHealthComponent } from '../../../src/components/ComponentView/NestedHealthComponent';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange }: { 
    children: React.ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="collapsible" data-open={open}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-content" className={className}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-trigger" className={className}>{children}</div>
  ),
}));

// Mock StatusDot
vi.mock('../../../src/components/ComponentView/StatusDot', () => ({
  StatusDot: ({ status }: { status?: string | boolean }) => (
    <div data-testid="status-dot" data-status={status?.toString()} />
  ),
}));

describe('NestedHealthComponent', () => {
  const mockDataWithComponents = {
    status: 'UP',
    components: {
      'sub-component-1': { status: 'UP' },
      'sub-component-2': { status: 'DOWN' },
    },
  };

  const mockDataWithDetails = {
    status: 'UP',
    details: {
      version: '1.0.0',
      mode: 'active',
      connections: 5,
    },
  };

  const mockSimpleData = { status: 'UP' };

  it('should render basic component structure with name and status', () => {
    render(<NestedHealthComponent name="Test Component" data={mockSimpleData} />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByTestId('status-dot')).toHaveAttribute('data-status', 'UP');
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
    expect(screen.getByTestId('collapsible-trigger')).toBeInTheDocument();
    // No collapsible content for simple data
    expect(screen.queryByTestId('collapsible-content')).not.toBeInTheDocument();
  });

  it('should render description when available', () => {
    const dataWithDescription = {
      status: 'UP',
      description: 'Test component description',
      details: { version: '1.0.0' },
    };

    render(<NestedHealthComponent name="Test Component" data={dataWithDescription} />);

    expect(screen.getByText('- Test component description')).toBeInTheDocument();
  });

  it('should render details with proper formatting', () => {
    const dataWithMixedDetails = {
      status: 'UP',
      details: {
        version: '1.0.0',
        maxConnections: 100,
        config: { timeout: 30, retries: 3 },
      },
    };

    render(<NestedHealthComponent name="Test Component" data={dataWithMixedDetails} />);

    expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();
    // Test key formatting
    expect(screen.getByText('version')).toBeInTheDocument();
    expect(screen.getByText('max Connections')).toBeInTheDocument();
    expect(screen.getByText('config')).toBeInTheDocument();
    // Test values
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('{"timeout":30,"retries":3}')).toBeInTheDocument();
  });

  it('should render nested components recursively', () => {
    render(<NestedHealthComponent name="Parent Component" data={mockDataWithComponents} />);

    // Parent component
    expect(screen.getByText('Parent Component')).toBeInTheDocument();
    // Nested components
    expect(screen.getByText('sub-component-1')).toBeInTheDocument();
    expect(screen.getByText('sub-component-2')).toBeInTheDocument();
    
    // Multiple collapsibles and status dots
    const collapsibles = screen.getAllByTestId('collapsible');
    const statusDots = screen.getAllByTestId('status-dot');
    expect(collapsibles.length).toBe(3); // Parent + 2 nested
    expect(statusDots.length).toBe(3);
    
    // Check status values
    expect(statusDots[0]).toHaveAttribute('data-status', 'UP'); // Parent
    expect(statusDots[1]).toHaveAttribute('data-status', 'UP'); // sub-component-1
    expect(statusDots[2]).toHaveAttribute('data-status', 'DOWN'); // sub-component-2
  });

  it('should apply correct padding based on nesting level', () => {
    const { container: container1 } = render(
      <NestedHealthComponent name="Level 0" data={mockSimpleData} />
    );
    const { container: container2 } = render(
      <NestedHealthComponent name="Level 2" data={mockSimpleData} level={2} />
    );

    expect(container1.firstChild as HTMLElement).toHaveStyle({ paddingLeft: '0rem' });
    expect(container2.firstChild as HTMLElement).toHaveStyle({ paddingLeft: '2rem' });
  });

  it('should handle different status values', () => {
    render(<NestedHealthComponent name="Down Component" data={{ status: 'DOWN' }} />);
    expect(screen.getByTestId('status-dot')).toHaveAttribute('data-status', 'DOWN');
  });

  it('should have correct styling classes for expandable content', () => {
    render(<NestedHealthComponent name="Test Component" data={mockDataWithDetails} />);

    const trigger = screen.getByTestId('collapsible-trigger');
    const content = screen.getByTestId('collapsible-content');
    
    expect(trigger).toHaveClass('w-full');
    expect(content).toHaveClass('mt-1', 'space-y-1');
  });
});
