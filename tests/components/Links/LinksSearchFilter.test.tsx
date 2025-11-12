import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LinksSearchFilter } from '../../../src/components/Links/LinksSearchFilter';
import { LinkCategory } from '../../../src/types/developer-portal';
import { BookOpen, Code, Database } from 'lucide-react';

// Mock the cn utility function
vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock the UI Input component
vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => (
    <input className={className} {...props} />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: ({ className, ...props }: any) => (
    <svg className={className} data-testid="search-icon" {...props} />
  ),
  ChevronLeft: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-left-icon" {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-right-icon" {...props} />
  ),
  BookOpen: ({ className, ...props }: any) => (
    <svg className={className} data-testid="book-open-icon" {...props} />
  ),
  Code: ({ className, ...props }: any) => (
    <svg className={className} data-testid="code-icon" {...props} />
  ),
  Database: ({ className, ...props }: any) => (
    <svg className={className} data-testid="database-icon" {...props} />
  ),
  Shield: ({ className, ...props }: any) => (
    <svg className={className} data-testid="shield-icon" {...props} />
  ),
}));

// Mock categories for testing
const mockCategories: LinkCategory[] = [
  { id: 'docs', name: 'Documentation', icon: BookOpen, color: 'blue' },
  { id: 'tools', name: 'Development Tools', icon: Code, color: 'green' },
];

const mockContextValue = {
  searchTerm: '',
  setSearchTerm: vi.fn(),
  selectedCategoryId: 'all',
  setSelectedCategoryId: vi.fn(),
  linkCategories: mockCategories,
};

// Mock the LinksPageContext
vi.mock('../../../src/contexts/LinksPageContext', () => ({
  useLinksPageContext: () => mockContextValue,
}));

describe('LinksSearchFilter', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // Reset mock context to default values
    mockContextValue.searchTerm = '';
    mockContextValue.selectedCategoryId = 'all';
    mockContextValue.linkCategories = mockCategories;
    
    // Mock DOM methods
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    Object.defineProperty(HTMLDivElement.prototype, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders all essential UI elements', () => {
      render(<LinksSearchFilter />);
      
      // Search functionality
      expect(screen.getByPlaceholderText('Search links...')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      
      // Category buttons
      expect(screen.getByRole('button', { name: 'All Links' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Documentation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Development Tools' })).toBeInTheDocument();
      
      // Category icons
      expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      
      // Scroll controls
      expect(screen.getByRole('button', { name: 'Scroll left' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Scroll right' })).toBeInTheDocument();
    });

    it('applies responsive design classes', () => {
      render(<LinksSearchFilter />);
      
      const container = screen.getByRole('button', { name: 'All Links' }).closest('.bg-card');
      expect(container).toHaveClass('flex-col', 'lg:flex-row');
      
      // Large screen divider
      expect(document.querySelector('.hidden.lg\\:block')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', () => {
      const setSearchTerm = vi.fn();
      mockContextValue.setSearchTerm = setSearchTerm;
      
      render(<LinksSearchFilter />);
      
      const searchInput = screen.getByPlaceholderText('Search links...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      expect(setSearchTerm).toHaveBeenCalledWith('test search');
    });

    it('displays current search term', () => {
      mockContextValue.searchTerm = 'existing search';
      
      render(<LinksSearchFilter />);
      
      expect(screen.getByPlaceholderText('Search links...')).toHaveValue('existing search');
    });

    it('clears search input', async () => {
      const setSearchTerm = vi.fn();
      mockContextValue.setSearchTerm = setSearchTerm;
      mockContextValue.searchTerm = 'existing';
      
      render(<LinksSearchFilter />);
      
      await user.clear(screen.getByPlaceholderText('Search links...'));
      expect(setSearchTerm).toHaveBeenCalledWith('');
    });
  });

  describe('Category Selection', () => {
    it('shows correct selection states', () => {
      // Test "All Links" selected
      mockContextValue.selectedCategoryId = 'all';
      const { rerender } = render(<LinksSearchFilter />);
      
      expect(screen.getByRole('button', { name: 'All Links' })).toHaveClass('bg-primary');
      
      // Test category selected
      mockContextValue.selectedCategoryId = 'docs';
      rerender(<LinksSearchFilter />);
      
      expect(screen.getByRole('button', { name: 'Documentation' })).toHaveClass('bg-primary');
      expect(screen.getByRole('button', { name: 'All Links' })).not.toHaveClass('bg-primary');
    });

    it('handles category button clicks correctly', async () => {
      const setSelectedCategoryId = vi.fn();
      mockContextValue.setSelectedCategoryId = setSelectedCategoryId;
      
      render(<LinksSearchFilter />);
      
      // Click category when none selected - should select it
      await user.click(screen.getByRole('button', { name: 'Documentation' }));
      expect(setSelectedCategoryId).toHaveBeenCalledWith('docs');
    });

    it('handles "All Links" button when category is selected', async () => {
      const setSelectedCategoryId = vi.fn();
      mockContextValue.setSelectedCategoryId = setSelectedCategoryId;
      mockContextValue.selectedCategoryId = 'docs';
      
      render(<LinksSearchFilter />);
      
      await user.click(screen.getByRole('button', { name: 'All Links' }));
      expect(setSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('handles deselecting a selected category', async () => {
      const setSelectedCategoryId = vi.fn();
      mockContextValue.setSelectedCategoryId = setSelectedCategoryId;
      mockContextValue.selectedCategoryId = 'docs';
      
      render(<LinksSearchFilter />);
      
      await user.click(screen.getByRole('button', { name: 'Documentation' }));
      expect(setSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('does not call handler when "All Links" clicked while already selected', async () => {
      const setSelectedCategoryId = vi.fn();
      mockContextValue.setSelectedCategoryId = setSelectedCategoryId;
      mockContextValue.selectedCategoryId = 'all';
      
      render(<LinksSearchFilter />);
      
      await user.click(screen.getByRole('button', { name: 'All Links' }));
      expect(setSelectedCategoryId).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty categories gracefully', () => {
      mockContextValue.linkCategories = [];
      
      render(<LinksSearchFilter />);
      
      expect(screen.getByRole('button', { name: 'All Links' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Documentation' })).not.toBeInTheDocument();
    });

    it('handles categories without icons', () => {
      mockContextValue.linkCategories = [
        { id: 'no-icon', name: 'No Icon Category', icon: undefined as any, color: 'gray' }
      ];
      
      render(<LinksSearchFilter />);
      
      expect(screen.getByRole('button', { name: 'No Icon Category' })).toBeInTheDocument();
    });

    it('handles long category names with proper styling', () => {
      mockContextValue.linkCategories = [
        { id: 'long', name: 'Very Long Category Name That Should Not Break Layout', icon: Code, color: 'blue' }
      ];
      
      render(<LinksSearchFilter />);
      
      const button = screen.getByRole('button', { name: 'Very Long Category Name That Should Not Break Layout' });
      expect(button).toHaveClass('whitespace-nowrap');
    });

    it('handles invalid selectedCategoryId gracefully', () => {
      mockContextValue.selectedCategoryId = 'non-existent';
      
      expect(() => render(<LinksSearchFilter />)).not.toThrow();
      
      // No category should appear selected
      expect(screen.getByRole('button', { name: 'All Links' })).not.toHaveClass('bg-primary');
    });

    it('handles missing container ref gracefully', () => {
      vi.spyOn(React, 'useRef').mockReturnValue({ current: null });
      
      expect(() => render(<LinksSearchFilter />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility attributes', () => {
      render(<LinksSearchFilter />);
      
      // Scroll buttons have aria-labels
      expect(screen.getByRole('button', { name: 'Scroll left' })).toHaveAttribute('aria-label', 'Scroll left');
      expect(screen.getByRole('button', { name: 'Scroll right' })).toHaveAttribute('aria-label', 'Scroll right');
      
      // All buttons are keyboard accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });
});
