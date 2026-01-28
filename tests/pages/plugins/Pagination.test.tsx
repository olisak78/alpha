import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Pagination from '@/plugins/components/Pagination';

// Mock the UI components and icons
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button
      data-testid="pagination-button"
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left-icon">←</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">→</span>,
}));

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render pagination controls with all elements', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('should render Previous button with ChevronLeft icon', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous').closest('button');
      expect(previousButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    });

    it('should render Next button with ChevronRight icon', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('should render current page information', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
    });

    it('should apply correct button variants and sizes', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const buttons = screen.getAllByTestId('pagination-button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-variant', 'outline');
        expect(button).toHaveAttribute('data-size', 'sm');
      });
    });
  });

  describe('Early Return Behavior', () => {
    it('should return null when totalPages is 1', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when totalPages is 0', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when totalPages is negative', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={-1}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when totalPages is 2', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={2}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Button Click Handlers', () => {
    it('should call onPageChange with currentPage - 1 when Previous is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it('should call onPageChange with currentPage + 1 when Next is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onPageChange when Previous is clicked while disabled', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when Next is clicked while disabled', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Previous Button State', () => {
    it('should disable Previous button on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should enable Previous button on second page', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();
    });

    it('should enable Previous button on last page', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();
    });

    it('should disable Previous button when isLoading is true', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should disable Previous button on first page even when not loading', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  describe('Next Button State', () => {
    it('should disable Next button on last page', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('should enable Next button on second-to-last page', () => {
      render(
        <Pagination
          currentPage={4}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable Next button when isLoading is true', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should disable Next button on last page even when not loading', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should disable both buttons when isLoading is true', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should re-enable buttons when isLoading changes to false', () => {
      const { rerender } = render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      let previousButton = screen.getByText('Previous');
      let nextButton = screen.getByText('Next');

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();

      rerender(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      previousButton = screen.getByText('Previous');
      nextButton = screen.getByText('Next');

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should not call onPageChange when buttons are clicked during loading', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      await user.click(previousButton);
      await user.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle two-page scenario correctly on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={2}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(previousButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should handle two-page scenario correctly on last page', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={2}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    it('should handle large page numbers correctly', () => {
      render(
        <Pagination
          currentPage={50}
          totalPages={100}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 50 of 100')).toBeInTheDocument();
      
      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should handle page 1 of large total correctly', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1000}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 1 of 1000')).toBeInTheDocument();
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should handle last page of large total correctly', () => {
      render(
        <Pagination
          currentPage={1000}
          totalPages={1000}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 1000 of 1000')).toBeInTheDocument();
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Layout and Styling', () => {
    it('should render with correct container classes', () => {
      const { container } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const paginationContainer = container.querySelector('.flex.items-center.justify-center.gap-2.mt-6');
      expect(paginationContainer).toBeInTheDocument();
    });

    it('should render page info with correct text styling', () => {
      const { container } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const pageInfo = screen.getByText('Page 2 of 5');
      expect(pageInfo).toHaveClass('text-sm');
      expect(pageInfo).toHaveClass('text-muted-foreground');
      expect(pageInfo).toHaveClass('px-4');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should properly disable buttons with disabled attribute', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toHaveAttribute('disabled');
    });

    it('should have readable current page information', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={7}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const pageInfo = screen.getByText('Page 3 of 7');
      expect(pageInfo.tagName).toBe('SPAN');
    });
  });

  describe('Component Updates', () => {
    it('should update displayed page when currentPage prop changes', () => {
      const { rerender } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

      rerender(
        <Pagination
          currentPage={4}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 4 of 5')).toBeInTheDocument();
    });

    it('should update button states when currentPage changes to first page', () => {
      const { rerender } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      let previousButton = screen.getByText('Previous');
      expect(previousButton).not.toBeDisabled();

      rerender(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should update button states when currentPage changes to last page', () => {
      const { rerender } = render(
        <Pagination
          currentPage={4}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      let nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();

      rerender(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should update total pages display when totalPages prop changes', () => {
      const { rerender } = render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 3 of 5')).toBeInTheDocument();

      rerender(
        <Pagination
          currentPage={3}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
    });

    it('should unmount when totalPages changes to 1', () => {
      const { rerender, container } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();

      rerender(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('User Interaction Flow', () => {
    it('should handle multiple consecutive Previous clicks', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const previousButton = screen.getByText('Previous');
      
      await user.click(previousButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(4);

      // Simulate page change
      rerender(
        <Pagination
          currentPage={4}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      await user.click(previousButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should handle multiple consecutive Next clicks', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      const nextButton = screen.getByText('Next');
      
      await user.click(nextButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Simulate page change
      rerender(
        <Pagination
          currentPage={2}
          totalPages={10}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      await user.click(nextButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot for middle page', () => {
      const { container } = render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for first page', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for last page', () => {
      const { container } = render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={false}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot when loading', () => {
      const { container } = render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
          isLoading={true}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});