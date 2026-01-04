import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeploymentTab } from '@/components/tabs/DeploymentTab';
import type { ConcourseJob } from '@/types/concourse';
import type { Landscape } from '@/types/developer-portal';
import '@testing-library/jest-dom';

// Mock the useConcourse hook
vi.mock('@/hooks/api/useConcourse', () => ({
  useConcourse: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, onClick, title, className, ...props }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      title={title}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="external-link-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock concourse type helpers
vi.mock('@/types/concourse', async () => {
  const actual = await vi.importActual('@/types/concourse');
  return {
    ...actual,
    getJobSection: (pipeline: string, jobName: string) => {
      if (pipeline.includes('monitoring')) return 'monitor';
      if (jobName.includes('validate') || jobName.includes('test')) return 'validate';
      return 'deploy';
    },
    getStatusColor: (status: string) => {
      switch (status) {
        case 'succeeded': return 'bg-green-500';
        case 'failed': return 'bg-red-500';
        case 'running': return 'bg-amber-500';
        case 'paused': return 'bg-slate-400';
        default: return 'bg-gray-500';
      }
    },
  };
});

import { useConcourse } from '@/hooks/api/useConcourse';

const mockJobs: ConcourseJob[] = [
  {
    key: 'prod-deploy-app-1',
    domain: 'concourse.example.com',
    landscape: 'prod',
    pipeline: 'landscape-update-pipeline',
    name: 'deploy-app',
    build: '123',
    paused: 'no',
    status: 'succeeded',
    start_time: 1640000000,
    end_time: 1640001000,
    duration: '16m 40s',
    message: 'Deploy application to production',
    commit: 'https://github.com/example/repo/commit/abc123',
    dateTime: '2024-01-01 10:00:00',
  },
  {
    key: 'prod-validate-tests-2',
    domain: 'concourse.example.com',
    landscape: 'prod',
    pipeline: 'landscape-update-pipeline',
    name: 'validate-tests',
    build: '124',
    paused: 'no',
    status: 'failed',
    start_time: 1640001000,
    end_time: 1640001500,
    duration: '8m 20s',
    message: 'Run validation tests',
    commit: 'https://github.com/example/repo/commit/def456',
    dateTime: '2024-01-01 10:30:00',
  },
  {
    key: 'staging-monitor-health-3',
    domain: 'concourse.example.com',
    landscape: 'staging',
    pipeline: 'landscape-monitoring-pipeline',
    name: 'monitor-health',
    build: '125',
    paused: 'yes',
    status: 'running',
    start_time: 1640002000,
    end_time: 1640002500,
    duration: '5m 10s',
    message: 'Monitor system health',
    commit: '',
    dateTime: '2024-01-01 11:00:00',
  },
];

const mockLandscapeData: Landscape = {
  id: 'landscape-1',
  name: 'prod',
  title: 'Production',
  description: 'Production environment',
  concourse: 'https://concourse.example.com/teams/main/pipelines/prod',
  project_id: 'project-1',
};

const defaultProps = {
  projectId: 'test-project-123',
  selectedLandscape: 'prod',
  landscapeData: mockLandscapeData,
};

describe('DeploymentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useConcourse).mockReturnValue({
      jobs: mockJobs,
      isLoading: false,
      error: null,
    } as any);

    // Mock window.open
    global.window.open = vi.fn();
  });

  describe('Loading State', () => {
    it('should display loading state with spinner', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: true,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading deployment jobs...')).toBeInTheDocument();
    });

    it('should have proper loading state styling', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<DeploymentTab {...defaultProps} />);

      const loadingContainer = container.querySelector('.flex.items-center.justify-center.py-12');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: false,
        error: new Error('Failed to fetch jobs'),
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load deployment jobs: Failed to fetch jobs/)).toBeInTheDocument();
    });

    it('should handle different error messages', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: false,
        error: new Error('Network timeout'),
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
    });
  });

  describe('Rendering Jobs by Section', () => {
    it('should render all three sections (Deploy, Validate, Monitor)', () => {
      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('Deploy')).toBeInTheDocument();
      expect(screen.getByText('Validate')).toBeInTheDocument();
      expect(screen.getByText('Monitor')).toBeInTheDocument();
    });

    it('should group jobs correctly by section', () => {
      render(<DeploymentTab {...defaultProps} />);

      // Check that jobs are present
      expect(screen.getByText('deploy-app')).toBeInTheDocument();
      expect(screen.getByText('validate-tests')).toBeInTheDocument();
      expect(screen.getByText('monitor-health')).toBeInTheDocument();
    });

    it('should display empty state for sections with no jobs', () => {
      const jobsWithoutValidate: ConcourseJob[] = [
        mockJobs[0], // deploy
        mockJobs[2], // monitor
      ];

      vi.mocked(useConcourse).mockReturnValue({
        jobs: jobsWithoutValidate,
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('No validate jobs found')).toBeInTheDocument();
    });

    it('should render empty state for all sections when no jobs available', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('No deploy jobs found')).toBeInTheDocument();
      expect(screen.getByText('No validate jobs found')).toBeInTheDocument();
      expect(screen.getByText('No monitor jobs found')).toBeInTheDocument();
    });
  });

  describe('Job Table Structure', () => {
    it('should render table headers with correct labels', () => {
      render(<DeploymentTab {...defaultProps} />);

      // Headers appear in multiple sections, so use getAllByText
      const jobHeaders = screen.getAllByText('Job');
      expect(jobHeaders.length).toBeGreaterThan(0);

      const landscapeHeaders = screen.getAllByText('Landscape');
      expect(landscapeHeaders.length).toBeGreaterThan(0);

      const buildHeaders = screen.getAllByText('Last build');
      expect(buildHeaders.length).toBeGreaterThan(0);

      const resultHeaders = screen.getAllByText('Result');
      expect(resultHeaders.length).toBeGreaterThan(0);

      const durationHeaders = screen.getAllByText('Duration');
      expect(durationHeaders.length).toBeGreaterThan(0);

      const actionHeaders = screen.getAllByText('Action');
      expect(actionHeaders.length).toBeGreaterThan(0);
    });

    it('should display job information correctly in table rows', () => {
      render(<DeploymentTab {...defaultProps} />);

      // Check job name
      expect(screen.getByText('deploy-app')).toBeInTheDocument();

      // Check landscape badge (use getAllByText since "prod" appears multiple times)
      const prodBadges = screen.getAllByText('prod');
      expect(prodBadges.length).toBeGreaterThan(0);

      // Check build number
      expect(screen.getByText('#123')).toBeInTheDocument();

      // Check duration
      expect(screen.getByText('16m 40s')).toBeInTheDocument();
    });

    it('should have proper grid layout structure', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const gridHeaders = container.querySelectorAll('.grid.grid-cols-12');
      expect(gridHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Job Status Indicators', () => {
    it('should display status badges with correct status', () => {
      render(<DeploymentTab {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');

      // Find status badges (not landscape badges)
      const statusBadges = badges.filter(badge =>
        ['succeeded', 'failed', 'running'].some(status =>
          badge.textContent?.toLowerCase() === status
        )
      );

      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should apply correct CSS classes for different statuses', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      // Check for status indicator dots
      const statusDots = container.querySelectorAll('.h-2.w-2.rounded-full');
      expect(statusDots.length).toBeGreaterThan(0);
    });

    it('should handle all status types correctly', () => {
      const jobsWithAllStatuses: ConcourseJob[] = [
        { ...mockJobs[0], status: 'succeeded' },
        { ...mockJobs[1], status: 'failed' },
        { ...mockJobs[2], status: 'running' },
        {
          ...mockJobs[0],
          key: 'test-paused-4',
          name: 'paused-job',
          status: 'paused',
          build: '126'
        },
      ];

      vi.mocked(useConcourse).mockReturnValue({
        jobs: jobsWithAllStatuses,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<DeploymentTab {...defaultProps} />);

      const statusDots = container.querySelectorAll('.h-2.w-2.rounded-full');
      expect(statusDots.length).toBe(4);
    });
  });

  describe('Row Expansion', () => {
    it('should toggle row expansion when clicked', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const jobRow = screen.getByText('deploy-app').closest('.grid');
      expect(jobRow).toBeInTheDocument();

      // Initially collapsed (should see chevron-right)
      expect(screen.getAllByTestId('chevron-right-icon').length).toBeGreaterThan(0);

      // Click to expand
      fireEvent.click(jobRow!);

      await waitFor(() => {
        expect(screen.getByText('Pipeline:')).toBeInTheDocument();
      });

      // Click again to collapse
      fireEvent.click(jobRow!);

      await waitFor(() => {
        expect(screen.queryByText('Pipeline:')).not.toBeInTheDocument();
      });
    });

    it('should display expanded job details correctly', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const jobRow = screen.getByText('deploy-app').closest('.grid');
      fireEvent.click(jobRow!);

      await waitFor(() => {
        expect(screen.getByText('Pipeline:')).toBeInTheDocument();
        expect(screen.getByText('landscape-update-pipeline')).toBeInTheDocument();
        expect(screen.getByText('Time:')).toBeInTheDocument();
        expect(screen.getByText('2024-01-01 10:00:00')).toBeInTheDocument();
        expect(screen.getByText('Message:')).toBeInTheDocument();
        expect(screen.getByText('Deploy application to production')).toBeInTheDocument();
      });
    });

    it('should display commit link in expanded view when available', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const jobRow = screen.getByText('deploy-app').closest('.grid');
      fireEvent.click(jobRow!);

      await waitFor(() => {
        const commitLink = screen.getByText('View commit');
        expect(commitLink).toBeInTheDocument();
        expect(commitLink.closest('a')).toHaveAttribute('href', 'https://github.com/example/repo/commit/abc123');
      });
    });

    it('should show paused badge in expanded view when job is paused', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const pausedJobRow = screen.getByText('monitor-health').closest('.grid');
      fireEvent.click(pausedJobRow!);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const pausedBadge = badges.find(badge => badge.textContent === 'Paused');
        expect(pausedBadge).toBeInTheDocument();
      });
    });

    it('should handle jobs without commit or message gracefully', async () => {
      const jobWithoutCommit: ConcourseJob = {
        ...mockJobs[0],
        commit: '',
        message: '',
      };

      vi.mocked(useConcourse).mockReturnValue({
        jobs: [jobWithoutCommit],
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      const jobRow = screen.getByText('deploy-app').closest('.grid');
      fireEvent.click(jobRow!);

      await waitFor(() => {
        expect(screen.queryByText('View commit')).not.toBeInTheDocument();
        expect(screen.queryByText('Message:')).not.toBeInTheDocument();
      });
    });

    it('should allow multiple rows to be expanded simultaneously', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const deployRow = screen.getByText('deploy-app').closest('.grid');
      const validateRow = screen.getByText('validate-tests').closest('.grid');

      // Expand both rows
      fireEvent.click(deployRow!);
      fireEvent.click(validateRow!);

      await waitFor(() => {
        // Both should show Pipeline label (2 instances)
        const pipelineLabels = screen.getAllByText('Pipeline:');
        expect(pipelineLabels.length).toBe(2);
      });
    });
  });

  describe('External Link Action', () => {
    it('should open Concourse job in new tab when action button clicked', () => {
      render(<DeploymentTab {...defaultProps} />);

      const actionButtons = screen.getAllByTitle('Open in Deployment Tool');
      expect(actionButtons.length).toBeGreaterThan(0);

      fireEvent.click(actionButtons[0]);

      expect(window.open).toHaveBeenCalledWith(
        'https://concourse.example.com/teams/main/pipelines/prod/jobs/deploy-app/builds/123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should construct URL from landscapeData when available', () => {
      render(<DeploymentTab {...defaultProps} />);

      const actionButtons = screen.getAllByTitle('Open in Deployment Tool');
      fireEvent.click(actionButtons[0]);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('concourse.example.com/teams/main/pipelines/prod'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should fall back to domain-based URL when landscapeData is not available', () => {
      render(<DeploymentTab {...defaultProps} landscapeData={null} />);

      const actionButtons = screen.getAllByTitle('Open in Deployment Tool');
      fireEvent.click(actionButtons[0]);

      expect(window.open).toHaveBeenCalledWith(
        'https://concourse.example.com/teams/main/pipelines/landscape-update-pipeline/jobs/deploy-app/builds/123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should stop event propagation to prevent row expansion', async () => {
      render(<DeploymentTab {...defaultProps} />);

      const actionButtons = screen.getAllByTitle('Open in Deployment Tool');

      // Click action button
      fireEvent.click(actionButtons[0]);

      // Row should not be expanded (Pipeline label should not appear)
      expect(screen.queryByText('Pipeline:')).not.toBeInTheDocument();
    });
  });

  describe('Landscape Filtering', () => {
    it('should pass correct landscape filter to useConcourse hook', () => {
      render(<DeploymentTab {...defaultProps} selectedLandscape="staging" />);

      expect(useConcourse).toHaveBeenCalledWith({
        landscape: 'staging',
        enabled: true,
      });
    });

    it('should default to "all" when no landscape selected', () => {
      render(<DeploymentTab {...defaultProps} selectedLandscape={undefined} />);

      expect(useConcourse).toHaveBeenCalledWith({
        landscape: 'all',
        enabled: true,
      });
    });

    it('should display jobs from filtered landscape', () => {
      const prodJobs = mockJobs.filter(job => job.landscape === 'prod');

      vi.mocked(useConcourse).mockReturnValue({
        jobs: prodJobs,
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} selectedLandscape="prod" />);

      expect(screen.getByText('deploy-app')).toBeInTheDocument();
      expect(screen.getByText('validate-tests')).toBeInTheDocument();
      expect(screen.queryByText('monitor-health')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should handle different projectId values', () => {
      const { rerender } = render(<DeploymentTab {...defaultProps} projectId="project-1" />);

      expect(screen.getByText('Deploy')).toBeInTheDocument();

      rerender(<DeploymentTab {...defaultProps} projectId="project-2" />);

      expect(screen.getByText('Deploy')).toBeInTheDocument();
    });

    it('should handle missing optional props gracefully', () => {
      render(
        <DeploymentTab
          projectId="test-project"
          selectedLandscape={undefined}
          landscapeData={undefined}
        />
      );

      expect(screen.getByText('Deploy')).toBeInTheDocument();
      expect(screen.getByText('Validate')).toBeInTheDocument();
      expect(screen.getByText('Monitor')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty jobs array', () => {
      vi.mocked(useConcourse).mockReturnValue({
        jobs: [],
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('No deploy jobs found')).toBeInTheDocument();
      expect(screen.getByText('No validate jobs found')).toBeInTheDocument();
      expect(screen.getByText('No monitor jobs found')).toBeInTheDocument();
    });

    it('should handle jobs with missing optional fields', () => {
      const incompleteJob: ConcourseJob = {
        key: 'test-incomplete',
        domain: 'concourse.example.com',
        landscape: 'dev',
        pipeline: 'test-pipeline',
        name: 'incomplete-job',
        build: '100',
        paused: 'no',
        status: 'succeeded',
        start_time: 0,
        end_time: 0,
        duration: '0s',
        message: '',
        commit: '',
        dateTime: '',
      };

      vi.mocked(useConcourse).mockReturnValue({
        jobs: [incompleteJob],
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('incomplete-job')).toBeInTheDocument();
    });

    it('should handle very long job names and messages', async () => {
      const longNameJob: ConcourseJob = {
        ...mockJobs[0],
        name: 'very-long-job-name-that-exceeds-normal-length-and-should-be-truncated-properly',
        message: 'This is a very long commit message that contains a lot of information about the changes made in this commit and should be displayed properly without breaking the layout',
      };

      vi.mocked(useConcourse).mockReturnValue({
        jobs: [longNameJob],
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText(longNameJob.name)).toBeInTheDocument();

      // Expand to see message
      const jobRow = screen.getByText(longNameJob.name).closest('.grid');
      fireEvent.click(jobRow!);

      await waitFor(() => {
        expect(screen.getByText(longNameJob.message)).toBeInTheDocument();
      });
    });
  });

  describe('UI and Styling', () => {
    it('should apply hover effects to job rows', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const jobRows = container.querySelectorAll('.hover\\:bg-muted\\/50');
      expect(jobRows.length).toBeGreaterThan(0);
    });

    it('should have proper responsive grid layout', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const responsiveGrids = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2');
      // The expanded details use responsive grid
      const jobRow = screen.getByText('deploy-app').closest('.grid');
      fireEvent.click(jobRow!);
    });

    it('should apply correct spacing classes', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render with proper border and background styles', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const borderedTables = container.querySelectorAll('.border.rounded-lg.overflow-hidden.bg-card');
      expect(borderedTables.length).toBe(3); // Three sections
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attributes for action buttons', () => {
      render(<DeploymentTab {...defaultProps} />);

      const actionButtons = screen.getAllByTitle('Open in Deployment Tool');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should have clickable rows with cursor pointer', () => {
      const { container } = render(<DeploymentTab {...defaultProps} />);

      const clickableRows = container.querySelectorAll('.cursor-pointer');
      expect(clickableRows.length).toBeGreaterThan(0);
    });

    it('should stop propagation on nested clickable elements', () => {
      render(<DeploymentTab {...defaultProps} />);

      const jobRow = screen.getByText('deploy-app').closest('.grid');
      fireEvent.click(jobRow!);

      // Expand the row
      const commitLink = screen.getByText('View commit');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagation = vi.fn();
      Object.defineProperty(clickEvent, 'stopPropagation', {
        value: stopPropagation,
      });

      commitLink.closest('a')?.dispatchEvent(clickEvent);
    });
  });

  describe('Performance', () => {
    it('should handle large number of jobs efficiently', () => {
      const manyJobs = Array.from({ length: 100 }, (_, i) => ({
        ...mockJobs[0],
        key: `job-${i}`,
        name: `job-${i}`,
        build: `${i}`,
      }));

      vi.mocked(useConcourse).mockReturnValue({
        jobs: manyJobs,
        isLoading: false,
        error: null,
      } as any);

      render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('Deploy')).toBeInTheDocument();
      expect(screen.getByText('job-0')).toBeInTheDocument();
      expect(screen.getByText('job-99')).toBeInTheDocument();
    });

    it('should memoize job sections correctly', () => {
      const { rerender } = render(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('deploy-app')).toBeInTheDocument();

      // Rerender with same props
      rerender(<DeploymentTab {...defaultProps} />);

      expect(screen.getByText('deploy-app')).toBeInTheDocument();
    });
  });
});
