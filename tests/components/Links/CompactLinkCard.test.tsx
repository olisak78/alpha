import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompactLinkCard } from '../../../src/components/Links/CompactLinkCard';
import { Link } from '../../../src/types/developer-portal';
import type { QuickLink } from '../../../src/contexts/QuickLinksContext';

// Mock the cn utility function
vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Star: ({ className, ...props }: any) => (
    <svg className={className} data-testid="star-icon" {...props} />
  ),
  Trash2: ({ className, ...props }: any) => (
    <svg className={className} data-testid="trash-icon" {...props} />
  ),
  Pencil: ({ className, ...props }: any) => (
    <svg className={className} data-testid="pencil-icon" {...props} />
  ),
}));

describe('CompactLinkCard', () => {
  const mockLink: Link = {
    id: 'test-link-1',
    title: 'Test Link',
    url: 'https://example.com',
    description: 'Test description',
    categoryId: 'test-category',
    tags: ['tag1', 'tag2'],
    favorite: false,
  };

  const mockQuickLink: QuickLink = {
    id: 'quick-link-1',
    title: 'Quick Link',
    url: 'https://quick.com',
    icon: 'link',
    category: 'Quick Category',
    categoryId: 'quick-category',
    categoryColor: 'bg-blue-500',
    description: 'Quick description',
    tags: ['quick'],
    isFavorite: true,
  };

  const defaultProps = {
    linkData: mockLink,
    isFavorite: false,
    showStarButton: true,
    showDeleteButton: false,
    showEditButton: false,
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  describe('Basic Rendering', () => {
    it('renders link with correct structure and styling', () => {
      render(<CompactLinkCard {...defaultProps} />);
      
      // Check link element and attributes
      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveAttribute('href', 'https://example.com');
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noreferrer');
      
      // Check CSS classes
      expect(linkElement).toHaveClass('block', 'px-3', 'py-2', 'border', 'rounded');
      expect(linkElement).toHaveClass('hover:shadow-sm', 'hover:border-primary/50');
      expect(linkElement).toHaveClass('transition-all', 'duration-200', 'bg-background', 'relative');
      
      // Check title
      const titleElement = screen.getByText('Test Link');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('text-sm', 'font-medium', 'text-foreground');
      expect(titleElement).toHaveClass('group-hover:text-primary', 'transition-colors', 'whitespace-nowrap');
      
      // Check container
      const container = linkElement.parentElement;
      expect(container).toHaveClass('group');
    });

    it('renders with QuickLink data', () => {
      render(<CompactLinkCard {...defaultProps} linkData={mockQuickLink} />);
      
      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveAttribute('href', 'https://quick.com');
      expect(screen.getByText('Quick Link')).toBeInTheDocument();
    });
  });

  describe('Button Visibility and Styling', () => {
    it('renders star button when showStarButton is true', () => {
      render(<CompactLinkCard {...defaultProps} showStarButton={true} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(starButton).toBeInTheDocument();
      expect(starButton).toHaveClass('p-1', 'hover:bg-accent', 'rounded-md');
      expect(starButton).toHaveClass('transition-colors', 'flex-shrink-0', 'relative', 'z-10');
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('renders delete button when showDeleteButton is true', () => {
      render(<CompactLinkCard {...defaultProps} showDeleteButton={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('p-1', 'hover:bg-destructive/10', 'rounded-md');
      expect(deleteButton).toHaveClass('transition-colors', 'flex-shrink-0', 'relative', 'z-10');
      
      const trashIcon = screen.getByTestId('trash-icon');
      expect(trashIcon).toHaveClass('h-4', 'w-4', 'text-muted-foreground', 'hover:text-destructive');
    });

    it('renders edit button when showEditButton is true', () => {
      render(<CompactLinkCard {...defaultProps} showEditButton={true} />);
      
      const editButton = screen.getByRole('button', { name: /edit link/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveClass('p-1', 'hover:bg-accent', 'rounded-md');
      expect(editButton).toHaveClass('transition-colors', 'flex-shrink-0', 'relative', 'z-10');
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      expect(pencilIcon).toHaveClass('h-4', 'w-4', 'text-muted-foreground', 'hover:text-primary');
    });

    it('hides buttons when show flags are false', () => {
      render(
        <CompactLinkCard 
          {...defaultProps} 
          showStarButton={false}
          showDeleteButton={false}
          showEditButton={false}
        />
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pencil-icon')).not.toBeInTheDocument();
    });

    it('renders all buttons when all show flags are true', () => {
      render(
        <CompactLinkCard 
          {...defaultProps} 
          showStarButton={true}
          showDeleteButton={true}
          showEditButton={true}
        />
      );
      
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Favorite State', () => {
    it('shows correct star appearance for favorite and non-favorite states', () => {
      const { rerender } = render(<CompactLinkCard {...defaultProps} isFavorite={false} />);
      
      let starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('text-muted-foreground', 'hover:text-yellow-400');
      expect(starIcon).not.toHaveClass('fill-yellow-400');
      
      rerender(<CompactLinkCard {...defaultProps} isFavorite={true} />);
      
      starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('fill-yellow-400', 'text-yellow-400');
    });
  });

  describe('User Interactions', () => {
    it('calls event handlers with correct parameters', async () => {
      const onToggleFavorite = vi.fn();
      const onDelete = vi.fn();
      const onEdit = vi.fn();
      
      render(
        <CompactLinkCard 
          {...defaultProps} 
          showDeleteButton={true}
          showEditButton={true}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /add to favorites/i }));
      await user.click(screen.getByRole('button', { name: /delete link/i }));
      await user.click(screen.getByRole('button', { name: /edit link/i }));
      
      expect(onToggleFavorite).toHaveBeenCalledWith('test-link-1');
      expect(onDelete).toHaveBeenCalledWith('test-link-1', 'Test Link');
      expect(onEdit).toHaveBeenCalledWith('test-link-1');
    });

    it('prevents event propagation on button clicks', async () => {
      const onToggleFavorite = vi.fn();
      render(<CompactLinkCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites/i });
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
      
      fireEvent(starButton, clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('handles missing handlers gracefully', async () => {
      render(
        <CompactLinkCard 
          {...defaultProps} 
          showDeleteButton={true}
          showEditButton={true}
          // No handlers provided
        />
      );
      
      const starButton = screen.getByRole('button', { name: /add to favorites/i });
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      const editButton = screen.getByRole('button', { name: /edit link/i });
      
      expect(() => fireEvent.click(starButton)).not.toThrow();
      expect(() => fireEvent.click(deleteButton)).not.toThrow();
      expect(() => fireEvent.click(editButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper button titles and accessibility attributes', () => {
      render(
        <CompactLinkCard 
          {...defaultProps} 
          isFavorite={false}
          showDeleteButton={true}
          showEditButton={true}
        />
      );
      
      const starButton = screen.getByRole('button', { name: /add to favorites/i });
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      const editButton = screen.getByRole('button', { name: /edit link/i });
      
      expect(starButton).toHaveAttribute('title', 'Add to favorites');
      expect(deleteButton).toHaveAttribute('title', 'Delete link');
      expect(editButton).toHaveAttribute('title', 'Edit link');
      
      // Check keyboard accessibility
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('updates star button title based on favorite state', () => {
      const { rerender } = render(<CompactLinkCard {...defaultProps} isFavorite={false} />);
      
      let starButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(starButton).toHaveAttribute('title', 'Add to favorites');
      
      rerender(<CompactLinkCard {...defaultProps} isFavorite={true} />);
      
      starButton = screen.getByRole('button', { name: /remove from favorites/i });
      expect(starButton).toHaveAttribute('title', 'Remove from favorites');
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in title', () => {
      const specialTitleLink = { ...mockLink, title: 'Link with "quotes" & <tags>' };
      
      render(<CompactLinkCard {...defaultProps} linkData={specialTitleLink} />);
      
      expect(screen.getByText('Link with "quotes" & <tags>')).toBeInTheDocument();
    });

    it('handles very long titles with proper styling', () => {
      const longTitleLink = { 
        ...mockLink, 
        title: 'This is a very long title that should be handled gracefully by the component' 
      };
      
      render(<CompactLinkCard {...defaultProps} linkData={longTitleLink} />);
      
      const titleElement = screen.getByText(longTitleLink.title);
      expect(titleElement).toHaveClass('whitespace-nowrap');
    });

    it('handles minimal link data', () => {
      const minimalLink = {
        id: 'minimal',
        title: 'Minimal Link',
        url: 'https://minimal.com',
      };
      
      expect(() => {
        render(<CompactLinkCard {...defaultProps} linkData={minimalLink as any} />);
      }).not.toThrow();
      
      expect(screen.getByText('Minimal Link')).toBeInTheDocument();
    });

    it('handles empty URL gracefully', () => {
      const emptyUrlLink = { ...mockLink, url: '' };
      
      render(<CompactLinkCard {...defaultProps} linkData={emptyUrlLink} />);
      
      // Use a more specific selector since empty href might not be recognized as a link role
      const linkElement = screen.getByText('Test Link').closest('a');
      expect(linkElement).toHaveAttribute('href', '');
    });

    it('works with different link data types', async () => {
      const onToggleFavorite = vi.fn();
      
      render(
        <CompactLinkCard 
          linkData={mockQuickLink}
          isFavorite={true}
          showStarButton={true}
          showDeleteButton={false}
          onToggleFavorite={onToggleFavorite}
        />
      );
      
      expect(screen.getByText('Quick Link')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://quick.com');
      
      const starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('fill-yellow-400', 'text-yellow-400');
      
      await user.click(screen.getByRole('button', { name: /remove from favorites/i }));
      expect(onToggleFavorite).toHaveBeenCalledWith('quick-link-1');
    });
  });
});
