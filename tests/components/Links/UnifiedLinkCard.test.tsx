import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UnifiedLinkCard } from '../../../src/components/Links/UnifiedLinkCard';
import { Link } from '../../../src/types/developer-portal';

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
  ExternalLink: ({ className, ...props }: any) => (
    <svg className={className} data-testid="external-link-icon" {...props} />
  ),
}));

// Mock the useLinkCard hook
const mockUseLinkCard = {
  showStarButton: true,
  showDeleteButton: false,
  category: null,
  handleToggleFavorite: vi.fn(),
  handleDelete: vi.fn(),
};

vi.mock('../../../src/hooks/useLinkCard', () => ({
  useLinkCard: () => mockUseLinkCard,
}));

describe('UnifiedLinkCard', () => {
  const mockLink: Link = {
    id: 'test-link-1',
    title: 'Test Link',
    url: 'https://example.com',
    description: 'Test description',
    categoryId: 'test-category',
    tags: ['tag1', 'tag2'],
    favorite: false,
  };

  const mockQuickLink = {
    id: 'quick-link-1',
    title: 'Quick Link',
    url: 'https://quick.com',
    description: 'Quick description',
    categoryId: 'quick-category',
    tags: ['quick'],
    isFavorite: true,
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // Reset mock hook values
    mockUseLinkCard.showStarButton = true;
    mockUseLinkCard.showDeleteButton = false;
    mockUseLinkCard.category = null;
    mockUseLinkCard.handleToggleFavorite = vi.fn();
    mockUseLinkCard.handleDelete = vi.fn();
  });

  describe('Component Rendering', () => {
    it('renders link with basic structure', () => {
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      // Check link element
      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveAttribute('href', 'https://example.com');
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noreferrer');
      
      // Check title
      expect(screen.getByText('Test Link')).toBeInTheDocument();
    });

    it('applies correct CSS classes for full layout', () => {
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveClass('group', 'relative', 'border', 'rounded-lg', 'p-5');
    });

    it('renders star button when showStarButton is true', () => {
      mockUseLinkCard.showStarButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('does not render star button when showStarButton is false', () => {
      mockUseLinkCard.showStarButton = false;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
    });

    it('renders delete button when showDeleteButton is true', () => {
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('does not render delete button when showDeleteButton is false', () => {
      mockUseLinkCard.showDeleteButton = false;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
    });
  });

  describe('Favorite Status Handling', () => {
    it('shows filled star for favorite link (Link type)', () => {
      const favoriteLink = { ...mockLink, favorite: true };
      
      render(<UnifiedLinkCard linkData={favoriteLink} />);
      
      const starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('fill-yellow-400', 'text-yellow-400');
    });

    it('shows empty star for non-favorite link (Link type)', () => {
      const nonFavoriteLink = { ...mockLink, favorite: false };
      
      render(<UnifiedLinkCard linkData={nonFavoriteLink} />);
      
      const starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('text-muted-foreground');
      expect(starIcon).not.toHaveClass('fill-yellow-400');
    });

    it('shows filled star for favorite QuickLink (isFavorite property)', () => {
      render(<UnifiedLinkCard linkData={mockQuickLink} />);
      
      const starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('fill-yellow-400', 'text-yellow-400');
    });

    it('shows empty star for non-favorite QuickLink', () => {
      const nonFavoriteQuickLink = { ...mockQuickLink, isFavorite: false };
      
      render(<UnifiedLinkCard linkData={nonFavoriteQuickLink} />);
      
      const starIcon = screen.getByTestId('star-icon');
      expect(starIcon).toHaveClass('text-muted-foreground');
      expect(starIcon).not.toHaveClass('fill-yellow-400');
    });
  });

  describe('User Interactions', () => {
    it('calls handleToggleFavorite when star is clicked', async () => {
      const handleToggleFavorite = vi.fn();
      mockUseLinkCard.handleToggleFavorite = handleToggleFavorite;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites|remove from favorites/i });
      await user.click(starButton);
      
      expect(handleToggleFavorite).toHaveBeenCalledWith('test-link-1');
    });

    it('calls handleDelete when delete button is clicked', async () => {
      const handleDelete = vi.fn();
      mockUseLinkCard.showDeleteButton = true;
      mockUseLinkCard.handleDelete = handleDelete;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      await user.click(deleteButton);
      
      expect(handleDelete).toHaveBeenCalledWith('test-link-1', 'Test Link');
    });

    it('prevents event propagation on button clicks', async () => {
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites|remove from favorites/i });
      
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
      
      fireEvent(starButton, clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('handles missing handlers gracefully', async () => {
      mockUseLinkCard.handleToggleFavorite = undefined as any;
      mockUseLinkCard.handleDelete = undefined as any;
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites|remove from favorites/i });
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      
      expect(() => fireEvent.click(starButton)).not.toThrow();
      expect(() => fireEvent.click(deleteButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper button titles for star button', () => {
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(starButton).toHaveAttribute('title', 'Add to favorites');
    });

    it('provides proper button titles for favorite star button', () => {
      const favoriteLink = { ...mockLink, favorite: true };
      
      render(<UnifiedLinkCard linkData={favoriteLink} />);
      
      const starButton = screen.getByRole('button', { name: /remove from favorites/i });
      expect(starButton).toHaveAttribute('title', 'Remove from favorites');
    });

    it('provides proper button title for delete button', () => {
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      expect(deleteButton).toHaveAttribute('title', 'Delete link');
    });

    it('maintains proper z-index for buttons', () => {
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites|remove from favorites/i });
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      
      // The buttons are in a container with relative z-10, not the buttons themselves
      const buttonContainer = starButton.parentElement;
      expect(buttonContainer).toHaveClass('relative', 'z-10');
    });

    it('provides keyboard accessibility', () => {
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct styling and layout', () => {
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveClass('hover:shadow-lg', 'hover:border-primary/50');
      expect(linkElement).toHaveClass('transition-all', 'duration-200');
    });

    it('positions buttons correctly', () => {
      mockUseLinkCard.showDeleteButton = true;
      
      render(<UnifiedLinkCard linkData={mockLink} />);
      
      const starButton = screen.getByRole('button', { name: /add to favorites|remove from favorites/i });
      const deleteButton = screen.getByRole('button', { name: /delete link/i });
      const titleElement = screen.getByText('Test Link');
      
      // Check that buttons and title are present and positioned correctly
      expect(starButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      expect(titleElement).toBeInTheDocument();
      
      // The title should have flex-1 class for flexible sizing
      expect(titleElement.parentElement).toHaveClass('flex-1');
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in title', () => {
      const specialTitleLink = { ...mockLink, title: 'Link with "quotes" & <tags>' };
      
      render(<UnifiedLinkCard linkData={specialTitleLink} />);
      
      expect(screen.getByText('Link with "quotes" & <tags>')).toBeInTheDocument();
    });

    it('handles minimal link data', () => {
      const minimalLink = {
        id: 'minimal',
        title: 'Minimal Link',
        url: 'https://minimal.com',
      };
      
      expect(() => render(<UnifiedLinkCard linkData={minimalLink as any} />)).not.toThrow();
    });

    it('maintains backward compatibility with variant prop', () => {
      expect(() => {
        render(<UnifiedLinkCard linkData={mockLink} variant="compact" />);
      }).not.toThrow();
    });
  });
});
