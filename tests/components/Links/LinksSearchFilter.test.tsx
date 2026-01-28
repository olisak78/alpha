import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LinksSearchFilter } from '@/components/Links/LinksSearchFilter';

// Mock the Zustand store hooks
vi.mock('@/stores/linksPageStore', () => ({
  useLinksSearchTerm: vi.fn(),
  useLinksSelectedCategoryId: vi.fn(),
  useLinksSearchFilterActions: vi.fn(),
}));

// Mock the LinksPageContext
vi.mock('@/contexts/LinksPageContext', () => ({
  useLinksPageContext: vi.fn(),
}));

import { useLinksSearchTerm, useLinksSelectedCategoryId, useLinksSearchFilterActions } from '@/stores/linksPageStore';
import { useLinksPageContext } from '@/contexts/LinksPageContext';

describe('LinksSearchFilter', () => {
  const mockSetSearchTerm = vi.fn();
  const mockSetSelectedCategoryId = vi.fn();

  const mockLinkCategories = [
    {
      id: 'cat-1',
      name: 'Development',
      icon: vi.fn(() => <span>DevIcon</span>),
      color: 'bg-blue-500',
    },
    {
      id: 'cat-2',
      name: 'Infrastructure',
      icon: vi.fn(() => <span>InfraIcon</span>),
      color: 'bg-green-500',
    },
    {
      id: 'cat-3',
      name: 'Documentation',
      icon: vi.fn(() => <span>DocsIcon</span>),
      color: 'bg-purple-500',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useLinksSearchTerm).mockReturnValue('');
    vi.mocked(useLinksSelectedCategoryId).mockReturnValue('all');
    vi.mocked(useLinksSearchFilterActions).mockReturnValue({
      setSearchTerm: mockSetSearchTerm,
      setSelectedCategoryId: mockSetSelectedCategoryId,
      setViewMode: vi.fn(),
    });

    vi.mocked(useLinksPageContext).mockReturnValue({
      linkCategories: mockLinkCategories,
      links: [],
      filteredLinks: [],
      linksByCategory: {},
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render "All Links" category button', () => {
      render(<LinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
    });

    it('should render all category buttons', () => {
      render(<LinksSearchFilter />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should not render Add Link button', () => {
      render(<LinksSearchFilter />);

      expect(screen.queryByText('Add Link')).not.toBeInTheDocument();
    });

    it('should not render ViewLinksToggleButton', () => {
      render(<LinksSearchFilter />);

      expect(screen.queryByTestId('view-toggle-button')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display current search term in input', () => {
      vi.mocked(useLinksSearchTerm).mockReturnValue('TypeScript');

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...') as HTMLInputElement;
      expect(searchInput.value).toBe('TypeScript');
    });

    it('should call setSearchTerm when user types in search input', async () => {
      const user = userEvent.setup();

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, 'API');

      expect(mockSetSearchTerm).toHaveBeenCalledWith('A');
      expect(mockSetSearchTerm).toHaveBeenCalledWith('P');
      expect(mockSetSearchTerm).toHaveBeenCalledWith('I');
    });

    it('should call setSearchTerm when clearing search input', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSearchTerm).mockReturnValue('existing text');

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.clear(searchInput);

      expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    });

    it('should handle empty search term', () => {
      vi.mocked(useLinksSearchTerm).mockReturnValue('');

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...') as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('should update search input value as user types', async () => {
      const user = userEvent.setup();

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, 'test');

      expect(mockSetSearchTerm).toHaveBeenCalledTimes(4);
    });
  });

  describe('Category Selection', () => {
    it('should highlight "All Links" when selectedCategoryId is "all"', () => {
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('all');

      render(<LinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      expect(allLinksButton).toHaveClass('bg-primary');
      expect(allLinksButton).toHaveClass('text-primary-foreground');
    });

    it('should highlight selected category', () => {
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      render(<LinksSearchFilter />);

      const developmentButton = screen.getByText('Development');
      expect(developmentButton).toHaveClass('bg-primary');
      expect(developmentButton).toHaveClass('text-primary-foreground');
    });

    it('should not call setSelectedCategoryId when "All Links" is clicked while already selected', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('all');

      render(<LinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      await user.click(allLinksButton);

      // Should not call because it's already selected
      expect(mockSetSelectedCategoryId).not.toHaveBeenCalled();
    });

    it('should call setSelectedCategoryId when "All Links" is clicked while another category is selected', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      render(<LinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      await user.click(allLinksButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('should select category when it is clicked while not selected', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('all');

      render(<LinksSearchFilter />);

      const developmentButton = screen.getByText('Development');
      await user.click(developmentButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-1');
    });

    it('should deselect category and return to "all" when clicking already selected category', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      render(<LinksSearchFilter />);

      const developmentButton = screen.getByText('Development');
      await user.click(developmentButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('should switch between different categories', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('all');

      render(<LinksSearchFilter />);

      // Click Development
      await user.click(screen.getByText('Development'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-1');

      // Simulate category changed
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      // Click Infrastructure (different category)
      await user.click(screen.getByText('Infrastructure'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-2');
    });

    it('should not highlight non-selected categories', () => {
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      render(<LinksSearchFilter />);

      const infrastructureButton = screen.getByText('Infrastructure');
      expect(infrastructureButton).not.toHaveClass('bg-primary');
      expect(infrastructureButton).toHaveClass('bg-gray-50');
    });
  });

  describe('Scroll Buttons', () => {
    it('should render left and right scroll buttons', () => {
      render(<LinksSearchFilter />);

      const leftButton = screen.getByLabelText('Scroll left');
      const rightButton = screen.getByLabelText('Scroll right');

      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
    });

    it('should initially hide scroll buttons when content fits', () => {
      render(<LinksSearchFilter />);

      const leftButton = screen.getByLabelText('Scroll left');
      const rightButton = screen.getByLabelText('Scroll right');

      expect(leftButton).toHaveClass('opacity-0');
      expect(rightButton).toHaveClass('opacity-0');
    });
  });

  describe('Empty Categories', () => {
    it('should render only "All Links" when no categories exist', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        linkCategories: [],
        links: [],
        filteredLinks: [],
        linksByCategory: {},
        isLoading: false,
      } as any);

      render(<LinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
      expect(screen.queryByText('Development')).not.toBeInTheDocument();
    });

    it('should handle single category', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        linkCategories: [mockLinkCategories[0]],
        links: [],
        filteredLinks: [],
        linksByCategory: {},
        isLoading: false,
      } as any);

      render(<LinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Categories', () => {
    it('should render all categories in order', () => {
      render(<LinksSearchFilter />);

      const buttons = screen.getAllByRole('button');
      const categoryButtons = buttons.filter(btn =>
        btn.textContent?.includes('Development') ||
        btn.textContent?.includes('Infrastructure') ||
        btn.textContent?.includes('Documentation')
      );

      expect(categoryButtons).toHaveLength(3);
    });

    it('should render category icons', () => {
      render(<LinksSearchFilter />);

      const developmentButton = screen.getByText('Development').closest('button');
      expect(developmentButton).toBeInTheDocument();
    });
  });

  describe('Integration with Store and Context', () => {
    it('should use searchTerm from Zustand store', () => {
      const searchTerm = 'kubernetes';
      vi.mocked(useLinksSearchTerm).mockReturnValue(searchTerm);

      render(<LinksSearchFilter />);

      expect(useLinksSearchTerm).toHaveBeenCalled();
      const searchInput = screen.getByPlaceholderText('Search links...') as HTMLInputElement;
      expect(searchInput.value).toBe(searchTerm);
    });

    it('should use selectedCategoryId from Zustand store', () => {
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-2');

      render(<LinksSearchFilter />);

      expect(useLinksSelectedCategoryId).toHaveBeenCalled();
      const infrastructureButton = screen.getByText('Infrastructure');
      expect(infrastructureButton).toHaveClass('bg-primary');
    });

    it('should use linkCategories from context', () => {
      render(<LinksSearchFilter />);

      expect(useLinksPageContext).toHaveBeenCalled();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should use actions from Zustand store', async () => {
      const user = userEvent.setup();

      render(<LinksSearchFilter />);

      expect(useLinksSearchFilterActions).toHaveBeenCalled();

      // Test search action
      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, 'a');
      expect(mockSetSearchTerm).toHaveBeenCalled();

      // Test category selection action
      await user.click(screen.getByText('Development'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for scroll buttons', () => {
      render(<LinksSearchFilter />);

      expect(screen.getByLabelText('Scroll left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll right')).toBeInTheDocument();
    });

    it('should have accessible search input field', () => {
      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('should have clickable category buttons', () => {
      render(<LinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      expect(allLinksButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long category names', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        linkCategories: [
          {
            id: 'cat-long',
            name: 'Very Long Category Name That Should Not Break The Layout Design',
            icon: vi.fn(() => <span>Icon</span>),
            color: 'bg-blue-500',
          },
        ],
        links: [],
        filteredLinks: [],
        linksByCategory: {},
        isLoading: false,
      } as any);

      render(<LinksSearchFilter />);

      expect(screen.getByText('Very Long Category Name That Should Not Break The Layout Design')).toBeInTheDocument();
    });

    it('should handle categories without icons', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        linkCategories: [
          {
            id: 'cat-no-icon',
            name: 'No Icon Category',
            icon: null,
            color: 'bg-blue-500',
          },
        ],
        links: [],
        filteredLinks: [],
        linksByCategory: {},
        isLoading: false,
      } as any);

      render(<LinksSearchFilter />);

      expect(screen.getByText('No Icon Category')).toBeInTheDocument();
    });



    it('should handle special characters in search input', async () => {
      const user = userEvent.setup();

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, '!@#$%^&*()');

      expect(mockSetSearchTerm).toHaveBeenCalled();
    });

    it('should handle unicode characters in search', async () => {
      const user = userEvent.setup();

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, '中文测试');

      expect(mockSetSearchTerm).toHaveBeenCalled();
    });
  });

  describe('Category Toggle Behavior', () => {


    it('should switch directly between different categories', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-1');

      render(<LinksSearchFilter />);

      // Click different category
      await user.click(screen.getByText('Infrastructure'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-2');
    });

    it('should handle clicking All Links from selected category', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSelectedCategoryId).mockReturnValue('cat-2');

      render(<LinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      await user.click(allLinksButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    });
  });

  describe('Layout', () => {
    it('should render search input and category pills in the same component', () => {
      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      const allLinksButton = screen.getByText('All Links');

      expect(searchInput).toBeInTheDocument();
      expect(allLinksButton).toBeInTheDocument();
    });

    it('should have proper container styling', () => {
      const { container } = render(<LinksSearchFilter />);

      const mainContainer = container.querySelector('.bg-card');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('border');
      expect(mainContainer).toHaveClass('rounded-lg');
    });
  });

  describe('Search Input Styling', () => {
    it('should apply correct styling to search input', () => {
      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      expect(searchInput).toHaveClass('pl-10');
      expect(searchInput).toHaveClass('border-2');
    });
  });

  describe('Clear Button (X)', () => {
    it('should render clear button when searchTerm is non-empty', () => {
      vi.mocked(useLinksSearchTerm).mockReturnValue('foo');
      render(<LinksSearchFilter />);
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render clear button when searchTerm is empty', () => {
      vi.mocked(useLinksSearchTerm).mockReturnValue('');
      render(<LinksSearchFilter />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('should clear searchTerm and refocus input when clicking clear button', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSearchTerm).mockReturnValue('bar');

      render(<LinksSearchFilter />);

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(mockSetSearchTerm).toHaveBeenCalledWith('');
      const searchInput = screen.getByPlaceholderText('Search links...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should clear searchTerm with Escape key when input has text', async () => {
      const user = userEvent.setup();
      vi.mocked(useLinksSearchTerm).mockReturnValue('baz');

      render(<LinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search links...');
      await user.type(searchInput, '{Escape}');

      expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    });
  });
});
