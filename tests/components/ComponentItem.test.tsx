import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentItem } from '../../src/components/ComponentItem';
import type { Component } from '../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock the useComponentOwner hook
vi.mock('../../src/hooks/useComponentOwner');

import { useComponentOwner } from '../../src/hooks/useComponentOwner';
const mockUseComponentOwner = vi.mocked(useComponentOwner);

// Mock UI components
vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, className, style, variant, ...props }: any) => (
    <span
      data-testid="badge"
      className={className}
      style={style}
      data-variant={variant}
      {...props}
    >
      {children}
    </span>
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
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

// Mock GithubIcon
vi.mock('../../src/components/icons/GithubIcon', () => ({
  GithubIcon: ({ className }: any) => <div data-testid="github-icon" className={className} />,
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ComponentItem', () => {
  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component for testing purposes',
    owner_ids: ['team-1'],
    github: 'https://github.com/example/test-service',
  };

  const mockOnComponentClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockOnComponentClick.mockClear();
    
    // Default mock return for useComponentOwner
    mockUseComponentOwner.mockReturnValue({
      teamNames: ['Test Team'],
      teamColors: ['#3b82f6'],
      owner_ids: ['team-1'],
      displayName: 'Test Team',
      sortKey: 'test team',
    });
  });

  it('should render component with all elements and handle interactions', () => {
    render(<ComponentItem component={mockComponent} onComponentClick={mockOnComponentClick} />);

    // Basic rendering
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('A test service component for testing purposes')).toBeInTheDocument();
    
    // GitHub button
    const githubButton = screen.getByText('GitHub');
    expect(githubButton).toBeInTheDocument();
    expect(screen.getByTestId('github-icon')).toBeInTheDocument();
    
    // Click interactions
    const componentDiv = screen.getByText('Test Service').closest('div');
    fireEvent.click(componentDiv!);
    expect(mockOnComponentClick).toHaveBeenCalledWith('test-service');
    
    // GitHub button click
    fireEvent.click(githubButton);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://github.com/example/test-service',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should handle missing data gracefully', () => {
    const minimalComponent: Component = {
      id: 'minimal',
      name: 'minimal-service',
      title: '',
      description: '',
      owner_ids: [],
      github: '',
    };

    render(<ComponentItem component={minimalComponent} />);

    // Should render name when title is missing
    expect(screen.getByText('minimal-service')).toBeInTheDocument();
    
    // Should not render GitHub button when data is missing
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    
    // Should not render description when it's empty
    expect(screen.queryByText('A test service component for testing purposes')).not.toBeInTheDocument();
  });

  it('should prevent button click propagation', () => {
    render(<ComponentItem component={mockComponent} onComponentClick={mockOnComponentClick} />);

    // Button clicks should not trigger component callback
    fireEvent.click(screen.getByText('GitHub'));
    expect(mockOnComponentClick).not.toHaveBeenCalled();
    
    fireEvent.click(screen.getByTestId('github-icon'));
    expect(mockOnComponentClick).not.toHaveBeenCalled();
  });

  it('should not render description when it is not provided', () => {
    const componentWithoutDescription = { ...mockComponent, description: '' };
    render(<ComponentItem component={componentWithoutDescription} />);

    // Should render title
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    
    // Should not render description paragraph
    expect(screen.queryByText('A test service component for testing purposes')).not.toBeInTheDocument();
  });

  it('should not open invalid URLs', () => {
    const componentWithInvalidGithub = { ...mockComponent, github: '#' };
    render(<ComponentItem component={componentWithInvalidGithub} />);

    fireEvent.click(screen.getByText('GitHub'));
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });
});
