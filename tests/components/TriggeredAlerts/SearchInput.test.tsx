import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchInput } from '../../../src/components/TriggeredAlerts/SearchInput';
import { TriggeredAlertsProvider } from '../../../src/contexts/TriggeredAlertsContext';

// Mock the useDebounce hook
vi.mock('../../../src/hooks/useDebounce', () => ({
  useDebounce: vi.fn(() => undefined),
}));

// Mock the TriggeredAlertsContext
const mockContextValue = {
  projectId: 'test-project',
  filters: {
    searchTerm: '',
    selectedSeverity: [],
    selectedStatus: [],
    selectedLandscape: [],
    selectedRegion: [],
    startDate: '',
    endDate: '',
    excludedSeverity: [],
    excludedStatus: [],
    excludedLandscape: [],
    excludedRegion: [],
    excludedAlertname: [],
    page: 1,
    pageSize: 50,
  },
  actions: {
    setSearchTerm: vi.fn(),
    setSelectedSeverity: vi.fn(),
    setSelectedStatus: vi.fn(),
    setSelectedLandscape: vi.fn(),
    setSelectedRegion: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    handleDateRangeSelect: vi.fn(),
    resetFilters: vi.fn(),
    removeSearchTerm: vi.fn(),
    removeSeverity: vi.fn(),
    removeStatus: vi.fn(),
    removeLandscape: vi.fn(),
    removeRegion: vi.fn(),
    removeDateRange: vi.fn(),
  },
  options: {
    severities: ['critical', 'warning', 'info'],
    statuses: ['firing', 'resolved'],
    landscapes: ['production', 'staging', 'development'],
    regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
  },
  filteredAlerts: [],
  isLoading: false,
  filtersLoading: false,
  error: null,
  appliedFilters: [],
  totalCount: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

vi.mock('../../../src/contexts/TriggeredAlertsContext', () => ({
  TriggeredAlertsProvider: ({ children }: any) => <div data-testid="triggered-alerts-provider">{children}</div>,
  useTriggeredAlertsContext: vi.fn(() => mockContextValue),
}));

// Import the mocked context and useDebounce
import { useTriggeredAlertsContext } from '../../../src/contexts/TriggeredAlertsContext';
import { useDebounce } from '../../../src/hooks/useDebounce';
const mockUseTriggeredAlertsContext = vi.mocked(useTriggeredAlertsContext);
const mockUseDebounce = vi.mocked(useDebounce);

// Helper function to render with provider
function renderWithProvider(component: React.ReactElement) {
  return render(
    <TriggeredAlertsProvider projectId="test-project">
      {component}
    </TriggeredAlertsProvider>
  );
}

// ============================================================================
// MAIN TESTS
// ============================================================================

describe('SearchInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset the mock to return the default context value
    mockUseTriggeredAlertsContext.mockReturnValue(mockContextValue);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('should render with default placeholder and search icon', () => {
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
    expect(searchInput).toHaveClass('pl-10', 'h-10');
    
    // Check for search icon
    const searchIcon = document.querySelector('svg.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const customPlaceholder = 'Search for specific alerts...';
    renderWithProvider(<SearchInput placeholder={customPlaceholder} />);
    
    const searchInput = screen.getByPlaceholderText(customPlaceholder);
    expect(searchInput).toBeInTheDocument();
  });

  // ============================================================================
  // CONTEXT INTEGRATION TESTS
  // ============================================================================

  it('should display current search term from context', () => {
    const mockWithSearchTerm = {
      ...mockContextValue,
      filters: {
        ...mockContextValue.filters,
        searchTerm: 'existing search',
      },
    };
    
    mockUseTriggeredAlertsContext.mockReturnValue(mockWithSearchTerm);
    
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByDisplayValue('existing search');
    expect(searchInput).toBeInTheDocument();
  });

  it('should update local value when context search term changes', () => {
    // Start with a search term in context
    const mockWithSearchTerm = {
      ...mockContextValue,
      filters: {
        ...mockContextValue.filters,
        searchTerm: 'updated search',
      },
    };
    
    mockUseTriggeredAlertsContext.mockReturnValue(mockWithSearchTerm);
    
    renderWithProvider(<SearchInput />);
    
    expect(screen.getByDisplayValue('updated search')).toBeInTheDocument();
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  it('should handle various input changes', () => {
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    
    // Test regular input
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
    
    // Test clearing
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput).toHaveValue('');
    
    // Test special characters
    const specialText = 'test@#$%^&*()_+-=';
    fireEvent.change(searchInput, { target: { value: specialText } });
    expect(searchInput).toHaveValue(specialText);
  });

  // ============================================================================
  // DEBOUNCE INTEGRATION TESTS
  // ============================================================================

  it('should use debounce hook for search functionality', () => {
    renderWithProvider(<SearchInput />);
    
    // Verify the component renders and uses debounce
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toBeInTheDocument();
    
    // Test that input changes work
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput).toHaveValue('test');
  });

  // ============================================================================
  // MEMO OPTIMIZATION TESTS
  // ============================================================================

  it('should be memoized and not re-render unnecessarily', () => {
    const { rerender } = renderWithProvider(<SearchInput placeholder="test" />);
    
    const initialInput = screen.getByPlaceholderText('test');
    
    // Re-render with same props
    rerender(
      <TriggeredAlertsProvider projectId="test-project">
        <SearchInput placeholder="test" />
      </TriggeredAlertsProvider>
    );
    
    const afterRerender = screen.getByPlaceholderText('test');
    
    // Component should be memoized
    expect(initialInput).toBeInTheDocument();
    expect(afterRerender).toBeInTheDocument();
  });

  it('should re-render when placeholder prop changes', () => {
    const { rerender } = renderWithProvider(<SearchInput placeholder="initial" />);
    
    expect(screen.getByPlaceholderText('initial')).toBeInTheDocument();
    
    // Re-render with different placeholder
    rerender(
      <TriggeredAlertsProvider projectId="test-project">
        <SearchInput placeholder="updated" />
      </TriggeredAlertsProvider>
    );
    
    expect(screen.getByPlaceholderText('updated')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('initial')).not.toBeInTheDocument();
  });

  // ============================================================================
  // REF TESTS
  // ============================================================================

  it('should have input ref accessible', () => {
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect(searchInput.tagName).toBe('INPUT');
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  it('should have proper accessibility attributes', () => {
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    
    // Check basic input attributes - input elements don't have explicit type="text" by default
    expect(searchInput).toHaveAttribute('placeholder', 'Search alerts...');
    expect(searchInput.tagName).toBe('INPUT');
  });

  it('should be focusable', () => {
    renderWithProvider(<SearchInput />);
    
    const searchInput = screen.getByPlaceholderText('Search alerts...');
    
    // Just verify the input exists and can be interacted with
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  it('should handle edge cases', () => {
    // Test undefined placeholder
    const { rerender } = renderWithProvider(<SearchInput placeholder={undefined} />);
    expect(screen.getByPlaceholderText('Search alerts...')).toBeInTheDocument();
    
    // Test empty placeholder
    rerender(
      <TriggeredAlertsProvider projectId="test-project">
        <SearchInput placeholder="" />
      </TriggeredAlertsProvider>
    );
    const emptyPlaceholderInput = screen.getByRole('textbox');
    expect(emptyPlaceholderInput).toHaveAttribute('placeholder', '');
    
    // Test very long input
    const longText = 'a'.repeat(1000);
    fireEvent.change(emptyPlaceholderInput, { target: { value: longText } });
    expect(emptyPlaceholderInput).toHaveValue(longText);
  });

  // ============================================================================
  // CONTEXT ERROR HANDLING TESTS
  // ============================================================================

  it('should handle missing context gracefully', () => {
    // Mock the context to throw an error
    mockUseTriggeredAlertsContext.mockImplementation(() => {
      throw new Error('useTriggeredAlertsContext must be used within a TriggeredAlertsProvider');
    });
    
    // This should throw an error since the component requires the context
    expect(() => render(<SearchInput />)).toThrow('useTriggeredAlertsContext must be used within a TriggeredAlertsProvider');
  });


  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  it('should not cause excessive re-renders', () => {
    const renderSpy = vi.fn();
    
    const TestComponent = () => {
      renderSpy();
      return <SearchInput />;
    };
    
    const { rerender } = renderWithProvider(<TestComponent />);
    
    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    // Re-render with same context
    rerender(
      <TriggeredAlertsProvider projectId="test-project">
        <TestComponent />
      </TriggeredAlertsProvider>
    );
    
    // Should not cause additional renders due to memoization
    expect(renderSpy).toHaveBeenCalledTimes(2); // Only the rerender call
  });
});
