import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthErrorDisplay } from '../../../src/components/ComponentView/HealthErrorDisplay';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

describe('HealthErrorDisplay', () => {
  it('should render error message with correct styling', () => {
    const errorMessage = 'Connection timeout';
    
    render(<HealthErrorDisplay healthError={errorMessage} />);
    
    // Check for card with error styling
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-red-200', 'bg-red-50');
    
    // Check for card content
    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toHaveClass('pt-6');
    
    // Check for error icon
    expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    
    // Check for error message
    expect(screen.getByText('Failed to fetch health data: Connection timeout')).toBeInTheDocument();
  });

  it('should render with different error messages', () => {
    const errorMessage = 'Network error occurred';
    
    render(<HealthErrorDisplay healthError={errorMessage} />);
    
    expect(screen.getByText('Failed to fetch health data: Network error occurred')).toBeInTheDocument();
  });

  it('should render with empty error message', () => {
    render(<HealthErrorDisplay healthError="" />);
    
    expect(screen.getByText(/Failed to fetch health data:/)).toBeInTheDocument();
  });

  it('should have correct text styling', () => {
    render(<HealthErrorDisplay healthError="Test error" />);
    
    const errorContainer = screen.getByText('Failed to fetch health data: Test error').parentElement;
    expect(errorContainer).toHaveClass('flex', 'items-center', 'gap-2', 'text-red-600');
    
    const errorText = screen.getByText('Failed to fetch health data: Test error');
    expect(errorText).toHaveClass('font-medium');
  });

  it('should render XCircle icon with correct styling', () => {
    render(<HealthErrorDisplay healthError="Test error" />);
    
    const icon = screen.getByTestId('x-circle-icon');
    expect(icon).toHaveClass('h-5', 'w-5');
  });
});
