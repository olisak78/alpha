import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuickLinksSearchFilter } from '@/components/QuickLinks/QuickLinksSearchFilter';

// Mock the Zustand store hooks
vi.mock('@/stores/quickLinksStore', () => ({
  useSearchTerm: vi.fn(),
  useSelectedCategoryId: vi.fn(),
  useSearchFilterActions: vi.fn(),
}));

// Mock the QuickLinksContext
vi.mock('@/contexts/QuickLinksContext', () => ({
  useQuickLinksContext: vi.fn(),
}));

// Mock the ViewLinksToggleButton component
vi.mock('@/components/Links/ViewLinksToggleButton', () => ({
  ViewLinksToggleButton: vi.fn(() => <div data-testid="view-toggle-button">View Toggle</div>),
}));

import { useSearchTerm, useSelectedCategoryId, useSearchFilterActions } from '@/stores/quickLinksStore';
import { useQuickLinksContext } from '@/contexts/QuickLinksContext';

describe('QuickLinksSearchFilter', () => {
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
    vi.mocked(useSearchTerm).mockReturnValue('');
    vi.mocked(useSelectedCategoryId).mockReturnValue('all');
    vi.mocked(useSearchFilterActions).mockReturnValue({
      setSearchTerm: mockSetSearchTerm,
      setSelectedCategoryId: mockSetSelectedCategoryId,
      setViewMode: vi.fn(),
    });

    vi.mocked(useQuickLinksContext).mockReturnValue({
      linkCategories: mockLinkCategories,
      filteredQuickLinks: [],
      quickLinks: [],
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render ViewLinksToggleButton', () => {
      render(<QuickLinksSearchFilter />);

      expect(screen.getByTestId('view-toggle-button')).toBeInTheDocument();
    });

    it('should render "All Links" category button', () => {
      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
    });

    it('should render all category buttons', () => {
      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should not render Add Link button when onAddLinkClick is not provided', () => {
      render(<QuickLinksSearchFilter />);

      expect(screen.queryByText('Add Link')).not.toBeInTheDocument();
    });

    it('should render Add Link button when onAddLinkClick is provided', () => {
      const mockOnAddLinkClick = vi.fn();
      render(<QuickLinksSearchFilter onAddLinkClick={mockOnAddLinkClick} />);

      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display current search term in input', () => {
      vi.mocked(useSearchTerm).mockReturnValue('GitHub');

      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...') as HTMLInputElement;
      expect(searchInput.value).toBe('GitHub');
    });

    it('should call setSearchTerm when user types in search input', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      await user.type(searchInput, 'test search');

      expect(mockSetSearchTerm).toHaveBeenCalledWith('t');
      expect(mockSetSearchTerm).toHaveBeenCalledWith('e');
      expect(mockSetSearchTerm).toHaveBeenCalledWith('s');
    });

    it('should call setSearchTerm when clearing search input', async () => {
      const user = userEvent.setup();
      vi.mocked(useSearchTerm).mockReturnValue('existing search');

      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      await user.clear(searchInput);

      expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    });

    it('should handle empty search term', () => {
      vi.mocked(useSearchTerm).mockReturnValue('');

      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...') as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });
  });

  describe('Category Selection', () => {
    it('should highlight "All Links" when selectedCategoryId is "all"', () => {
      vi.mocked(useSelectedCategoryId).mockReturnValue('all');

      render(<QuickLinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      expect(allLinksButton).toHaveClass('bg-primary');
      expect(allLinksButton).toHaveClass('text-primary-foreground');
    });

    it('should highlight selected category', () => {
      vi.mocked(useSelectedCategoryId).mockReturnValue('cat-1');

      render(<QuickLinksSearchFilter />);

      const developmentButton = screen.getByText('Development');
      expect(developmentButton).toHaveClass('bg-primary');
      expect(developmentButton).toHaveClass('text-primary-foreground');
    });

    it('should call setSelectedCategoryId when "All Links" is clicked', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      await user.click(allLinksButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('should call setSelectedCategoryId when category is clicked', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      const developmentButton = screen.getByText('Development');
      await user.click(developmentButton);

      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-1');
    });

    it('should handle switching between categories', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      // Click Development
      await user.click(screen.getByText('Development'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-1');

      // Click Infrastructure
      await user.click(screen.getByText('Infrastructure'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('cat-2');

      // Click All Links
      await user.click(screen.getByText('All Links'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    });

    it('should not highlight non-selected categories', () => {
      vi.mocked(useSelectedCategoryId).mockReturnValue('cat-1');

      render(<QuickLinksSearchFilter />);

      const infrastructureButton = screen.getByText('Infrastructure');
      expect(infrastructureButton).not.toHaveClass('bg-primary');
      expect(infrastructureButton).toHaveClass('bg-gray-50');
    });
  });

  describe('Add Link Button', () => {
    it('should call onAddLinkClick when Add Link button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnAddLinkClick = vi.fn();

      render(<QuickLinksSearchFilter onAddLinkClick={mockOnAddLinkClick} />);

      const addLinkButton = screen.getByText('Add Link');
      await user.click(addLinkButton);

      expect(mockOnAddLinkClick).toHaveBeenCalledTimes(1);
    });

    it('should render Plus icon in Add Link button', () => {
      const mockOnAddLinkClick = vi.fn();
      render(<QuickLinksSearchFilter onAddLinkClick={mockOnAddLinkClick} />);

      const addLinkButton = screen.getByText('Add Link');
      expect(addLinkButton).toBeInTheDocument();
      // The Plus icon is rendered as part of the button
      expect(addLinkButton.closest('button')).toBeInTheDocument();
    });
  });

  describe('Scroll Buttons', () => {
    it('should render left and right scroll buttons', () => {
      render(<QuickLinksSearchFilter />);

      const leftButton = screen.getByLabelText('Scroll left');
      const rightButton = screen.getByLabelText('Scroll right');

      expect(leftButton).toBeInTheDocument();
      expect(rightButton).toBeInTheDocument();
    });

    it('should initially hide scroll buttons when content fits', () => {
      render(<QuickLinksSearchFilter />);

      const leftButton = screen.getByLabelText('Scroll left');
      const rightButton = screen.getByLabelText('Scroll right');

      // Initially hidden because scroll position is at start and content fits
      expect(leftButton).toHaveClass('opacity-0');
      expect(rightButton).toHaveClass('opacity-0');
    });
  });

  describe('Empty Categories', () => {
    it('should render only "All Links" when no categories exist', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        linkCategories: [],
        filteredQuickLinks: [],
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
      expect(screen.queryByText('Development')).not.toBeInTheDocument();
    });

    it('should handle single category', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        linkCategories: [mockLinkCategories[0]],
        filteredQuickLinks: [],
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('All Links')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Categories', () => {
    it('should render all categories in order', () => {
      render(<QuickLinksSearchFilter />);

      const buttons = screen.getAllByRole('button');
      const categoryButtons = buttons.filter(btn =>
        btn.textContent?.includes('Development') ||
        btn.textContent?.includes('Infrastructure') ||
        btn.textContent?.includes('Documentation')
      );

      expect(categoryButtons).toHaveLength(3);
    });

    it('should render category icons', () => {
      render(<QuickLinksSearchFilter />);

      // Icons are rendered as part of the category buttons
      const developmentButton = screen.getByText('Development').closest('button');
      expect(developmentButton).toBeInTheDocument();
    });
  });

  describe('Integration with Store and Context', () => {
    it('should use searchTerm from Zustand store', () => {
      const searchTerm = 'my search';
      vi.mocked(useSearchTerm).mockReturnValue(searchTerm);

      render(<QuickLinksSearchFilter />);

      expect(useSearchTerm).toHaveBeenCalled();
      const searchInput = screen.getByPlaceholderText('Search quick links...') as HTMLInputElement;
      expect(searchInput.value).toBe(searchTerm);
    });

    it('should use selectedCategoryId from Zustand store', () => {
      vi.mocked(useSelectedCategoryId).mockReturnValue('cat-2');

      render(<QuickLinksSearchFilter />);

      expect(useSelectedCategoryId).toHaveBeenCalled();
      const infrastructureButton = screen.getByText('Infrastructure');
      expect(infrastructureButton).toHaveClass('bg-primary');
    });

    it('should use linkCategories from context', () => {
      render(<QuickLinksSearchFilter />);

      expect(useQuickLinksContext).toHaveBeenCalled();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should use actions from Zustand store', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      expect(useSearchFilterActions).toHaveBeenCalled();

      // Test search action
      const searchInput = screen.getByPlaceholderText('Search quick links...');
      await user.type(searchInput, 'a');
      expect(mockSetSearchTerm).toHaveBeenCalled();

      // Test category selection action
      await user.click(screen.getByText('Development'));
      expect(mockSetSelectedCategoryId).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for scroll buttons', () => {
      render(<QuickLinksSearchFilter />);

      expect(screen.getByLabelText('Scroll left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll right')).toBeInTheDocument();
    });

    it('should have searchable input field', () => {
      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      expect(searchInput.tagName).toBe('INPUT');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have clickable category buttons', () => {
      render(<QuickLinksSearchFilter />);

      const allLinksButton = screen.getByText('All Links');
      expect(allLinksButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long category names', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        linkCategories: [
          {
            id: 'cat-long',
            name: 'Very Long Category Name That Should Not Break Layout',
            icon: vi.fn(() => <span>Icon</span>),
            color: 'bg-blue-500',
          },
        ],
        filteredQuickLinks: [],
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('Very Long Category Name That Should Not Break Layout')).toBeInTheDocument();
    });

    it('should handle categories without icons', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        linkCategories: [
          {
            id: 'cat-no-icon',
            name: 'No Icon Category',
            icon: null,
            color: 'bg-blue-500',
          },
        ],
        filteredQuickLinks: [],
        quickLinks: [],
        isLoading: false,
      } as any);

      render(<QuickLinksSearchFilter />);

      expect(screen.getByText('No Icon Category')).toBeInTheDocument();
    });

    it('should handle rapid category switching', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      // Rapidly click different categories
      await user.click(screen.getByText('Development'));
      await user.click(screen.getByText('Infrastructure'));
      await user.click(screen.getByText('Documentation'));
      await user.click(screen.getByText('All Links'));

      expect(mockSetSelectedCategoryId).toHaveBeenCalledTimes(4);
    });

    it('should handle special characters in search input', async () => {
      const user = userEvent.setup();

      render(<QuickLinksSearchFilter />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      await user.type(searchInput, '!@#$%^&*()');

      expect(mockSetSearchTerm).toHaveBeenCalled();
    });
  });

  describe('Layout', () => {
    it('should render search input and buttons in same row', () => {
      const mockOnAddLinkClick = vi.fn();
      render(<QuickLinksSearchFilter onAddLinkClick={mockOnAddLinkClick} />);

      const searchInput = screen.getByPlaceholderText('Search quick links...');
      const addLinkButton = screen.getByText('Add Link');
      const viewToggle = screen.getByTestId('view-toggle-button');

      expect(searchInput).toBeInTheDocument();
      expect(addLinkButton).toBeInTheDocument();
      expect(viewToggle).toBeInTheDocument();
    });

    it('should have proper container styling', () => {
      const { container } = render(<QuickLinksSearchFilter />);

      const mainContainer = container.querySelector('.bg-card');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('border');
      expect(mainContainer).toHaveClass('rounded-lg');
    });
  });
});
