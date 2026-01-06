import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Home, User, Settings } from 'lucide-react';
import QuickFilterButtons, { FilterOption, QuickFilterButtonsProps } from '../../src/components/QuickFilterButtons';

// Simple and logical mock filters for testing
const mockFilters: FilterOption[] = [
  { value: "all", label: "All", icon: Home },
  { value: "active", label: "Active", icon: User, tooltip: "Show active items" },
  { value: "archived", label: "Archived", icon: Settings, isDisabled: true },
];

describe('QuickFilterButtons', () => {
  const defaultProps: QuickFilterButtonsProps = {
    activeFilter: 'all',
    onFilterChange: vi.fn(),
    filters: mockFilters,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter buttons with correct labels and icons', () => {
    render(<QuickFilterButtons {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /archived/i })).toBeInTheDocument();
    
    // Check that SVG elements (icons) are present
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('handles active filter state and changes correctly', () => {
    const { rerender } = render(<QuickFilterButtons {...defaultProps} activeFilter="active" />);
    
    const activeButton = screen.getByRole('button', { name: /active/i });
    const inactiveButton = screen.getByRole('button', { name: /all/i });
    
    // Active button should not have outline variant class
    expect(activeButton).not.toHaveClass('border-input');
    // Inactive button should have outline variant class
    expect(inactiveButton).toHaveClass('border-input');
    
    // Test filter change
    rerender(<QuickFilterButtons {...defaultProps} activeFilter="all" />);
    
    const newActiveButton = screen.getByRole('button', { name: /all/i });
    expect(newActiveButton).not.toHaveClass('border-input');
  });

  it('calls onFilterChange when enabled buttons are clicked', () => {
    const onFilterChange = vi.fn();
    render(<QuickFilterButtons {...defaultProps} onFilterChange={onFilterChange} />);
    
    const activeButton = screen.getByRole('button', { name: /active/i });
    fireEvent.click(activeButton);
    
    expect(onFilterChange).toHaveBeenCalledWith('active');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    
    // Test multiple clicks
    fireEvent.click(activeButton);
    fireEvent.click(activeButton);
    expect(onFilterChange).toHaveBeenCalledTimes(3);
  });

  it('handles disabled buttons correctly', () => {
    const onFilterChange = vi.fn();
    render(<QuickFilterButtons {...defaultProps} onFilterChange={onFilterChange} />);
    
    const disabledButton = screen.getByRole('button', { name: /archived/i });
    const enabledButton = screen.getByRole('button', { name: /all/i });
    
    expect(disabledButton).toBeDisabled();
    expect(enabledButton).not.toBeDisabled();
    
    // Disabled button should not trigger callback
    fireEvent.click(disabledButton);
    expect(onFilterChange).not.toHaveBeenCalled();
  });


  it('works with custom generic types', () => {
    type StatusType = 'pending' | 'completed';
    
    const customFilters: FilterOption<StatusType>[] = [
      { value: 'pending', label: 'Pending', icon: Home },
      { value: 'completed', label: 'Completed', icon: User },
    ];
    
    const onFilterChange = vi.fn();
    const customProps: QuickFilterButtonsProps<StatusType> = {
      activeFilter: 'pending',
      onFilterChange,
      filters: customFilters,
    };
    
    render(<QuickFilterButtons {...customProps} />);
    
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    
    const completedButton = screen.getByRole('button', { name: /completed/i });
    fireEvent.click(completedButton);
    expect(onFilterChange).toHaveBeenCalledWith('completed');
  });

  it('handles edge cases gracefully', () => {
    // Empty filters
    render(<QuickFilterButtons {...defaultProps} filters={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    
    // Duplicate labels
    const duplicateFilters: FilterOption[] = [
      { value: 'filter1', label: 'Active', icon: Home },
      { value: 'filter2', label: 'Active', icon: User },
    ];
    
    const onFilterChange = vi.fn();
    const { rerender } = render(<QuickFilterButtons {...defaultProps} filters={duplicateFilters} onFilterChange={onFilterChange} />);
    
    const buttons = screen.getAllByRole('button', { name: /active/i });
    expect(buttons).toHaveLength(2);
    
    fireEvent.click(buttons[0]);
    expect(onFilterChange).toHaveBeenCalledWith('filter1');
    
    // Non-existent active filter
    rerender(<QuickFilterButtons {...defaultProps} activeFilter="nonexistent" />);
    mockFilters.forEach(filter => {
      const button = screen.getByRole('button', { name: new RegExp(filter.label, 'i') });
      expect(button).toHaveClass('border-input');
    });
  });
});
