import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import SearchBar from '@/plugins/components/SearchBar';

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type, className, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      className={className}
      data-testid="search-input"
      {...props}
    />
  ),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Search: ({ className }: any) => (
    <div data-testid="search-icon" className={className}>
      Search
    </div>
  ),
  X: ({ className }: any) => (
    <div data-testid="x-icon" className={className}>
      X
    </div>
  ),
}));

describe('SearchBar', () => {
  const mockOnSearchChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render search input', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should have correct placeholder text', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByTestId('search-input')).toHaveAttribute(
        'placeholder',
        'Search plugins by name, title, or description...'
      );
    });

    it('should render as text input', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByTestId('search-input')).toHaveAttribute('type', 'text');
    });

    it('should apply correct padding classes for icons', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const input = screen.getByTestId('search-input');
      expect(input.className).toContain('pl-9');
      expect(input.className).toContain('pr-9');
    });
  });

  describe('Search Input Interaction', () => {
    it('should display current search query', () => {
      render(
        <SearchBar
          searchQuery="test plugin"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('test plugin');
    });

    it('should handle empty input', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should update when searchQuery prop changes', () => {
      const { rerender } = render(
        <SearchBar
          searchQuery="initial"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      let input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(
        <SearchBar
          searchQuery="updated"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });
  });

  describe('Clear Button (X Icon)', () => {
    it('should not show clear button when search query is empty', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('should show clear button when search query has text', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should call onSearchChange with empty string when clear button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchBar
          searchQuery="test query"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });

    it('should have clear button as button element', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton.tagName).toBe('BUTTON');
    });

    it('should have correct aria-label on clear button', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });
  });

  describe('Search Results Summary', () => {
    it('should not show results summary when debouncedSearchQuery is empty', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={5}
        />
      );

      expect(screen.queryByText(/Found/)).not.toBeInTheDocument();
    });

    it('should show results summary when debouncedSearchQuery has value', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      expect(screen.getByText(/Found 5 plugins matching "test"/)).toBeInTheDocument();
    });

    it('should use singular "plugin" for 1 result', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={1}
        />
      );

      expect(screen.getByText(/Found 1 plugin matching "test"/)).toBeInTheDocument();
    });

    it('should use plural "plugins" for 0 results', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={0}
        />
      );

      expect(screen.getByText(/Found 0 plugins matching "test"/)).toBeInTheDocument();
    });

    it('should use plural "plugins" for multiple results', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={10}
        />
      );

      expect(screen.getByText(/Found 10 plugins matching "test"/)).toBeInTheDocument();
    });

    it('should display the debounced search query in results', () => {
      render(
        <SearchBar
          searchQuery="test query"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      // Should show debounced query, not the current query
      expect(screen.getByText(/matching "test"/)).toBeInTheDocument();
    });

    it('should show clear search button in results when items found', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    it('should not show clear search button in results when no items found', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={0}
        />
      );

      // Should show results summary but not the clear button
      expect(screen.getByText(/Found 0 plugins/)).toBeInTheDocument();
      expect(screen.queryByText('Clear search')).not.toBeInTheDocument();
    });

    it('should call onSearchChange with empty string when clear search clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      const clearButton = screen.getByText('Clear search');
      await user.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Layout and Styling', () => {
    it('should have relative positioning on search container', () => {
      const { container } = render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const searchContainer = container.querySelector('.relative.max-w-md');
      expect(searchContainer).toBeInTheDocument();
    });

    it('should position search icon on left', () => {
      render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const searchIcon = screen.getByTestId('search-icon');
      expect(searchIcon.className).toContain('left-3');
      expect(searchIcon.className).toContain('absolute');
    });

    it('should have max width on search container', () => {
      const { container } = render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const searchContainer = container.querySelector('.max-w-md');
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long search query', () => {
      const longQuery = 'a'.repeat(200);
      
      render(
        <SearchBar
          searchQuery={longQuery}
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery={longQuery}
          filteredTotalItems={1}
        />
      );

      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe(longQuery);
      expect(screen.getByText(new RegExp(`matching "${longQuery}"`))).toBeInTheDocument();
    });

    it('should handle quotes in search query', () => {
      const queryWithQuotes = 'plugin "name" search';
      
      render(
        <SearchBar
          searchQuery={queryWithQuotes}
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery={queryWithQuotes}
          filteredTotalItems={2}
        />
      );

      expect(screen.getByText(new RegExp(`matching "${queryWithQuotes}"`))).toBeInTheDocument();
    });

    it('should handle very large filteredTotalItems number', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={999999}
        />
      );

      expect(screen.getByText(/Found 999999 plugins/)).toBeInTheDocument();
    });

    it('should handle negative filteredTotalItems gracefully', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={-1}
        />
      );

      // Component doesn't validate, so it would show negative number
      // But this is an edge case that shouldn't happen in normal usage
      expect(screen.getByText(/Found -1/)).toBeInTheDocument();
    });

    it('should handle searchQuery and debouncedSearchQuery being different', () => {
      render(
        <SearchBar
          searchQuery="testing"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('testing');
      
      // Results should use debounced query
      expect(screen.getByText(/matching "test"/)).toBeInTheDocument();
    });

  });

  describe('Multiple Interactions', () => {

    it('should handle clearing via X icon and via Clear search button', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      // Both clear mechanisms should be present
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();

      // Click X icon
      const xButton = screen.getByLabelText('Clear search');
      await user.click(xButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on clear button', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });

    it('should have focusable clear button', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton.tagName).toBe('BUTTON');
    });

    it('should have focusable clear search link', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      const clearLink = screen.getByText('Clear search');
      expect(clearLink.tagName).toBe('BUTTON');
    });

    it('should have semantic text for screen readers', () => {
      render(
        <SearchBar
          searchQuery="test"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test"
          filteredTotalItems={5}
        />
      );

      // Results summary should be readable by screen readers
      expect(screen.getByText(/Found 5 plugins matching "test"/)).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot with empty search', () => {
      const { container } = render(
        <SearchBar
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery=""
          filteredTotalItems={0}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with active search', () => {
      const { container } = render(
        <SearchBar
          searchQuery="test plugin"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="test plugin"
          filteredTotalItems={5}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with no results', () => {
      const { container } = render(
        <SearchBar
          searchQuery="nonexistent"
          onSearchChange={mockOnSearchChange}
          debouncedSearchQuery="nonexistent"
          filteredTotalItems={0}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});