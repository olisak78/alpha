import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobStatusIndicator, JobStatusBadge } from '../../../src/components/SelfService/JobStatusIndicator';
import type { Job } from '../../../src/hooks/api/useJobStatus';

/**
 * JobStatusIndicator Component Tests
 * 
 * Comprehensive tests for the JobStatusIndicator and JobStatusBadge components
 * which display job status information with interactive features.
 */

// Mock the custom hooks
const mockUseJobStatus = vi.fn();
const mockUseRemoveJobStatus = vi.fn();
const mockUseClearJobStatus = vi.fn();

vi.mock('../../../src/hooks/api/useJobStatus', () => ({
  useJobStatus: () => mockUseJobStatus(),
  useRemoveJobStatus: () => mockUseRemoveJobStatus(),
  useClearJobStatus: () => mockUseClearJobStatus(),
}));

// Mock UI components
vi.mock('../../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children }) => <div data-testid="dropdown-menu">{children}</div>),
  DropdownMenuContent: vi.fn(({ children, align, className }) => (
    <div data-testid="dropdown-menu-content" data-align={align} className={className}>
      {children}
    </div>
  )),
  DropdownMenuItem: vi.fn(({ children, className, onClick }) => (
    <div 
      data-testid="dropdown-menu-item" 
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  )),
  DropdownMenuSeparator: vi.fn(() => <div data-testid="dropdown-menu-separator" />),
  DropdownMenuTrigger: vi.fn(({ children, asChild }) => (
    <div data-testid="dropdown-menu-trigger" data-as-child={asChild}>
      {children}
    </div>
  )),
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: vi.fn(({ children, variant, size, className, onClick }) => (
    <button 
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  )),
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: vi.fn(({ children, variant, className }) => (
    <span 
      data-testid="badge" 
      data-variant={variant}
      className={className}
    >
      {children}
    </span>
  )),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ExternalLink: vi.fn(({ className }) => (
    <svg data-testid="external-link-icon" className={className}>
      <path d="external-link-path" />
    </svg>
  )),
  Briefcase: vi.fn(({ className }) => (
    <svg data-testid="briefcase-icon" className={className}>
      <path d="briefcase-path" />
    </svg>
  )),
  X: vi.fn(({ className }) => (
    <svg data-testid="x-icon" className={className}>
      <path d="x-path" />
    </svg>
  )),
}));

describe('JobStatusIndicator', () => {
  let queryClient: QueryClient;
  const mockRemoveMutate = vi.fn();
  const mockClearMutate = vi.fn();

  const mockJobs: Job[] = [
    {
      queueItemId: 'job-1',
      jobName: 'Build Frontend',
      status: 'success',
      message: 'Build completed successfully',
      queueUrl: 'https://jenkins.example.com/queue/item/123',
      baseJobUrl: 'https://jenkins.example.com/job/frontend',
      jaasName: 'frontend-build',
      buildNumber: 42,
      timestamp: Date.now() - 1000,
    },
    {
      queueItemId: 'job-2',
      jobName: 'Deploy Backend',
      status: 'running',
      message: 'Deployment in progress',
      queueUrl: 'https://jenkins.example.com/queue/item/124',
      baseJobUrl: 'https://jenkins.example.com/job/backend',
      jaasName: 'backend-deploy',
      buildNumber: 15,
      timestamp: Date.now() - 2000,
    },
    {
      queueItemId: 'job-3',
      jobName: 'Test Suite',
      status: 'failed',
      message: 'Tests failed with 3 errors',
      queueUrl: 'https://jenkins.example.com/queue/item/125',
      baseJobUrl: 'https://jenkins.example.com/job/tests',
      jaasName: 'test-suite',
      buildNumber: 8,
      timestamp: Date.now() - 3000,
    },
    {
      queueItemId: 'job-4',
      jobName: 'Database Migration',
      status: 'queued',
      message: 'Waiting in queue',
      queueUrl: 'https://jenkins.example.com/queue/item/126',
      baseJobUrl: 'https://jenkins.example.com/job/migration',
      jaasName: 'db-migration',
      timestamp: Date.now() - 4000,
    },
    {
      queueItemId: 'job-5',
      jobName: 'Security Scan',
      status: 'pending',
      message: 'Pending approval',
      queueUrl: 'https://jenkins.example.com/queue/item/127',
      baseJobUrl: 'https://jenkins.example.com/job/security',
      jaasName: 'security-scan',
      timestamp: Date.now() - 5000,
    },
  ];

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseJobStatus.mockReturnValue({
      data: mockJobs,
      isLoading: false,
    });
    
    mockUseRemoveJobStatus.mockReturnValue({
      mutate: mockRemoveMutate,
    });
    
    mockUseClearJobStatus.mockReturnValue({
      mutate: mockClearMutate,
    });
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render the job status indicator with briefcase icon', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-menu-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
    });

    it('should display job count badge when jobs exist', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      const badges = screen.getAllByTestId('badge');
      const countBadge = badges.find(badge => badge.textContent === '5');
      expect(countBadge).toBeInTheDocument();
      expect(countBadge).toHaveAttribute('data-variant', 'destructive');
    });

    it('should not display count badge when no jobs exist', () => {
      mockUseJobStatus.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      const badges = screen.queryAllByTestId('badge');
      const countBadge = badges.find(badge => badge.textContent === '0');
      expect(countBadge).toBeUndefined();
    });

    it('should not render anything when loading', () => {
      mockUseJobStatus.mockReturnValue({
        data: [],
        isLoading: true,
      });

      const { container } = renderWithQueryClient(<JobStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ============================================================================
  // DROPDOWN CONTENT TESTS
  // ============================================================================

  describe('Dropdown Content', () => {
    it('should render dropdown content with proper structure', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-menu-content')).toHaveAttribute('data-align', 'end');
      expect(screen.getByTestId('dropdown-menu-content')).toHaveClass('w-80');
    });

    it('should display "Job Status" header and "Clear All" button when jobs exist', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByText('Job Status')).toBeInTheDocument();
      
      const clearAllButtons = screen.getAllByTestId('button');
      const clearAllButton = clearAllButtons.find(btn => btn.textContent === 'Clear All');
      expect(clearAllButton).toBeInTheDocument();
      expect(clearAllButton).toHaveAttribute('data-variant', 'ghost');
      expect(clearAllButton).toHaveAttribute('data-size', 'sm');
    });

    it('should not display "Clear All" button when no jobs exist', () => {
      mockUseJobStatus.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      const clearAllButtons = screen.queryAllByTestId('button');
      const clearAllButton = clearAllButtons.find(btn => btn.textContent === 'Clear All');
      expect(clearAllButton).toBeUndefined();
    });

    it('should display "No recent jobs" message when no jobs exist', () => {
      mockUseJobStatus.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByText('No recent jobs')).toBeInTheDocument();
    });

    it('should render dropdown separator', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByTestId('dropdown-menu-separator')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // JOB LIST RENDERING TESTS
  // ============================================================================

  describe('Job List Rendering', () => {
    it('should render all jobs with correct details and icons', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      // Check job names and details
      expect(screen.getByText('Build Frontend')).toBeInTheDocument();
      expect(screen.getByText('Deploy Backend')).toBeInTheDocument();
      expect(screen.getByText('#job-1')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
      expect(screen.getByText('Build completed successfully')).toBeInTheDocument();

      // Check icons are rendered for all jobs
      expect(screen.getAllByTestId('external-link-icon')).toHaveLength(5);
      expect(screen.getAllByTestId('x-icon')).toHaveLength(5);
    });

    it('should handle jobs without messages', () => {
      const jobsWithoutMessages = mockJobs.map(job => ({ ...job, message: undefined }));
      mockUseJobStatus.mockReturnValue({
        data: jobsWithoutMessages,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByText('Build Frontend')).toBeInTheDocument();
      expect(screen.queryByText('Build completed successfully')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATUS HANDLING TESTS
  // ============================================================================

  describe('Status Handling', () => {
    it('should handle different status values including unknown and mixed case', () => {
      const jobsWithVariousStatuses = [
        { ...mockJobs[0], status: 'SUCCESS' },
        { ...mockJobs[1], status: 'unknown-status' },
        { ...mockJobs[2], status: 'Running' },
      ];
      
      mockUseJobStatus.mockReturnValue({
        data: jobsWithVariousStatuses,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
      expect(screen.getByText('unknown-status')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    beforeEach(() => {
      // Mock window.open
      Object.defineProperty(window, 'open', {
        value: vi.fn(),
        writable: true,
      });
    });

    it('should open job URL when job item is clicked', () => {
      const mockWindowOpen = vi.fn();
      window.open = mockWindowOpen;

      renderWithQueryClient(<JobStatusIndicator />);

      const jobItems = screen.getAllByTestId('dropdown-menu-item');
      const firstJobItem = jobItems.find(item => 
        item.textContent?.includes('Build Frontend')
      );
      
      expect(firstJobItem).toBeInTheDocument();
      fireEvent.click(firstJobItem!);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://jenkins.example.com/queue/item/123',
        '_blank'
      );
    });

    it('should call remove job mutation when remove button is clicked', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      const removeButtons = screen.getAllByTestId('button').filter(btn => 
        btn.querySelector('[data-testid="x-icon"]')
      );
      
      expect(removeButtons.length).toBeGreaterThan(0);
      fireEvent.click(removeButtons[0]);

      expect(mockRemoveMutate).toHaveBeenCalledWith('job-1');
    });

    it('should prevent event propagation when remove button is clicked', () => {
      const mockWindowOpen = vi.fn();
      window.open = mockWindowOpen;

      renderWithQueryClient(<JobStatusIndicator />);

      const removeButtons = screen.getAllByTestId('button').filter(btn => 
        btn.querySelector('[data-testid="x-icon"]')
      );
      
      fireEvent.click(removeButtons[0]);

      // Window.open should not be called because event propagation was stopped
      expect(mockWindowOpen).not.toHaveBeenCalled();
      expect(mockRemoveMutate).toHaveBeenCalledWith('job-1');
    });

    it('should call clear jobs mutation when "Clear All" button is clicked', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      const clearAllButton = screen.getAllByTestId('button').find(btn => 
        btn.textContent === 'Clear All'
      );
      
      expect(clearAllButton).toBeInTheDocument();
      fireEvent.click(clearAllButton!);

      expect(mockClearMutate).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined jobs data and incomplete job fields', () => {
      mockUseJobStatus.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);
      expect(screen.getByText('No recent jobs')).toBeInTheDocument();
    });

    it('should handle edge case job data (long text, special characters, empty fields)', () => {
      const edgeCaseJobs = [
        {
          queueItemId: 'incomplete-job',
          jobName: '',
          status: '',
          message: '',
          queueUrl: '',
          baseJobUrl: '',
          jaasName: '',
        } as Job,
        {
          ...mockJobs[0],
          jobName: 'Job with émojis 🚀 & very long name that should be truncated',
          message: 'Message with <script>alert("xss")</script> and special chars',
        },
      ];

      mockUseJobStatus.mockReturnValue({
        data: edgeCaseJobs,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByText('#incomplete-job')).toBeInTheDocument();
      expect(screen.getByText('Job with émojis 🚀 & very long name that should be truncated')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper button roles and attributes', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper semantic structure', () => {
      renderWithQueryClient(<JobStatusIndicator />);

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-menu-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// JOBSTATUSBADGE COMPONENT TESTS
// ============================================================================

describe('JobStatusBadge', () => {
  let queryClient: QueryClient;
  
  const mockJobs: Job[] = [
    {
      queueItemId: 'job-1',
      jobName: 'Build Frontend',
      status: 'success',
      message: 'Build completed successfully',
      queueUrl: 'https://jenkins.example.com/queue/item/123',
      baseJobUrl: 'https://jenkins.example.com/job/frontend',
      jaasName: 'frontend-build',
      buildNumber: 42,
      timestamp: Date.now() - 1000,
    },
    {
      queueItemId: 'job-2',
      jobName: 'Deploy Backend',
      status: 'running',
      message: 'Deployment in progress',
      queueUrl: 'https://jenkins.example.com/queue/item/124',
      baseJobUrl: 'https://jenkins.example.com/job/backend',
      jaasName: 'backend-deploy',
      buildNumber: 15,
      timestamp: Date.now() - 2000,
    },
    {
      queueItemId: 'job-3',
      jobName: 'Test Suite',
      status: 'failed',
      message: 'Tests failed with 3 errors',
      queueUrl: 'https://jenkins.example.com/queue/item/125',
      baseJobUrl: 'https://jenkins.example.com/job/tests',
      jaasName: 'test-suite',
      buildNumber: 8,
      timestamp: Date.now() - 3000,
    },
    {
      queueItemId: 'job-4',
      jobName: 'Database Migration',
      status: 'queued',
      message: 'Waiting in queue',
      queueUrl: 'https://jenkins.example.com/queue/item/126',
      baseJobUrl: 'https://jenkins.example.com/job/migration',
      jaasName: 'db-migration',
      timestamp: Date.now() - 4000,
    },
    {
      queueItemId: 'job-5',
      jobName: 'Security Scan',
      status: 'pending',
      message: 'Pending approval',
      queueUrl: 'https://jenkins.example.com/queue/item/127',
      baseJobUrl: 'https://jenkins.example.com/job/security',
      jaasName: 'security-scan',
      timestamp: Date.now() - 5000,
    },
  ];

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should not render when no jobs exist', () => {
      mockUseJobStatus.mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = renderWithQueryClient(<JobStatusBadge />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when jobs data is undefined', () => {
      mockUseJobStatus.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      const { container } = renderWithQueryClient(<JobStatusBadge />);
      expect(container.firstChild).toBeNull();
    });

    it('should render running jobs badge when running jobs exist', () => {
      const jobsWithRunning = [
        { ...mockJobs[0], status: 'running' },
        { ...mockJobs[1], status: 'running' },
        { ...mockJobs[2], status: 'success' },
      ];

      mockUseJobStatus.mockReturnValue({
        data: jobsWithRunning,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusBadge />);

      const badges = screen.getAllByTestId('badge');
      const runningBadge = badges.find(badge => badge.textContent === '2 Running');
      expect(runningBadge).toBeInTheDocument();
      expect(runningBadge).toHaveAttribute('data-variant', 'default');
      expect(runningBadge).toHaveClass('bg-blue-500');
    });

    it('should render queued jobs badge when queued/pending jobs exist', () => {
      const jobsWithQueued = [
        { ...mockJobs[0], status: 'queued' },
        { ...mockJobs[1], status: 'pending' },
        { ...mockJobs[2], status: 'success' },
      ];

      mockUseJobStatus.mockReturnValue({
        data: jobsWithQueued,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusBadge />);

      const badges = screen.getAllByTestId('badge');
      const queuedBadge = badges.find(badge => badge.textContent === '2 Queued');
      expect(queuedBadge).toBeInTheDocument();
      expect(queuedBadge).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render both running and queued badges when both exist', () => {
      const mixedJobs = [
        { ...mockJobs[0], status: 'running' },
        { ...mockJobs[1], status: 'queued' },
        { ...mockJobs[2], status: 'pending' },
        { ...mockJobs[3], status: 'success' },
      ];

      mockUseJobStatus.mockReturnValue({
        data: mixedJobs,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusBadge />);

      expect(screen.getByText('1 Running')).toBeInTheDocument();
      expect(screen.getByText('2 Queued')).toBeInTheDocument();
    });

    it('should not render badges for completed statuses only', () => {
      const completedJobs = [
        { ...mockJobs[0], status: 'success' },
        { ...mockJobs[1], status: 'failed' },
        { ...mockJobs[2], status: 'aborted' },
      ];

      mockUseJobStatus.mockReturnValue({
        data: completedJobs,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusBadge />);
      
      // Should not render any running or queued badges
      expect(screen.queryByText(/Running/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Queued/)).not.toBeInTheDocument();
    });
  });

  describe('Status Filtering and Count Display', () => {
    it('should handle various status scenarios and display correct counts', () => {
      const mixedStatusJobs = [
        { ...mockJobs[0], status: 'RUNNING' }, // Case insensitive
        { ...mockJobs[1], status: 'running' },
        { ...mockJobs[2], status: 'queued' },
        { ...mockJobs[3], status: 'pending' },
        { ...mockJobs[4], status: 'unknown-status' }, // Unknown status ignored
      ];

      mockUseJobStatus.mockReturnValue({
        data: mixedStatusJobs,
        isLoading: false,
      });

      renderWithQueryClient(<JobStatusBadge />);

      expect(screen.getByText('2 Running')).toBeInTheDocument();
      expect(screen.getByText('2 Queued')).toBeInTheDocument();
      
      // Check styling and layout
      const container = screen.getByText('2 Running').parentElement;
      expect(container).toHaveClass('flex items-center gap-2');
      
      const runningBadge = screen.getByText('2 Running');
      expect(runningBadge).toHaveAttribute('data-variant', 'default');
      expect(runningBadge).toHaveClass('bg-blue-500');
    });

    it('should handle status changes and real-world scenarios', () => {
      const { rerender } = renderWithQueryClient(<JobStatusBadge />);

      // Initially running jobs
      mockUseJobStatus.mockReturnValue({
        data: [
          { ...mockJobs[0], status: 'running', jobName: 'CI/CD Pipeline' },
          { ...mockJobs[1], status: 'queued', jobName: 'Unit Tests' },
        ],
        isLoading: false,
      });

      rerender(<JobStatusBadge />);
      expect(screen.getByText('1 Running')).toBeInTheDocument();
      expect(screen.getByText('1 Queued')).toBeInTheDocument();

      // Jobs complete
      mockUseJobStatus.mockReturnValue({
        data: [{ ...mockJobs[0], status: 'success' }],
        isLoading: false,
      });

      rerender(<JobStatusBadge />);
      expect(screen.queryByText(/Running/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Queued/)).not.toBeInTheDocument();
    });
  });
});
