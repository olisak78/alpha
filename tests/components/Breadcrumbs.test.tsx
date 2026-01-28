import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs, generateBreadcrumbs, formatEntityName } from '../../src/components/Breadcrumbs';
import '@testing-library/jest-dom/vitest';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
  };
});

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-right-icon" className={className} />
  ),
}));

// Mock the useTeams hook
vi.mock('../../src/hooks/api/useTeams', () => ({
  useTeams: vi.fn(),
}));

// Mock constants
vi.mock('../../src/constants/developer-portal', () => ({
  VALID_COMMON_TABS: ['overview', 'components', 'schedule', 'jira', 'docs'],
}));

import { useLocation } from 'react-router-dom';
import { useTeams } from '../../src/hooks/api/useTeams';
import type { MockedFunction } from 'vitest';

const mockUseLocation = useLocation as MockedFunction<typeof useLocation>;
const mockUseTeams = useTeams as MockedFunction<typeof useTeams>;

// Test wrapper component
const TestWrapper = ({ children, pathname = '/' }: { children: React.ReactNode; pathname?: string }) => {
  mockUseLocation.mockReturnValue({
    pathname,
    search: '',
    hash: '',
    state: null,
    key: 'test',
  });

  return <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>;
};

describe('Breadcrumbs Component', () => {
  const mockTeamsData = {
    teams: [
      { id: 'team-1', name: 'platform-engineering', title: 'Platform Engineering' },
      { id: 'team-2', name: 'frontend-team', title: 'Frontend Team' },
      { id: 'team-3', name: 'backend-services' }, // No title
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTeams.mockReturnValue({
      data: mockTeamsData,
      isLoading: false,
      error: null,
    } as any);
  });

  describe('Component Rendering', () => {
    it('should not render breadcrumbs on home page', () => {
      const { container } = render(
        <TestWrapper pathname="/">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render breadcrumbs navigation with proper structure', () => {
      render(
        <TestWrapper pathname="/teams">
          <Breadcrumbs />
        </TestWrapper>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    it('should render breadcrumb items with chevron separators', () => {
      render(
        <TestWrapper pathname="/teams/platform-engineering">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Platform Engineering')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('should render active breadcrumb item correctly', () => {
      render(
        <TestWrapper pathname="/teams/platform-engineering">
          <Breadcrumbs />
        </TestWrapper>
      );

      const activeItem = screen.getByText('Platform Engineering');
      expect(activeItem).toBeInTheDocument();
      
      // Verify the breadcrumb structure
      const breadcrumbItems = screen.getAllByRole('listitem');
      expect(breadcrumbItems).toHaveLength(2); // Teams and Platform Engineering
    });
  });

  describe('Route Configurations', () => {
    it('should render all configured routes correctly', () => {
      const routes = [
        { path: '/teams', label: 'Teams' },
        { path: '/cis', label: 'CIS@2.0' },
        { path: '/unified-services', label: 'Unified Services' },
        { path: '/cloud-automation', label: 'Cloud Automation' },
        { path: '/cis/component', labels: ['CIS@2.0', 'Component View'] },
      ] as const;

      routes.forEach(route => {
        const { unmount } = render(
          <TestWrapper pathname={route.path}>
            <Breadcrumbs />
          </TestWrapper>
        );

        if ('labels' in route && route.labels) {
          route.labels.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
          });
        } else if ('label' in route) {
          expect(screen.getByText(route.label)).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Dynamic Routes', () => {
    it('should render team name from API data when available', () => {
      render(
        <TestWrapper pathname="/teams/platform-engineering">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Platform Engineering')).toBeInTheDocument();
    });

    it('should fallback to formatted name when team not found in API data', () => {
      render(
        <TestWrapper pathname="/teams/unknown-team">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Unknown Team')).toBeInTheDocument();
    });

    it('should render component routes with proper hierarchy', () => {
      render(
        <TestWrapper pathname="/cis/component/my-service/api">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('CIS@2.0')).toBeInTheDocument();
      expect(screen.getByText('Component View')).toBeInTheDocument();
      expect(screen.getByText('My Service')).toBeInTheDocument();
      expect(screen.getByText('Api')).toBeInTheDocument(); // Note: actual output is "Api" not "API"
    });

    it('should render team tabs correctly', () => {
      render(
        <TestWrapper pathname="/teams/platform-engineering/components">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Platform Engineering')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty teams data gracefully', () => {
      mockUseTeams.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      render(
        <TestWrapper pathname="/teams/platform-engineering">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Platform Engineering')).toBeInTheDocument();
    });

    it('should handle complex nested routes', () => {
      render(
        <TestWrapper pathname="/unified-services/component/my-service/overview">
          <Breadcrumbs />
        </TestWrapper>
      );

      expect(screen.getByText('Unified Services')).toBeInTheDocument();
      expect(screen.getByText('Component View')).toBeInTheDocument();
      expect(screen.getByText('My Service')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });
});

describe('generateBreadcrumbs Utility Function', () => {
  const mockTeamsData = {
    teams: [
      { id: 'team-1', name: 'platform-engineering', title: 'Platform Engineering' },
      { id: 'team-2', name: 'frontend-team', title: 'Frontend Team' },
    ],
  };

  it('should return empty array for root path and empty segments', () => {
    expect(generateBreadcrumbs('/')).toEqual([]);
    expect(generateBreadcrumbs('')).toEqual([]);
  });

  it('should generate breadcrumbs for configured routes', () => {
    const result = generateBreadcrumbs('/cis/component');
    expect(result).toEqual([
      { label: 'CIS@2.0', path: '/cis', isActive: false },
      { label: 'Component View', path: '/cis/component', isActive: true },
    ]);
  });

  it('should generate breadcrumbs with team data', () => {
    const result = generateBreadcrumbs('/teams/platform-engineering/components', mockTeamsData);
    expect(result).toEqual([
      { label: 'Teams', path: '/teams', isActive: false },
      { label: 'Platform Engineering', path: '/teams/platform-engineering', isActive: false },
      { label: 'Components', path: '/teams/platform-engineering/components', isActive: true },
    ]);
  });

  it('should generate breadcrumbs for component tabs', () => {
    const result = generateBreadcrumbs('/cis/component/my-service/api');
    expect(result).toEqual([
      { label: 'CIS@2.0', path: '/cis', isActive: false },
      { label: 'Component View', path: '/cis/component', isActive: false },
      { label: 'My Service', path: '/cis/component/my-service', isActive: false },
      { label: 'Api', path: '/cis/component/my-service/api', isActive: true }, // Note: actual output is "Api"
    ]);
  });

  it('should handle unknown routes with formatted names', () => {
    const result = generateBreadcrumbs('/unknown/route-name');
    expect(result).toEqual([
      { label: 'Unknown', path: '/unknown', isActive: false },
      { label: 'Route Name', path: '/unknown/route-name', isActive: true },
    ]);
  });

  it('should handle team not found in API data', () => {
    const result = generateBreadcrumbs('/teams/unknown-team', mockTeamsData);
    expect(result).toEqual([
      { label: 'Teams', path: '/teams', isActive: false },
      { label: 'Unknown Team', path: '/teams/unknown-team', isActive: true },
    ]);
  });
});

describe('formatEntityName Utility Function', () => {
  it('should format words correctly', () => {
    expect(formatEntityName('service')).toBe('Service');
    expect(formatEntityName('my-service')).toBe('My Service');
    expect(formatEntityName('platform-engineering-team')).toBe('Platform Engineering Team');
  });

  it('should handle edge cases', () => {
    expect(formatEntityName('')).toBe('');
    expect(formatEntityName('a')).toBe('A');
    expect(formatEntityName('my--service')).toBe('My  Service');
    expect(formatEntityName('-my-service-')).toBe(' My Service ');
    expect(formatEntityName('myService')).toBe('MyService');
  });
});

describe('Tab Name Formatting', () => {
  it('should format common tabs correctly', () => {
    const testCases = [
      { path: '/teams/platform-engineering/overview', expected: 'Overview' },
      { path: '/cis/component/my-service/api', expected: 'Api' }, // Note: actual output
      { path: '/teams/platform-engineering/components', expected: 'Components' },
      { path: '/teams/platform-engineering/jira', expected: 'Jira Issues' },
      { path: '/teams/platform-engineering/schedule', expected: 'On-Call Schedule' },
      { path: '/teams/platform-engineering/custom-tab', expected: 'Custom Tab' },
    ];

    testCases.forEach(({ path, expected }) => {
      const result = generateBreadcrumbs(path);
      const lastItem = result[result.length - 1];
      expect(lastItem.label).toBe(expected);
    });
  });
});

describe('Route Configuration Coverage', () => {
  it('should handle all configured routes', () => {
    const configuredRoutes = [
      '/teams',
      '/cis',
      '/cis/component',
      '/unified-services',
      '/unified-services/component',
      '/cloud-automation',
      '/cloud-automation/component',
      '/self-service',
      '/backstage-services',
      '/ai-arena',
    ];

    configuredRoutes.forEach(route => {
      const result = generateBreadcrumbs(route);
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1].isActive).toBe(true);
    });
  });
});
