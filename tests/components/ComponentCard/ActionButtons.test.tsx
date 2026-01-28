import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionButtons } from '../../../src/components/ComponentCard/ActionButtons';
import type { Component } from '../../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock icons
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
}));

vi.mock('../../../src/components/icons/GithubIcon', () => ({
  GithubIcon: ({ className }: any) => <div data-testid="github-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: any) => (
    <button
      type="button"
      data-testid="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ActionButtons', () => {
  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    project_id: 'proj-1',
    owner_id: 'team-1',
    github: 'https://github.com/example/test-service',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  describe('Rendering', () => {
    it('should render both buttons when URLs are provided', () => {
      render(<ActionButtons component={mockComponent} />);

      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Sonar')).toBeInTheDocument();
      expect(screen.getByTestId('github-icon')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should not render buttons when URLs are missing or empty', () => {
      const componentWithoutUrls = { ...mockComponent, github: '', sonar: undefined };
      render(<ActionButtons component={componentWithoutUrls} />);

      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
      expect(screen.queryByText('Sonar')).not.toBeInTheDocument();
    });

    it('should not render buttons for whitespace-only URLs', () => {
      const componentWithWhitespaceUrls = { ...mockComponent, github: '   ', sonar: '\t\n  ' };
      render(<ActionButtons component={componentWithWhitespaceUrls} />);

      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
      expect(screen.queryByText('Sonar')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should open URLs when buttons are clicked', () => {
      render(<ActionButtons component={mockComponent} />);

      fireEvent.click(screen.getByText('GitHub'));
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/example/test-service',
        '_blank',
        'noopener,noreferrer'
      );

      fireEvent.click(screen.getByText('Sonar'));
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://sonar.example.com/dashboard?id=test-service',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not open invalid URLs', () => {
      const componentWithInvalidUrl = { ...mockComponent, github: '#' };
      render(<ActionButtons component={componentWithInvalidUrl} />);

      fireEvent.click(screen.getByText('GitHub'));
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should call onStopPropagation callback when provided', () => {
      const mockOnStopPropagation = vi.fn();
      render(<ActionButtons component={mockComponent} onStopPropagation={mockOnStopPropagation} />);

      fireEvent.click(screen.getByText('GitHub'));
      expect(mockOnStopPropagation).toHaveBeenCalled();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct button and container styles', () => {
      const { container } = render(<ActionButtons component={mockComponent} />);

      const buttonContainer = container.firstChild as HTMLElement;
      expect(buttonContainer).toHaveClass('flex', 'gap-2', 'justify-end', 'pb-6');

      const githubButton = screen.getByText('GitHub').closest('button');
      expect(githubButton).toHaveAttribute('data-variant', 'outline');
      expect(githubButton).toHaveAttribute('data-size', 'sm');
      expect(githubButton).toHaveClass('h-7', 'px-2', 'text-xs', 'pointer-events-auto');
    });

    it('should render icons with correct styling', () => {
      render(<ActionButtons component={mockComponent} />);

      const githubIcon = screen.getByTestId('github-icon');
      expect(githubIcon).toHaveClass('h-3', 'w-3', 'mr-1');
    });
  });
});
