import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderNavigation } from '../../../src/components/DeveloperPortalHeader/HeaderNavigation';
import { HeaderTab } from '../../../src/contexts/HeaderNavigationContext';
import { SidebarProvider } from '../../../src/contexts/SidebarContext';

/**
 * HeaderNavigation Component Tests
 * 
 * Tests for the HeaderNavigation component which conditionally renders either
 * HeaderDropdown or HeaderTabsList based on the isDropdown prop.
 */

// Mock DOM methods before all tests to prevent Radix UI errors
beforeAll(() => {
  // Mock scrollIntoView for jsdom environment
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock PointerEvent for better Radix UI compatibility
  if (!global.PointerEvent) {
    class MockPointerEvent extends MouseEvent {
      constructor(type: string, props: PointerEventInit) {
        super(type, props);
      }
    }
    global.PointerEvent = MockPointerEvent as any;
  }
});

// ✅ FIX: Wrapper component to provide SidebarContext and Router
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </MemoryRouter>
  );
}

// Mock data
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

describe('HeaderNavigation Component', () => {
  let mockOnTabClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnTabClick = vi.fn();
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should return null when tabs array is empty', () => {
      const { container } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={[]}
            activeTab={null}
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render HeaderTabsList by default when isDropdown is false', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should render HeaderTabsList when isDropdown prop is not provided', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should render HeaderDropdown when isDropdown is true', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // HeaderDropdown uses a Select component, so we check for the trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should not render both HeaderDropdown and HeaderTabsList simultaneously', () => {
      const tabs = createMockTabs();
      const { container } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // When isDropdown is true, we should see the select combobox
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Should not see the tabs list structure
      const tabButtons = container.querySelectorAll('button[class*="flex items-center"]');
      expect(tabButtons.length).toBeLessThanOrEqual(1); // Only the select trigger
    });
  });

  // ============================================================================
  // PROPS PASSING TESTS
  // ============================================================================

  describe('Props Passing', () => {
    it('should pass correct tabs to HeaderTabsList', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      tabs.forEach((tab) => {
        expect(screen.getByText(tab.label)).toBeInTheDocument();
      });
    });

    it('should pass correct tabs to HeaderDropdown', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // The active tab should be visible
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should pass onTabClick callback to HeaderTabsList', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      const teamBetaButton = screen.getByText('Team Beta');
      fireEvent.click(teamBetaButton);

      expect(mockOnTabClick).toHaveBeenCalledWith('team-2');
    });
  });

  // ============================================================================
  // CONDITIONAL RENDERING TESTS
  // ============================================================================

  describe('Conditional Rendering Logic', () => {
    it('should switch from TabsList to Dropdown when isDropdown changes', () => {
      const tabs = createMockTabs();
      const { rerender, container } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // Should show tabs list (multiple clickable tab buttons)
      const initialButtons = screen.getAllByRole('button');
      expect(initialButtons.length).toBeGreaterThan(1);

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // Should show dropdown (combobox)
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should switch from Dropdown to TabsList when isDropdown changes', () => {
      const tabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // Should show dropdown
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // Should show tabs list (multiple tab buttons)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('should maintain activeTab when switching between modes', () => {
      const tabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-2"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Beta')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-2"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // Team Beta should still be visible as the selected option
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATE MANAGEMENT TESTS
  // ============================================================================

  describe('State Management', () => {
    it('should handle null activeTab in TabsList mode', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab={null}
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // All tabs should be rendered
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should handle null activeTab in Dropdown mode', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab={null}
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      // Should show the dropdown with placeholder
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should update when activeTab changes in TabsList mode', () => {
      const tabs = createMockTabs();
      const { rerender, container } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // Check team-1 is active
      let activeIndicators = container.querySelectorAll('.bg-primary');
      expect(activeIndicators.length).toBeGreaterThan(0);

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-3"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // Team 3 should now be active
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should update when activeTab changes in Dropdown mode', () => {
      const tabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-2"
            onTabClick={mockOnTabClick}
            isDropdown={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    it('should handle tabs array updates', () => {
      const initialTabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={initialTabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();

      const updatedTabs: HeaderTab[] = [
        {
          id: 'team-4',
          label: 'Team Delta',
          icon: '🔥',
        },
      ];

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={updatedTabs}
            activeTab="team-4"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('Team Delta')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle single tab in array', () => {
      const singleTab: HeaderTab[] = [
        {
          id: 'only-tab',
          label: 'Only Tab',
          icon: '🎯',
        },
      ];

      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={singleTab}
            activeTab="only-tab"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
    });

    it('should handle tabs without icons', () => {
      const tabsWithoutIcons: HeaderTab[] = [
        {
          id: 'tab-1',
          label: 'Tab One',
        },
        {
          id: 'tab-2',
          label: 'Tab Two',
        },
      ];

      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabsWithoutIcons}
            activeTab="tab-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Tab One')).toBeInTheDocument();
      expect(screen.getByText('Tab Two')).toBeInTheDocument();
    });

    it('should handle empty string as activeTab', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab=""
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // All tabs should still be rendered
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    it('should handle non-existent activeTab id', () => {
      const tabs = createMockTabs();
      render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="non-existent-id"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      // Component should still render all tabs
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should maintain callback reference across re-renders', () => {
      const tabs = createMockTabs();
      const { rerender } = render(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-1"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <HeaderNavigation
            tabs={tabs}
            activeTab="team-2"
            onTabClick={mockOnTabClick}
            isDropdown={false}
          />
        </TestWrapper>
      );

      const button = screen.getByText('Team Gamma');
      fireEvent.click(button);

      expect(mockOnTabClick).toHaveBeenCalledWith('team-3');
      expect(mockOnTabClick).toHaveBeenCalledTimes(1);
    });
  });
});