import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { HeaderTabsList } from '@/components/DeveloperPortalHeader/HeaderTabsList';
import type { HeaderTab } from '@/contexts/HeaderNavigationContext';
import { MemoryRouter } from 'react-router-dom';

// Mock contexts
vi.mock('@/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import { useNavigate, useLocation } from 'react-router-dom';

describe('HeaderTabsList', () => {
  const mockSetActiveTab = vi.fn();
  const mockNavigate = vi.fn();
  const mockOnTabClick = vi.fn();

  const mockTabs: HeaderTab[] = [
    {
      id: 'team-alpha',
      label: 'Team Alpha',
    },
    {
      id: 'team-beta',
      label: 'Team Beta',
    },
    {
      id: 'team-gamma',
      label: 'Team Gamma',
      icon: <span data-testid="gamma-icon">Icon</span>,
    },
  ];

  const defaultProps = {
    tabs: mockTabs,
    activeTab: 'team-alpha',
    onTabClick: mockOnTabClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useHeaderNavigation).mockReturnValue({
      setActiveTab: mockSetActiveTab,
      tabs: [],
      activeTab: null,
      isDropdown: false,
      setIsDropdown: vi.fn(),
      setTabs: vi.fn(),
    });

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    vi.mocked(useLocation).mockReturnValue({
      pathname: '/home',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render all tabs', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should render tabs as buttons', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render tab icons when provided', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.getByTestId('gamma-icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const alphaButton = screen.getByText('Team Alpha').closest('button');
      const icon = alphaButton?.querySelector('[data-testid]');
      expect(icon).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should return null when tabs array is empty', () => {
      const { container } = renderWithRouter(
        <HeaderTabsList {...defaultProps} tabs={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render any buttons when tabs are empty', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} tabs={[]} />);

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Active Tab', () => {
    it('should highlight active tab', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab="team-alpha" />);

      const alphaButton = screen.getByText('Team Alpha').closest('button');
      expect(alphaButton).toHaveClass('text-primary');
    });

    it('should show underline indicator on active tab', () => {
      const { container } = renderWithRouter(
        <HeaderTabsList {...defaultProps} activeTab="team-alpha" />
      );

      const alphaButton = screen.getByText('Team Alpha').closest('button');
      const indicator = alphaButton?.querySelector('.bg-primary');
      expect(indicator).toBeInTheDocument();
    });

    it('should not highlight inactive tabs', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab="team-alpha" />);

      const betaButton = screen.getByText('Team Beta').closest('button');
      expect(betaButton).toHaveClass('text-muted-foreground');
    });

    it('should not show underline on inactive tabs', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab="team-alpha" />);

      const betaButton = screen.getByText('Team Beta').closest('button');
      const indicator = betaButton?.querySelector('.bg-primary');
      expect(indicator).toBeNull();
    });

    it('should handle null activeTab', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab={null} />);

      const alphaButton = screen.getByText('Team Alpha').closest('button');
      expect(alphaButton).toHaveClass('text-muted-foreground');
    });
  });

  describe('Tab Click Handling', () => {
    it('should call setActiveTab when tab is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const betaButton = screen.getByText('Team Beta');
      await user.click(betaButton);

      expect(mockSetActiveTab).toHaveBeenCalledWith('team-beta');
    });

    it('should call setActiveTab for each tab clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      await user.click(screen.getByText('Team Beta'));
      await user.click(screen.getByText('Team Gamma'));

      expect(mockSetActiveTab).toHaveBeenCalledTimes(2);
      expect(mockSetActiveTab).toHaveBeenNthCalledWith(1, 'team-beta');
      expect(mockSetActiveTab).toHaveBeenNthCalledWith(2, 'team-gamma');
    });

    it('should handle clicking the already active tab', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab="team-alpha" />);

      await user.click(screen.getByText('Team Alpha'));

      expect(mockSetActiveTab).toHaveBeenCalledWith('team-alpha');
    });
  });

  describe('Teams Page - Common Tabs', () => {
    beforeEach(() => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha/overview',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });
    });

    it('should render common tabs on Teams page', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
      expect(screen.getByText('Jira Issues')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
    });

    it('should highlight active common tab', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha/components',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const componentsButton = screen.getByText('Components').closest('button');
      expect(componentsButton).toHaveClass('text-primary');
    });

    it('should show underline on active common tab', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha/jira',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const jiraButton = screen.getByText('Jira Issues').closest('button');
      const indicator = jiraButton?.querySelector('.bg-primary');
      expect(indicator).toBeInTheDocument();
    });

    it('should default to overview tab when no common tab specified', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const overviewButton = screen.getByText('Overview').closest('button');
      expect(overviewButton).toHaveClass('text-primary');
    });

    it('should navigate to common tab when clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      await user.click(screen.getByText('Components'));

      expect(mockNavigate).toHaveBeenCalledWith('/teams/team-alpha/components');
    });

    it('should navigate to different common tabs', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      await user.click(screen.getByText('Jira Issues'));
      await user.click(screen.getByText('Docs'));

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/teams/team-alpha/jira');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/teams/team-alpha/docs');
    });

    it('should not show common tabs on non-Teams pages', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/home',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Components')).not.toBeInTheDocument();
    });

    it('should not show common tabs on Teams index page', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct height to tab container', () => {
      const { container } = renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const tabContainer = container.querySelector('.h-12');
      expect(tabContainer).toBeInTheDocument();
    });

    it('should apply secondary background color', () => {
      const { container } = renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const tabContainer = container.querySelector('.bg-secondary');
      expect(tabContainer).toBeInTheDocument();
    });

    it('should apply hover styles to inactive tabs', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} activeTab="team-alpha" />);

      const betaButton = screen.getByText('Team Beta').closest('button');
      expect(betaButton).toHaveClass('hover:text-foreground');
    });

    it('should apply transition classes', () => {
      const { container } = renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const tabContainer = container.querySelector('.transition-all');
      expect(tabContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle tabs with very long labels', () => {
      const longLabelTabs = [
        {
          id: 'long-tab',
          label: 'This is a very long tab label that might cause layout issues',
        },
      ];

      renderWithRouter(<HeaderTabsList {...defaultProps} tabs={longLabelTabs} />);

      expect(screen.getByText('This is a very long tab label that might cause layout issues')).toBeInTheDocument();
    });

    it('should handle single tab', () => {
      const singleTab = [mockTabs[0]];

      renderWithRouter(<HeaderTabsList {...defaultProps} tabs={singleTab} />);

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Team Beta')).not.toBeInTheDocument();
    });

    it('should handle many tabs', () => {
      const manyTabs = Array.from({ length: 20 }, (_, i) => ({
        id: `tab-${i}`,
        label: `Tab ${i}`,
      }));

      renderWithRouter(<HeaderTabsList {...defaultProps} tabs={manyTabs} />);

      expect(screen.getByText('Tab 0')).toBeInTheDocument();
      expect(screen.getByText('Tab 19')).toBeInTheDocument();
    });

    it('should handle tabs with special characters in labels', () => {
      const specialTabs = [
        {
          id: 'special',
          label: 'Team & Services <Test>',
        },
      ];

      renderWithRouter(<HeaderTabsList {...defaultProps} tabs={specialTabs} />);

      expect(screen.getByText('Team & Services <Test>')).toBeInTheDocument();
    });

    it('should handle Teams page with trailing slash', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha/overview/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should handle Teams page with nested paths', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/teams/team-alpha/overview/details',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const overviewButton = screen.getByText('Overview').closest('button');
      expect(overviewButton).toHaveClass('text-primary');
    });
  });

  describe('Integration', () => {
    it('should integrate with HeaderNavigationContext', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(useHeaderNavigation).toHaveBeenCalled();
    });

    it('should integrate with react-router', () => {
      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      expect(useLocation).toHaveBeenCalled();
      expect(useNavigate).toHaveBeenCalled();
    });

    it('should use cn utility for className composition', async () => {
      const user = userEvent.setup();

      renderWithRouter(<HeaderTabsList {...defaultProps} />);

      const button = screen.getByText('Team Alpha').closest('button');
      expect(button).toBeInTheDocument();
    });
  });
});