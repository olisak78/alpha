import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { TeamJiraIssues } from '../../../src/components/Team/TeamJiraIssues';
import { useTeamContext } from '../../../src/contexts/TeamContext';
import type { Member } from '../../../src/hooks/useOnDutyData';
import type { QuickFilterType } from '../../../src/hooks/team/useJiraFiltering';

// Mock the TeamContext
vi.mock('../../../src/contexts/TeamContext');

// Mock child components
vi.mock('../../../src/components/Team/TeamJiraTable', () => ({
  TeamJiraTable: ({ filteredIssues }: { filteredIssues: any[] }) => (
    <div data-testid="team-jira-table">
      <div>Issues count: {filteredIssues.length}</div>
      {filteredIssues.map((issue, index) => (
        <div key={index} data-testid={`issue-${index}`}>
          {issue.key}: {issue.summary}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/Team/TeamJiraFilters', () => ({
  TeamJiraFilters: () => <div data-testid="team-jira-filters">Jira Filters</div>,
}));

vi.mock('../../../src/components/QuickFilterButtons', () => ({
  default: ({ activeFilter, onFilterChange, filters }: any) => (
    <div data-testid="quick-filter-buttons">
      {filters.map((filter: any) => (
        <button
          key={filter.value}
          data-testid={`filter-${filter.value}`}
          className={activeFilter === filter.value ? 'active' : ''}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../src/components/TablePagination', () => ({
  default: ({ currentPage, totalPages, totalItems, onPageChange, itemsPerPage }: any) => (
    <div data-testid="table-pagination">
      <div>Page {currentPage} of {totalPages}</div>
      <div>Total items: {totalItems}</div>
      <div>Items per page: {itemsPerPage}</div>
      <button 
        data-testid="prev-page" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <button 
        data-testid="next-page" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  ),
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
}));

const mockUseTeamContext = vi.mocked(useTeamContext);

describe('TeamJiraIssues', () => {
  const mockMembers: Member[] = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Developer',
      team: 'Team A',
      iuser: 'john.doe',
      uuid: 'uuid-1'
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      team: 'Team A',
      iuser: 'jane.smith',
      uuid: 'uuid-2'
    }
  ];

  const mockJiraIssues = [
    {
      id: '1',
      key: 'PROJ-123',
      summary: 'Fix critical bug',
      status: 'In Progress',
      priority: 'High',
      assignee: 'John Doe',
      type: 'Bug'
    },
    {
      id: '2',
      key: 'PROJ-124',
      summary: 'Implement new feature',
      status: 'Open',
      priority: 'Medium',
      assignee: 'Jane Smith',
      type: 'Task'
    }
  ];

  const createMockJiraFilters = (overrides = {}) => ({
    filteredIssues: mockJiraIssues,
    quickFilter: 'both' as QuickFilterType,
    setQuickFilter: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 2,
    totalItems: 15,
    itemsPerPage: 10,
    isLoading: false,
    error: null,
    assigneeFilter: 'all',
    setAssigneeFilter: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'updated_desc',
    setSortBy: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    ...overrides,
  });

  const createMockContext = (jiraFiltersOverrides = {}) => ({
    teamId: 'team-1',
    teamName: 'Team A',
    currentTeam: null,
    teamOptions: ['Team A', 'Team B'],
    members: mockMembers,
    memberDialogOpen: false,
    setMemberDialogOpen: vi.fn(),
    editingMember: null,
    memberForm: {},
    setMemberForm: vi.fn(),
    openAddMember: vi.fn(),
    openEditMember: vi.fn(),
    deleteMember: vi.fn(),
    moveMember: vi.fn(),
    createMember: vi.fn(),
    jiraFilters: createMockJiraFilters(jiraFiltersOverrides),
    teamLinks: {
      links: [],
      linkDialogOpen: false,
      onLinkDialogOpenChange: vi.fn(),
      removeLink: vi.fn(),
      setLinks: vi.fn(),
    },
    teamComponents: {
      componentsData: undefined,
      teamComponentsExpanded: {},
      toggleComponentExpansion: vi.fn(),
    },
    scheduleData: {
      todayAssignments: {
        dayMember: null,
        nightMember: null,
      },
    },
    scoreboardData: {
      jiraTop3: [],
      gitTop3: [],
      dutyTop3: [],
      crossTeamRows: [],
      scoreWeights: {
        jira: 1,
        git: 1,
        duty: 1,
      },
    },
    isAdmin: false,
    onOpenComponent: vi.fn(),
    isLoading: false,
    error: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeamContext.mockReturnValue(createMockContext());
  });

  describe('Component Rendering', () => {
    it('renders component structure with title and all child components', () => {
      render(<TeamJiraIssues />);

      // Basic structure
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toHaveTextContent('Bugs and Tasks');
      expect(screen.getByTestId('card-title')).toHaveClass('text-base');
      
      // Child components
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('team-jira-filters')).toBeInTheDocument();
      expect(screen.getByTestId('team-jira-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-pagination')).toBeInTheDocument();

      // CSS structure
      const { container } = render(<TeamJiraIssues />);
      expect(container.querySelector('.rounded-md.border')).toBeInTheDocument();
      expect(container.querySelector('.mt-4')).toBeInTheDocument();
    });
  });

  describe('Quick Filter Functionality', () => {
    it('renders filter buttons with correct options and active states', () => {
      const mockContext = createMockContext({ quickFilter: 'bugs' });
      mockUseTeamContext.mockReturnValue(mockContext);

      render(<TeamJiraIssues />);

      // Check button existence and content
      expect(screen.getByTestId('filter-bugs')).toHaveTextContent('Bugs');
      expect(screen.getByTestId('filter-tasks')).toHaveTextContent('Tasks');
      expect(screen.getByTestId('filter-both')).toHaveTextContent('Both');
      
      // Check active state
      expect(screen.getByTestId('filter-bugs')).toHaveClass('active');
      expect(screen.getByTestId('filter-tasks')).not.toHaveClass('active');
      expect(screen.getByTestId('filter-both')).not.toHaveClass('active');
    });

    it('handles filter changes correctly', () => {
      const setQuickFilter = vi.fn();
      const mockContext = createMockContext({ setQuickFilter });
      mockUseTeamContext.mockReturnValue(mockContext);

      render(<TeamJiraIssues />);

      fireEvent.click(screen.getByTestId('filter-bugs'));
      expect(setQuickFilter).toHaveBeenCalledWith('bugs');

      fireEvent.click(screen.getByTestId('filter-tasks'));
      expect(setQuickFilter).toHaveBeenCalledWith('tasks');

      fireEvent.click(screen.getByTestId('filter-both'));
      expect(setQuickFilter).toHaveBeenCalledWith('both');

      expect(setQuickFilter).toHaveBeenCalledTimes(3);
    });
  });

  describe('Component States', () => {
    it('displays loading state with correct styling and maintains filters', () => {
      const mockContext = createMockContext({ isLoading: true });
      mockUseTeamContext.mockReturnValue(mockContext);

      const { container } = render(<TeamJiraIssues />);

      expect(screen.getByText('Loading issues...')).toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-table')).not.toBeInTheDocument();
      expect(screen.queryByTestId('table-pagination')).not.toBeInTheDocument();

      // Check styling
      expect(container.querySelector('.flex.items-center.justify-center.py-8')).toBeInTheDocument();
      expect(container.querySelector('.text-sm.text-muted-foreground')).toBeInTheDocument();

      // Filters remain visible
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('team-jira-filters')).toBeInTheDocument();
    });

    it('displays error state with correct styling and maintains filters', () => {
      const mockError = new Error('Network error');
      const mockContext = createMockContext({ 
        isLoading: false, 
        error: mockError 
      });
      mockUseTeamContext.mockReturnValue(mockContext);

      const { container } = render(<TeamJiraIssues />);

      expect(screen.getByText('Failed to load issues: Network error')).toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-table')).not.toBeInTheDocument();
      expect(screen.queryByTestId('table-pagination')).not.toBeInTheDocument();

      // Check styling
      expect(container.querySelector('.flex.items-center.justify-center.py-8')).toBeInTheDocument();
      expect(container.querySelector('.text-sm.text-red-500')).toBeInTheDocument();

      // Filters remain visible
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('team-jira-filters')).toBeInTheDocument();
    });

    it('handles different error types', () => {
      // Error with message property
      const mockContext1 = createMockContext({ 
        isLoading: false, 
        error: { message: 'String error message' }
      });
      mockUseTeamContext.mockReturnValue(mockContext1);

      const { rerender } = render(<TeamJiraIssues />);
      expect(screen.getByText('Failed to load issues: String error message')).toBeInTheDocument();

      // Error object with toString method
      const mockContext2 = createMockContext({ 
        isLoading: false, 
        error: { toString: () => 'Custom error' }
      });
      mockUseTeamContext.mockReturnValue(mockContext2);

      rerender(<TeamJiraIssues />);
      expect(screen.getByText(/Failed to load issues:/)).toBeInTheDocument();
    });

    it('displays empty state with correct styling and maintains filters', () => {
      const mockContext = createMockContext({ 
        filteredIssues: [],
        totalItems: 0,
        isLoading: false,
        error: null
      });
      mockUseTeamContext.mockReturnValue(mockContext);

      const { container } = render(<TeamJiraIssues />);

      expect(screen.getByText('No issues found')).toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-table')).not.toBeInTheDocument();
      expect(screen.queryByTestId('table-pagination')).not.toBeInTheDocument();

      // Check styling
      expect(container.querySelector('.flex.items-center.justify-center.py-8')).toBeInTheDocument();
      expect(container.querySelector('.text-sm.text-muted-foreground')).toBeInTheDocument();

      // Filters remain visible
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('team-jira-filters')).toBeInTheDocument();
    });
  });

  describe('Data Display and Pagination', () => {
    it('renders table and pagination with correct data', () => {
      render(<TeamJiraIssues />);

      // Components are rendered
      expect(screen.getByTestId('team-jira-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
      expect(screen.queryByText('Loading issues...')).not.toBeInTheDocument();
      expect(screen.queryByText('No issues found')).not.toBeInTheDocument();

      // Correct data passed to components
      expect(screen.getByText('Issues count: 2')).toBeInTheDocument();
      expect(screen.getByTestId('issue-0')).toHaveTextContent('PROJ-123: Fix critical bug');
      expect(screen.getByTestId('issue-1')).toHaveTextContent('PROJ-124: Implement new feature');
      
      // Pagination info
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Total items: 15')).toBeInTheDocument();
      expect(screen.getByText('Items per page: 10')).toBeInTheDocument();
    });

    it('handles pagination changes correctly', () => {
      const setCurrentPage = vi.fn();
      const mockContext = createMockContext({ setCurrentPage, currentPage: 2, totalPages: 5 });
      mockUseTeamContext.mockReturnValue(mockContext);

      render(<TeamJiraIssues />);

      fireEvent.click(screen.getByTestId('next-page'));
      expect(setCurrentPage).toHaveBeenCalledWith(3);

      fireEvent.click(screen.getByTestId('prev-page'));
      expect(setCurrentPage).toHaveBeenCalledWith(1);
    });
  });

  describe('State Transitions', () => {
    it('transitions correctly between different states', () => {
      const { rerender } = render(<TeamJiraIssues />);
      
      // Start with loading
      mockUseTeamContext.mockReturnValue(createMockContext({ isLoading: true }));
      rerender(<TeamJiraIssues />);
      expect(screen.getByText('Loading issues...')).toBeInTheDocument();

      // Transition to data
      mockUseTeamContext.mockReturnValue(createMockContext({ 
        isLoading: false,
        filteredIssues: mockJiraIssues,
        totalItems: 2
      }));
      rerender(<TeamJiraIssues />);
      expect(screen.queryByText('Loading issues...')).not.toBeInTheDocument();
      expect(screen.getByTestId('team-jira-table')).toBeInTheDocument();

      // Transition to error
      mockUseTeamContext.mockReturnValue(createMockContext({ 
        isLoading: false,
        error: new Error('API Error')
      }));
      rerender(<TeamJiraIssues />);
      expect(screen.getByText('Failed to load issues: API Error')).toBeInTheDocument();

      // Transition to empty
      mockUseTeamContext.mockReturnValue(createMockContext({ 
        isLoading: false,
        filteredIssues: [],
        totalItems: 0,
        error: null
      }));
      rerender(<TeamJiraIssues />);
      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing jiraFilters', () => {
      const mockContext = {
        ...createMockContext(),
        jiraFilters: null as any,
      };
      mockUseTeamContext.mockReturnValue(mockContext);

      expect(() => render(<TeamJiraIssues />)).toThrow();
    });

    it('handles undefined filteredIssues', () => {
      const mockContext = createMockContext({ 
        filteredIssues: undefined as any,
        totalItems: 0
      });
      mockUseTeamContext.mockReturnValue(mockContext);

      render(<TeamJiraIssues />);
      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });

    it('handles large datasets and pagination edge cases', () => {
      const largeIssuesList = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        key: `PROJ-${i}`,
        summary: `Issue ${i}`,
        status: 'Open',
        priority: 'Medium',
        assignee: 'Developer',
        type: 'Task'
      }));

      // Large dataset
      const largeDataContext = createMockContext({ 
        filteredIssues: largeIssuesList.slice(0, 10),
        totalItems: 100,
        totalPages: 10,
        currentPage: 1
      });
      mockUseTeamContext.mockReturnValue(largeDataContext);

      const { rerender } = render(<TeamJiraIssues />);
      expect(screen.getByText('Issues count: 10')).toBeInTheDocument();
      expect(screen.getByText('Total items: 100')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();

      // Single page edge case
      const singlePageContext = createMockContext({ 
        currentPage: 1,
        totalPages: 1,
        totalItems: 5
      });
      mockUseTeamContext.mockReturnValue(singlePageContext);
      rerender(<TeamJiraIssues />);
      expect(screen.getByTestId('prev-page')).toBeDisabled();
      expect(screen.getByTestId('next-page')).toBeDisabled();

      // Last page edge case
      const lastPageContext = createMockContext({ 
        currentPage: 5,
        totalPages: 5,
        totalItems: 50
      });
      mockUseTeamContext.mockReturnValue(lastPageContext);
      rerender(<TeamJiraIssues />);
      expect(screen.getByTestId('next-page')).toBeDisabled();
      expect(screen.getByTestId('prev-page')).not.toBeDisabled();
    });
  });

  describe('Context Integration', () => {
    it('uses TeamContext and responds to updates', () => {
      const { rerender } = render(<TeamJiraIssues />);

      expect(mockUseTeamContext).toHaveBeenCalled();
      expect(screen.getByTestId('team-jira-filters')).toBeInTheDocument();
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();

      // Update context with different data
      const updatedContext = createMockContext({
        filteredIssues: [
          {
            id: '3',
            key: 'PROJ-125',
            summary: 'Updated issue',
            status: 'Done',
            priority: 'Low',
            assignee: 'New Developer',
            type: 'Story'
          }
        ],
        totalItems: 1,
        totalPages: 1,
        quickFilter: 'tasks' as QuickFilterType
      });
      mockUseTeamContext.mockReturnValue(updatedContext);

      rerender(<TeamJiraIssues />);

      expect(screen.getByText('Issues count: 1')).toBeInTheDocument();
      expect(screen.getByTestId('issue-0')).toHaveTextContent('PROJ-125: Updated issue');
      expect(screen.getByTestId('filter-tasks')).toHaveClass('active');
    });

    it('handles context errors', () => {
      mockUseTeamContext.mockImplementation(() => {
        throw new Error('Context error');
      });

      expect(() => render(<TeamJiraIssues />)).toThrow('Context error');
    });
  });

  describe('Accessibility', () => {
    it('provides proper semantic structure and focus management', () => {
      const { rerender } = render(<TeamJiraIssues />);

      // Semantic structure
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-title').tagName).toBe('H3');

      // Focus management
      const bugsFilter = screen.getByTestId('filter-bugs');
      bugsFilter.focus();
      expect(document.activeElement).toBe(bugsFilter);

      // State changes don't break accessibility
      const updatedContext = createMockContext({
        quickFilter: 'bugs' as QuickFilterType
      });
      mockUseTeamContext.mockReturnValue(updatedContext);
      rerender(<TeamJiraIssues />);
      expect(screen.getByTestId('filter-bugs')).toBeInTheDocument();

      // ARIA roles are present
      const filterButtons = screen.getAllByRole('button');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });
});
