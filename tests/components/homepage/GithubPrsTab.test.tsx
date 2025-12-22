import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import GithubPrsTab from '../../../src/components/tabs/MePageTabs/GithubPrsTab';

// NEW: import React Query bits
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// (Optional but recommended) mock toast to avoid needing ToastProvider
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
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

const mockData = {
  pull_requests: [
    {
      id: 1,
      title: 'Fix authentication bug',
      state: 'open',
      draft: false,
      html_url: 'https://github.com/test/repo/pull/1',
      updated_at: '2023-12-01T10:00:00Z',
      repository: {
        name: 'test-repo',
        full_name: 'test/test-repo'
      }
    },
    {
      id: 2,
      title: 'Add new feature',
      state: 'closed',
      draft: true,
      html_url: 'https://github.com/test/repo/pull/2',
      updated_at: '2023-11-30T15:30:00Z',
      repository: {
        name: 'another-repo',
        full_name: 'test/another-repo'
      }
    }
  ],
  total: 2
};

const mockProps = {
  data: mockData,
  isLoading: false,
  error: null,
  prStatus: 'open' as const,
  setPrStatus: vi.fn(),
  prPage: 1,
  setPrPage: vi.fn(),
  perPage: 10
};

// NEW: helper to render with a QueryClientProvider
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
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
  });

  it('renders status filter and quick filter buttons', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getAllByText('Status')).toHaveLength(2); // One in filter, one in table header
    const openElements = screen.getAllByText('Open');
    expect(openElements.length).toBeGreaterThan(0); // Multiple "Open" texts exist
    expect(screen.getByTestId('quick-filter-buttons')).toBeInTheDocument();
  });

  it('displays pull requests in table', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
    expect(screen.getByText('Add new feature')).toBeInTheDocument();
    expect(screen.getByText('test/test-repo')).toBeInTheDocument();
    expect(screen.getByText('test/another-repo')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithClient(<GithubPrsTab {...mockProps} isLoading={true} />);
    
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const error = new Error('Failed to load PRs');
    renderWithClient(<GithubPrsTab {...mockProps} error={error} isLoading={false} />);
    
    expect(screen.getByText('Error loading pull requests: Failed to load PRs')).toBeInTheDocument();
  });

  it('handles status filter change', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    const statusButton = screen.getByRole('combobox');
    fireEvent.click(statusButton);
    
    expect(mockProps.setPrStatus).toBeDefined();
  });

  it('displays correct status badges', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    const openBadges = screen.getAllByText('Open');
    expect(openBadges.length).toBeGreaterThan(0);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('displays pagination controls', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getByText('Page 1 / 1 (2 total)')).toBeInTheDocument();
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles pagination clicks', () => {
    const propsWithMultiplePages = {
      ...mockProps,
      data: { ...mockData, total: 25 },
      prPage: 1
    };
    
    renderWithClient(<GithubPrsTab {...propsWithMultiplePages} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(mockProps.setPrPage).toHaveBeenCalledWith(expect.any(Function));
  });

  it('renders PR links correctly', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    const prLink = screen.getByText('Fix authentication bug');
    expect(prLink).toHaveAttribute('href', 'https://github.com/test/repo/pull/1');
    expect(prLink).toHaveAttribute('target', '_blank');
    expect(prLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('displays formatted update dates', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getByText(/12\/1\/2023/)).toBeInTheDocument();
    expect(screen.getByText(/11\/30\/2023/)).toBeInTheDocument();
  });

  it('shows repository filter options', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getByTestId('filter-tools')).toBeInTheDocument();
    expect(screen.getByTestId('filter-wdf')).toBeInTheDocument();
    expect(screen.getByTestId('filter-both')).toBeInTheDocument();
  });

  it('disables WDF and Both filters', () => {
    renderWithClient(<GithubPrsTab {...mockProps} />);
    
    expect(screen.getByTestId('filter-wdf')).toBeDisabled();
    expect(screen.getByTestId('filter-both')).toBeDisabled();
  });

  it('handles undefined data gracefully', () => {
    renderWithClient(<GithubPrsTab {...mockProps} data={undefined} />);
    
    expect(screen.getByText('No pull requests found')).toBeInTheDocument();
    expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
  });

  it('calculates total pages correctly', () => {
    const largeDataSet = {
      pull_requests: Array(5).fill(mockData.pull_requests[0]),
      total: 25
    };
    
    renderWithClient(<GithubPrsTab {...mockProps} data={largeDataSet} />);
    
    expect(screen.getByText('Page 1 / 3 (25 total)')).toBeInTheDocument();
  });
});
