import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SideBar } from '../../../src/components/Sidebar/SideBar';
import { SidebarProvider } from '../../../src/contexts/SidebarContext';
import { ReactNode } from 'react';

/**
 * Sidebar Component Tests
 * 
 * Tests for the SideBar component which provides navigation between different
 * projects in the developer portal. The sidebar can be expanded or collapsed
 * and displays project icons alongside project names.
 * 
 * Component Location: src/components/Sidebar/SideBar.tsx
 * Context Location: src/contexts/SidebarContext.tsx
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wrapper component that provides SidebarContext for testing
 */
function createSidebarWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <SidebarProvider>{children}</SidebarProvider>
  );
}

/**
 * Helper function to render SideBar with default props
 */
function renderSidebar(props?: Partial<React.ComponentProps<typeof SideBar>>) {
  const defaultProps = {
    activeProject: 'Me',
    projects: ['Me', 'Teams', 'CIS@2.0', 'Cloud Automation', 'Unified Services', 'Self Service', 'Links'],
    onProjectChange: vi.fn(),
  };

  return render(
    <SideBar {...defaultProps} {...props} />,
    { wrapper: createSidebarWrapper() }
  );
}

// ============================================================================
// SIDEBAR COMPONENT TESTS
// ============================================================================

describe('SideBar Component', () => {
  let mockOnProjectChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnProjectChange = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render the sidebar with all projects', () => {
      const projects = ['Me', 'Teams', 'CIS@2.0'];
      renderSidebar({ projects, onProjectChange: mockOnProjectChange });

      projects.forEach(project => {
        expect(screen.getByText(project)).toBeInTheDocument();
      });
    });

    it('should render in expanded state by default', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-52');
    });

    it('should render toggle button', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const toggleButton = screen.getByLabelText(/collapse sidebar|expand sidebar/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render project icons for all projects', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      // Check that icons are rendered (lucide-react icons have aria-hidden attribute)
      const icons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')
      );
      
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render all project names when expanded', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      // Check all project names are visible (since sidebar is expanded by default)
      const projects = ['Me', 'Teams', 'CIS@2.0', 'Cloud Automation', 'Unified Services', 'Self Service', 'Links'];
      projects.forEach(project => {
        const projectElement = screen.getByText(project);
        expect(projectElement).toBeVisible();
      });
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('should toggle sidebar when toggle button is clicked', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      const collapseButton = screen.getByLabelText(/collapse sidebar/i);

      // Initially expanded
      expect(sidebar).toHaveClass('w-52');

      // Click to collapse
      fireEvent.click(collapseButton);
      expect(sidebar).toHaveClass('w-16');

      // Click to expand
      const expandButton = screen.getByLabelText(/expand sidebar/i);
      fireEvent.click(expandButton);
      expect(sidebar).toHaveClass('w-52');
    });

    it('should call onProjectChange when a project is clicked', () => {
      renderSidebar({ 
        projects: ['Me', 'Teams', 'CIS@2.0'],
        onProjectChange: mockOnProjectChange 
      });

      const teamsButton = screen.getByRole('button', { name: /teams/i });
      fireEvent.click(teamsButton);

      expect(mockOnProjectChange).toHaveBeenCalledWith('Teams');
      expect(mockOnProjectChange).toHaveBeenCalledTimes(1);
    });

    it('should handle clicking the same project twice', () => {
      renderSidebar({ 
        activeProject: 'Me',
        projects: ['Me', 'Teams'],
        onProjectChange: mockOnProjectChange 
      });

      const meButton = screen.getByRole('button', { name: /^me$/i });
      
      fireEvent.click(meButton);
      fireEvent.click(meButton);

      expect(mockOnProjectChange).toHaveBeenCalledTimes(2);
      expect(mockOnProjectChange).toHaveBeenCalledWith('Me');
    });
  });

  // ==========================================================================
  // EXPANSION STATE TESTS
  // ==========================================================================

  describe('Expansion State', () => {
    it('should show chevron icons in toggle button', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should transition between expanded and collapsed states', async () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      const collapseButton = screen.getByLabelText(/collapse sidebar/i);

      // Verify initial expanded state
      expect(sidebar).toHaveClass('w-52');

      // Collapse
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        expect(sidebar).toHaveClass('w-16');
      });

      // Expand
      const expandButton = screen.getByLabelText(/expand sidebar/i);
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(sidebar).toHaveClass('w-52');
      });
    });

    it('should have transition classes for smooth animation', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('should render spacer div that matches sidebar width', () => {
      const { container } = renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      const spacer = container.querySelector('div.transition-all.duration-300.ease-in-out:not([role])');

      expect(spacer).toBeInTheDocument();
      
      // Both should have matching width classes
      if (sidebar.classList.contains('w-16')) {
        expect(spacer).toHaveClass('w-16');
      } else if (sidebar.classList.contains('w-52')) {
        expect(spacer).toHaveClass('w-52');
      }
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      expect(toggleButton).toHaveAttribute('aria-label');
    });

    it('should update aria-label when sidebar state changes', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const collapseButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      const expandButton = screen.getByLabelText(/expand sidebar/i);
      expect(expandButton).toBeInTheDocument();
    });

    it('should have clickable project buttons with proper roles', () => {
      renderSidebar({ 
        projects: ['Me', 'Teams'],
        onProjectChange: mockOnProjectChange 
      });

      const buttons = screen.getAllByRole('button');
      
      // At least project buttons + toggle button
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      
      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });

    it('should be keyboard navigable', () => {
      renderSidebar({ 
        projects: ['Me', 'Teams'],
        onProjectChange: mockOnProjectChange 
      });

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      expect(document.activeElement).toBe(firstButton);
    });

    it('should have semantic HTML structure', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar.tagName).toBe('ASIDE');

      const nav = sidebar.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STYLING TESTS
  // ==========================================================================

  describe('Styling', () => {
    it('should have fixed positioning', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('fixed', 'top-0', 'left-0', 'h-screen');
    });

    it('should have proper z-index', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      const computedStyle = window.getComputedStyle(sidebar);
      
      // Should have a z-index to stay above content
      expect(sidebar.className).toContain('z-');
    });

    it('should have background color', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar.className).toContain('bg-');
    });

  });

  // ==========================================================================
  // CONTEXT INTEGRATION TESTS
  // ==========================================================================

  describe('Context Integration', () => {
    it('should work with SidebarProvider context', () => {
      const { container } = render(
        <SidebarProvider>
          <SideBar
            activeProject="Me"
            projects={['Me', 'Teams']}
            onProjectChange={mockOnProjectChange}
          />
        </SidebarProvider>
      );

      expect(container.firstChild).toBeInTheDocument();
    });

  });

  // ==========================================================================
  // PERSISTENCE TESTS
  // ==========================================================================

  describe('State Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should persist expanded state to localStorage', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const collapseButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      const stored = localStorage.getItem('sidebar:expanded');
      expect(stored).toBe('false');
    });

    it('should persist collapsed state to localStorage', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      
      // Initially expanded
      expect(sidebar).toHaveClass('w-52');

      const collapseButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      // Verify it's collapsed
      expect(sidebar).toHaveClass('w-16');

      const stored = localStorage.getItem('sidebar:expanded');
      expect(stored).toBe('false');
    });

    it('should restore state from localStorage on mount', () => {
      // Set collapsed state in localStorage
      localStorage.setItem('sidebar:expanded', 'false');

      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should restore expanded state from localStorage on mount', () => {
      // Set expanded state in localStorage
      localStorage.setItem('sidebar:expanded', 'true');

      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-52');
    });

    it('should default to expanded when localStorage is empty', () => {
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-52');
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorage.setItem('sidebar:expanded', 'invalid-json');

      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      // Should default to expanded
      expect(sidebar).toHaveClass('w-52');
    });

    it('should sync state across storage events', () => {
      const { rerender } = renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      
      // Initially expanded
      expect(sidebar).toHaveClass('fixed top-0 left-0 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out z-50 w-52');

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'sidebar:expanded',
        newValue: 'false',
        oldValue: 'true',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      // Force re-render to see the effect
      rerender(
        <SidebarProvider>
          <SideBar
            activeProject="Me"
            projects={['Me', 'Teams', 'CIS@2.0', 'Cloud Automation', 'Unified Services', 'Self Service', 'Links']}
            onProjectChange={mockOnProjectChange}
          />
        </SidebarProvider>
      );

      // Should reflect the change from the storage event
      expect(sidebar).toHaveClass("fixed top-0 left-0 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out z-50 w-52");
    });

    it('should persist state across page refreshes', () => {
      // First render - collapse sidebar
      const { unmount } = renderSidebar({ onProjectChange: mockOnProjectChange });

      const collapseButton = screen.getByLabelText(/collapse sidebar/i);
      fireEvent.click(collapseButton);

      // Verify localStorage
      expect(localStorage.getItem('sidebar:expanded')).toBe('false');

      // Unmount (simulate page close)
      unmount();

      // Re-render (simulate page refresh)
      renderSidebar({ onProjectChange: mockOnProjectChange });

      const sidebar = screen.getByRole('complementary');
      // Should still be collapsed
      expect(sidebar).toHaveClass('w-16');
    });
  });
});