import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TriggeredAlertsTableHeader } from '../../../src/components/TriggeredAlerts/TriggeredAlertsTableHeader';
import type { SortState } from '../../../src/hooks/useTableSort';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronUp: ({ className }: any) => <svg className={`lucide-chevron-up ${className}`} data-testid="chevron-up" />,
  ChevronDown: ({ className }: any) => <svg className={`lucide-chevron-down ${className}`} data-testid="chevron-down" />,
  ChevronsUpDown: ({ className }: any) => <svg className={`lucide-chevrons-up-down ${className}`} data-testid="chevrons-up-down" />,
}));

describe('TriggeredAlertsTableHeader', () => {
  const mockOnSort = vi.fn();

  const defaultProps = {
    showRegion: false,
    sortState: { field: null, direction: 'asc' as const },
    onSort: mockOnSort,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render columns correctly with proper styling and grid layout', () => {
    const { rerender } = render(<TriggeredAlertsTableHeader {...defaultProps} />);

    // Check basic columns without region
    expect(screen.getByText('Alert Name')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Landscape')).toBeInTheDocument();
    expect(screen.queryByText('Region')).not.toBeInTheDocument();

    // Check grid layout and styling
    const container = screen.getByText('Alert Name').closest('.grid');
    expect(container).toHaveClass('grid-cols-9', 'px-4', 'py-3', 'border-b', 'bg-muted/30');

    // Check column spans
    expect(screen.getByText('Alert Name').closest('button')).toHaveClass('col-span-4');
    expect(screen.getByText('Severity').closest('button')).toHaveClass('col-span-1');

    // Test with region
    rerender(<TriggeredAlertsTableHeader {...defaultProps} showRegion={true} />);
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Alert Name').closest('.grid')).toHaveClass('grid-cols-10');
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('should display correct sort icons based on sort state', () => {
    const { rerender } = render(<TriggeredAlertsTableHeader {...defaultProps} />);

    // No sorting - all unsorted icons
    expect(screen.getAllByTestId('chevrons-up-down')).toHaveLength(6);

    // Ascending sort
    rerender(<TriggeredAlertsTableHeader {...defaultProps} sortState={{ field: 'alertname', direction: 'asc' }} />);
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-up')).toHaveClass('h-4', 'w-4', 'text-foreground');
    expect(screen.getAllByTestId('chevrons-up-down')).toHaveLength(5);

    // Descending sort
    rerender(<TriggeredAlertsTableHeader {...defaultProps} sortState={{ field: 'severity', direction: 'desc' }} />);
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    expect(screen.getAllByTestId('chevrons-up-down')).toHaveLength(5);
  });

  it('should handle click events and call onSort with correct field mappings', () => {
    render(<TriggeredAlertsTableHeader {...defaultProps} showRegion={true} />);

    const columnMappings = [
      { text: 'Alert Name', key: 'alertname' },
      { text: 'Severity', key: 'severity' },
      { text: 'Start Time', key: 'startsAt' },
      { text: 'End Time', key: 'endsAt' },
      { text: 'Status', key: 'status' },
      { text: 'Landscape', key: 'landscape' },
      { text: 'Region', key: 'region' },
    ];

    columnMappings.forEach(({ text, key }) => {
      const button = screen.getByText(text).closest('button');
      expect(button).toHaveClass('flex', 'items-center', 'gap-2', 'text-left');
      fireEvent.click(button!);
      expect(mockOnSort).toHaveBeenCalledWith(key);
    });

    expect(mockOnSort).toHaveBeenCalledTimes(7);
  });

  it('should handle edge cases and maintain accessibility', () => {
    // Test with invalid sort field
    render(<TriggeredAlertsTableHeader {...defaultProps} sortState={{ field: 'nonexistent', direction: 'asc' }} />);
    expect(screen.getAllByTestId('chevrons-up-down')).toHaveLength(6);

    // Test accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });

    // Test multiple clicks
    const alertNameButton = screen.getByText('Alert Name').closest('button');
    fireEvent.click(alertNameButton!);
    fireEvent.click(alertNameButton!);
    expect(mockOnSort).toHaveBeenCalledTimes(2);
  });

  it('should maintain sort state when showRegion prop changes', () => {
    const sortState: SortState = { field: 'alertname', direction: 'asc' };
    const { rerender } = render(
      <TriggeredAlertsTableHeader {...defaultProps} sortState={sortState} showRegion={false} />
    );

    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();

    rerender(<TriggeredAlertsTableHeader {...defaultProps} sortState={sortState} showRegion={true} />);
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
  });
});
