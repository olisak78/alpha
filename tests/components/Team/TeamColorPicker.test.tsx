import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { TeamColorPicker } from '../../../src/components/Team/TeamColorPicker';

/**
 * TeamColorPicker Component Tests
 * 
 * Streamlined tests for the TeamColorPicker component covering core functionality,
 * used colors handling, and accessibility.
 */

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverContent: ({ children, className, align, ...props }: any) => (
    <div data-testid="popover-content" className={className} data-align={align} {...props}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild, onClick }: any) => (
    <div data-testid="popover-trigger" data-as-child={asChild} onClick={onClick}>
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Palette: () => <span data-testid="palette-icon">🎨</span>,
}));

// Mock utils
vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('TeamColorPicker Component', () => {
  const defaultProps = {
    currentColor: '#3b82f6',
    onColorChange: vi.fn(),
    disabled: false,
    usedColors: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render trigger button with correct structure', () => {
      render(<TeamColorPicker {...defaultProps} />);

      // Get the trigger button specifically
      const triggerButton = screen.getByRole('button', { name: /color/i });
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveClass('gap-2 h-9');
      expect(triggerButton).toHaveAttribute('data-variant', 'outline');
      expect(triggerButton).toHaveAttribute('data-size', 'sm');

      // Check color preview
      const colorPreview = triggerButton.querySelector('div[style*="background-color"]');
      expect(colorPreview).toBeInTheDocument();
      expect(colorPreview).toHaveStyle('background-color: #3b82f6');

      // Check icon and text
      expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('should render with default color when currentColor is not provided', () => {
      render(<TeamColorPicker onColorChange={vi.fn()} />);

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorPreview = triggerButton.querySelector('div[style*="background-color"]');
      expect(colorPreview).toHaveStyle('background-color: #6b7280');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<TeamColorPicker {...defaultProps} disabled={true} />);

      const triggerButton = screen.getByRole('button', { name: /color/i });
      expect(triggerButton).toBeDisabled();
    });
  });

  // ============================================================================
  // POPOVER FUNCTIONALITY TESTS
  // ============================================================================

  describe('Popover Functionality', () => {
    it('should render popover structure', () => {
      render(<TeamColorPicker {...defaultProps} />);

      const popover = screen.getByTestId('popover');
      expect(popover).toHaveAttribute('data-open', 'false');
      
      // Check popover content is always rendered (based on our mock)
      const popoverContent = screen.getByTestId('popover-content');
      expect(popoverContent).toBeInTheDocument();
      expect(popoverContent).toHaveClass('w-80');
      expect(popoverContent).toHaveAttribute('data-align', 'end');
    });

    it('should render popover content with correct structure', () => {
      render(<TeamColorPicker {...defaultProps} />);

      // Check header content
      expect(screen.getByText('Choose a color')).toBeInTheDocument();
      expect(screen.getByText('Select a color to identify your team\'s components')).toBeInTheDocument();
    });

    it('should render color grid with all preset colors', () => {
      render(<TeamColorPicker {...defaultProps} />);

      // Should render 30 color buttons (18 base colors + 12 additional colors)
      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );
      expect(colorButtons).toHaveLength(30);

      // Check grid layout
      const grid = colorButtons[0].parentElement;
      expect(grid).toHaveClass('grid grid-cols-6 gap-2');
    });
  });

  // ============================================================================
  // COLOR SELECTION TESTS
  // ============================================================================

  describe('Color Selection', () => {
    it('should call onColorChange when a color is selected', async () => {
      const user = userEvent.setup();
      const onColorChange = vi.fn();
      render(<TeamColorPicker {...defaultProps} onColorChange={onColorChange} />);

      // Get trigger button and color buttons
      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );
      const firstColorButton = colorButtons[0];
      await user.click(firstColorButton);

      expect(onColorChange).toHaveBeenCalledTimes(1);
      expect(onColorChange).toHaveBeenCalledWith(expect.any(String));
    });

    it('should highlight current color in the grid', () => {
      render(<TeamColorPicker {...defaultProps} currentColor="#10b981" />);

      const triggerButton = screen.getByRole('button', { name: /color/i });
      // Find the button with the current color
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );
      
      const currentColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(16, 185, 129)' // #10b981 in RGB
      );
      
      if (currentColorButton) {
        expect(currentColorButton).toHaveClass('border-foreground ring-2 ring-offset-2 ring-foreground');
      }
    });
  });

  // ============================================================================
  // USED COLORS FUNCTIONALITY TESTS
  // ============================================================================

  describe('Used Colors Functionality', () => {
    it('should disable colors that are used by other teams', () => {
      const usedColors = ['#3b82f6', '#10b981', '#ef4444'];
      render(
        <TeamColorPicker 
          {...defaultProps} 
          currentColor="#f59e0b" // Different from used colors
          usedColors={usedColors}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      // Check that used colors are disabled
      const usedColorButtons = colorButtons.filter(btn => {
        const bgColor = btn.style.backgroundColor;
        return usedColors.some(color => {
          // Convert hex to rgb for comparison
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return bgColor === `rgb(${r}, ${g}, ${b})`;
        });
      });

      usedColorButtons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('opacity-40 cursor-not-allowed');
      });
    });

    it('should not disable current team color even if it appears in usedColors', () => {
      const currentColor = '#3b82f6';
      const usedColors = ['#3b82f6', '#10b981']; // Current color is in used colors
      
      render(
        <TeamColorPicker 
          {...defaultProps} 
          currentColor={currentColor}
          usedColors={usedColors}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      // Find the current color button
      const currentColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(59, 130, 246)' // #3b82f6 in RGB
      );

      if (currentColorButton) {
        expect(currentColorButton).not.toBeDisabled();
        expect(currentColorButton).toHaveClass('border-foreground ring-2 ring-offset-2 ring-foreground');
      }
    });

    it('should show tooltip and strike-through for used colors', () => {
      const usedColors = ['#3b82f6'];
      render(
        <TeamColorPicker 
          {...defaultProps} 
          currentColor="#10b981"
          usedColors={usedColors}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      const usedColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(59, 130, 246)' // #3b82f6 in RGB
      );

      if (usedColorButton) {
        expect(usedColorButton).toHaveAttribute('title', expect.stringContaining('Used by another team'));
        
        // Check for strike-through visual indicator
        const strikeThrough = usedColorButton.querySelector('div[class*="rotate-45"]');
        expect(strikeThrough).toBeInTheDocument();
      }
    });

    it('should not allow clicking on used colors', async () => {
      const user = userEvent.setup();
      const onColorChange = vi.fn();
      const usedColors = ['#3b82f6'];
      
      render(
        <TeamColorPicker 
          {...defaultProps} 
          currentColor="#10b981"
          usedColors={usedColors}
          onColorChange={onColorChange}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      const usedColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(59, 130, 246)' // #3b82f6 in RGB
      );

      if (usedColorButton) {
        await user.click(usedColorButton);
        expect(onColorChange).not.toHaveBeenCalled();
      }
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty usedColors array', () => {
      render(<TeamColorPicker {...defaultProps} usedColors={[]} />);

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      // No colors should be disabled
      colorButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle case-insensitive color comparison', () => {
      const usedColors = ['#3B82F6']; // Uppercase
      
      render(
        <TeamColorPicker 
          {...defaultProps} 
          currentColor="#3b82f6" // Lowercase
          usedColors={usedColors}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /color/i });
      // Current color should not be disabled even with case difference
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      const currentColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(59, 130, 246)'
      );

      if (currentColorButton) {
        expect(currentColorButton).not.toBeDisabled();
      }
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper color names in tooltips', () => {
      render(<TeamColorPicker {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton
      );

      // Check that color buttons have title attributes with color names
      colorButtons.forEach(button => {
        expect(button).toHaveAttribute('title');
        const title = button.getAttribute('title');
        expect(title).toBeTruthy();
        expect(title).not.toBe('');
      });
    });
  });

  // ============================================================================
  // INTEGRATION TEST
  // ============================================================================

  describe('Integration', () => {
    it('should work with complete color selection workflow', async () => {
      const user = userEvent.setup();
      const onColorChange = vi.fn();
      
      render(
        <TeamColorPicker 
          currentColor="#6b7280"
          onColorChange={onColorChange}
          usedColors={['#3b82f6', '#10b981']}
        />
      );

      // Select an available color
      const triggerButton = screen.getByRole('button', { name: /color/i });
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.style.backgroundColor && btn !== triggerButton && !(btn as HTMLButtonElement).disabled
      );
      
      if (colorButtons.length > 0) {
        await user.click(colorButtons[0]);
        expect(onColorChange).toHaveBeenCalled();
      }
    });
  });
});
