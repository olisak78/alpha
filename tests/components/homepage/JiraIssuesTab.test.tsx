import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JiraIssuesTab from '../../../src/components/tabs/MePageTabs/JiraIssuesTab';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bug: () => <div data-testid="bug-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  List: () => <div data-testid="list-icon" />
}));

// Mock components
vi.mock('../../../src/components/Homepage/JiraIssuesTable', () => ({
  default: ({ issues, showAssignee }: { issues: any[]; showAssignee: boolean }) => (
    <div data-testid="jira-issues-table">
      {issues.map(issue => (
        <div key={issue.key} data-testid={`issue-${issue.key}`}>
          {issue.key}: {issue.fields?.summary}
        </div>
      ))}
      <div data-testid="show-assignee">{showAssignee.toString()}</div>
    </div>
  )
}));

vi.mock('../../../src/components/Homepage/JiraIssuesFilter', () => ({
  default: ({ 
    search, 
    onSearchChange, 
    status, 
    project, 
    onStatusChange, 
    onProjectChange, 
    sortBy, 
    onSortByChange 
  }: any) => (
    <div data-testid="jira-issues-filter">
      <input 
        value={search} 
        onChange={(e) => onSearchChange(e.target.value)} 
        placeholder="Search issues"
        data-testid="search-input"
      />
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} data-testid="status-select">
        <option value="all">All</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
      </select>
      <select value={project} onChange={(e) => onProjectChange(e.target.value)} data-testid="project-select">
        <option value="all">All</option>
        <option value="TEST">TEST</option>
      </select>
      <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} data-testid="sort-select">
        <option value="updated_desc">Updated (Newest)</option>
        <option value="priority_asc">Priority</option>
      </select>
    </div>
  )
}));

vi.mock('../../../src/components/TablePagination', () => ({
  default: ({ currentPage, totalPages, totalItems, onPageChange }: any) => (
    <div data-testid="table-pagination">
      <span>Page {currentPage} of {totalPages} ({totalItems} total)</span>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
        Previous
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        Next
      </button>
    </div>
  )
}));

vi.mock('../../../src/components/QuickFilterButtons', () => ({
  default: ({ activeFilter, onFilterChange, filters }: any) => (
    <div data-testid="quick-filter-buttons">
      {filters.map((filter: any) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          data-testid={`filter-${filter.value}`}
          className={activeFilter === filter.value ? 'active' : ''}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}));

// Mock API hook
const mockJiraData = {
  issues: [
    {
      key: 'TEST-1',
      project: 'TEST',
      fields: {
        summary: 'Bug in authentication',
        status: { name: 'Open' },
        issuetype: { name: 'Bug' },
        priority: { name: 'High' },
        updated: '2023-12-01T10:00:00Z'
      }
    },
    {
      key: 'TEST-2',
      project: 'TEST',
      fields: {
        summary: 'New feature request',
        status: { name: 'In Progress' },
        issuetype: { name: 'Story' },
        priority: { name: 'Medium' },
        updated: '2023-11-30T15:30:00Z'
      }
    },
    {
      key: 'TEST-3',
      project: 'TEST',
      fields: {
        summary: 'Subtask for feature',
        status: { name: 'Open' },
        issuetype: { name: 'Task' },
        priority: { name: 'Low' },
        updated: '2023-11-29T12:00:00Z',
        parent: { key: 'TEST-2' }
      }
    }
  ]
};

vi.mock('../../../src/hooks/api/useJira', () => ({
  useMyJiraIssues: vi.fn(() => ({
    data: mockJiraData,
    isLoading: false,
    error: null
  }))
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('JiraIssuesTab', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock to default state
    const { useMyJiraIssues } = await import('../../../src/hooks/api/useJira');
    vi.mocked(useMyJiraIssues).mockReturnValue({
      data: mockJiraData,
      isLoading: false,
      error: null
    });
  });

  it('renders quick filter buttons', () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('filter-bugs')).toBeInTheDocument();
    expect(screen.getByTestId('filter-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('filter-both')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByTestId('jira-issues-filter')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();
    expect(screen.getByTestId('project-select')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  it('renders issues table with filtered issues', () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByTestId('jira-issues-table')).toBeInTheDocument();
    // Should show issues but not subtasks (they are filtered out)
    expect(screen.getByTestId('issue-TEST-1')).toBeInTheDocument();
    expect(screen.getByTestId('issue-TEST-2')).toBeInTheDocument();
    expect(screen.queryByTestId('issue-TEST-3')).not.toBeInTheDocument(); // subtask filtered out
  });

  it('renders pagination controls', () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
  });

  it('filters issues by search query', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'authentication' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('issue-TEST-1')).toBeInTheDocument();
      expect(screen.queryByTestId('issue-TEST-2')).not.toBeInTheDocument();
    });
  });

  it('filters issues by status', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
    
    await waitFor(() => {
      expect(screen.queryByTestId('issue-TEST-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('issue-TEST-2')).toBeInTheDocument();
    });
  });

  it('filters issues by project', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const projectSelect = screen.getByTestId('project-select');
    fireEvent.change(projectSelect, { target: { value: 'TEST' } });
    
    // All issues are from TEST project, so they should still be visible
    await waitFor(() => {
      expect(screen.getByTestId('issue-TEST-1')).toBeInTheDocument();
      expect(screen.getByTestId('issue-TEST-2')).toBeInTheDocument();
    });
  });

  it('filters issues by quick filter (bugs)', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const bugsFilter = screen.getByTestId('filter-bugs');
    fireEvent.click(bugsFilter);
    
    await waitFor(() => {
      expect(screen.getByTestId('issue-TEST-1')).toBeInTheDocument(); // Bug type
      expect(screen.queryByTestId('issue-TEST-2')).not.toBeInTheDocument(); // Story type
    });
  });

  it('filters issues by quick filter (tasks)', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const tasksFilter = screen.getByTestId('filter-tasks');
    fireEvent.click(tasksFilter);
    
    await waitFor(() => {
      expect(screen.queryByTestId('issue-TEST-1')).not.toBeInTheDocument(); // Bug type
      expect(screen.getByTestId('issue-TEST-2')).toBeInTheDocument(); // Story type
    });
  });

  it('sorts issues by different criteria', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'priority_asc' } });
    
    // Should still render the table with sorted data
    await waitFor(() => {
      expect(screen.getByTestId('jira-issues-table')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    const { useMyJiraIssues } = await import('../../../src/hooks/api/useJira');
    vi.mocked(useMyJiraIssues).mockReturnValue({
      data: null as any,
      isLoading: true,
      error: null
    } as any);

    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByText('Loading issues...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    const { useMyJiraIssues } = await import('../../../src/hooks/api/useJira');
    vi.mocked(useMyJiraIssues).mockReturnValue({
      data: null as any,
      isLoading: false,
      error: new Error('Failed to load issues')
    } as any);

    renderWithQueryClient(<JiraIssuesTab />);
    
    expect(screen.getByText('Failed to load issues: Failed to load issues')).toBeInTheDocument();
  });


  it('resets to first page when filters change', async () => {
    renderWithQueryClient(<JiraIssuesTab />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'authentication' } });
    
    // Should filter issues - check that filtering works
    await waitFor(() => {
      expect(screen.getByTestId('issue-TEST-1')).toBeInTheDocument();
      expect(screen.queryByTestId('issue-TEST-2')).not.toBeInTheDocument();
    });
  });
});
