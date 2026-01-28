import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PinButton } from '../../src/components/PinButton';
import type { Component } from '../../src/types/api';

/**
 * PinButton Component Tests
 * 
 * Tests for the PinButton component which allows users to pin/unpin components
 * with visual feedback and hover states.
 */

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Pin: ({ size, className, onClick, ...props }: any) => (
    <div
      data-testid="pin-icon"
      data-size={size}
      className={className}
      onClick={onClick}
      {...props}
    />
  ),
  PinOff: ({ size, className, onClick, ...props }: any) => (
    <div
      data-testid="pin-off-icon"
      data-size={size}
      className={className}
      onClick={onClick}
      {...props}
    />
  ),
}));

// Mock the usePinComponent hook
const mockTogglePin = vi.fn();
vi.mock('../../src/hooks/usePinComponent', () => ({
  usePinComponent: () => ({
    togglePin: mockTogglePin,
    isLoading: false,
  }),
}));

describe('PinButton Component', () => {
  const mockPinnedComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    owner_id: 'team-1',
    isPinned: true,
  };

  const mockUnpinnedComponent: Component = {
    id: 'comp-2',
    name: 'another-service',
    title: 'Another Service',
    description: 'Another test service component',
    owner_id: 'team-2',
    isPinned: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render correct icon based on pin state', () => {
      // Test pinned state
      const { rerender } = render(<PinButton component={mockPinnedComponent} />);
      expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('pin-off-icon')).not.toBeInTheDocument();

      // Test unpinned state
      rerender(<PinButton component={mockUnpinnedComponent} />);
      expect(screen.getByTestId('pin-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('pin-icon')).not.toBeInTheDocument();
    });

    it('should render PinOff icon when isPinned is undefined', () => {
      const componentWithoutPinState = { ...mockUnpinnedComponent };
      delete componentWithoutPinState.isPinned;
      
      render(<PinButton component={componentWithoutPinState} />);
      expect(screen.getByTestId('pin-off-icon')).toBeInTheDocument();
    });
  });

  describe('Styling and Props', () => {
    it('should apply correct default styling and size', () => {
      const { rerender } = render(<PinButton component={mockPinnedComponent} />);
      
      const pinIcon = screen.getByTestId('pin-icon');
      expect(pinIcon).toHaveAttribute('data-size', '16');
      expect(pinIcon).toHaveClass('text-blue-500', 'fill-current', 'cursor-pointer', 'hover:text-blue-600');

      rerender(<PinButton component={mockUnpinnedComponent} />);
      
      const pinOffIcon = screen.getByTestId('pin-off-icon');
      expect(pinOffIcon).toHaveAttribute('data-size', '16');
      expect(pinOffIcon).toHaveClass('text-gray-400', 'cursor-pointer', 'hover:text-blue-500');
    });

    it('should apply custom props correctly', () => {
      render(
        <PinButton
          component={mockUnpinnedComponent}
          className="custom-class"
          size={24}
          showOnHover={true}
        />
      );

      const pinOffIcon = screen.getByTestId('pin-off-icon');
      expect(pinOffIcon).toHaveAttribute('data-size', '24');
      expect(pinOffIcon).toHaveClass('custom-class');
      expect(pinOffIcon).toHaveClass('opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'duration-200');
    });

    it('should not apply hover opacity classes when showOnHover is false', () => {
      render(<PinButton component={mockUnpinnedComponent} showOnHover={false} />);

      const pinOffIcon = screen.getByTestId('pin-off-icon');
      expect(pinOffIcon).not.toHaveClass('opacity-0');
      expect(pinOffIcon).not.toHaveClass('group-hover:opacity-100');
    });
  });

  describe('Interactions', () => {
    it('should call togglePin when clicked', () => {
      const { rerender } = render(<PinButton component={mockPinnedComponent} />);

      // Test pinned component click
      fireEvent.click(screen.getByTestId('pin-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(mockPinnedComponent);

      // Test unpinned component click
      rerender(<PinButton component={mockUnpinnedComponent} />);
      fireEvent.click(screen.getByTestId('pin-off-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(mockUnpinnedComponent);
      expect(mockTogglePin).toHaveBeenCalledTimes(2);
    });

    it('should stop event propagation when clicked', () => {
      const mockParentClick = vi.fn();
      render(
        <div onClick={mockParentClick}>
          <PinButton component={mockPinnedComponent} />
        </div>
      );

      fireEvent.click(screen.getByTestId('pin-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(mockPinnedComponent);
      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Component Updates', () => {
    it('should update icon when pin state changes', () => {
      const { rerender } = render(<PinButton component={mockUnpinnedComponent} />);
      expect(screen.getByTestId('pin-off-icon')).toBeInTheDocument();

      // Change to pinned state
      const pinnedComponent = { ...mockUnpinnedComponent, isPinned: true };
      rerender(<PinButton component={pinnedComponent} />);
      expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('pin-off-icon')).not.toBeInTheDocument();
    });

    it('should handle different component objects correctly', () => {
      const component1 = { ...mockPinnedComponent, id: 'comp-1' };
      const component2 = { ...mockPinnedComponent, id: 'comp-2' };

      const { rerender } = render(<PinButton component={component1} />);
      fireEvent.click(screen.getByTestId('pin-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(component1);

      rerender(<PinButton component={component2} />);
      fireEvent.click(screen.getByTestId('pin-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(component2);
    });
  });

  describe('Error Handling', () => {
    it('should handle component without id gracefully', () => {
      const componentWithoutId = { ...mockPinnedComponent };
      delete (componentWithoutId as any).id;

      expect(() => {
        render(<PinButton component={componentWithoutId as any} />);
      }).not.toThrow();

      fireEvent.click(screen.getByTestId('pin-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(componentWithoutId);
    });

    it('should handle null/undefined component gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<PinButton component={null as any} />);
      }).toThrow();

      expect(() => {
        render(<PinButton component={undefined as any} />);
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('should work with complex component objects', () => {
      const complexComponent: Component = {
        id: 'complex-comp',
        name: 'complex-service',
        title: 'Complex Service',
        description: 'A complex service with metadata',
        owner_id: 'team-3',
        isPinned: false,
        metadata: {
          tags: ['backend', 'api'],
          domain: 'payments',
        },
        github: 'https://github.com/example/complex-service',
      };

      render(<PinButton component={complexComponent} />);
      fireEvent.click(screen.getByTestId('pin-off-icon'));
      expect(mockTogglePin).toHaveBeenCalledWith(complexComponent);
    });
  });
});
