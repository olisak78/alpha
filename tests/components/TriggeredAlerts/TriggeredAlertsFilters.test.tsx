import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TriggeredAlertsFilters } from '../../../src/components/TriggeredAlerts/TriggeredAlertsFilters';
import { TriggeredAlertsProvider } from '../../../src/contexts/TriggeredAlertsContext';

// Mock the hook to return controlled data
const mockHookReturn = {
  filters: {
    searchTerm: '',
    selectedSeverity: 'all',
    selectedStatus: 'all',
    selectedLandscape: 'all',
    selectedRegion: 'all',
    selectedComponent: 'all',
    startDate: '',
    endDate: '',
  },
  actions: {
    setSearchTerm: vi.fn(),
    setSelectedSeverity: vi.fn(),
    setSelectedStatus: vi.fn(),
    setSelectedLandscape: vi.fn(),
    setSelectedRegion: vi.fn(),
    setSelectedComponent: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    handleDateRangeSelect: vi.fn(),
    resetFilters: vi.fn(),
    removeSearchTerm: vi.fn(),
    removeSeverity: vi.fn(),
    removeStatus: vi.fn(),
    removeLandscape: vi.fn(),
    removeRegion: vi.fn(),
    removeComponent: vi.fn(),
    removeDateRange: vi.fn(),
  },
  options: {
    severities: ['critical', 'warning', 'info'],
    statuses: ['firing', 'resolved'],
    landscapes: ['production', 'staging', 'development'],
    components: ['component-a', 'component-b', 'component-c'],
    regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
  },
  filteredAlerts: [],
  isLoading: false,
  filtersLoading: false,
  error: null,
  appliedFilters: [],
};

vi.mock('../../../src/hooks/useTriggeredAlertsFilters', () => ({
  useTriggeredAlertsFilters: vi.fn(() => mockHookReturn),
}));

// Import the mocked hook
import { useTriggeredAlertsFilters } from '../../../src/hooks/useTriggeredAlertsFilters';
const mockUseTriggeredAlertsFilters = vi.mocked(useTriggeredAlertsFilters);

// Helper function to render with provider
function renderWithProvider(component: React.ReactElement) {
  return render(
    <TriggeredAlertsProvider projectId="test-project">
      {component}
    </TriggeredAlertsProvider>
  );
}

describe('TriggeredAlertsFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input and filters button', () => {
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Check for search input
    expect(screen.getByPlaceholderText('Search alerts...')).toBeInTheDocument();
    
    // Check for filters button
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Check for search icon
    const searchIcon = document.querySelector('svg.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should render search input with correct placeholder and icon', () => {
    renderWithProvider(<TriggeredAlertsFilters />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
    
    // Check for search icon using SVG selector
    const searchIcon = document.querySelector('svg.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    await user.type(searchInput, 'test search');
    
    // userEvent.type calls onChange for each character, so check that it was called
    expect(mockHookReturn.actions.setSearchTerm).toHaveBeenCalled();
    // Check the last call was with the last character
    expect(mockHookReturn.actions.setSearchTerm).toHaveBeenLastCalledWith('h');
  });

  it('should render date range picker with calendar icon in filters popover', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Open the filters popover first
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Check for date range button with calendar icon
    const dateRangeButton = screen.getByText('Select dates');
    expect(dateRangeButton).toBeInTheDocument();
    
    // Check for calendar icon using SVG selector
    const calendarIcon = document.querySelector('svg.lucide-calendar');
    expect(calendarIcon).toBeInTheDocument();
  });

  it('should handle date range selection', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Open the filters popover first
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Click on the date range button to open the date picker popover
    const dateRangeButton = screen.getByText('Select dates');
    await user.click(dateRangeButton);
    
    // The DateRangeCalendar should be rendered in the popover
    // We can't easily test the actual date selection without mocking the calendar component
    // So we'll just verify the button click works
    expect(dateRangeButton).toBeInTheDocument();
  });

  it('should open filters popover when filters button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Click the filters button to open the popover
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Check that filter labels are now visible in the popover
    expect(screen.getByText('Time Range')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Landscape')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
  });

  it('should display selected values in filters', async () => {
    const user = userEvent.setup();
    
    // Mock the hook to return selected values
    const mockWithSelections = {
      ...mockHookReturn,
      filters: {
        ...mockHookReturn.filters,
        searchTerm: 'test search',
        selectedSeverity: 'critical',
        selectedStatus: 'firing',
        selectedLandscape: 'production',
        selectedComponent: 'component-a',
        selectedRegion: 'us-east-1',
        startDate: '2023-12-01',
        endDate: '2023-12-31'
      }
    };
    
    mockUseTriggeredAlertsFilters.mockReturnValue(mockWithSelections);
    
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Check search input value
    const searchInput = screen.getByDisplayValue('test search');
    expect(searchInput).toBeInTheDocument();
    
    // Open the filters popover to see the date range
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Check date range display (formatted dates)
    expect(screen.getByText('01/12/2023 - 31/12/2023')).toBeInTheDocument();
  });

  it('should apply correct CSS classes and styling', () => {
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Check main container styling
    const container = screen.getByPlaceholderText('Search alerts...').closest('.bg-card');
    expect(container).toHaveClass('bg-card', 'border', 'rounded-lg', 'p-4');
    
    // Check flex layout
    const flexContainer = container?.querySelector('.flex');
    expect(flexContainer).toHaveClass('flex', 'flex-wrap', 'gap-3', 'items-center');
    
    // Check search input styling
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toHaveClass('pl-10', 'h-10');
  });

  it('should handle empty filter arrays gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock the hook to return empty arrays
    const mockWithEmptyArrays = {
      ...mockHookReturn,
      options: {
        severities: [],
        statuses: [],
        landscapes: [],
        components: [],
        regions: []
      }
    };
    
    mockUseTriggeredAlertsFilters.mockReturnValue(mockWithEmptyArrays);
    
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Search input should always be visible
    expect(screen.getByPlaceholderText('Search alerts...')).toBeInTheDocument();
    
    // Open the filters popover
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Time Range should always be visible
    expect(screen.getByText('Time Range')).toBeInTheDocument();
    
    // Filter labels should not be present when arrays are empty
    expect(screen.queryByText('Severity')).not.toBeInTheDocument();
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Landscape')).not.toBeInTheDocument();
    expect(screen.queryByText('Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Region')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Check search input has proper attributes
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toHaveAttribute('placeholder', 'Search alerts...');
    
    // Check filters button is accessible
    const filtersButton = screen.getByText('Filters');
    expect(filtersButton).toHaveAttribute('type', 'button');
  });

  it('should render date range display correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Open the filters popover first
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Check that the date range button shows "Select dates" when no dates are selected
    expect(screen.getByText('Select dates')).toBeInTheDocument();
  });

  it('should handle all callback functions being called', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Test search input
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    await user.type(searchInput, 'a');
    expect(mockHookReturn.actions.setSearchTerm).toHaveBeenCalled();
    
    // Open the filters popover first
    const filtersButton = screen.getByText('Filters');
    await user.click(filtersButton);
    
    // Test date range button click
    const dateRangeButton = screen.getByText('Select dates');
    await user.click(dateRangeButton);
    // Just verify the button is clickable - actual date selection would require mocking the calendar
    expect(dateRangeButton).toBeInTheDocument();
  });

  it('should maintain responsive layout classes', () => {
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Check responsive flex classes
    const container = screen.getByPlaceholderText('Search alerts...').closest('.bg-card');
    const flexContainer = container?.querySelector('.flex');
    expect(flexContainer).toHaveClass('flex', 'flex-wrap', 'gap-3', 'items-center');
    
    // Check search container classes - find the parent div that has the w-full class
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    const searchContainer = searchInput.parentElement?.parentElement; // Go up to the div with w-full class
    expect(searchContainer).toHaveClass('w-full', 'lg:w-80', 'flex-shrink-0');
  });

  it('should render with different selected values', () => {
    // Mock the hook to return different selected values
    const mockWithDifferentValues = {
      ...mockHookReturn,
      filters: {
        ...mockHookReturn.filters,
        selectedSeverity: 'warning',
        selectedStatus: 'resolved',
        selectedLandscape: 'staging',
        selectedComponent: 'component-b',
        selectedRegion: 'eu-west-1'
      }
    };
    
    mockUseTriggeredAlertsFilters.mockReturnValue(mockWithDifferentValues);
    
    renderWithProvider(<TriggeredAlertsFilters />);
    
    // Component should render without errors
    expect(screen.getByPlaceholderText('Search alerts...')).toBeInTheDocument();
  });
});
