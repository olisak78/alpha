import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinksGrid } from '@/components/Links/LinksGrid';

// Mock the Zustand store hooks
vi.mock('@/stores/linksPageStore', () => ({
  useLinksViewMode: vi.fn(),
}));

// Mock the LinksPageContext
vi.mock('@/contexts/LinksPageContext', () => ({
  useLinksPageContext: vi.fn(),
}));

// Mock the UnifiedLinksGrid component
vi.mock('@/components/Links/UnifiedLinksGrid', () => ({
  UnifiedLinksGrid: vi.fn(({ links, linkCategories, viewMode, linksByCategory }) => (
    <div data-testid="unified-links-grid">
      <div data-testid="view-mode">{viewMode}</div>
      <div data-testid="links-count">{links.length}</div>
      <div data-testid="categories-count">{linkCategories.length}</div>
      <div data-testid="links-by-category-count">
        {Object.keys(linksByCategory || {}).length}
      </div>
    </div>
  )),
}));

import { useLinksViewMode } from '@/stores/linksPageStore';
import { useLinksPageContext } from '@/contexts/LinksPageContext';
import { UnifiedLinksGrid } from '@/components/Links/UnifiedLinksGrid';

describe('LinksGrid', () => {
  const mockLinks = [
    {
      id: 'link-1',
      title: 'API Documentation',
      url: 'https://api.example.com/docs',
      description: 'Complete API reference',
      categoryId: 'cat-1',
      tags: ['api', 'docs'],
      favorite: true,
    },
    {
      id: 'link-2',
      title: 'Cloud Console',
      url: 'https://console.cloud.com',
      description: 'Cloud management portal',
      categoryId: 'cat-2',
      tags: ['cloud', 'admin'],
      favorite: false,
    },
    {
      id: 'link-3',
      title: 'Monitoring Dashboard',
      url: 'https://monitoring.example.com',
      description: 'System monitoring',
      categoryId: 'cat-1',
      tags: ['monitoring'],
      favorite: true,
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
      name: 'Infrastructure',
      icon: vi.fn(),
      color: 'bg-green-500',
    },
  ];

  const mockLinksByCategory = {
    'cat-1': [mockLinks[0], mockLinks[2]], // API Documentation, Monitoring Dashboard
    'cat-2': [mockLinks[1]], // Cloud Console
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useLinksViewMode).mockReturnValue('collapsed');

    vi.mocked(useLinksPageContext).mockReturnValue({
      filteredLinks: mockLinks,
      linkCategories: mockLinkCategories,
      linksByCategory: mockLinksByCategory,
      links: mockLinks,
      isLoading: false,
      searchTerm: '',
      selectedCategoryId: 'all',
      setSearchTerm: vi.fn(),
      setSelectedCategoryId: vi.fn(),
      viewMode: 'collapsed',
      setViewMode: vi.fn(),
      handleToggleFavorite: vi.fn(),
      currentUser: undefined,
      favoriteLinkIds: new Set(['link-1', 'link-3']),
    } as any);
  });

  describe('Rendering', () => {
    it('should render UnifiedLinksGrid component', () => {
      render(<LinksGrid />);

      expect(screen.getByTestId('unified-links-grid')).toBeInTheDocument();
    });

    it('should pass filteredLinks to UnifiedLinksGrid', () => {
      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: mockLinks,
        }),
        expect.anything()
      );
    });

    it('should pass linkCategories to UnifiedLinksGrid', () => {
      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: mockLinkCategories,
        }),
        expect.anything()
      );
    });

    it('should pass viewMode to UnifiedLinksGrid', () => {
      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'collapsed',
        }),
        expect.anything()
      );
    });

    it('should pass linksByCategory to UnifiedLinksGrid', () => {
      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linksByCategory: mockLinksByCategory,
        }),
        expect.anything()
      );
    });
  });

  describe('View Mode', () => {
    it('should render with collapsed view mode', () => {
      vi.mocked(useLinksViewMode).mockReturnValue('collapsed');

      render(<LinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('collapsed');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'collapsed',
        }),
        expect.anything()
      );
    });

    it('should render with expanded view mode', () => {
      vi.mocked(useLinksViewMode).mockReturnValue('expanded');

      render(<LinksGrid />);

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
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: [],
        linkCategories: mockLinkCategories,
        linksByCategory: {},
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('0');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: [],
          linksByCategory: {},
        }),
        expect.anything()
      );
    });

    it('should handle empty categories array', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: [],
        linksByCategory: mockLinksByCategory,
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: [],
        }),
        expect.anything()
      );
    });

    it('should handle all empty data', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: [],
        linkCategories: [],
        linksByCategory: {},
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('0');
    });

    it('should handle large number of links', () => {
      const manyLinks = Array.from({ length: 100 }, (_, i) => ({
        id: `link-${i}`,
        title: `Link ${i}`,
        url: `https://example.com/${i}`,
        description: `Description ${i}`,
        categoryId: `cat-${i % 5}`,
        tags: [`tag${i}`],
        favorite: i % 2 === 0,
      }));

      const manyLinksByCategory = manyLinks.reduce((acc, link) => {
        if (!acc[link.categoryId]) acc[link.categoryId] = [];
        acc[link.categoryId].push(link);
        return acc;
      }, {} as Record<string, typeof manyLinks>);

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: manyLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: manyLinksByCategory,
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('100');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('5');
    });
  });

  describe('Filtered Data', () => {
    it('should display filtered links when search is active', () => {
      const filteredLinks = [mockLinks[0]]; // Only API Documentation
      const filteredByCategory = {
        'cat-1': [mockLinks[0]],
      };

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: filteredByCategory,
        searchTerm: 'API',
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('1');
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          links: filteredLinks,
          linksByCategory: filteredByCategory,
        }),
        expect.anything()
      );
    });

    it('should display filtered links when category is selected', () => {
      const filteredLinks = [mockLinks[0], mockLinks[2]]; // Only Development category
      const filteredByCategory = {
        'cat-1': [mockLinks[0], mockLinks[2]],
      };

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: filteredByCategory,
        selectedCategoryId: 'cat-1',
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('2');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('1');
    });

    it('should handle no results after filtering', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: [],
        linkCategories: mockLinkCategories,
        linksByCategory: {},
        searchTerm: 'nonexistent',
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('0');
    });

    it('should handle single category with multiple links', () => {
      const singleCategoryLinks = mockLinks.map(link => ({ ...link, categoryId: 'cat-1' }));
      const singleCategoryByCategory = {
        'cat-1': singleCategoryLinks,
      };

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: singleCategoryLinks,
        linkCategories: [mockLinkCategories[0]],
        linksByCategory: singleCategoryByCategory,
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('3');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('1');
    });
  });

  describe('Integration with Store and Context', () => {
    it('should use viewMode from Zustand store', () => {
      const mockViewMode = 'expanded';
      vi.mocked(useLinksViewMode).mockReturnValue(mockViewMode);

      render(<LinksGrid />);

      expect(useLinksViewMode).toHaveBeenCalled();
      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: mockViewMode,
        }),
        expect.anything()
      );
    });

    it('should use filteredLinks from context', () => {
      const customLinks = [
        {
          id: 'custom-1',
          title: 'Custom Link',
          url: 'https://custom.com',
          description: 'Custom description',
          categoryId: 'cat-custom',
          tags: ['custom'],
          favorite: true,
        },
      ];

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: customLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: { 'cat-custom': customLinks },
      } as any);

      render(<LinksGrid />);

      expect(useLinksPageContext).toHaveBeenCalled();
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

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: customCategories,
        linksByCategory: mockLinksByCategory,
      } as any);

      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linkCategories: customCategories,
        }),
        expect.anything()
      );
    });

    it('should use linksByCategory from context', () => {
      const customLinksByCategory = {
        'cat-custom': [mockLinks[0]],
        'cat-other': [mockLinks[1], mockLinks[2]],
      };

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: customLinksByCategory,
      } as any);

      render(<LinksGrid />);

      expect(UnifiedLinksGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          linksByCategory: customLinksByCategory,
        }),
        expect.anything()
      );
    });
  });

  describe('Re-rendering', () => {
    it('should re-render when viewMode changes', () => {
      const { rerender } = render(<LinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('collapsed');

      // Change viewMode
      vi.mocked(useLinksViewMode).mockReturnValue('expanded');
      rerender(<LinksGrid />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('expanded');
    });

    it('should re-render when filteredLinks changes', () => {
      const { rerender } = render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('3');

      // Change links
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: [mockLinks[0]],
        linkCategories: mockLinkCategories,
        linksByCategory: { 'cat-1': [mockLinks[0]] },
      } as any);
      rerender(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
    });

    it('should re-render when linkCategories changes', () => {
      const { rerender } = render(<LinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('2');

      // Change categories
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: [mockLinkCategories[0]],
        linksByCategory: mockLinksByCategory,
      } as any);
      rerender(<LinksGrid />);

      expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    });

    it('should re-render when linksByCategory changes', () => {
      const { rerender } = render(<LinksGrid />);

      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('2');

      // Change linksByCategory to single category
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: { 'cat-1': mockLinks },
      } as any);
      rerender(<LinksGrid />);

      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined linksByCategory gracefully', () => {
      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: mockLinks,
        linkCategories: mockLinkCategories,
        linksByCategory: undefined,
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('0');
    });

    it('should handle links with missing category', () => {
      const linksWithMissingCategory = [
        ...mockLinks,
        {
          id: 'link-orphan',
          title: 'Orphan Link',
          url: 'https://orphan.com',
          description: 'No category',
          categoryId: 'cat-nonexistent',
          tags: [],
          favorite: false,
        },
      ];

      const linksByCategory = {
        ...mockLinksByCategory,
        'cat-nonexistent': [linksWithMissingCategory[3]],
      };

      vi.mocked(useLinksPageContext).mockReturnValue({
        filteredLinks: linksWithMissingCategory,
        linkCategories: mockLinkCategories,
        linksByCategory,
      } as any);

      render(<LinksGrid />);

      expect(screen.getByTestId('links-count')).toHaveTextContent('4');
      expect(screen.getByTestId('links-by-category-count')).toHaveTextContent('3');
    });
  });
});