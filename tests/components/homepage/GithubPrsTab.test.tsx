import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import GithubPrsTab from '../../../src/components/tabs/MePageTabs/GithubPrsTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as githubApi from '../../../src/services/githubApi';

// Mock the entire githubApi module
vi.mock('../../../src/services/githubApi', () => ({
  fetchGitHubPullRequests: vi.fn(),
  fetchGitHubWdfPullRequests: vi.fn(),
  fetchBothGitHubPullRequests: vi.fn(),
  closePullRequest: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  Wrench: () => <div data-testid="wrench-icon" />,
  Database: () => <div data-testid="database-icon" />,
  List: () => <div data-testid="list-icon" />,
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  Trash2: (props: any) => <div data-testid="trash-icon" {...props} />,
  GitPullRequest: () => <div data-testid="git-pr-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />
}));

// Mock toast to avoid needing ToastProvider
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock ClosePRDialog component
vi.mock('../../../src/components/dialogs/ClosePRDialog', () => ({
  ClosePRDialog: () => <div data-testid="close-pr-dialog" />,
}));

// Mock QuickFilterButtons component
vi.mock('../../../src/components/QuickFilterButtons', () => ({
  default: ({ activeFilter, onFilterChange, filters }: any) => (
    <div data-testid="quick-filter-buttons">
      {filters.map((filter: any) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          data-testid={`filter-${filter.value}`}
          className={activeFilter === filter.value ? 'active' : ''}
          disabled={filter.isDisabled}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}));

const mockPullRequests = [
  {
    id: 1,
    number: 100,
    title: 'Fix authentication bug',
    state: 'open',
    draft: false,
    html_url: 'https://github.com/test/repo/pull/1',
    updated_at: '2023-12-01T10:00:00Z',
    created_at: '2023-11-30T10:00:00Z',
    user: {
      login: 'user1',
      id: 1,
      avatar_url: 'https://github.com/avatars/1',
    },
    repository: {
      name: 'test-repo',
      full_name: 'test/test-repo',
      owner: 'test',
      private: false,
    }
  },
  {
    id: 2,
    number: 101,
    title: 'Add new feature',
    state: 'closed',
    draft: true,
    html_url: 'https://github.com/test/repo/pull/2',
    updated_at: '2023-11-30T15:30:00Z',
    created_at: '2023-11-29T15:30:00Z',
    user: {
      login: 'user2',
      id: 2,
      avatar_url: 'https://github.com/avatars/2',
    },
    repository: {
      name: 'another-repo',
      full_name: 'test/another-repo',
      owner: 'test',
      private: false,
    }
  }
];

const mockApiResponse = {
  pull_requests: mockPullRequests,
  total: 2
};

const mockProps = {
  prStatus: 'open' as const,
  setPrStatus: vi.fn(),
  prPage: 1,
  setPrPage: vi.fn(),
  perPage: 10
};

// Helper to create a test QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection for tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  );
};

describe('GithubPrsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for Tools filter
    vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(mockApiResponse);
    vi.mocked(githubApi.fetchGitHubWdfPullRequests).mockResolvedValue(mockApiResponse);
    vi.mocked(githubApi.fetchBothGitHubPullRequests).mockResolvedValue(mockApiResponse);
  });

  describe('Rendering and UI', () => {
    it('renders status filter and quick filter buttons', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      expect(screen.getAllByText('Status')).toHaveLength(2); // One in filter, one in table header
      expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
    });

    it('displays pull requests in table', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
        expect(screen.getByText('Add new feature')).toBeInTheDocument();
        expect(screen.getByText('test/test-repo')).toBeInTheDocument();
        expect(screen.getByText('test/another-repo')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      const errorMessage = 'Failed to load PRs';
      vi.mocked(githubApi.fetchGitHubPullRequests).mockRejectedValue(new Error(errorMessage));
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(`Error loading pull requests: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('displays correct status badges', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        const openBadges = screen.getAllByText('Open');
        expect(openBadges.length).toBeGreaterThan(0);
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('displays pagination controls', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 / 1 (2 total)')).toBeInTheDocument();
        expect(screen.getByText('Prev')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('renders PR links correctly', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        const prLink = screen.getByText('Fix authentication bug');
        expect(prLink).toHaveAttribute('href', 'https://github.com/test/repo/pull/1');
        expect(prLink).toHaveAttribute('target', '_blank');
        expect(prLink).toHaveAttribute('rel', 'noreferrer');
      });
    });

    it('displays formatted update dates', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);

      await waitFor(() => {
        // Date format from toLocaleString() is locale-specific and includes time
        // Match either format with flexible separators and optional leading zeros
        expect(screen.getByText(/(12[.\/]0?1[.\/]2023|0?1[.\/]12[.\/]2023)/)).toBeInTheDocument();
        expect(screen.getByText(/(11[.\/]30[.\/]2023|30[.\/]11[.\/]2023)/)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Options', () => {
    it('shows all repository filter options', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      expect(screen.getByTestId('filter-tools')).toBeInTheDocument();
      expect(screen.getByTestId('filter-wdf')).toBeInTheDocument();
      expect(screen.getByTestId('filter-both')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
    });

    it('enables all filter buttons (Tools, WDF, Both)', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      // All filters should be enabled now
      expect(screen.getByTestId('filter-tools')).not.toBeDisabled();
      expect(screen.getByTestId('filter-wdf')).not.toBeDisabled();
      expect(screen.getByTestId('filter-both')).not.toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
    });

    it('defaults to Tools filter', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(githubApi.fetchGitHubPullRequests).toHaveBeenCalled();
        expect(githubApi.fetchGitHubWdfPullRequests).not.toHaveBeenCalled();
        expect(githubApi.fetchBothGitHubPullRequests).not.toHaveBeenCalled();
      });
    });
  });

  describe('Filter Switching', () => {
    it('switches to WDF filter and fetches WDF PRs', async () => {
      const wdfResponse = {
        pull_requests: [
          {
            ...mockPullRequests[0],
            id: 3,
            title: 'WDF PR',
            repository: {
              ...mockPullRequests[0].repository,
              full_name: 'wdf/repo'
            }
          }
        ],
        total: 1
      };
      
      vi.mocked(githubApi.fetchGitHubWdfPullRequests).mockResolvedValue(wdfResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
      
      // Click WDF filter
      const wdfButton = screen.getByTestId('filter-wdf');
      fireEvent.click(wdfButton);
      
      // Should fetch WDF PRs
      await waitFor(() => {
        expect(githubApi.fetchGitHubWdfPullRequests).toHaveBeenCalled();
        expect(screen.getByText('WDF PR')).toBeInTheDocument();
      });
    });

    it('switches to Both filter and fetches combined PRs', async () => {
      const bothResponse = {
        pull_requests: [
          ...mockPullRequests,
          {
            ...mockPullRequests[0],
            id: 3,
            title: 'Combined PR from Both',
            repository: {
              ...mockPullRequests[0].repository,
              full_name: 'combined/repo'
            }
          }
        ],
        total: 3
      };
      
      vi.mocked(githubApi.fetchBothGitHubPullRequests).mockResolvedValue(bothResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
      
      // Click Both filter
      const bothButton = screen.getByTestId('filter-both');
      fireEvent.click(bothButton);
      
      // Should fetch combined PRs
      await waitFor(() => {
        expect(githubApi.fetchBothGitHubPullRequests).toHaveBeenCalled();
        expect(screen.getByText('Combined PR from Both')).toBeInTheDocument();
      });
    });

    it('resets page to 1 when filter changes', async () => {
      const setPrPageMock = vi.fn();
      renderWithClient(<GithubPrsTab {...mockProps} setPrPage={setPrPageMock} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
      
      // Click WDF filter
      const wdfButton = screen.getByTestId('filter-wdf');
      fireEvent.click(wdfButton);
      
      // Should reset page
      await waitFor(() => {
        expect(setPrPageMock).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Status Filter', () => {
    it('handles status filter change', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
      
      const statusButton = screen.getByRole('combobox');
      fireEvent.click(statusButton);
      
      expect(mockProps.setPrStatus).toBeDefined();
    });

    it('passes correct state parameter to API', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} prStatus="closed" />);
      
      await waitFor(() => {
        expect(githubApi.fetchGitHubPullRequests).toHaveBeenCalledWith(
          expect.objectContaining({
            state: 'closed'
          })
        );
      });
    });

    it('resets page to 1 when status changes', async () => {
      const setPrPageMock = vi.fn();
      const { rerender } = renderWithClient(
        <GithubPrsTab {...mockProps} setPrPage={setPrPageMock} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
      });
      
      // Change status
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <GithubPrsTab {...mockProps} prStatus="closed" setPrPage={setPrPageMock} />
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(setPrPageMock).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Pagination', () => {
    it('handles pagination clicks', async () => {
      const largeResponse = {
        pull_requests: mockPullRequests,
        total: 25
      };
      
      vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(largeResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 / 3 (25 total)')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(mockProps.setPrPage).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calculates total pages correctly', async () => {
      const largeResponse = {
        pull_requests: Array(5).fill(mockPullRequests[0]),
        total: 25
      };
      
      vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(largeResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 / 3 (25 total)')).toBeInTheDocument();
      });
    });

    it('disables Prev button on first page', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} prPage={1} />);
      
      await waitFor(() => {
        const prevButton = screen.getByText('Prev');
        expect(prevButton).toBeDisabled();
      });
    });

    it('disables Next button on last page', async () => {
      const singlePageResponse = {
        pull_requests: mockPullRequests,
        total: 2
      };
      
      vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(singlePageResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} prPage={1} perPage={10} />);
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Empty and Error States', () => {
    it('handles empty PR list gracefully', async () => {
      const emptyResponse = {
        pull_requests: [],
        total: 0
      };
      
      vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(emptyResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No pull requests found')).toBeInTheDocument();
        expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
      });
    });

    it('shows error message when fetch fails', async () => {
      vi.mocked(githubApi.fetchGitHubPullRequests).mockRejectedValue(
        new Error('Network error')
      );
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading pull requests: Network error')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls fetchGitHubPullRequests with correct parameters', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} prStatus="open" prPage={2} perPage={20} />);
      
      await waitFor(() => {
        expect(githubApi.fetchGitHubPullRequests).toHaveBeenCalledWith({
          state: 'open',
          page: 2,
          per_page: 20,
          sort: 'updated',
          direction: 'desc',
        });
      });
    });

    it('refetches data when query parameters change', async () => {
      const { rerender } = renderWithClient(<GithubPrsTab {...mockProps} prPage={1} />);
      
      await waitFor(() => {
        expect(githubApi.fetchGitHubPullRequests).toHaveBeenCalledTimes(1);
      });
      
      // Change page
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <GithubPrsTab {...mockProps} prPage={2} />
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(githubApi.fetchGitHubPullRequests).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Close PR Functionality', () => {
    it('renders close button for open PRs', async () => {
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        const closeButtons = screen.getAllByTestId('trash-icon');
        // Only open PRs should have close button
        expect(closeButtons.length).toBe(1);
      });
    });

    it('does not render close button for closed PRs', async () => {
      const closedOnlyResponse = {
        pull_requests: [mockPullRequests[1]], // This is the closed one
        total: 1
      };
      
      vi.mocked(githubApi.fetchGitHubPullRequests).mockResolvedValue(closedOnlyResponse);
      
      renderWithClient(<GithubPrsTab {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Add new feature')).toBeInTheDocument();
        expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
      });
    });
  });
});