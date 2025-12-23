import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { HeaderTabsList } from '../../../src/components/DeveloperPortalHeader/HeaderTabsList';
import { HeaderTab, HeaderNavigationProvider } from '../../../src/contexts/HeaderNavigationContext';
import { ProjectsProvider } from '../../../src/contexts/ProjectsContext';
import { ReactNode } from 'react';

// Mock the useFetchProjects hook
vi.mock('@/hooks/api/useProjects', () => ({
  useFetchProjects: vi.fn(() => ({
    data: [
      { title: 'CIS@2.0', name: 'CIS@2.0' },
      { title: 'Cloud Automation', name: 'Cloud Automation' },
      { title: 'Unified Services', name: 'Unified Services' }
    ],
    isLoading: false,
    error: null
  }))
}));

// Mock the HeaderNavigationContext
const mockSetActiveTab = vi.fn();
vi.mock('@/contexts/HeaderNavigationContext', async () => {
  const actual = await vi.importActual('@/contexts/HeaderNavigationContext');
  return {
    ...actual,
    useHeaderNavigation: () => ({
      tabs: [],
      activeTab: null,
      setTabs: vi.fn(),
      setActiveTab: mockSetActiveTab,
      isDropdown: false,
      setIsDropdown: vi.fn()
    })
  };
});

/**
 * HeaderTabsList Component Tests
 * 
 * Tests for the HeaderTabsList component which displays a horizontal list of tabs
 * with icons and active state indicators in the developer portal header.
 */

// Mock DOM methods before all tests to prevent any potential errors
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

  // Mock PointerEvent for better compatibility
  if (!global.PointerEvent) {
    class MockPointerEvent extends MouseEvent {
      constructor(type: string, props: PointerEventInit) {
        super(type, props);
      }
    }
    global.PointerEvent = MockPointerEvent as any;
  }
});

// Wrapper component to provide SidebarContext and Router
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ProjectsProvider>
          <HeaderNavigationProvider>
            {children}
          </HeaderNavigationProvider>
      </ProjectsProvider>
    </MemoryRouter>
  );
}

// Helper function to render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
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

describe('HeaderTabsList Component', () => {
  let mockOnTabClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnTabClick = vi.fn();
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {

    it('should render all tabs with labels', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should render tabs with icons', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('should render tabs without icons', () => {
      renderWithProvider(
        <HeaderTabsList
          tabs={mockTabsWithoutIcons}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    it('should render each tab as a button', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should apply correct container classes', () => {
      const tabs = createMockTabs();
      const { container } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const wrapper = container.querySelector('.bg-secondary');
      expect(wrapper).toHaveClass('px-4', 'transition-all', 'duration-300', 'h-12');
    });

    it('should render tabs in a flex container', () => {
      const tabs = createMockTabs();
      const { container } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const flexContainer = container.querySelector('.flex.items-center.space-x-6');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass('h-full');
    });
  });

  // ============================================================================
  // ACTIVE TAB STYLING TESTS
  // ============================================================================

  describe('Active Tab Styling', () => {
    it('should apply primary text color to active tab', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const activeButton = screen.getByRole('button', { name: /Team Alpha/i });
      expect(activeButton).toHaveClass('text-primary');
    });

    it('should apply muted text color to inactive tabs', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const inactiveButton = screen.getByRole('button', { name: /Team Beta/i });
      expect(inactiveButton).toHaveClass('text-muted-foreground');
    });

    it('should show active indicator line for active tab', () => {
      const tabs = createMockTabs();
      const { container } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-2"
          onTabClick={mockOnTabClick}
        />
      );

      const activeButton = screen.getByRole('button', { name: /Team Beta/i });
      const indicator = activeButton.querySelector('.absolute.bottom-0');
      
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('h-0.5', 'bg-primary');
    });

    it('should not show active indicator line for inactive tabs', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const inactiveButton = screen.getByRole('button', { name: /Team Beta/i });
      const indicator = inactiveButton.querySelector('.absolute.bottom-0');
      
      expect(indicator).not.toBeInTheDocument();
    });

    it('should handle null activeTab gracefully', () => {
      const tabs = createMockTabs();
      const { container } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab={null}
          onTabClick={mockOnTabClick}
        />
      );

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground');
        const indicator = button.querySelector('.absolute.bottom-0');
        expect(indicator).not.toBeInTheDocument();
      });
    });

    it('should update active state when activeTab changes', () => {
      const tabs = createMockTabs();
      const { rerender } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      let activeButton = screen.getByRole('button', { name: /Team Alpha/i });
      expect(activeButton).toHaveClass('text-primary');

      rerender(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-3"
          onTabClick={mockOnTabClick}
        />
      );

      activeButton = screen.getByRole('button', { name: /Team Gamma/i });
      expect(activeButton).toHaveClass('text-primary');

      const inactiveButton = screen.getByRole('button', { name: /Team Alpha/i });
      expect(inactiveButton).toHaveClass('text-muted-foreground');
    });
  });

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('Interactions', () => {
    it('should call setActiveTab when tab is clicked', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Team Beta/i }));

      expect(mockSetActiveTab).toHaveBeenCalledWith('team-2');
      expect(mockSetActiveTab).toHaveBeenCalledTimes(1);
    });

    it('should call setActiveTab with correct tab id for each tab', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Team Beta/i }));
      expect(mockSetActiveTab).toHaveBeenCalledWith('team-2');

      fireEvent.click(screen.getByRole('button', { name: /Team Gamma/i }));
      expect(mockSetActiveTab).toHaveBeenCalledWith('team-3');
    });

    it('should allow clicking the active tab', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Team Alpha/i }));

      expect(mockSetActiveTab).toHaveBeenCalledWith('team-1');
    });

    it('should handle multiple tab clicks', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Team Beta/i }));
      fireEvent.click(screen.getByRole('button', { name: /Team Gamma/i }));
      fireEvent.click(screen.getByRole('button', { name: /Team Alpha/i }));

      expect(mockSetActiveTab).toHaveBeenCalledTimes(3);
      expect(mockSetActiveTab).toHaveBeenNthCalledWith(1, 'team-2');
      expect(mockSetActiveTab).toHaveBeenNthCalledWith(2, 'team-3');
      expect(mockSetActiveTab).toHaveBeenNthCalledWith(3, 'team-1');
    });

    it('should not call setActiveTab when button is not clicked', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TAB STRUCTURE TESTS
  // ============================================================================

  describe('Tab Structure', () => {
    it('should render icon and label together for tabs with icons', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const button = screen.getByRole('button', { name: /Team Alpha/i });
      const buttonElement = within(button);
      
      expect(buttonElement.getByText('🚀')).toBeInTheDocument();
      expect(buttonElement.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('should not render icon span when tab has no icon', () => {
      renderWithProvider(
        <HeaderTabsList
          tabs={mockTabsWithoutIcons}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const button = screen.getByRole('button', { name: /Team Alpha/i });
      
      // The only span should be the one containing the label
      const spans = button.querySelectorAll('span');
      expect(spans.length).toBe(1);
      expect(spans[0]).toHaveTextContent('Team Alpha');
    });

  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle tabs with special characters in labels', () => {
      const specialCharTabs: HeaderTab[] = [
        {
          id: 'tab-1',
          label: 'Team A & B (Test)',
          icon: '🔥',
        },
        {
          id: 'tab-2',
          label: 'Team <Dev>',
          icon: '💻',
        },
      ];

      renderWithProvider(
        <HeaderTabsList
          tabs={specialCharTabs}
          activeTab="tab-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('Team A & B (Test)')).toBeInTheDocument();
      expect(screen.getByText('Team <Dev>')).toBeInTheDocument();
    });

    it('should handle empty string as activeTab', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab=""
          onTabClick={mockOnTabClick}
        />
      );

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground');
      });
    });

    it('should handle non-existent activeTab id', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="non-existent-id"
          onTabClick={mockOnTabClick}
        />
      );

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground');
        const indicator = button.querySelector('.absolute.bottom-0');
        expect(indicator).not.toBeInTheDocument();
      });
    });

    it('should handle tabs with undefined icon property', () => {
      const tabsWithUndefinedIcon: HeaderTab[] = [
        {
          id: 'tab-1',
          label: 'Tab Without Icon',
          icon: undefined,
        },
      ];

      renderWithProvider(
        <HeaderTabsList
          tabs={tabsWithUndefinedIcon}
          activeTab="tab-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('Tab Without Icon')).toBeInTheDocument();
    });

    it('should handle large number of tabs', () => {
      const manyTabs: HeaderTab[] = Array.from({ length: 20 }, (_, i) => ({
        id: `tab-${i}`,
        label: `Tab ${i}`,
        icon: '🎯',
      }));

      renderWithProvider(
        <HeaderTabsList
          tabs={manyTabs}
          activeTab="tab-10"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(20);
      expect(screen.getByText('Tab 10')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATE UPDATE TESTS
  // ============================================================================

  describe('State Updates', () => {
    it('should update when tabs array changes', () => {
      const initialTabs = createMockTabs();
      const { rerender } = renderWithProvider(
        <HeaderTabsList
          tabs={initialTabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();

      const newTabs: HeaderTab[] = [
        {
          id: 'new-tab',
          label: 'New Tab',
          icon: '🔥',
        },
      ];

      rerender(
        <HeaderTabsList
          tabs={newTabs}
          activeTab="new-tab"
          onTabClick={mockOnTabClick}
        />
      );

      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('New Tab')).toBeInTheDocument();
    });

    it('should maintain callback reference across re-renders', () => {
      const tabs = createMockTabs();
      const { rerender } = renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      rerender(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-2"
          onTabClick={mockOnTabClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Team Beta/i }));
      expect(mockSetActiveTab).toHaveBeenCalledWith('team-2');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {

    it('should be keyboard navigable', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const button = screen.getByRole('button', { name: /Team Alpha/i });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should support Enter key activation', () => {
      const tabs = createMockTabs();
      renderWithProvider(
        <HeaderTabsList
          tabs={tabs}
          activeTab="team-1"
          onTabClick={mockOnTabClick}
        />
      );

      const button = screen.getByRole('button', { name: /Team Beta/i });
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button);

      expect(mockSetActiveTab).toHaveBeenCalledWith('team-2');
    });
  });
});
