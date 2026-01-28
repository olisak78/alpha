import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchUser } from '../../../src/components/Team/SearchUser';
import type { User } from '../../../src/types/api';

// Mock the hooks with proper implementations
vi.mock('../../../src/hooks/useDebounce', () => ({
  useDebounce: vi.fn(),
}));

vi.mock('../../../src/hooks/api/useMembers', () => ({
  useUserSearch: vi.fn(),
}));

// Mock the SearchDropdown component
vi.mock('../../../src/components/SearchDropdown', () => ({
  SearchDropdown: vi.fn(({ searchTerm, placeholder, className, isLoading, error, items, onSearchTermChange, onItemSelect, renderItem, getItemKey, noResultsMessage }) => (
    <div data-testid="search-dropdown">
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <div data-testid="dropdown-props">
        <span data-testid="is-loading">{isLoading.toString()}</span>
        <span data-testid="error">{error ? 'error' : 'no-error'}</span>
        <span data-testid="items-count">{items?.length || 0}</span>
        <span data-testid="no-results-message">{noResultsMessage}</span>
      </div>
      {items?.map((item) => (
        <button
          key={getItemKey(item)}
          onClick={() => onItemSelect(item)}
          data-testid={`user-item-${item.id}`}
        >
          <div>{renderItem(item)}</div>
        </button>
      ))}
    </div>
  )),
}));

// Import the mocked modules
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useUserSearch } from '../../../src/hooks/api/useMembers';

// Get references to the mocked functions
const mockUseDebounce = vi.mocked(useDebounce);
const mockUseUserSearch = vi.mocked(useUserSearch);

/**
 * SearchUser Component Tests
 * 
 * Tests for the SearchUser component which provides user search functionality
 * with debouncing and integration with the SearchDropdown component.
 */

describe('SearchUser Component', () => {
  // Test data
  const mockUsers: User[] = [
    {
      id: '1',
      uuid: 'uuid-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      mobile: '+1234567890',
      team_domain: 'engineering',
      team_id: 'team-1',
      team_role: 'developer',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      metadata: {},
    },
    {
      id: '2',
      uuid: 'uuid-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      mobile: '+1234567891',
      team_domain: 'design',
      team_id: 'team-2',
      team_role: 'designer',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      metadata: {},
    },
  ];

  const mockSearchResults = {
    users: mockUsers,
    total: mockUsers.length,
    limit: 20,
    offset: 0,
  };

  const defaultProps = {
    onUserSelect: vi.fn(),
    placeholder: 'Search users...',
    className: 'test-class',
  };

  // Helper function to render component with QueryClient
  const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations - don't call callback immediately to avoid infinite renders
    mockUseDebounce.mockImplementation(() => {
      // Just mock the hook without calling the callback
    });

    mockUseUserSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
      refetch: vi.fn(),
      isFetching: false,
      isLoadingError: false,
      isRefetchError: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isInitialLoading: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetching: false,
      isStale: false,
    } as any);
  });

  // ============================================================================
  // COMPONENT INTEGRATION TESTS
  // ============================================================================

  describe('Component Integration', () => {
    it('should render SearchDropdown with correct props', () => {
      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search users...');
      expect(screen.getByTestId('search-input')).toHaveAttribute('class', 'test-class');
      expect(screen.getByTestId('items-count')).toHaveTextContent('2');
    });

    it('should render with default props when none provided', () => {
      renderWithQueryClient(<SearchUser />);

      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search users...');
      expect(screen.getByTestId('search-input')).toHaveAttribute('class', '');
    });

    it('should pass custom placeholder and className', () => {
      renderWithQueryClient(
        <SearchUser
          placeholder="Find team members..."
          className="custom-search"
        />
      );

      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Find team members...');
      expect(screen.getByTestId('search-input')).toHaveAttribute('class', 'custom-search');
    });
  });

  // ============================================================================
  // DEBOUNCING FUNCTIONALITY TESTS
  // ============================================================================

  describe('Debouncing Functionality', () => {
    it('should call useDebounce with correct parameters', () => {
      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(mockUseDebounce).toHaveBeenCalledWith(
        '', // initial searchTerm
        expect.any(Function), // callback function
        { delay: 300 }
      );
    });
  });

  // ============================================================================
  // API INTEGRATION TESTS
  // ============================================================================

  describe('API Integration', () => {
    it('should call useUserSearch with initial empty search term', () => {
      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(mockUseUserSearch).toHaveBeenCalledWith(
        '',
        { enabled: false }
      );
    });

    it('should pass loading state to SearchDropdown', () => {
      mockUseUserSearch.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });

    it('should pass error state to SearchDropdown', () => {
      const mockError = new Error('Search failed');
      mockUseUserSearch.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
      } as any);

      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('error')).toHaveTextContent('error');
    });

    it('should handle empty search results', () => {
      mockUseUserSearch.mockReturnValue({
        data: { users: [], total: 0, limit: 20, offset: 0 },
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });

    it('should handle undefined search results', () => {
      mockUseUserSearch.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interaction', () => {
    it('should call onUserSelect when user is selected', async () => {
      const user = userEvent.setup();
      const onUserSelect = vi.fn();
      renderWithQueryClient(
        <SearchUser {...defaultProps} onUserSelect={onUserSelect} />
      );

      const userButton = screen.getByTestId('user-item-1');
      await user.click(userButton);

      expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should not crash when onUserSelect is not provided', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SearchUser />);

      const userButton = screen.getByTestId('user-item-1');
      
      // Should not crash when clicking
      await expect(user.click(userButton)).resolves.not.toThrow();
    });

    it('should clear search term when user is selected', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SearchUser {...defaultProps} />);

      // Type in search
      const input = screen.getByTestId('search-input');
      await user.type(input, 'john');
      expect(input).toHaveValue('john');

      // Select user
      const userButton = screen.getByTestId('user-item-1');
      await user.click(userButton);

      // Search should be cleared
      expect(input).toHaveValue('');
    });
  });

  // ============================================================================
  // USER RENDERING TESTS
  // ============================================================================

  describe('User Rendering', () => {
    it('should render user items with name only', () => {
      renderWithQueryClient(<SearchUser {...defaultProps} />);

      const userItem = screen.getByTestId('user-item-1');
      expect(userItem).toHaveTextContent('John Doe');
      // Email is not rendered in the actual component
      expect(userItem).not.toHaveTextContent('john.doe@example.com');
    });

    it('should handle user with missing names', () => {
      const usersWithMissingNames = [{
        ...mockUsers[0],
        first_name: '',
        last_name: '',
      }];

      mockUseUserSearch.mockReturnValue({
        data: { users: usersWithMissingNames, total: 1, limit: 20, offset: 0 },
        isLoading: false,
        error: null,
      } as any);

      renderWithQueryClient(<SearchUser {...defaultProps} />);

      const userItem = screen.getByTestId('user-item-1');
      expect(userItem).toBeInTheDocument();
      // Should render empty content when both names are empty
      expect(userItem).toHaveTextContent('');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete search and selection flow', async () => {
      const user = userEvent.setup();
      const onUserSelect = vi.fn();
      renderWithQueryClient(
        <SearchUser {...defaultProps} onUserSelect={onUserSelect} />
      );

      // 1. Type in search
      const input = screen.getByTestId('search-input');
      await user.type(input, 'john');
      expect(input).toHaveValue('john');

      // 2. Select a user
      const userButton = screen.getByTestId('user-item-1');
      await user.click(userButton);

      // 3. Verify callback was called and search was cleared
      expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
      expect(input).toHaveValue('');
    });

    it('should handle search with loading and error states', () => {
      // Start with loading
      mockUseUserSearch.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      const { rerender } = renderWithQueryClient(<SearchUser {...defaultProps} />);

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      // Switch to error
      mockUseUserSearch.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
      } as any);

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <SearchUser {...defaultProps} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('error');
    });
  });
});
