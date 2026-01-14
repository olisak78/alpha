import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { SearchDropdown } from '../../src/components/SearchDropdown';

// Mock the UI components
vi.mock('../../src/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }>((props, ref) => <button ref={ref} {...props} />),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

/**
 * SearchDropdown Component Tests
 * 
 * Tests for the generic SearchDropdown component which provides
 * search functionality with dropdown results display.
 */

describe('SearchDropdown Component', () => {
  // Test data
  interface TestItem {
    id: string;
    name: string;
    email: string;
  }

  const mockItems: TestItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
  ];

  const defaultProps = {
    searchTerm: '',
    onSearchTermChange: vi.fn(),
    isDropdownOpen: false,
    onDropdownOpenChange: vi.fn(),
    onItemSelect: vi.fn(),
    renderItem: (item: TestItem) => (
      <div>
        <span>{item.name}</span>
        <span>{item.email}</span>
      </div>
    ),
    getItemKey: (item: TestItem) => item.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render search input with correct structure', () => {
      render(<SearchDropdown {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const searchIcon = screen.getByTestId('search-icon');

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render with custom placeholder and className', () => {
      const { container } = render(
        <SearchDropdown
          {...defaultProps}
          placeholder="Search users..."
          className="custom-class"
        />
      );

      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild as HTMLElement;
      
      expect(input).toHaveAttribute('placeholder', 'Search users...');
      expect(wrapper).toHaveClass('relative', 'custom-class');
    });

    it('should display search term in input', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm="test search"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test search');
    });
  });

  // ============================================================================
  // INPUT INTERACTION TESTS
  // ============================================================================

  describe('Input Interactions', () => {
    it('should call onSearchTermChange when typing in input', async () => {
      const user = userEvent.setup();
      const onSearchTermChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          onSearchTermChange={onSearchTermChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(onSearchTermChange).toHaveBeenCalledTimes(4); // One for each character
      expect(onSearchTermChange).toHaveBeenNthCalledWith(1, 't');
      expect(onSearchTermChange).toHaveBeenNthCalledWith(4, 't');
    });

    it('should call onDropdownOpenChange when input is focused with search term', async () => {
      const user = userEvent.setup();
      const onDropdownOpenChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm="test"
          onDropdownOpenChange={onDropdownOpenChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(onDropdownOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call onDropdownOpenChange with false when input loses focus', async () => {
      const user = userEvent.setup();
      const onDropdownOpenChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away

      // Wait for the blur timeout
      await waitFor(() => {
        expect(onDropdownOpenChange).toHaveBeenCalledWith(false);
      }, { timeout: 300 });
    });
  });

  // ============================================================================
  // CLEAR BUTTON TESTS
  // ============================================================================

  describe('Clear Button', () => {
    it('should show clear button when search term is present', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm="test"
        />
      );

      const clearButton = screen.getByRole('button');
      const xIcon = screen.getByTestId('x-icon');

      expect(clearButton).toBeInTheDocument();
      expect(xIcon).toBeInTheDocument();
    });

    it('should not show clear button when search term is empty', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm=""
        />
      );

      const clearButton = screen.queryByRole('button');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should clear search and close dropdown when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onSearchTermChange = vi.fn();
      const onDropdownOpenChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm="test"
          onSearchTermChange={onSearchTermChange}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      );

      const clearButton = screen.getByRole('button');
      await user.click(clearButton);

      expect(onSearchTermChange).toHaveBeenCalledWith('');
      expect(onDropdownOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ============================================================================
  // DROPDOWN VISIBILITY TESTS
  // ============================================================================

  describe('Dropdown Visibility', () => {
    it('should show dropdown when isDropdownOpen is true', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={mockItems}
        />
      );

      const dropdown = document.querySelector('[class*="absolute"][class*="top-full"]');
      expect(dropdown).toBeInTheDocument();
    });

    it('should not show dropdown when isDropdownOpen is false', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={false}
          items={mockItems}
        />
      );

      const dropdown = document.querySelector('[class*="absolute"][class*="top-full"]');
      expect(dropdown).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATE TESTS (LOADING, ERROR, NO RESULTS)
  // ============================================================================

  describe('Component States', () => {
    it('should show loading message when isLoading is true', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          isLoading={true}
          loadingMessage="Finding users..."
        />
      );

      expect(screen.getByText('Finding users...')).toBeInTheDocument();
    });

    it('should show error message when error is present', () => {
      const error = new Error('Search failed');

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          error={error}
          errorMessage="Failed to search users"
        />
      );

      expect(screen.getByText('Failed to search users')).toBeInTheDocument();
    });

    it('should show no results message when items array is empty and search term exists', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={[]}
          searchTerm="test"
          noResultsMessage="No users found for your search"
        />
      );

      expect(screen.getByText('No users found for your search')).toBeInTheDocument();
    });

    it('should not show no results message when loading or error is present', () => {
      const error = new Error('Search failed');

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={[]}
          searchTerm="test"
          isLoading={true}
          error={error}
        />
      );

      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ITEMS RENDERING AND INTERACTION TESTS
  // ============================================================================

  describe('Items Rendering and Interaction', () => {
    it('should render items when provided', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={mockItems}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should call onItemSelect and close dropdown when item is clicked', async () => {
      const user = userEvent.setup();
      const onItemSelect = vi.fn();
      const onDropdownOpenChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={mockItems}
          onItemSelect={onItemSelect}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      );

      const firstItem = screen.getByText('John Doe').closest('button');
      await user.click(firstItem!);

      expect(onItemSelect).toHaveBeenCalledWith(mockItems[0]);
      expect(onDropdownOpenChange).toHaveBeenCalledWith(false);
    });

    it('should use custom renderItem function', () => {
      const customRenderItem = (item: TestItem) => (
        <div data-testid={`custom-item-${item.id}`}>
          <strong>{item.name.toUpperCase()}</strong>
        </div>
      );

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={mockItems}
          renderItem={customRenderItem}
        />
      );

      expect(screen.getByTestId('custom-item-1')).toBeInTheDocument();
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
    });

    it('should use getItemKey for unique keys', () => {
      const getItemKey = vi.fn((item: TestItem) => item.id);

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={mockItems}
          getItemKey={getItemKey}
        />
      );

      expect(getItemKey).toHaveBeenCalledTimes(mockItems.length);
      mockItems.forEach((item) => {
        expect(getItemKey).toHaveBeenCalledWith(item);
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle undefined items gracefully', () => {
      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={undefined}
        />
      );

      // Should not crash and should not show any items
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle items with missing properties', () => {
      const incompleteItems = [
        { id: '1', name: 'John', email: '' },
        { id: '2', name: '', email: 'test@example.com' },
      ] as TestItem[];

      render(
        <SearchDropdown
          {...defaultProps}
          isDropdownOpen={true}
          items={incompleteItems}
        />
      );

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should handle special characters in search terms', () => {
      const specialSearchTerm = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm={specialSearchTerm}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(specialSearchTerm);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete search flow', async () => {
      const user = userEvent.setup();
      const onSearchTermChange = vi.fn();
      const onDropdownOpenChange = vi.fn();
      const onItemSelect = vi.fn();

      const { rerender } = render(
        <SearchDropdown
          {...defaultProps}
          onSearchTermChange={onSearchTermChange}
          onDropdownOpenChange={onDropdownOpenChange}
          onItemSelect={onItemSelect}
        />
      );

      // Type in search
      const input = screen.getByRole('textbox');
      await user.type(input, 'john');

      expect(onSearchTermChange).toHaveBeenCalledTimes(4);

      // Simulate dropdown opening with results
      rerender(
        <SearchDropdown
          {...defaultProps}
          searchTerm="john"
          isDropdownOpen={true}
          items={mockItems}
          onSearchTermChange={onSearchTermChange}
          onDropdownOpenChange={onDropdownOpenChange}
          onItemSelect={onItemSelect}
        />
      );

      // Select an item
      const firstItem = screen.getByText('John Doe').closest('button');
      await user.click(firstItem!);

      expect(onItemSelect).toHaveBeenCalledWith(mockItems[0]);
      expect(onDropdownOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle search and clear flow', async () => {
      const user = userEvent.setup();
      const onSearchTermChange = vi.fn();
      const onDropdownOpenChange = vi.fn();

      render(
        <SearchDropdown
          {...defaultProps}
          searchTerm="test"
          isDropdownOpen={true}
          items={mockItems}
          onSearchTermChange={onSearchTermChange}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      );

      // Clear search
      const clearButton = screen.getByTestId('x-icon').closest('button');
      await user.click(clearButton!);

      expect(onSearchTermChange).toHaveBeenCalledWith('');
      expect(onDropdownOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
