import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderNavigation } from '@/components/DeveloperPortalHeader/HeaderNavigation';
import type { HeaderTab } from '@/contexts/HeaderNavigationContext';

// Mock child components
vi.mock('@/components/DeveloperPortalHeader/HeaderDropdown', () => ({
  HeaderDropdown: vi.fn(({ tabs, activeTab, onTabClick }) => (
    <div data-testid="header-dropdown">
      <div data-testid="dropdown-tabs-count">{tabs.length}</div>
      <div data-testid="dropdown-active-tab">{activeTab || 'none'}</div>
      <button onClick={() => onTabClick(tabs[0]?.id)}>Dropdown Click</button>
    </div>
  )),
}));

vi.mock('@/components/DeveloperPortalHeader/HeaderTabsList', () => ({
  HeaderTabsList: vi.fn(({ tabs, activeTab, onTabClick }) => (
    <div data-testid="header-tabs-list">
      <div data-testid="tabs-list-count">{tabs.length}</div>
      <div data-testid="tabs-list-active-tab">{activeTab || 'none'}</div>
      <button onClick={() => onTabClick(tabs[0]?.id)}>Tabs List Click</button>
    </div>
  )),
}));

import { HeaderDropdown } from '@/components/DeveloperPortalHeader/HeaderDropdown';
import { HeaderTabsList } from '@/components/DeveloperPortalHeader/HeaderTabsList';

describe('HeaderNavigation', () => {
  const mockOnTabClick = vi.fn();

  const mockTabs: HeaderTab[] = [
    {
      id: 'tab-1',
      label: 'Tab 1',
    },
    {
      id: 'tab-2',
      label: 'Tab 2',
    },
    {
      id: 'tab-3',
      label: 'Tab 3',
    },
  ];

  const defaultProps = {
    tabs: mockTabs,
    activeTab: 'tab-1',
    onTabClick: mockOnTabClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render HeaderTabsList by default', () => {
      render(<HeaderNavigation {...defaultProps} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();
      expect(screen.queryByTestId('header-dropdown')).not.toBeInTheDocument();
    });

    it('should render HeaderDropdown when isDropdown is true', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(screen.getByTestId('header-dropdown')).toBeInTheDocument();
      expect(screen.queryByTestId('header-tabs-list')).not.toBeInTheDocument();
    });

    it('should render HeaderTabsList when isDropdown is false', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={false} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();
      expect(screen.queryByTestId('header-dropdown')).not.toBeInTheDocument();
    });

    it('should render HeaderTabsList when isDropdown is undefined', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={undefined} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should return null when tabs array is empty', () => {
      const { container } = render(<HeaderNavigation {...defaultProps} tabs={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render HeaderTabsList when tabs are empty', () => {
      render(<HeaderNavigation {...defaultProps} tabs={[]} />);

      expect(screen.queryByTestId('header-tabs-list')).not.toBeInTheDocument();
    });

    it('should not render HeaderDropdown when tabs are empty', () => {
      render(<HeaderNavigation {...defaultProps} tabs={[]} isDropdown={true} />);

      expect(screen.queryByTestId('header-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Props Passing - HeaderTabsList', () => {
    it('should pass tabs prop to HeaderTabsList', () => {
      render(<HeaderNavigation {...defaultProps} />);

      expect(screen.getByTestId('tabs-list-count')).toHaveTextContent('3');
    });

    it('should pass activeTab prop to HeaderTabsList', () => {
      render(<HeaderNavigation {...defaultProps} activeTab="tab-2" />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('tab-2');
    });

    it('should pass null activeTab to HeaderTabsList', () => {
      render(<HeaderNavigation {...defaultProps} activeTab={null} />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('none');
    });

    it('should pass onTabClick prop to HeaderTabsList', async () => {
      const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());

      render(<HeaderNavigation {...defaultProps} />);

      const button = screen.getByText('Tabs List Click');
      await user.click(button);

      expect(mockOnTabClick).toHaveBeenCalledWith('tab-1');
    });

    it('should call HeaderTabsList with correct props', () => {
      render(<HeaderNavigation {...defaultProps} />);

      expect(HeaderTabsList).toHaveBeenCalledWith(
        {
          tabs: mockTabs,
          activeTab: 'tab-1',
          onTabClick: mockOnTabClick,
        },
        expect.anything()
      );
    });
  });

  describe('Props Passing - HeaderDropdown', () => {
    it('should pass tabs prop to HeaderDropdown', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(screen.getByTestId('dropdown-tabs-count')).toHaveTextContent('3');
    });

    it('should pass activeTab prop to HeaderDropdown', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} activeTab="tab-3" />);

      expect(screen.getByTestId('dropdown-active-tab')).toHaveTextContent('tab-3');
    });

    it('should pass null activeTab to HeaderDropdown', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} activeTab={null} />);

      expect(screen.getByTestId('dropdown-active-tab')).toHaveTextContent('none');
    });

    it('should pass onTabClick prop to HeaderDropdown', async () => {
      const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());

      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      const button = screen.getByText('Dropdown Click');
      await user.click(button);

      expect(mockOnTabClick).toHaveBeenCalledWith('tab-1');
    });

    it('should call HeaderDropdown with correct props', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(HeaderDropdown).toHaveBeenCalledWith(
        {
          tabs: mockTabs,
          activeTab: 'tab-1',
          onTabClick: mockOnTabClick,
        },
        expect.anything()
      );
    });
  });

  describe('Conditional Rendering', () => {
    it('should switch from tabs list to dropdown', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} isDropdown={false} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();

      rerender(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(screen.getByTestId('header-dropdown')).toBeInTheDocument();
      expect(screen.queryByTestId('header-tabs-list')).not.toBeInTheDocument();
    });

    it('should switch from dropdown to tabs list', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(screen.getByTestId('header-dropdown')).toBeInTheDocument();

      rerender(<HeaderNavigation {...defaultProps} isDropdown={false} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();
      expect(screen.queryByTestId('header-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single tab', () => {
      const singleTab = [mockTabs[0]];

      render(<HeaderNavigation {...defaultProps} tabs={singleTab} />);

      expect(screen.getByTestId('tabs-list-count')).toHaveTextContent('1');
    });

    it('should handle many tabs', () => {
      const manyTabs = Array.from({ length: 20 }, (_, i) => ({
        id: `tab-${i}`,
        label: `Tab ${i}`,
      }));

      render(<HeaderNavigation {...defaultProps} tabs={manyTabs} />);

      expect(screen.getByTestId('tabs-list-count')).toHaveTextContent('20');
    });

    it('should handle tabs with icons', () => {
      const tabsWithIcons = mockTabs.map(tab => ({
        ...tab,
        icon: <span>Icon</span>,
      }));

      render(<HeaderNavigation {...defaultProps} tabs={tabsWithIcons} />);

      expect(screen.getByTestId('header-tabs-list')).toBeInTheDocument();
    });

    it('should handle changing activeTab', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} activeTab="tab-1" />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('tab-1');

      rerender(<HeaderNavigation {...defaultProps} activeTab="tab-2" />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('tab-2');
    });

    it('should handle changing tabs array', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} />);

      expect(screen.getByTestId('tabs-list-count')).toHaveTextContent('3');

      const newTabs = [mockTabs[0], mockTabs[1]];
      rerender(<HeaderNavigation {...defaultProps} tabs={newTabs} />);

      expect(screen.getByTestId('tabs-list-count')).toHaveTextContent('2');
    });
  });

  describe('Component Calls', () => {
    it('should not call HeaderDropdown when isDropdown is false', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={false} />);

      expect(HeaderDropdown).not.toHaveBeenCalled();
    });

    it('should not call HeaderTabsList when isDropdown is true', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(HeaderTabsList).not.toHaveBeenCalled();
    });

    it('should call HeaderTabsList exactly once by default', () => {
      render(<HeaderNavigation {...defaultProps} />);

      expect(HeaderTabsList).toHaveBeenCalledTimes(1);
    });

    it('should call HeaderDropdown exactly once when isDropdown is true', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(HeaderDropdown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should integrate with HeaderTabsList component', () => {
      render(<HeaderNavigation {...defaultProps} />);

      expect(HeaderTabsList).toHaveBeenCalledWith(
        expect.objectContaining({
          tabs: mockTabs,
          activeTab: 'tab-1',
          onTabClick: mockOnTabClick,
        }),
        expect.anything()
      );
    });

    it('should integrate with HeaderDropdown component', () => {
      render(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(HeaderDropdown).toHaveBeenCalledWith(
        expect.objectContaining({
          tabs: mockTabs,
          activeTab: 'tab-1',
          onTabClick: mockOnTabClick,
        }),
        expect.anything()
      );
    });
  });

  describe('Re-rendering', () => {
    it('should update when props change', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('tab-1');

      rerender(<HeaderNavigation {...defaultProps} activeTab="tab-3" />);

      expect(screen.getByTestId('tabs-list-active-tab')).toHaveTextContent('tab-3');
    });

    it('should handle multiple re-renders', () => {
      const { rerender } = render(<HeaderNavigation {...defaultProps} />);

      rerender(<HeaderNavigation {...defaultProps} isDropdown={true} />);
      rerender(<HeaderNavigation {...defaultProps} isDropdown={false} />);
      rerender(<HeaderNavigation {...defaultProps} isDropdown={true} />);

      expect(screen.getByTestId('header-dropdown')).toBeInTheDocument();
    });
  });
});