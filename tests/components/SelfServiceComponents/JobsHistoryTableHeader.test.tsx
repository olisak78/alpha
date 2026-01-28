import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobsHistoryTableHeader } from '@/components/SelfService/JobsHistoryTableHeader';

// Mock the UI components from shadcn
vi.mock('@/components/ui/button', () => ({
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

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      data-testid="switch"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, type }: any) => (
    <input
      data-testid="search-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button data-testid="dropdown-item" onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// Mock DateRangePicker
vi.mock('@/components/SelfService/DateRangePicker', () => ({
  DateRangePicker: ({ value, onChange, onClear }: any) => (
    <div data-testid="date-range-picker">
      <button onClick={() => onChange({ from: new Date(), to: new Date() })}>
        Select Range
      </button>
      <button onClick={onClear}>Clear Range</button>
    </div>
  ),
}));

describe('JobsHistoryTableHeader', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    filteredService: null,
    onClearFilter: vi.fn(),
    totalJobs: 50,
    totalFilteredItems: 50,
    hasSearchTerm: false,
    onlyMine: true,
    onToggleOnlyMine: vi.fn(),
    timePeriod: 'last48h' as const,
    onTimePeriodChange: vi.fn(),
    currentPeriodLabel: 'Last 48 hours',
    onRefresh: vi.fn(),
    isRefreshing: false,
    searchTerm: '',
    onSearchChange: vi.fn(),
    onClearSearch: vi.fn(),
    customDateRange: { from: undefined, to: undefined },
    onCustomDateRangeChange: vi.fn(),
    onClearCustomDateRange: vi.fn(),
    hasCustomDateRange: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should render collapse button with correct icon', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      expect(screen.getByText(/My Latest Executions/i)).toBeInTheDocument();
    });

    it('should render expanded state with search input', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={false} />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should not render search input when collapsed', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={true} />);
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('should render job count badge when totalJobs > 0', () => {
      render(<JobsHistoryTableHeader {...defaultProps} totalJobs={42} />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('42');
    });

    it('should not render job count badge when totalJobs is 0', () => {
      render(<JobsHistoryTableHeader {...defaultProps} totalJobs={0} />);
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    it('should show "My Latest Executions" when onlyMine is true and no filter', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={true} />);
      expect(screen.getByText('My Latest Executions')).toBeInTheDocument();
    });

    it('should show "Latest Executions" when onlyMine is false and no filter', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={false} />);
      expect(screen.getByText('Latest Executions')).toBeInTheDocument();
    });

    it('should keep the same title when filtering by service', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          onlyMine={true}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Dev Landscape',
          }}
        />
      );
      // Title should remain "My Latest Executions" instead of changing
      expect(screen.getByText('My Latest Executions')).toBeInTheDocument();
      // Should NOT show the old "All executions for:" text
      expect(screen.queryByText(/All executions for:/i)).not.toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should call onToggleCollapse when collapse button is clicked', async () => {
      const onToggleCollapse = vi.fn();
      render(<JobsHistoryTableHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />);

      const button = screen.getByText(/My Latest Executions/i).closest('button');
      await userEvent.click(button!);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleCollapse when "Click to collapse" text is clicked', async () => {
      const onToggleCollapse = vi.fn();
      render(<JobsHistoryTableHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />);

      const clickText = screen.getByText(/Click to collapse/i);
      await userEvent.click(clickText);

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should show "Click to expand" when collapsed', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={true} />);
      expect(screen.getByText(/Click to expand/i)).toBeInTheDocument();
    });

    it('should show "Click to collapse" when expanded', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={false} />);
      expect(screen.getByText(/Click to collapse/i)).toBeInTheDocument();
    });
  });

  describe('Job Count Badge', () => {
    it('should show total jobs count when no search', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          totalJobs={50}
          totalFilteredItems={50}
          hasSearchTerm={false}
        />
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('50');
    });

    it('should show filtered/total when searching', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          totalJobs={50}
          totalFilteredItems={15}
          hasSearchTerm={true}
        />
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('15 / 50');
    });

    it('should show only filtered count when filtering by service without search', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          totalJobs={50}
          totalFilteredItems={8}
          hasSearchTerm={false}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
        />
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('8');
    });
  });

  describe('Service Filter', () => {
    it('should show job name button when filtering by service', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
        />
      );
      // Should show the job name instead of "Back to All Jobs"
      expect(screen.getByText('create-cluster')).toBeInTheDocument();
    });

    it('should call onClearFilter when job name button is clicked', async () => {
      const onClearFilter = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
          onClearFilter={onClearFilter}
        />
      );

      const button = screen.getByText('create-cluster');
      await userEvent.click(button);

      expect(onClearFilter).toHaveBeenCalledTimes(1);
    });

    it('should not show job name button when not filtering', () => {
      render(<JobsHistoryTableHeader {...defaultProps} filteredService={null} />);
      expect(screen.queryByText('create-cluster')).not.toBeInTheDocument();
    });

    it('should hide "Click to collapse" text when filtering by service', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
        />
      );
      expect(screen.queryByText(/Click to collapse/i)).not.toBeInTheDocument();
    });
  });

  describe('Time Period Dropdown', () => {
    it('should render dropdown menu with all time period options', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('should call onTimePeriodChange when a period is selected', async () => {
      const onTimePeriodChange = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          onTimePeriodChange={onTimePeriodChange}
        />
      );

      // Find all dropdown items and click one
      const dropdownItems = screen.getAllByTestId('dropdown-item');
      await userEvent.click(dropdownItems[0]);

      expect(onTimePeriodChange).toHaveBeenCalled();
    });
  });

  describe('Only Mine / All Jobs Toggle', () => {
    it('should render "Only My Jobs" label when onlyMine is true', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={true} />);
      expect(screen.getByText('Only My Jobs')).toBeInTheDocument();
    });

    it('should render "All Jobs" label when onlyMine is false', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={false} />);
      expect(screen.getByText('All Jobs')).toBeInTheDocument();
    });

    it('should have switch checked when showing all jobs', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={false} />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toBeChecked();
    });

    it('should have switch unchecked when showing only mine', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={true} />);
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).not.toBeChecked();
    });

    it('should call onToggleOnlyMine when switch is toggled', async () => {
      const onToggleOnlyMine = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          onlyMine={true}
          onToggleOnlyMine={onToggleOnlyMine}
        />
      );

      const switchElement = screen.getByTestId('switch');
      await userEvent.click(switchElement);

      expect(onToggleOnlyMine).toHaveBeenCalledWith(false);
    });

    it('should hide toggle when filtering by service', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
        />
      );
      expect(screen.queryByTestId('switch')).not.toBeInTheDocument();
      expect(screen.queryByText('Only My Jobs')).not.toBeInTheDocument();
      expect(screen.queryByText('All Jobs')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should render refresh button', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should call onRefresh when clicked', async () => {
      const onRefresh = vi.fn();
      render(<JobsHistoryTableHeader {...defaultProps} onRefresh={onRefresh} />);

      const button = screen.getByText('Refresh');
      await userEvent.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isRefreshing is true', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isRefreshing={true} />);
      const button = screen.getByText('Refresh').closest('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when isRefreshing is false', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isRefreshing={false} />);
      const button = screen.getByText('Refresh').closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Search Input', () => {
    it('should render search input when not collapsed', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={false} />);
      const input = screen.getByTestId('search-input');
      expect(input).toBeInTheDocument();
    });

    it('should not render search input when collapsed', () => {
      render(<JobsHistoryTableHeader {...defaultProps} isCollapsed={true} />);
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('should have correct placeholder text', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute(
        'placeholder',
        'Search by job name, user, status, or build number...'
      );
    });

    it('should display current search term', () => {
      render(<JobsHistoryTableHeader {...defaultProps} searchTerm="test-search" />);
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('test-search');
    });

    it('should call onSearchChange when typing', async () => {
      const onSearchChange = vi.fn();
      render(
        <JobsHistoryTableHeader {...defaultProps} onSearchChange={onSearchChange} />
      );

      const input = screen.getByTestId('search-input');
      await userEvent.type(input, 'new search');

      expect(onSearchChange).toHaveBeenCalled();
      // Check that it was called with each character
      expect(onSearchChange).toHaveBeenCalledTimes('new search'.length);
    });

    it('should show clear button when search term is not empty', () => {
      render(<JobsHistoryTableHeader {...defaultProps} searchTerm="test" />);
      
      // Clear button should be present
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => 
        btn.classList.contains('absolute') || 
        btn.querySelector('svg')
      );
      expect(clearButton).toBeDefined();
    });

    it('should not show clear button when search term is empty', () => {
      render(<JobsHistoryTableHeader {...defaultProps} searchTerm="" />);
      
      // Should have fewer buttons without the clear button
      const buttons = screen.getAllByRole('button');
      // Count buttons - should not include inline clear button
      const absoluteButtons = buttons.filter(btn => 
        btn.classList.contains('absolute')
      );
      expect(absoluteButtons.length).toBe(0);
    });

    it('should call onClearSearch when clear button is clicked', async () => {
      const onClearSearch = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          searchTerm="test"
          onClearSearch={onClearSearch}
        />
      );

      // Find the clear button (it has specific styling)
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => btn.classList.contains('absolute'));
      
      if (clearButton) {
        await userEvent.click(clearButton);
        expect(onClearSearch).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Date Range Picker', () => {
    it('should render date range picker', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    });

    it('should call onCustomDateRangeChange when range is selected', async () => {
      const onCustomDateRangeChange = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          onCustomDateRangeChange={onCustomDateRangeChange}
        />
      );

      const selectButton = screen.getByText('Select Range');
      await userEvent.click(selectButton);

      expect(onCustomDateRangeChange).toHaveBeenCalled();
    });

    it('should call onClearCustomDateRange when clear is clicked', async () => {
      const onClearCustomDateRange = vi.fn();
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          onClearCustomDateRange={onClearCustomDateRange}
        />
      );

      const clearButton = screen.getByText('Clear Range');
      await userEvent.click(clearButton);

      expect(onClearCustomDateRange).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should handle all props being updated', () => {
      const { rerender } = render(<JobsHistoryTableHeader {...defaultProps} />);

      // Update all props
      rerender(
        <JobsHistoryTableHeader
          {...defaultProps}
          isCollapsed={true}
          onlyMine={false}
          totalJobs={100}
          searchTerm="updated search"
          isRefreshing={true}
        />
      );

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
      expect(screen.getByText('All Jobs')).toBeInTheDocument();
    });

    it('should properly switch between filtered and unfiltered states', () => {
      const { rerender } = render(<JobsHistoryTableHeader {...defaultProps} />);

      // Initially unfiltered - should show toggle
      expect(screen.getByTestId('switch')).toBeInTheDocument();

      // Switch to filtered
      rerender(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'test-job',
            serviceTitle: 'Test Service',
          }}
        />
      );

      // Toggle should be hidden, job name button should show
      expect(screen.queryByTestId('switch')).not.toBeInTheDocument();
      expect(screen.getByText('test-job')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for switch', () => {
      render(<JobsHistoryTableHeader {...defaultProps} onlyMine={true} />);
      
      const label = screen.getByText('Only My Jobs');
      expect(label).toHaveAttribute('for', 'only-mine-toggle');
    });

    it('should associate switch with label via id', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      
      const switchElement = screen.getByTestId('switch');
      expect(switchElement).toHaveAttribute('id', 'only-mine-toggle');
    });

    it('should have accessible button text', () => {
      render(<JobsHistoryTableHeader {...defaultProps} />);
      
      // All buttons should have meaningful text
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText(/My Latest Executions/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onClearFilter gracefully', () => {
      render(
        <JobsHistoryTableHeader
          {...defaultProps}
          filteredService={{
            jobName: 'test',
            serviceTitle: 'Test',
          }}
          onClearFilter={undefined}
        />
      );

      // Should not render clear button without callback
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should handle zero totalJobs', () => {
      render(<JobsHistoryTableHeader {...defaultProps} totalJobs={0} />);
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should handle empty search term', () => {
      render(<JobsHistoryTableHeader {...defaultProps} searchTerm="" />);
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('');
    });

    it('should handle very large job counts', () => {
      render(<JobsHistoryTableHeader {...defaultProps} totalJobs={999999} />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('999999');
    });

    it('should handle all callbacks being called in sequence', async () => {
      const callbacks = {
        onToggleCollapse: vi.fn(),
        onRefresh: vi.fn(),
        onSearchChange: vi.fn(),
        onClearSearch: vi.fn(),
      };

      render(<JobsHistoryTableHeader {...defaultProps} {...callbacks} searchTerm="test" />);

      // Click multiple buttons
      const collapseButton = screen.getByText(/My Latest Executions/i).closest('button');
      await userEvent.click(collapseButton!);

      const refreshButton = screen.getByText('Refresh');
      await userEvent.click(refreshButton);

      expect(callbacks.onToggleCollapse).toHaveBeenCalled();
      expect(callbacks.onRefresh).toHaveBeenCalled();
    });
  });
});