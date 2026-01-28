import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TeamJiraFilters } from '@/components/Team/TeamJiraFilters';

// Mock TeamContext
vi.mock('@/contexts/TeamContext', () => ({
  useTeamContext: vi.fn(),
}));

// Mock Zustand store hooks
vi.mock('@/stores/teamStore', () => ({
  useJiraSearch: vi.fn(),
  useJiraAssigneeFilter: vi.fn(),
  useJiraStatusFilter: vi.fn(),
  useJiraSortBy: vi.fn(),
  useJiraFilterActions: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/select', () => ({
  Select: vi.fn(({ value, onValueChange, children }) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange?.(value)}>Select</button>
      {children}
    </div>
  )),
  SelectTrigger: vi.fn(({ children }) => (
    <div data-testid="select-trigger">{children}</div>
  )),
  SelectValue: vi.fn(({ placeholder }) => (
    <div data-testid="select-value">{placeholder || 'Value'}</div>
  )),
  SelectContent: vi.fn(({ children }) => (
    <div data-testid="select-content">{children}</div>
  )),
  SelectItem: vi.fn(({ value, children }) => (
    <div data-testid={`select-item-${value}`} data-value={value}>
      {children}
    </div>
  )),
}));

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn((props) => <input data-testid="search-input" {...props} />),
}));

import { useTeamContext } from '@/contexts/TeamContext';
import {
  useJiraSearch,
  useJiraAssigneeFilter,
  useJiraStatusFilter,
  useJiraSortBy,
  useJiraFilterActions,
} from '@/stores/teamStore';

describe('TeamJiraFilters', () => {
  const mockSetSearch = vi.fn();
  const mockSetAssigneeFilter = vi.fn();
  const mockSetStatusFilter = vi.fn();
  const mockSetSortBy = vi.fn();

  const mockMembers = [
    {
      id: 'member-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      iuser: 'jdoe',
      team: 'Team A',
      uuid: 'uuid-1',
    },
    {
      id: 'member-2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Designer',
      iuser: 'jsmith',
      team: 'Team A',
      uuid: 'uuid-2',
    },
    {
      id: 'member-3',
      fullName: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'Manager',
      iuser: 'bjohnson',
      team: 'Team A',
      uuid: 'uuid-3',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTeamContext).mockReturnValue({
      members: mockMembers,
    } as any);

    vi.mocked(useJiraSearch).mockReturnValue('');
    vi.mocked(useJiraAssigneeFilter).mockReturnValue('all');
    vi.mocked(useJiraStatusFilter).mockReturnValue('all');
    vi.mocked(useJiraSortBy).mockReturnValue('updated_desc');

    vi.mocked(useJiraFilterActions).mockReturnValue({
      setSearch: mockSetSearch,
      setAssigneeFilter: mockSetAssigneeFilter,
      setStatusFilter: mockSetStatusFilter,
      setSortBy: mockSetSortBy,
    });
  });

  describe('Rendering', () => {
    it('should render all filter sections', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Assignee')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Order by')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search key or summary');
    });

    it('should render assignee select', () => {
      render(<TeamJiraFilters />);

      const assigneeSelects = screen.getAllByTestId('select');
      expect(assigneeSelects.length).toBeGreaterThan(0);
    });

    it('should render status select', () => {
      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      expect(selects.length).toBe(3); // Assignee, Status, Sort
    });

    it('should render sort by select', () => {
      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      expect(selects.length).toBe(3);
    });
  });

  describe('Search Functionality', () => {
    it('should display current search value', () => {
      vi.mocked(useJiraSearch).mockReturnValue('TEST-123');

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
      expect(searchInput.value).toBe('TEST-123');
    });

    it('should call setSearch when search input changes', async () => {
      const user = userEvent.setup();

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');

      expect(mockSetSearch).toHaveBeenCalledWith('t');
      expect(mockSetSearch).toHaveBeenCalledWith('e');
      expect(mockSetSearch).toHaveBeenCalledWith('s');
      expect(mockSetSearch).toHaveBeenCalledWith('t');
    });

    it('should handle empty search', () => {
      vi.mocked(useJiraSearch).mockReturnValue('');

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('should call setSearch when clearing search', async () => {
      const user = userEvent.setup();
      vi.mocked(useJiraSearch).mockReturnValue('existing');

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input');
      await user.clear(searchInput);

      expect(mockSetSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Assignee Filter', () => {

    it('should display "Unassigned" option in assignee filter', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByTestId('select-item-Unassigned')).toHaveTextContent('Unassigned');
    });

    it('should render all team members in assignee filter', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByTestId('select-item-member-1')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('select-item-member-2')).toHaveTextContent('Jane Smith');
      expect(screen.getByTestId('select-item-member-3')).toHaveTextContent('Bob Johnson');
    });

    it('should display current assignee filter value', () => {
      vi.mocked(useJiraAssigneeFilter).mockReturnValue('member-1');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      const assigneeSelect = selects[0];
      expect(assigneeSelect).toHaveAttribute('data-value', 'member-1');
    });

  });

  describe('Status Filter', () => {
    it('should display "All" option in status filter', () => {
      render(<TeamJiraFilters />);

      const allItems = screen.getAllByTestId('select-item-all');
      expect(allItems.length).toBeGreaterThan(0);
    });

    it('should render all task statuses', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByTestId('select-item-In Progress')).toHaveTextContent('In Progress');
      expect(screen.getByTestId('select-item-Open')).toHaveTextContent('Open');
      expect(screen.getByTestId('select-item-Resolved')).toHaveTextContent('Resolved');
      expect(screen.getByTestId('select-item-Closed')).toHaveTextContent('Closed');
    });

    it('should display current status filter value', () => {
      vi.mocked(useJiraStatusFilter).mockReturnValue('In Progress');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      const statusSelect = selects[1];
      expect(statusSelect).toHaveAttribute('data-value', 'In Progress');
    });

    it('should display "all" when no specific status is selected', () => {
      vi.mocked(useJiraStatusFilter).mockReturnValue('all');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      const statusSelect = selects[1];
      expect(statusSelect).toHaveAttribute('data-value', 'all');
    });
  });

  describe('Sort By Filter', () => {
    it('should render all sort options', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByTestId('select-item-updated_desc')).toHaveTextContent('Updated (newest)');
      expect(screen.getByTestId('select-item-updated_asc')).toHaveTextContent('Updated (oldest)');
      expect(screen.getByTestId('select-item-created_desc')).toHaveTextContent('Created (newest)');
      expect(screen.getByTestId('select-item-created_asc')).toHaveTextContent('Created (oldest)');
      expect(screen.getByTestId('select-item-priority')).toHaveTextContent('Priority');
    });

    it('should display current sort by value', () => {
      vi.mocked(useJiraSortBy).mockReturnValue('priority');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      const sortSelect = selects[2];
      expect(sortSelect).toHaveAttribute('data-value', 'priority');
    });

    it('should default to "updated_desc"', () => {
      vi.mocked(useJiraSortBy).mockReturnValue('updated_desc');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      const sortSelect = selects[2];
      expect(sortSelect).toHaveAttribute('data-value', 'updated_desc');
    });
  });

  describe('Integration with Store', () => {
    it('should use search from Zustand store', () => {
      render(<TeamJiraFilters />);

      expect(useJiraSearch).toHaveBeenCalled();
    });

    it('should use assignee filter from Zustand store', () => {
      render(<TeamJiraFilters />);

      expect(useJiraAssigneeFilter).toHaveBeenCalled();
    });

    it('should use status filter from Zustand store', () => {
      render(<TeamJiraFilters />);

      expect(useJiraStatusFilter).toHaveBeenCalled();
    });

    it('should use sort by from Zustand store', () => {
      render(<TeamJiraFilters />);

      expect(useJiraSortBy).toHaveBeenCalled();
    });

    it('should get filter actions from Zustand store', () => {
      render(<TeamJiraFilters />);

      expect(useJiraFilterActions).toHaveBeenCalled();
    });
  });

  describe('Integration with Context', () => {
    it('should get members from TeamContext', () => {
      render(<TeamJiraFilters />);

      expect(useTeamContext).toHaveBeenCalled();
    });

    it('should render members from context in assignee filter', () => {
      render(<TeamJiraFilters />);

      mockMembers.forEach(member => {
        expect(screen.getByTestId(`select-item-${member.id}`)).toHaveTextContent(member.fullName);
      });
    });

    it('should handle context with many members', () => {
      const manyMembers = Array.from({ length: 50 }, (_, i) => ({
        id: `member-${i}`,
        fullName: `Member ${i}`,
        email: `member${i}@example.com`,
        role: 'Developer',
        iuser: `user${i}`,
        team: 'Team A',
        uuid: `uuid-${i}`,
      }));

      vi.mocked(useTeamContext).mockReturnValue({
        members: manyMembers,
      } as any);

      render(<TeamJiraFilters />);

      // Should render all members
      manyMembers.forEach(member => {
        expect(screen.getByTestId(`select-item-${member.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Labels', () => {
    it('should render "Search" label', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should render "Assignee" label', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByText('Assignee')).toBeInTheDocument();
    });

    it('should render "Status" label', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render "Order by" label', () => {
      render(<TeamJiraFilters />);

      expect(screen.getByText('Order by')).toBeInTheDocument();
    });

    it('should style labels with muted foreground', () => {
      const { container } = render(<TeamJiraFilters />);

      const labels = container.querySelectorAll('.text-muted-foreground');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should apply small text size to labels', () => {
      const { container } = render(<TeamJiraFilters />);

      const labels = container.querySelectorAll('.text-xs');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Layout', () => {
    it('should use flexbox layout', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.flex');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should be responsive with flex-col on mobile', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.flex-col');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should switch to flex-row on medium screens', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.md\\:flex-row');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have proper spacing between elements', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.gap-3');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should align items at end on medium screens', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.md\\:items-end');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have margin bottom', () => {
      const { container } = render(<TeamJiraFilters />);

      const mainContainer = container.querySelector('.mb-4');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Filter Widths', () => {
    it('should make search input flex-1', () => {
      const { container } = render(<TeamJiraFilters />);

      const searchContainer = container.querySelector('.flex-1');
      expect(searchContainer).toBeInTheDocument();
    });

    it('should set min-width for assignee filter', () => {
      const { container } = render(<TeamJiraFilters />);

      const assigneeContainer = container.querySelector('.min-w-\\[180px\\]');
      expect(assigneeContainer).toBeInTheDocument();
    });

    it('should set min-width for status filter', () => {
      const { container } = render(<TeamJiraFilters />);

      const statusContainer = container.querySelector('.min-w-\\[160px\\]');
      expect(statusContainer).toBeInTheDocument();
    });

    it('should set min-width for sort filter', () => {
      const { container } = render(<TeamJiraFilters />);

      const sortContainer = container.querySelector('.min-w-\\[200px\\]');
      expect(sortContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle member with missing fullName', () => {
      const membersWithMissingName = [
        {
          id: 'member-1',
          fullName: '',
          email: 'test@example.com',
          role: 'Developer',
          iuser: 'test',
          team: 'Team A',
          uuid: 'uuid-1',
        },
      ];

      vi.mocked(useTeamContext).mockReturnValue({
        members: membersWithMissingName,
      } as any);

      render(<TeamJiraFilters />);

      expect(screen.getByTestId('select-item-member-1')).toBeInTheDocument();
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, '!@#$%');

      expect(mockSetSearch).toHaveBeenCalled();
    });

    it('should handle very long search strings', async () => {
      const user = userEvent.setup();

      render(<TeamJiraFilters />);

      const searchInput = screen.getByTestId('search-input');
      const longString = 'a'.repeat(1000);
      await user.type(searchInput, longString);

      expect(mockSetSearch).toHaveBeenCalled();
    });

    it('should handle members with duplicate names', () => {
      const membersWithDuplicates = [
        {
          id: 'member-1',
          fullName: 'John Doe',
          email: 'john1@example.com',
          role: 'Developer',
          iuser: 'jdoe1',
          team: 'Team A',
          uuid: 'uuid-1',
        },
        {
          id: 'member-2',
          fullName: 'John Doe',
          email: 'john2@example.com',
          role: 'Designer',
          iuser: 'jdoe2',
          team: 'Team A',
          uuid: 'uuid-2',
        },
      ];

      vi.mocked(useTeamContext).mockReturnValue({
        members: membersWithDuplicates,
      } as any);

      render(<TeamJiraFilters />);

      // Both should render with unique keys
      expect(screen.getByTestId('select-item-member-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-member-2')).toBeInTheDocument();
    });
  });

  describe('Filter State Combinations', () => {
    it('should handle all filters set to default values', () => {
      vi.mocked(useJiraSearch).mockReturnValue('');
      vi.mocked(useJiraAssigneeFilter).mockReturnValue('all');
      vi.mocked(useJiraStatusFilter).mockReturnValue('all');
      vi.mocked(useJiraSortBy).mockReturnValue('updated_desc');

      render(<TeamJiraFilters />);

      expect(screen.getByTestId('search-input')).toHaveValue('');
      
      const selects = screen.getAllByTestId('select');
      expect(selects[0]).toHaveAttribute('data-value', 'all');
      expect(selects[1]).toHaveAttribute('data-value', 'all');
      expect(selects[2]).toHaveAttribute('data-value', 'updated_desc');
    });

    it('should handle all filters with specific values', () => {
      vi.mocked(useJiraSearch).mockReturnValue('TEST-123');
      vi.mocked(useJiraAssigneeFilter).mockReturnValue('member-1');
      vi.mocked(useJiraStatusFilter).mockReturnValue('In Progress');
      vi.mocked(useJiraSortBy).mockReturnValue('priority');

      render(<TeamJiraFilters />);

      expect(screen.getByTestId('search-input')).toHaveValue('TEST-123');
      
      const selects = screen.getAllByTestId('select');
      expect(selects[0]).toHaveAttribute('data-value', 'member-1');
      expect(selects[1]).toHaveAttribute('data-value', 'In Progress');
      expect(selects[2]).toHaveAttribute('data-value', 'priority');
    });

    it('should handle unassigned filter', () => {
      vi.mocked(useJiraAssigneeFilter).mockReturnValue('Unassigned');

      render(<TeamJiraFilters />);

      const selects = screen.getAllByTestId('select');
      expect(selects[0]).toHaveAttribute('data-value', 'Unassigned');
    });
  });
});