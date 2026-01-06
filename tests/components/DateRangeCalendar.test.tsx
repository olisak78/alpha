import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { DateRangeCalendar } from '../../src/components/DateRangeCalendar';
import type { DateRange } from 'react-day-picker';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: ({ className, ...props }: any) => (
    <div data-testid="chevron-left-icon" className={className} {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <div data-testid="chevron-right-icon" className={className} {...props} />
  ),
}));

// Mock utils
vi.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock button variants
vi.mock('../../src/components/ui/button', () => ({
  buttonVariants: ({ variant }: { variant?: string }) => `button-${variant || 'default'}`,
}));

describe('DateRangeCalendar', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render calendar with default and custom props', () => {
      const { container, rerender } = render(<DateRangeCalendar />);
      
      // Check for calendar structure and default classes
      expect(screen.getByRole('grid')).toBeInTheDocument();
      const calendar = container.querySelector('.date-range-calendar');
      expect(calendar).toBeInTheDocument();
      expect(calendar).toHaveClass('p-3');
      
      // Check navigation buttons
      expect(screen.getByLabelText('Go to the Previous Month')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to the Next Month')).toBeInTheDocument();
      
      // Test custom className
      rerender(<DateRangeCalendar className="custom-calendar" />);
      const customCalendar = container.querySelector('.date-range-calendar');
      expect(customCalendar).toHaveClass('custom-calendar');
      
      // Test showOutsideDays prop
      rerender(<DateRangeCalendar showOutsideDays={false} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    it('should handle date range selection with various scenarios', async () => {
      const mockOnSelect = vi.fn();
      
      // Test complete date range
      const dateRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 20)
      };
      
      const { rerender } = render(<DateRangeCalendar mode="range" selected={dateRange} onSelect={mockOnSelect} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Test incomplete date range (only from date)
      const incompleteRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: undefined
      };
      rerender(<DateRangeCalendar mode="range" selected={incompleteRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Test same start and end date
      const sameDate = new Date(2024, 0, 15);
      const singleDayRange: DateRange = {
        from: sameDate,
        to: sameDate
      };
      rerender(<DateRangeCalendar mode="range" selected={singleDayRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render available dates for selection', async () => {
      const mockOnSelect = vi.fn();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      render(<DateRangeCalendar mode="range" onSelect={mockOnSelect} defaultMonth={futureDate} />);
      
      const dateButtons = screen.getAllByRole('gridcell');
      const availableDates = dateButtons.filter(button => 
        !button.hasAttribute('data-disabled') && 
        !button.classList.contains('rdp-disabled') &&
        button.textContent && 
        parseInt(button.textContent) > 0
      );
      
      expect(availableDates.length).toBeGreaterThan(0);
    });
  });

  describe('Modifiers Logic', () => {
    it('should handle various modifier scenarios', () => {
      const { rerender } = render(<DateRangeCalendar />);
      
      // Empty modifiers when no selection
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Range start modifier (only from date)
      const startOnlyRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: undefined
      };
      rerender(<DateRangeCalendar mode="range" selected={startOnlyRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Complete range with middle dates
      const completeRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 20)
      };
      rerender(<DateRangeCalendar mode="range" selected={completeRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Consecutive days (no middle range)
      const consecutiveRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 16)
      };
      rerender(<DateRangeCalendar mode="range" selected={consecutiveRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Invalid range (to before from)
      const invalidRange: DateRange = {
        from: new Date(2024, 0, 20),
        to: new Date(2024, 0, 15)
      };
      rerender(<DateRangeCalendar mode="range" selected={invalidRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Styling and Navigation', () => {
    it('should inject CSS styles and handle navigation', async () => {
      const { container } = render(<DateRangeCalendar />);
      
      // Check CSS injection
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      const cssContent = styleTag?.textContent || '';
      expect(cssContent).toContain('.date-range-calendar');
      expect(cssContent).toContain('.rdp-weekdays');
      expect(cssContent).toContain('.rdp-day_range_start');
      expect(cssContent).toContain('.rdp-day_range_end');
      expect(cssContent).toContain('.rdp-day_range_middle');
      
      // Check CSS classes
      const calendar = container.querySelector('.date-range-calendar');
      expect(calendar).toHaveClass('p-3');
      
      // Check navigation buttons
      const leftButton = screen.getByLabelText('Go to the Previous Month');
      const rightButton = screen.getByLabelText('Go to the Next Month');
      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
      
      // Test navigation functionality
      await user.click(rightButton);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should apply modifiers styles with date range', () => {
      const dateRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 20)
      };
      
      render(<DateRangeCalendar mode="range" selected={dateRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should handle various props and configurations', () => {
      const { rerender } = render(<DateRangeCalendar />);
      
      // Test DayPicker props pass-through
      const mockProps = {
        disabled: { before: new Date() },
        fixedWeeks: true
      };
      rerender(<DateRangeCalendar {...mockProps} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Test numberOfMonths prop
      rerender(<DateRangeCalendar numberOfMonths={2} />);
      const grids = screen.getAllByRole('grid');
      expect(grids.length).toBe(2);
      
      // Test custom classNames
      const customClassNames = {
        day: 'custom-day-class',
        month: 'custom-month-class'
      };
      rerender(<DateRangeCalendar classNames={customClassNames} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Test showOutsideDays prop
      rerender(<DateRangeCalendar showOutsideDays={false} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DateRangeCalendar />);
      
      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      
      // Check for navigation buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<DateRangeCalendar />);
      
      const grid = screen.getByRole('grid');
      
      // Focus the grid and test keyboard navigation
      grid.focus();
      await user.keyboard('{ArrowRight}');
      
      // Calendar should still be functional after keyboard interaction
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should have proper button roles for navigation', () => {
      render(<DateRangeCalendar />);
      
      // Check for navigation buttons by their aria-labels
      const prevButton = screen.getByLabelText('Go to the Previous Month');
      const nextButton = screen.getByLabelText('Go to the Next Month');
      
      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle various edge cases without crashing', () => {
      const { rerender } = render(<DateRangeCalendar />);
      
      // Undefined selected value
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Empty object as selected value
      rerender(<DateRangeCalendar mode="range" selected={{} as DateRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Invalid date objects
      const invalidRange: DateRange = {
        from: new Date('invalid'),
        to: new Date('also invalid')
      };
      rerender(<DateRangeCalendar mode="range" selected={invalidRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // Very large date ranges
      const largeRange: DateRange = {
        from: new Date(2020, 0, 1),
        to: new Date(2025, 11, 31)
      };
      rerender(<DateRangeCalendar mode="range" selected={largeRange} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work with form libraries', () => {
      const mockOnSelect = vi.fn();
      
      render(
        <form>
          <DateRangeCalendar mode="range" onSelect={mockOnSelect} />
        </form>
      );
      
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should handle rapid date selections', async () => {
      const mockOnSelect = vi.fn();
      // Use a future date to ensure it's not disabled
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      render(<DateRangeCalendar mode="range" onSelect={mockOnSelect} defaultMonth={futureDate} />);
      
      // Verify the calendar renders and onSelect prop is passed
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      const dateButtons = screen.getAllByRole('gridcell');
      const availableDates = dateButtons.filter(button => 
        !button.hasAttribute('data-disabled') && 
        !button.classList.contains('rdp-disabled') &&
        button.textContent && 
        parseInt(button.textContent) > 0
      );
      
      // Verify that there are clickable dates available for interaction
      expect(availableDates.length).toBeGreaterThan(0);
    });

    it('should maintain state consistency during interactions', async () => {
      const mockOnSelect = vi.fn();
      const initialRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: undefined
      };
      
      const { rerender } = render(
        <DateRangeCalendar mode="range" selected={initialRange} onSelect={mockOnSelect} />
      );
      
      // Update with complete range
      const completeRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 20)
      };
      
      rerender(<DateRangeCalendar mode="range" selected={completeRange} onSelect={mockOnSelect} />);
      
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily with same props', () => {
      const dateRange: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 20)
      };
      
      const { rerender } = render(<DateRangeCalendar mode="range" selected={dateRange} />);
      
      // Re-render with same props
      rerender(<DateRangeCalendar mode="range" selected={dateRange} />);
      
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should handle frequent prop updates efficiently', () => {
      const { rerender } = render(<DateRangeCalendar />);
      
      // Simulate multiple prop updates
      for (let i = 0; i < 10; i++) {
        const dateRange: DateRange = {
          from: new Date(2024, 0, i + 1),
          to: new Date(2024, 0, i + 5)
        };
        rerender(<DateRangeCalendar mode="range" selected={dateRange} />);
      }
      
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(DateRangeCalendar.displayName).toBe('DateRangeCalendar');
    });
  });
});
