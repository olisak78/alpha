import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PendingReviewPage from '../../src/pages/PendingReviewPage';
import { useGitHubPRs } from '../../src/hooks/api/useGitHubPRs';

// Mock the hooks
vi.mock('../../src/hooks/api/useGitHubPRs');

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

describe('PendingReviewPage', () => {
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = mockWindowOpen;
  });

  const defaultProps = {
    projectId: 'test-project-123',
  };

  // Helper function to render with providers
  const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  // Mock PR data
  const mockUpdatePR = {
    id: 1,
    number: 101,
    title: '[Update-Rule] Update HighCPUAlert threshold',
    html_url: 'https://github.com/test/repo/pull/101',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-02T15:30:00Z',
    user: {
      login: 'testuser1',
    },
  };

  const mockAddPR = {
    id: 2,
    number: 102,
    title: '[Add-Rule] Add DiskSpaceAlert',
    html_url: 'https://github.com/test/repo/pull/102',
    created_at: '2024-01-03T09:00:00Z',
    updated_at: '2024-01-03T14:00:00Z',
    user: {
      login: 'testuser2',
    },
  };

  const mockOtherPR = {
    id: 3,
    number: 103,
    title: 'Fix typo in documentation',
    html_url: 'https://github.com/test/repo/pull/103',
    created_at: '2024-01-04T11:00:00Z',
    updated_at: '2024-01-04T12:00:00Z',
    user: {
      login: 'testuser3',
    },
  };

  // =========================================
  // LOADING STATE TESTS
  // =========================================

  describe('Loading State', () => {
    it('displays loading state when PRs are being fetched', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText('Loading pending pull requests...')).toBeInTheDocument();

      // Check for progress bar
      const progressBar = container.querySelector('.animate-pulse');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // =========================================
  // ERROR STATE TESTS
  // =========================================

  describe('Error State', () => {
    it('displays error message when PRs fail to load', () => {
      const errorMessage = 'Network error occurred';
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
      } as any);

      const { container } = renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(`Failed to load pending PRs: ${errorMessage}`)).toBeInTheDocument();

      // Check for error icon
      const errorIcon = container.querySelector('.lucide-triangle-alert');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  // =========================================
  // SUCCESS STATE TESTS
  // =========================================

  describe('Success State', () => {
    beforeEach(() => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockUpdatePR, mockAddPR, mockOtherPR],
        },
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders summary bar with correct counts', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText('Pending Alert Rule Changes')).toBeInTheDocument();
      expect(screen.getByText('Updates')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Check counts are present (nested in spans)
      const counts = screen.getAllByText('1');
      expect(counts.length).toBeGreaterThanOrEqual(2); // At least 2 instances of '1'
      expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    });

    it('renders Update Rule PRs section', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('[Update-Rule] Update HighCPUAlert threshold')).toBeInTheDocument();
      expect(screen.getByText('#101')).toBeInTheDocument();
      expect(screen.getByText('by testuser1')).toBeInTheDocument();
    });

    it('renders Add Rule PRs section', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/New Rules \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('[Add-Rule] Add DiskSpaceAlert')).toBeInTheDocument();
      expect(screen.getByText('#102')).toBeInTheDocument();
      expect(screen.getByText('by testuser2')).toBeInTheDocument();
    });

    it('does not render PRs without [Update-Rule] or [Add-Rule] prefix', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.queryByText('Fix typo in documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('#103')).not.toBeInTheDocument();
    });

    it('displays created and updated timestamps', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      // Check that time-related text is present (date-fns formatDistance)
      const timeElements = screen.getAllByText(/ago/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('renders View PR buttons for each PR', () => {
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      const viewPRButtons = screen.getAllByText('View PR');
      expect(viewPRButtons).toHaveLength(2); // One for update, one for add
    });
  });

  // =========================================
  // INTERACTION TESTS
  // =========================================

  describe('User Interactions', () => {
    beforeEach(() => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockUpdatePR, mockAddPR],
        },
        isLoading: false,
        error: null,
      } as any);
    });

    it('opens PR URL when View PR button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      const viewPRButtons = screen.getAllByText('View PR');
      await user.click(viewPRButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/101',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens correct URL for each PR', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      const viewPRButtons = screen.getAllByText('View PR');

      // Click first PR (Update Rule)
      await user.click(viewPRButtons[0]);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/101',
        '_blank',
        'noopener,noreferrer'
      );

      // Click second PR (Add Rule)
      await user.click(viewPRButtons[1]);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/102',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  // =========================================
  // EMPTY STATE TESTS
  // =========================================

  describe('Empty State', () => {
    it('displays empty state when no alert rule PRs are found', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockOtherPR], // Only non-alert PR
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText('No pending alert rule changes')).toBeInTheDocument();
      expect(screen.getByText('All alert rule PRs have been merged or there are no open PRs')).toBeInTheDocument();
    });

    it('displays empty state when no PRs exist at all', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText('No pending alert rule changes')).toBeInTheDocument();
    });

    it('shows 0 counts in summary bar when no alert PRs exist', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockOtherPR],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText('Updates')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Check all counts are 0
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3); // Should have at least 3 zeros
    });
  });

  // =========================================
  // FILTERING TESTS
  // =========================================

  describe('PR Filtering', () => {
    it('correctly filters Update Rule PRs', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [
            mockUpdatePR,
            { ...mockUpdatePR, id: 4, number: 104, title: '[Update-Rule] Another Update' },
            mockAddPR,
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/New Rules \(1\)/)).toBeInTheDocument();
    });

    it('correctly filters Add Rule PRs', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [
            mockAddPR,
            { ...mockAddPR, id: 5, number: 105, title: '[Add-Rule] Another Addition' },
            { ...mockAddPR, id: 6, number: 106, title: '[Add-Rule] Yet Another Addition' },
            mockUpdatePR,
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/New Rules \(3\)/)).toBeInTheDocument();
    });

    it('handles PRs with different title formats', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [
            { ...mockUpdatePR, title: '[UPDATE-RULE] Different Case' }, // Should not match (case-sensitive)
            { ...mockUpdatePR, id: 7, number: 107, title: '[Update-Rule]NoSpace' }, // Should match
            { ...mockAddPR, title: 'Update-Rule without brackets' }, // Should not match
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      // Only the properly formatted one should be counted
      expect(screen.getByText(/Rule Updates \(1\)/)).toBeInTheDocument();
    });
  });

  // =========================================
  // SECTION VISIBILITY TESTS
  // =========================================

  describe('Section Visibility', () => {
    it('only shows Update Rules section when no Add Rules exist', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockUpdatePR],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(1\)/)).toBeInTheDocument();
      expect(screen.queryByText(/New Rules/)).not.toBeInTheDocument();
    });

    it('only shows Add Rules section when no Update Rules exist', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockAddPR],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.queryByText(/Rule Updates/)).not.toBeInTheDocument();
      expect(screen.getByText(/New Rules \(1\)/)).toBeInTheDocument();
    });

    it('shows both sections when both types of PRs exist', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockUpdatePR, mockAddPR],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/New Rules \(1\)/)).toBeInTheDocument();
    });
  });

  // =========================================
  // UI STYLING TESTS
  // =========================================

  describe('UI Styling', () => {
    beforeEach(() => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: [mockUpdatePR, mockAddPR],
        },
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders Update Rule badges with correct styling', () => {
      const { container } = renderWithProviders(<PendingReviewPage {...defaultProps} />);

      // Check for amber-colored badge for update rules
      const updateBadge = screen.getByText('#101').closest('.inline-flex');
      expect(updateBadge).toHaveClass('bg-amber-50');
    });

    it('renders Add Rule badges with correct styling', () => {
      const { container } = renderWithProviders(<PendingReviewPage {...defaultProps} />);

      // Check for green-colored badge for add rules
      const addBadge = screen.getByText('#102').closest('.inline-flex');
      expect(addBadge).toHaveClass('bg-green-50');
    });

    it('renders compact layout with appropriate spacing', () => {
      const { container } = renderWithProviders(<PendingReviewPage {...defaultProps} />);

      // Check for compact padding classes
      const cards = container.querySelectorAll('[class*="p-3"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  // =========================================
  // PROPS HANDLING TESTS
  // =========================================

  describe('Props Handling', () => {
    it('calls useGitHubPRs with correct parameters', () => {
      const mockUseGitHubPRs = vi.mocked(useGitHubPRs);
      mockUseGitHubPRs.mockReturnValue({
        data: { pull_requests: [] },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(mockUseGitHubPRs).toHaveBeenCalledWith({
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
    });

    it('handles optional alertsRepoOwner prop', () => {
      vi.mocked(useGitHubPRs).mockReturnValue({
        data: { pull_requests: [] },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(
        <PendingReviewPage
          {...defaultProps}
          alertsRepoOwner="custom-owner"
          alertsRepoName="custom-repo"
        />
      );

      // Component should render without errors
      expect(screen.getByText('Pending Alert Rule Changes')).toBeInTheDocument();
    });
  });

  // =========================================
  // MULTIPLE PRs TESTS
  // =========================================

  describe('Multiple PRs', () => {
    it('handles many Update Rule PRs', () => {
      const manyUpdatePRs = Array.from({ length: 10 }, (_, i) => ({
        ...mockUpdatePR,
        id: i + 1,
        number: 200 + i,
        title: `[Update-Rule] Update Alert ${i}`,
      }));

      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: manyUpdatePRs,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/Rule Updates \(10\)/)).toBeInTheDocument();
      expect(screen.getAllByText('View PR')).toHaveLength(10);
    });

    it('handles many Add Rule PRs', () => {
      const manyAddPRs = Array.from({ length: 15 }, (_, i) => ({
        ...mockAddPR,
        id: i + 100,
        number: 300 + i,
        title: `[Add-Rule] Add Alert ${i}`,
      }));

      vi.mocked(useGitHubPRs).mockReturnValue({
        data: {
          pull_requests: manyAddPRs,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<PendingReviewPage {...defaultProps} />);

      expect(screen.getByText(/New Rules \(15\)/)).toBeInTheDocument();
      expect(screen.getAllByText('View PR')).toHaveLength(15);
    });
  });
});
