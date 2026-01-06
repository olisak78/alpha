import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewSwitcher } from '@/components/ViewSwitcher';

describe('ViewSwitcher', () => {
  const mockOnViewChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render both view buttons', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');

      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });

    it('should render container with correct styling', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex.items-center');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('gap-1', 'border', 'rounded-md', 'p-1', 'bg-muted/50');
    });

    it('should render both buttons as button elements', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render buttons with correct size and styling', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');

      expect(gridButton).toHaveClass('h-8', 'px-3');
      expect(tableButton).toHaveClass('h-8', 'px-3');
    });
  });

  describe('Grid View Active State', () => {
    it('should apply default variant to grid button when view is grid', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');
      
      // Grid button should be styled differently from table button
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });

    it('should apply ghost variant to table button when view is grid', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');
      
      // Both buttons should be present and functional
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });

    it('should render grid icon', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const icon = gridButton.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Table View Active State', () => {
    it('should apply default variant to table button when view is table', () => {
      render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      const gridButton = screen.getByTitle('Grid view');
      
      // Table button should be styled differently from grid button
      expect(tableButton).toBeInTheDocument();
      expect(gridButton).toBeInTheDocument();
    });

    it('should apply ghost variant to grid button when view is table', () => {
      render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');
      
      // Both buttons should be present and functional
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });

    it('should render table icon', () => {
      const { container } = render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      const icon = tableButton.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Grid Button Interactions', () => {
    it('should call onViewChange with grid when grid button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      await user.click(gridButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('grid');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should call onViewChange with grid even when already in grid view', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      await user.click(gridButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('grid');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on grid button', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      
      await user.click(gridButton);
      await user.click(gridButton);
      await user.click(gridButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(3);
      expect(mockOnViewChange).toHaveBeenCalledWith('grid');
    });
  });

  describe('Table Button Interactions', () => {
    it('should call onViewChange with table when table button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      await user.click(tableButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('table');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should call onViewChange with table even when already in table view', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      await user.click(tableButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('table');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on table button', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      
      await user.click(tableButton);
      await user.click(tableButton);
      await user.click(tableButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(3);
      expect(mockOnViewChange).toHaveBeenCalledWith('table');
    });
  });

  describe('View Switching', () => {
    it('should switch between grid and table views', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');

      // Switch to table
      await user.click(tableButton);
      expect(mockOnViewChange).toHaveBeenCalledWith('table');

      // Switch back to grid
      await user.click(gridButton);
      expect(mockOnViewChange).toHaveBeenCalledWith('grid');

      expect(mockOnViewChange).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid view switching', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const tableButton = screen.getByTitle('Table view');

      await user.click(tableButton);
      await user.click(gridButton);
      await user.click(tableButton);
      await user.click(gridButton);
      await user.click(tableButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(5);
      
      // Verify the order of calls
      expect(mockOnViewChange).toHaveBeenNthCalledWith(1, 'table');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(2, 'grid');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(3, 'table');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(4, 'grid');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(5, 'table');
    });

    it('should update button states when view prop changes', () => {
      const { rerender } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      let gridButton = screen.getByTitle('Grid view');
      let tableButton = screen.getByTitle('Table view');

      // Both buttons should be present
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();

      // Switch to table
      rerender(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      gridButton = screen.getByTitle('Grid view');
      tableButton = screen.getByTitle('Table view');

      // Both buttons should still be present
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render both icons', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(2);
    });

    it('should render icons with correct size', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('h-4', 'w-4');
      });
    });

    it('should render grid icon in grid button', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      const icon = gridButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('should render table icon in table button', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      const icon = tableButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have title attribute for grid button', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const gridButton = screen.getByTitle('Grid view');
      expect(gridButton).toHaveAttribute('title', 'Grid view');
    });

    it('should have title attribute for table button', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      expect(tableButton).toHaveAttribute('title', 'Table view');
    });

    it('should have accessible button roles', () => {
      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      // Tab to first button (grid)
      await user.tab();
      const gridButton = screen.getByTitle('Grid view');
      expect(gridButton).toHaveFocus();

      // Tab to second button (table)
      await user.tab();
      const tableButton = screen.getByTitle('Table view');
      expect(tableButton).toHaveFocus();
    });

    it('should support keyboard activation with Enter', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      tableButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnViewChange).toHaveBeenCalledWith('table');
    });

    it('should support keyboard activation with Space', async () => {
      const user = userEvent.setup();

      render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      tableButton.focus();

      await user.keyboard(' ');

      expect(mockOnViewChange).toHaveBeenCalledWith('table');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a typical view switching workflow', async () => {
      const user = userEvent.setup();
      let currentView: 'grid' | 'table' = 'grid';
      
      const handleViewChange = vi.fn((view: 'grid' | 'table') => {
        currentView = view;
      });

      const { rerender } = render(
        <ViewSwitcher view={currentView} onViewChange={handleViewChange} />
      );

      // Initially grid is active
      let gridButton = screen.getByTitle('Grid view');
      let tableButton = screen.getByTitle('Table view');
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();

      // Switch to table
      await user.click(tableButton);
      expect(handleViewChange).toHaveBeenCalledWith('table');
      
      // Update component with new view
      rerender(
        <ViewSwitcher view="table" onViewChange={handleViewChange} />
      );

      gridButton = screen.getByTitle('Grid view');
      tableButton = screen.getByTitle('Table view');
      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();

      // Switch back to grid
      await user.click(gridButton);
      expect(handleViewChange).toHaveBeenCalledWith('grid');
    });

    it('should maintain visual state across re-renders', () => {
      const { rerender } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      let gridButton = screen.getByTitle('Grid view');
      expect(gridButton).not.toHaveClass('ghost');

      // Re-render with same props
      rerender(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      gridButton = screen.getByTitle('Grid view');
      expect(gridButton).not.toHaveClass('ghost');
    });
  });

  describe('Button State Persistence', () => {
    it('should maintain button state between interactions', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const tableButton = screen.getByTitle('Table view');
      await user.click(tableButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('table');

      // Simulate parent updating view
      rerender(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      // Table button should now be active
      const updatedTableButton = screen.getByTitle('Table view');
      expect(updatedTableButton).not.toHaveClass('ghost');
    });

    it('should reflect current view after multiple changes', () => {
      const { rerender } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      // Change to table
      rerender(
        <ViewSwitcher view="table" onViewChange={mockOnViewChange} />
      );

      let tableButton = screen.getByTitle('Table view');
      expect(tableButton).not.toHaveClass('ghost');

      // Change back to grid
      rerender(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      let gridButton = screen.getByTitle('Grid view');
      expect(gridButton).not.toHaveClass('ghost');
    });
  });

  describe('Container Layout', () => {
    it('should render buttons in a flex container', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('items-center');
    });

    it('should have correct gap between buttons', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('gap-1');
    });

    it('should have border and rounded corners', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('border', 'rounded-md');
    });

    it('should have padding', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('p-1');
    });

    it('should have muted background', () => {
      const { container } = render(
        <ViewSwitcher view="grid" onViewChange={mockOnViewChange} />
      );

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('bg-muted/50');
    });
  });
});