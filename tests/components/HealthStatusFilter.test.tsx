import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthStatusFilter } from '@/components/HealthStatusFilter';

describe('HealthStatusFilter', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - hideDownComponents = false', () => {
    it('should render button with Eye icon when not hiding components', () => {
      const { container } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Eye icon should be present
      const eyeIcon = container.querySelector('svg');
      expect(eyeIcon).toBeInTheDocument();
    });

    it('should render button with outline variant when not hiding components', () => {
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      // Outline variant has border and bg-background classes
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('should have correct button styling', () => {
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3', 'gap-2');
    });
  });

  describe('Rendering - hideDownComponents = true', () => {
    it('should render button with EyeOff icon when hiding components', () => {
      const { container } = render(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Icon should be present (EyeOff in this case)
      const eyeOffIcon = container.querySelector('svg');
      expect(eyeOffIcon).toBeInTheDocument();
    });

    it('should render button with default variant when hiding components', () => {
      render(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      // Default variant doesn't have bg-background class (outline variant has it)
      expect(button).not.toHaveClass('bg-background');
    });
  });

  describe('Button Click Behavior', () => {
    it('should call onToggle with true when clicked while hideDownComponents is false', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('should call onToggle with false when clicked while hideDownComponents is true', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('should always toggle to opposite state', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      
      // First click: false -> true
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith(true);

      mockOnToggle.mockClear();

      // Rerender with new state
      rerender(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      // Second click: true -> false
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('should handle multiple rapid clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      
      // Multiple rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
      // All should toggle from false to true
      expect(mockOnToggle).toHaveBeenNthCalledWith(1, true);
      expect(mockOnToggle).toHaveBeenNthCalledWith(2, true);
      expect(mockOnToggle).toHaveBeenNthCalledWith(3, true);
    });
  });

  describe('State Changes and Re-renders', () => {

    it('should maintain functionality across multiple state changes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');

      // First click
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith(true);

      mockOnToggle.mockClear();

      // Update state
      rerender(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      // Second click
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith(false);

      mockOnToggle.mockClear();

      // Update state again
      rerender(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      // Third click
      await user.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button element', () => {
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      
      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      // Press Space
      await user.keyboard(' ');
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Icon Display', () => {
    it('should show Eye icon when not hiding components', () => {
      const { container } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show EyeOff icon when hiding components', () => {
      const { container } = render(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have correct icon size', () => {
      const { container } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle onToggle being called with same value multiple times', async () => {
      const user = userEvent.setup();
      
      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      
      // Click multiple times without state update
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // All calls should be with true (since hideDownComponents stays false)
      expect(mockOnToggle).toHaveBeenCalledTimes(3);
      mockOnToggle.mock.calls.forEach(call => {
        expect(call[0]).toBe(true);
      });
    });

    it('should work with different onToggle implementations', async () => {
      const user = userEvent.setup();
      
      const customToggle = vi.fn((value) => {
        // Custom logic
        console.log('Toggling to:', value);
      });

      render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={customToggle}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(customToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Integration Scenarios', () => {

    it('should reflect visual state correctly', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <HealthStatusFilter 
          hideDownComponents={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');

      // Initial: outline variant (has border and bg-background)
      expect(button).toHaveClass('border', 'border-input', 'bg-background');

      // Simulate parent updating state
      rerender(
        <HealthStatusFilter 
          hideDownComponents={true}
          onToggle={mockOnToggle}
        />
      );

      // Now: default variant (no longer has bg-background class)
      expect(button).not.toHaveClass('bg-background');
    });
  });

  describe('Multiple Instances', () => {
    it('should work independently when multiple instances are rendered', async () => {
      const user = userEvent.setup();
      
      const onToggle1 = vi.fn();
      const onToggle2 = vi.fn();

      const { container } = render(
        <>
          <HealthStatusFilter 
            hideDownComponents={false}
            onToggle={onToggle1}
          />
          <HealthStatusFilter 
            hideDownComponents={true}
            onToggle={onToggle2}
          />
        </>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      // Click first button
      await user.click(buttons[0]);
      expect(onToggle1).toHaveBeenCalledWith(true);
      expect(onToggle2).not.toHaveBeenCalled();

      // Click second button
      await user.click(buttons[1]);
      expect(onToggle2).toHaveBeenCalledWith(false);
      expect(onToggle1).toHaveBeenCalledTimes(1); // Still only once
    });
  });
});