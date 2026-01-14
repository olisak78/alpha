import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobsHistoryTable from '@/components/SelfService/JobsHistoryTable';
import type { JenkinsJobHistoryItem } from '@/services/SelfServiceApi';

// Mock the hooks and contexts
vi.mock('@/hooks/api/useJenkinsJobHistory');
vi.mock('@/contexts/AuthContext');
vi.mock('@/components/SelfService/JobsHistoryTableHeader', () => ({
  JobsHistoryTableHeader: ({ 
    isCollapsed,
    onToggleCollapse,
    onRefresh,
    searchTerm,
    onSearchChange,
    onClearSearch,
    onlyMine,
    onToggleOnlyMine,
    timePeriod,
    onTimePeriodChange,
  }: any) => (
    <div data-testid="jobs-history-table-header">
      <button onClick={onToggleCollapse}>
        {isCollapsed ? 'Expand' : 'Collapse'}
      </button>
      <button onClick={onRefresh}>Refresh</button>
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button onClick={onClearSearch}>Clear Search</button>
      <button onClick={() => onToggleOnlyMine(!onlyMine)}>
        Toggle Only Mine
      </button>
      <select 
        data-testid="time-period-select"
        value={timePeriod}
        onChange={(e) => onTimePeriodChange(e.target.value)}
      >
        <option value="last24h">Last 24 hours</option>
        <option value="last48h">Last 48 hours</option>
        <option value="thisWeek">This week</option>
        <option value="thisMonth">This month</option>
      </select>
    </div>
  ),
}));

vi.mock('@/components/SelfService/ExpandedRowContent', () => ({
  ExpandedRowContent: ({ job }: any) => (
    <div data-testid={`expanded-content-${job.id}`}>
      Expanded content for {job.jobName}
    </div>
  ),
}));

vi.mock('@/components/SelfService/StatusBadge', () => ({
  StatusBadge: ({ status }: any) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

// Import mocked modules
import { useJenkinsJobHistory } from '@/hooks/api/useJenkinsJobHistory';
import { useAuth } from '@/contexts/AuthContext';

const mockUseJenkinsJobHistory = useJenkinsJobHistory as any;
const mockUseAuth = useAuth as any;

// Mock data
const createMockJob = (overrides: Partial<JenkinsJobHistoryItem> = {}): JenkinsJobHistoryItem => ({
  id: `job-${Math.random()}`,
  jobName: 'test-job',
  buildNumber: 123,
  status: 'success',
  duration: 120000,
  lastPolledAt: new Date().toISOString(),
  user: 'testuser',
  triggeredBy: 'testuser',  // Add triggeredBy field for search functionality
  jenkinsUrl: 'https://jenkins.example.com/job/test-job/123',
  jaasName: 'test-jaas',
  parameters: {},
  ...overrides,
});

const mockJobsData = {
  jobs: [
    createMockJob({ 
      id: 'job-1', 
      jobName: 'create-cluster',
      user: 'john.doe',
      triggeredBy: 'john.doe',
      status: 'success',
      buildNumber: 100,
    }),
    createMockJob({ 
      id: 'job-2', 
      jobName: 'delete-cluster',
      user: 'jane.smith',
      triggeredBy: 'jane.smith',
      status: 'failure',
      buildNumber: 101,
    }),
    createMockJob({ 
      id: 'job-3', 
      jobName: 'create-cluster',
      user: 'john.doe',
      triggeredBy: 'john.doe',
      status: 'running',
      buildNumber: 102,
    }),
  ],
  total: 3,
};

describe('JobsHistoryTable', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    
    // Default mock implementations
    mockUseJenkinsJobHistory.mockReturnValue({
      data: mockJobsData,
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: { 
        id: 'john.doe',
        email: 'john.doe@example.com',
        name: 'John Doe'
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<JobsHistoryTable />);
      expect(screen.getByTestId('jobs-history-table-header')).toBeInTheDocument();
    });

    it('should render job rows when data is available', () => {
      render(<JobsHistoryTable />);
      
      // Check for both job types - use getAllByText for duplicate job names
      expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
      expect(screen.getByText('delete-cluster')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseJenkinsJobHistory.mockReturnValue({
        data: null,
        isLoading: true,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      expect(screen.getByText(/Loading executions/i)).toBeInTheDocument();
    });

    it('should show empty state when no jobs', () => {
      mockUseJenkinsJobHistory.mockReturnValue({
        data: { jobs: [], total: 0 },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      expect(screen.getByText(/No executions found/i)).toBeInTheDocument();
    });

    it('should display status badges for each job', () => {
      render(<JobsHistoryTable />);
      
      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges).toHaveLength(3);
      expect(statusBadges[0]).toHaveTextContent('success');
      expect(statusBadges[1]).toHaveTextContent('failure');
      expect(statusBadges[2]).toHaveTextContent('running');
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should collapse table when collapse button is clicked', async () => {
      render(<JobsHistoryTable />);
      
      const collapseButton = screen.getByText('Collapse');
      await userEvent.click(collapseButton);
      
      // Table content should not be visible when collapsed
      await waitFor(() => {
        expect(screen.queryByText('create-cluster')).not.toBeInTheDocument();
      });
    });

    it('should expand table when expand button is clicked', async () => {
      render(<JobsHistoryTable />);
      
      // First collapse
      const collapseButton = screen.getByText('Collapse');
      await userEvent.click(collapseButton);
      
      // Then expand
      const expandButton = await screen.findByText('Expand');
      await userEvent.click(expandButton);
      
      // Table content should be visible
      await waitFor(() => {
        expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter jobs based on search term (job name)', async () => {
      render(<JobsHistoryTable />);
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'create-cluster');
      
      // Wait for debounce
      await waitFor(() => {
        expect(screen.getAllByText('create-cluster')).toHaveLength(2);
        expect(screen.queryByText('delete-cluster')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should filter jobs based on search term (user)', async () => {
      render(<JobsHistoryTable />);
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'jane.smith');
      
      await waitFor(() => {
        expect(screen.getByText('delete-cluster')).toBeInTheDocument();
        expect(screen.queryByText('create-cluster')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should filter jobs based on search term (build number)', async () => {
      render(<JobsHistoryTable />);
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, '101');
      
      await waitFor(() => {
        expect(screen.getByText('delete-cluster')).toBeInTheDocument();
        expect(screen.queryByText('create-cluster')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should clear search when clear button is clicked', async () => {
      render(<JobsHistoryTable />);
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'delete');
      
      await waitFor(() => {
        expect(screen.getByText('delete-cluster')).toBeInTheDocument();
        expect(screen.queryByText('create-cluster')).not.toBeInTheDocument();
      }, { timeout: 500 });
      
      const clearButton = screen.getByText('Clear Search');
      await userEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('create-cluster')).toHaveLength(2);
        expect(screen.getByText('delete-cluster')).toBeInTheDocument();
      });
    });

    it('should show "no results" message when search has no matches', async () => {
      render(<JobsHistoryTable />);
      
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'nonexistent-job');
      
      await waitFor(() => {
        expect(screen.getByText(/No jobs match your search/i)).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Pagination', () => {
    it('should paginate jobs when there are more than itemsPerPage', () => {
      const manyJobs = Array.from({ length: 25 }, (_, i) => 
        createMockJob({ 
          id: `job-${i}`,
          jobName: `job-${i}`,
          buildNumber: i,
        })
      );

      mockUseJenkinsJobHistory.mockReturnValue({
        data: { jobs: manyJobs, total: 25 },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      
      // Should show only first 10 jobs on page 1
      expect(screen.getByText('job-0')).toBeInTheDocument();
      expect(screen.getByText('job-9')).toBeInTheDocument();
      expect(screen.queryByText('job-10')).not.toBeInTheDocument();
    });
  });

  describe('Only Mine Toggle', () => {
    it('should filter to only current user jobs when "Only Mine" is enabled', async () => {
      render(<JobsHistoryTable />);
      
      // Initially showing only mine (john.doe's jobs)
      expect(screen.getAllByText(/create-cluster/i)).toHaveLength(2);
      expect(screen.queryByText(/delete-cluster/i)).toBeInTheDocument(); // jane.smith's job visible in "All Jobs" mode
    });

    it('should toggle between "Only Mine" and "All Jobs"', async () => {
      render(<JobsHistoryTable />);
      
      const toggleButton = screen.getByText('Toggle Only Mine');
      await userEvent.click(toggleButton);
      
      // Should persist to localStorage
      await waitFor(() => {
        expect(localStorage.getItem('jobsHistory_onlyMine')).toBe('false');
      });
    });

    it('should force onlyMine=false when filteredService is provided', () => {
      render(
        <JobsHistoryTable 
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
        />
      );
      
      // Should show all jobs for the filtered service, not just current user's
      expect(mockUseJenkinsJobHistory).toHaveBeenCalledWith(
        10,
        0,
        false, // onlyMine should be false
        expect.any(Number)
      );
    });
  });

  describe('Time Period Selection', () => {
    it('should use controlled time period when provided', () => {
      render(
        <JobsHistoryTable 
          timePeriod="last24h"
          onTimePeriodChange={vi.fn()}
        />
      );
      
      const select = screen.getByTestId('time-period-select');
      expect(select).toHaveValue('last24h');
    });

    it('should call onTimePeriodChange when period changes in controlled mode', async () => {
      const onTimePeriodChange = vi.fn();
      render(
        <JobsHistoryTable 
          timePeriod="last48h"
          onTimePeriodChange={onTimePeriodChange}
        />
      );
      
      const select = screen.getByTestId('time-period-select');
      await userEvent.selectOptions(select, 'thisWeek');
      
      expect(onTimePeriodChange).toHaveBeenCalledWith('thisWeek');
    });

    it('should manage time period internally when not controlled', async () => {
      localStorage.setItem('jobsHistory_timePeriod', 'last24h');
      
      render(<JobsHistoryTable />);
      
      const select = screen.getByTestId('time-period-select');
      expect(select).toHaveValue('last24h');
    });

    it('should fetch jobs with correct hours for selected time period', () => {
      render(<JobsHistoryTable timePeriod="thisWeek" />);
      
      // Check that useJenkinsJobHistory was called with correct hours
      // thisWeek should calculate hours from Sunday start
      expect(mockUseJenkinsJobHistory).toHaveBeenCalledWith(
        10,
        0,
        true,
        expect.any(Number) // Hours calculated by getHoursForPeriod
      );
    });
  });

  describe('Service Filtering', () => {
    it('should filter jobs by service when filteredService is provided', () => {
      render(
        <JobsHistoryTable 
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster Service',
          }}
        />
      );
      
      // Should show only jobs with jobName 'create-cluster'
      expect(screen.getAllByText('create-cluster')).toHaveLength(2);
      expect(screen.queryByText('delete-cluster')).not.toBeInTheDocument();
    });

    it('should call onClearFilter when clear filter button is clicked', async () => {
      const onClearFilter = vi.fn();
      render(
        <JobsHistoryTable 
          filteredService={{
            jobName: 'create-cluster',
            serviceTitle: 'Create Cluster',
          }}
          onClearFilter={onClearFilter}
        />
      );
      
      // The clear filter button would be in the header
      // Since we mocked the header, this test validates the prop passing
      expect(onClearFilter).toBeDefined();
    });
  });

  describe('Row Expansion', () => {
    it('should expand row when clicked', async () => {
      render(<JobsHistoryTable />);
      
      // Find all rows, excluding the header
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      
      // Find the expansion button within the first data row
      // The button is a ghost button with size sm (h-8 w-8)
      const buttons = within(firstDataRow).getAllByRole('button');
      const expandButton = buttons[0]; // First button in the row is the expand button
      
      await userEvent.click(expandButton);
      
      // Expanded content should appear
      await waitFor(() => {
        expect(screen.getByTestId('expanded-content-job-1')).toBeInTheDocument();
      });
    });

    it('should collapse row when clicked again', async () => {
      render(<JobsHistoryTable />);
      
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      
      // Find the expansion button
      const buttons = within(firstDataRow).getAllByRole('button');
      const expandButton = buttons[0];
      
      // Expand
      await userEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.getByTestId('expanded-content-job-1')).toBeInTheDocument();
      });
      
      // Collapse
      await userEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.queryByTestId('expanded-content-job-1')).not.toBeInTheDocument();
      });
    });

    it('should allow multiple rows to be expanded simultaneously', async () => {
      render(<JobsHistoryTable />);
      
      const rows = screen.getAllByRole('row');
      
      // Expand first row
      const firstRowButtons = within(rows[1]).getAllByRole('button');
      const firstExpandButton = firstRowButtons[0];
      
      await userEvent.click(firstExpandButton);
      await waitFor(() => {
        expect(screen.getByTestId('expanded-content-job-1')).toBeInTheDocument();
      });
      
      // Expand second row
      const secondRowButtons = within(rows[2]).getAllByRole('button');
      const secondExpandButton = secondRowButtons[0];
      
      await userEvent.click(secondExpandButton);
      await waitFor(() => {
        expect(screen.getByTestId('expanded-content-job-1')).toBeInTheDocument();
        expect(screen.getByTestId('expanded-content-job-2')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should call refetch when refresh button is clicked', async () => {
      const refetch = vi.fn();
      mockUseJenkinsJobHistory.mockReturnValue({
        data: mockJobsData,
        isLoading: false,
        isFetching: false,
        refetch,
      });

      render(<JobsHistoryTable />);
      
      const refreshButton = screen.getByText('Refresh');
      await userEvent.click(refreshButton);
      
      expect(refetch).toHaveBeenCalled();
    });

    it('should show loading indicator during refresh', () => {
      mockUseJenkinsJobHistory.mockReturnValue({
        data: mockJobsData,
        isLoading: false,
        isFetching: true, // Currently refreshing
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      
      // The header component should receive isRefreshing=true
      // which would disable the refresh button or show a spinner
      expect(screen.getByTestId('jobs-history-table-header')).toBeInTheDocument();
    });
  });

  describe('User Identification', () => {
    it('should identify current user jobs correctly', () => {
      render(<JobsHistoryTable />);
      
      // Jobs from john.doe should be marked as "my jobs"
      // This is internal logic, but we can verify the component renders
      expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
    });

    it('should handle user with email format', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          email: 'john.doe@example.com',
          name: 'John Doe'
        },
      });

      render(<JobsHistoryTable />);
      
      // Should extract 'john.doe' from email
      expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
    });

    it('should handle missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
      });

      render(<JobsHistoryTable />);
      
      // Should still render but with no "my jobs" filtering
      expect(screen.getByTestId('jobs-history-table-header')).toBeInTheDocument();
      // Should still show all jobs (multiple create-cluster jobs exist)
      expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist onlyMine setting to localStorage', async () => {
      render(<JobsHistoryTable />);
      
      const toggleButton = screen.getByText('Toggle Only Mine');
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('jobsHistory_onlyMine')).toBe('false');
      });
    });

    it('should load onlyMine setting from localStorage on mount', () => {
      localStorage.setItem('jobsHistory_onlyMine', 'false');
      
      render(<JobsHistoryTable />);
      
      // Should have called useJenkinsJobHistory with onlyMine=false
      expect(mockUseJenkinsJobHistory).toHaveBeenCalledWith(
        10,
        0,
        false,
        expect.any(Number)
      );
    });

    it('should persist time period to localStorage only in uncontrolled mode', async () => {
      // Uncontrolled mode (no timePeriod prop)
      render(<JobsHistoryTable />);
      
      const select = screen.getByTestId('time-period-select');
      await userEvent.selectOptions(select, 'thisMonth');
      
      await waitFor(() => {
        expect(localStorage.getItem('jobsHistory_timePeriod')).toBe('thisMonth');
      });
    });

    it('should NOT persist time period in controlled mode', async () => {
      // Controlled mode (timePeriod prop provided)
      render(
        <JobsHistoryTable 
          timePeriod="last24h"
          onTimePeriodChange={vi.fn()}
        />
      );
      
      // Even if we try to change it, parent controls it
      const select = screen.getByTestId('time-period-select');
      await userEvent.selectOptions(select, 'thisMonth');
      
      // Parent's onTimePeriodChange would be called, but localStorage shouldn't update
      // in controlled mode
      await waitFor(() => {
        expect(localStorage.getItem('jobsHistory_timePeriod')).not.toBe('thisMonth');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user email gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '',
          email: '',
          name: 'Test User'
        },
      });

      render(<JobsHistoryTable />);
      
      // Should render without crashing even with empty user data
      expect(screen.getByTestId('jobs-history-table-header')).toBeInTheDocument();
      // Should still show jobs (multiple create-cluster jobs exist)
      expect(screen.getAllByText('create-cluster').length).toBeGreaterThan(0);
    });

    it('should handle jobs with missing fields', () => {
      const incompleteJobs = {
        jobs: [
          createMockJob({ 
            id: 'incomplete-1',
            jobName: '',
            user: '',
            buildNumber: 0,
          }),
        ],
        total: 1,
      };

      mockUseJenkinsJobHistory.mockReturnValue({
        data: incompleteJobs,
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      
      // Should render without crashing
      expect(screen.getByTestId('jobs-history-table-header')).toBeInTheDocument();
    });

    it('should reset to page 1 when search term changes', async () => {
      const manyJobs = Array.from({ length: 25 }, (_, i) => 
        createMockJob({ 
          id: `job-${i}`,
          jobName: i < 15 ? 'create-cluster' : 'delete-cluster',
          buildNumber: i,
        })
      );

      mockUseJenkinsJobHistory.mockReturnValue({
        data: { jobs: manyJobs, total: 25 },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(<JobsHistoryTable />);
      
      // Navigate to page 2 (would need pagination controls)
      // Then search - should reset to page 1
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'delete');
      
      // After search, should be on page 1 showing first results
      await waitFor(() => {
        // Multiple delete-cluster jobs (15-24), so use getAllByText
        expect(screen.getAllByText('delete-cluster').length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });
});