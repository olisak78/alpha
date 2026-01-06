import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickLinksGrid } from '@/components/tabs/MePageTabs/QuickLinksGrid';

// Mock the Zustand store hooks
vi.mock('@/stores/quickLinksStore', () => ({
  useViewMode: vi.fn(),
}));

// Mock the QuickLinksContext
vi.mock('@/contexts/QuickLinksContext', () => ({
  useQuickLinksContext: vi.fn(),
}));

// Mock the UnifiedLinksGrid component
vi.mock('@/components/Links/UnifiedLinksGrid', () => ({
  UnifiedLinksGrid: vi.fn(({ links, linkCategories, viewMode }) => (
    <div data-testid="unified-links-grid">
      <div data-testid="view-mode">{viewMode}</div>
      <div data-testid="links-count">{links.length}</div>
      <div data-testid="categories-count">{linkCategories.length}</div>
    </div>
  )),
}));

import { useViewMode } from '@/stores/quickLinksStore';
import { useQuickLinksContext } from '@/contexts/QuickLinksContext';
import { UnifiedLinksGrid } from '@/components/Links/UnifiedLinksGrid';

describe('QuickLinksGrid', () => {
  const mockQuickLinks = [
    {
      id: 'link-1',
      title: 'GitHub',
      url: 'https://github.com',
      icon: 'Github',
      category: 'Development',
      categoryId: 'cat-1',
      categoryColor: 'bg-blue-500',
      description: 'Code repository',
      tags: ['code', 'git'],
      isFavorite: true,
    },
    {
      id: 'link-2',
      title: 'Jira',
      url: 'https://jira.com',
      icon: 'CheckSquare',
      category: 'Project Management',
      categoryId: 'cat-2',
      categoryColor: 'bg-green-500',
      description: 'Issue tracking',
      tags: ['tasks'],
      isFavorite: true,
    },
  ];

  const mockLinkCategories = [
    {
      id: 'cat-1',
      name: 'Development',
      icon: vi.fn(),
      color: 'bg-blue-500',
    },
    {
      id: 'cat-2',
      name: 'Project Management',
      icon: vi.fn(),
      color: 'bg-green-500',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useViewMode).mockReturnValue('collapsed');

    vi.mocked(useQuickLinksContext).mockReturnValue({
      filteredQuickLinks: mockQuickLinks,
      linkCategories: mockLinkCategories,
      quickLinks: mockQuickLinks,
      isLoading: false,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      selectedCategoryId: 'all',
      setSelectedCategoryId: vi.fn(),
      viewMode: 'collapsed',
      setViewMode: vi.fn(),
      handleToggleFavorite: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      handleDeleteCancel: vi.fn(),
      handleEditClick: vi.fn(),
      deleteDialog: { isOpen: false, linkId: '', linkTitle: '' },
      editDialog: { isOpen: false, linkId: '' },
      handleEditCancel: vi.fn(),
    } as any);
  });

  describe('Rendering', () => {
    it('should render UnifiedLinksGrid component', () => {
      render(<QuickLinksGrid />);

      expect(screen.getByTestId('unified-links-grid')).toBeInTheDocument();
    });

    it('should pass filteredQuickLinks to UnifiedLinksGrid', () => {
      render(<QuickLinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: mockQuickLinks,
        }),
        expect.anything()
      );
    });

    it('should pass linkCategories to UnifiedLinksGrid', () => {
      render(<QuickLinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: mockLinkCategories,
        }),
        expect.anything()
      );
    });

    it('should pass viewMode to UnifiedLinksGrid', () => {
      render(<QuickLinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'collapsed',
        }),
        expect.anything()
      );
    });
  });

  describe('View Mode', () => {
    it('should render with collapsed view mode', () => {
      vi.mocked(useViewMode).mockReturnValue('collapsed');

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('collapsed');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'collapsed',
        }),
        expect.anything()
      );
    });

    it('should render with expanded view mode', () => {
      vi.mocked(useViewMode).mockReturnValue('expanded');

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('expanded');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'expanded',
        }),
        expect.anything()
      );
    });
  });

  describe('Data Scenarios', () => {
    it('should handle empty links array', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: [],
        linkCategories: mockLinkCategories,
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: [],
        }),
        expect.anything()
      );
    });

    it('should handle empty categories array', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: mockQuickLinks,
        linkCategories: [],
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: [],
        }),
        expect.anything()
      );
    });

    it('should handle both empty arrays', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: [],
        linkCategories: [],
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
    });

    it('should handle large number of links', () => {
      const manyLinks = Array.from({ length: 50 }, (_, i) => ({
        id: `link-${i}`,
        title: `Link ${i}`,
        url: `https://example.com/${i}`,
        icon: 'Link',
        category: 'Category',
        categoryId: 'cat-1',
        categoryColor: 'bg-gray-500',
        description: `Description ${i}`,
        tags: [`tag${i}`],
        isFavorite: true,
      }));

      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: manyLinks,
        linkCategories: mockLinkCategories,
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('50');
    });
  });

  describe('Filtered Data', () => {
    it('should display filtered links when search is active', () => {
      const filteredLinks = [mockQuickLinks[0]]; // Only one link after filtering

      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: filteredLinks,
        linkCategories: mockLinkCategories,
        searchTerm: 'GitHub',
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: filteredLinks,
        }),
        expect.anything()
      );
    });

    it('should display filtered links when category is selected', () => {
      const filteredLinks = [mockQuickLinks[0]]; // Only Development category

      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: filteredLinks,
        linkCategories: mockLinkCategories,
        selectedCategoryId: 'cat-1',
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
    });

    it('should handle no results after filtering', () => {
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: [],
        linkCategories: mockLinkCategories,
        searchTerm: 'nonexistent',
      } as any);

      render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
    });
  });

  describe('Integration with Store and Context', () => {
    it('should use viewMode from Zustand store', () => {
      const mockViewMode = 'expanded';
      vi.mocked(useViewMode).mockReturnValue(mockViewMode);

      render(<QuickLinksGrid />);

      expect(useViewMode).toHaveBeenCalled();
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: mockViewMode,
        }),
        expect.anything()
      );
    });

    it('should use filteredQuickLinks from context', () => {
      const customLinks = [
        {
          id: 'custom-1',
          title: 'Custom Link',
          url: 'https://custom.com',
          icon: 'Star',
          category: 'Custom',
          categoryId: 'cat-custom',
          categoryColor: 'bg-purple-500',
          isFavorite: true,
        },
      ];

      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: customLinks,
        linkCategories: mockLinkCategories,
      } as any);

      render(<QuickLinksGrid />);

      expect(useQuickLinksContext).toHaveBeenCalled();
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: customLinks,
        }),
        expect.anything()
      );
    });

    it('should use linkCategories from context', () => {
      const customCategories = [
        {
          id: 'cat-custom',
          name: 'Custom Category',
          icon: vi.fn(),
          color: 'bg-purple-500',
        },
      ];

      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: mockQuickLinks,
        linkCategories: customCategories,
      } as any);

      render(<QuickLinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: customCategories,
        }),
        expect.anything()
      );
    });
  });

  describe('Re-rendering', () => {
    it('should re-render when viewMode changes', () => {
      const { rerender } = render(<QuickLinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('collapsed');

      // Change viewMode
      vi.mocked(useViewMode).mockReturnValue('expanded');
      rerender(<QuickLinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('expanded');
    });

    it('should re-render when filteredQuickLinks changes', () => {
      const { rerender } = render(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('2');

      // Change links
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: [mockQuickLinks[0]],
        linkCategories: mockLinkCategories,
      } as any);
      rerender(<QuickLinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
    });

    it('should re-render when linkCategories changes', () => {
      const { rerender } = render(<QuickLinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('2');

      // Change categories
      vi.mocked(useQuickLinksContext).mockReturnValue({
        filteredQuickLinks: mockQuickLinks,
        linkCategories: [mockLinkCategories[0]],
      } as any);
      rerender(<QuickLinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    });
  });
});