import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderDropdown } from '../../../src/components/DeveloperPortalHeader/HeaderDropdown';
import { HeaderTab } from '../../../src/contexts/HeaderNavigationContext';

/**
 * HeaderDropdown Component Tests
 * 
 * Tests for the HeaderDropdown component which displays a select dropdown
 * for navigating between tabs/teams in the developer portal header.
 */

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  if (!global.PointerEvent) {
    class MockPointerEvent extends MouseEvent {
      constructor(type: string, props: PointerEventInit) {
        super(type, props);
      }
    }
    global.PointerEvent = MockPointerEvent as any;
  }
});

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
        {children}
    </MemoryRouter>
  );
}

const createMockTabs = (): HeaderTab[] => [
  {
    id: 'team-1',
    label: 'Team Alpha',
    icon: '🚀',
  },
  {
    id: 'team-2',
    label: 'Team Beta',
    icon: '⚡',
  },
  {
    id: 'team-3',
    label: 'Team Gamma',
    icon: '🎯',
  },
];

const mockTabsWithoutIcons: HeaderTab[] = [
  {
    id: 'team-1',
    label: 'Team Alpha',
  },
  {
    id: 'team-2',
    label: 'Team Beta',
  },
];

describe('HeaderDropdown Component', () => {
  let mockOnTabClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnTabClick = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the dropdown with default label', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            label="Select Team:"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select Team:')).toBeInTheDocument();
    });

    it('should render the active tab label', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should render active tab with icon', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should render without icon when tab has no icon', () => {
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={mockTabsWithoutIcons}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should return null when tabs array is empty', () => {
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={[]}
            activeTab={null}
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should apply correct background and layout classes', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const dropdown = container.querySelector('.bg-secondary');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveClass('px-4', 'py-3', 'flex', 'items-center');
    });

    it('should apply custom width class', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            width="w-96"
          />
        </TestWrapper>
      );

      const trigger = container.querySelector('.w-96');
      expect(trigger).toBeInTheDocument();
    });

    it('should apply default width class', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = container.querySelector('.w-64');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Team Beta')).toBeInTheDocument();
          expect(screen.getByText('Team Gamma')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should call onTabClick when an option is selected', async () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(
        async () => {
          const option = screen.getByText('Team Beta');
          fireEvent.click(option);
          await new Promise(resolve => setTimeout(resolve, 100));
        },
        { timeout: 3000 }
      );

      expect(mockOnTabClick).toHaveBeenCalledWith('team-2');
    });

    it('should call onTabClick with correct tab id', async () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(
        async () => {
          const option = screen.getByText('Team Gamma');
          fireEvent.click(option);
          await new Promise(resolve => setTimeout(resolve, 100));
        },
        { timeout: 3000 }
      );

      expect(mockOnTabClick).toHaveBeenCalledWith('team-3');
      expect(mockOnTabClick).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid tab switching', async () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      
      fireEvent.click(trigger);
      await waitFor(
        async () => {
          fireEvent.click(screen.getByText('Team Beta'));
          await new Promise(resolve => setTimeout(resolve, 100));
        },
        { timeout: 3000 }
      );

      expect(mockOnTabClick).toHaveBeenCalledWith('team-2');
    });

    it('should handle tabs array being updated', () => {
      const initialTabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={initialTabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();

      const updatedTabs: HeaderTab[] = [
        {
          id: 'team-4',
          label: 'Team Delta',
          icon: '🔥',
        },
      ];

      rerender(
        <TestWrapper>
          <HeaderDropdown
            tabs={updatedTabs}
            activeTab="team-4"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Delta')).toBeInTheDocument();
    });

    it('should handle undefined icon gracefully', () => {
      const tabsWithUndefinedIcon: HeaderTab[] = [
        {
          id: 'team-1',
          label: 'Team Without Icon',
          icon: undefined,
        },
      ];

      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabsWithUndefinedIcon}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Without Icon')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply transition classes', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const dropdown = container.querySelector('.transition-all.duration-300');
      expect(dropdown).toBeInTheDocument();
    });

    it('should apply spacing classes correctly', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.space-x-4');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply padding classes', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const dropdown = container.querySelector('.px-4');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should use custom placeholder when provided', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab={null}
            onTabClick={mockOnTabClick}
            placeholder="Choose your team"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Choose your team')).toBeInTheDocument();
    });

    it('should use default placeholder when not provided', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab={null}
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select a team')).toBeInTheDocument();
    });

    it('should handle single tab in array', () => {
      const singleTab: HeaderTab[] = [
        {
          id: 'team-1',
          label: 'Single Team',
          icon: '🎯',
        },
      ];

      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={singleTab}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Single Team')).toBeInTheDocument();
    });

    it('should handle tabs with long labels', () => {
      const tabsWithLongLabels: HeaderTab[] = [
        {
          id: 'team-1',
          label: 'Team with a Very Long Name That Might Overflow',
          icon: '🚀',
        },
      ];

      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabsWithLongLabels}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team with a Very Long Name That Might Overflow')).toBeInTheDocument();
    });

    it('should handle tabs with special characters in labels', () => {
      const tabsWithSpecialChars: HeaderTab[] = [
        {
          id: 'team-1',
          label: 'Team A & B (Test)',
          icon: '🚀',
        },
      ];

      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabsWithSpecialChars}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team A & B (Test)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for combobox', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('combobox');
      
      trigger.focus();
      expect(trigger).toHaveFocus();
    });

    it('should have proper semantic HTML structure', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderDropdown
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      const dropdown = container.querySelector('.flex.items-center.space-x-4');
      expect(dropdown).toBeInTheDocument();
    });
  });
});