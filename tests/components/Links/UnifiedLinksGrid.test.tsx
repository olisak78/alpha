import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { UnifiedLinksGrid } from '../../../src/components/Links/UnifiedLinksGrid';
import { LinkCategory } from '../../../src/types/developer-portal';
import { Code, Database } from 'lucide-react';

// Mock the UnifiedLinkCard component
vi.mock('../../../src/components/Links/UnifiedLinkCard', () => ({
  UnifiedLinkCard: ({ linkData, variant }: any) => (
    <div data-testid="unified-link-card" data-link-id={linkData.id} data-variant={variant}>
      {linkData.title}
    </div>
  ),
}));

// Mock the Badge component
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

// Mock the cn utility function
vi.mock('../../../src/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-down-icon" {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-right-icon" {...props} />
  ),
  Code: ({ className, ...props }: any) => (
    <svg className={className} data-testid="code-icon" {...props} />
  ),
  Database: ({ className, ...props }: any) => (
    <svg className={className} data-testid="database-icon" {...props} />
  ),
}));

describe('UnifiedLinksGrid', () => {
  const mockCategories: LinkCategory[] = [
    { id: 'tools', name: 'Development Tools', icon: Code, color: 'bg-blue-500' },
    { id: 'databases', name: 'Databases', icon: Database, color: 'bg-green-500' },
  ];

  const mockLinks = [
    {
      id: 'link-1',
      title: 'VS Code',
      url: 'https://code.visualstudio.com',
      description: 'Code editor',
      categoryId: 'tools',
      tags: ['editor'],
      favorite: false,
    },
    {
      id: 'link-2',
      title: 'PostgreSQL',
      url: 'https://postgresql.org',
      description: 'Database',
      categoryId: 'databases',
      tags: ['database'],
      favorite: true,
    },
    {
      id: 'link-3',
      title: 'Git',
      url: 'https://git-scm.com',
      description: 'Version control',
      categoryId: 'tools',
      tags: ['vcs'],
      favorite: false,
    },
  ];

  const mockLinksByCategory = {
    tools: [mockLinks[0], mockLinks[2]],
    databases: [mockLinks[1]],
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  describe('Expanded View Mode', () => {
    it('renders all links in a grid when viewMode is expanded', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="expanded"
        />
      );
      
      // Check that all links are rendered
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('Git')).toBeInTheDocument();
      
      // Check that all cards use 'full' variant
      const linkCards = screen.getAllByTestId('unified-link-card');
      expect(linkCards).toHaveLength(3);
      linkCards.forEach(card => {
        expect(card).toHaveAttribute('data-variant', 'full');
      });
    });

    it('applies correct grid classes in expanded view', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="expanded"
        />
      );
      
      const gridContainer = screen.getByText('VS Code').closest('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.gap-4');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Collapsed View Mode', () => {
    it('renders categories with links when viewMode is collapsed', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      // Check category headers
      expect(screen.getByText('Development Tools')).toBeInTheDocument();
      expect(screen.getByText('Databases')).toBeInTheDocument();
      
      // Check category icons
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();
      
      // Check link counts in badges
      expect(screen.getByText('2 links')).toBeInTheDocument();
      expect(screen.getByText('1 link')).toBeInTheDocument();
    });

    it('groups links by category when linksByCategory is not provided', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
        />
      );
      
      // Should still render categories and links
      expect(screen.getByText('Development Tools')).toBeInTheDocument();
      expect(screen.getByText('Databases')).toBeInTheDocument();
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('Git')).toBeInTheDocument();
    });

    it('renders links with compact variant in collapsed view', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const linkCards = screen.getAllByTestId('unified-link-card');
      linkCards.forEach(card => {
        expect(card).toHaveAttribute('data-variant', 'compact');
      });
    });

    it('shows correct chevron icons for collapsed/expanded state', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      // Initially expanded - should show chevron down
      expect(screen.getAllByTestId('chevron-down-icon')).toHaveLength(2);
      expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('collapses category when chevron is clicked', async () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      // Find the first chevron button
      const chevronButtons = screen.getAllByRole('button', { name: /expand category|collapse category/i });
      const firstChevronButton = chevronButtons[0];
      
      // Click to collapse
      await user.click(firstChevronButton);
      
      // Should show chevron right (collapsed state)
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
      
      // Links should be hidden (not in DOM when collapsed)
      expect(screen.queryByText('VS Code')).not.toBeInTheDocument();
      expect(screen.queryByText('Git')).not.toBeInTheDocument();
      
      // Other category should still be expanded
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    });

    it('expands category when chevron is clicked again', async () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const chevronButtons = screen.getAllByRole('button', { name: /expand category|collapse category/i });
      const firstChevronButton = chevronButtons[0];
      
      // Collapse first
      await user.click(firstChevronButton);
      expect(screen.queryByText('VS Code')).not.toBeInTheDocument();
      
      // Expand again
      await user.click(firstChevronButton);
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(screen.getByText('Git')).toBeInTheDocument();
    });

    it('handles multiple categories independently', async () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const chevronButtons = screen.getAllByRole('button', { name: /expand category|collapse category/i });
      
      // Collapse first category
      await user.click(chevronButtons[0]);
      expect(screen.queryByText('VS Code')).not.toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      
      // Collapse second category
      await user.click(chevronButtons[1]);
      expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument();
      
      // Expand first category
      await user.click(chevronButtons[0]);
      expect(screen.getByText('VS Code')).toBeInTheDocument();
      expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    it('shows singular "link" for single item', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      expect(screen.getByText('1 link')).toBeInTheDocument();
    });

    it('shows plural "links" for multiple items', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      expect(screen.getByText('2 links')).toBeInTheDocument();
    });

    it('renders badges with correct variant', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const badges = screen.getAllByTestId('badge');
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant', 'secondary');
      });
    });
  });

  describe('Edge Cases', () => {
    it('returns null when no links are provided', () => {
      const { container } = render(
        <UnifiedLinksGrid
          links={[]}
          linkCategories={mockCategories}
          viewMode="collapsed"
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('filters out categories without links', () => {
      const linksWithOneCategory = [mockLinks[0]]; // Only tools category
      
      render(
        <UnifiedLinksGrid
          links={linksWithOneCategory}
          linkCategories={mockCategories}
          viewMode="collapsed"
        />
      );
      
      expect(screen.getByText('Development Tools')).toBeInTheDocument();
      expect(screen.queryByText('Databases')).not.toBeInTheDocument();
    });

    it('handles categories without icons', () => {
      const categoriesWithoutIcons = [
        { id: 'no-icon', name: 'No Icon Category', icon: undefined as any, color: 'bg-gray-500' }
      ];
      const linksForNoIconCategory = [{ ...mockLinks[0], categoryId: 'no-icon' }];
      
      render(
        <UnifiedLinksGrid
          links={linksForNoIconCategory}
          linkCategories={categoriesWithoutIcons}
          viewMode="collapsed"
        />
      );
      
      expect(screen.getByText('No Icon Category')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper button accessibility', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const chevronButtons = screen.getAllByRole('button');
      chevronButtons.forEach(button => {
        expect(button).toHaveAttribute('title');
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('maintains semantic structure', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      // Check for proper heading structure
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Development Tools');
      expect(headings[1]).toHaveTextContent('Databases');
    });

    it('shows correct button titles for accessibility', () => {
      render(
        <UnifiedLinksGrid
          links={mockLinks}
          linkCategories={mockCategories}
          viewMode="collapsed"
          linksByCategory={mockLinksByCategory}
        />
      );
      
      const chevronButtons = screen.getAllByRole('button', { name: /collapse category/i });
      expect(chevronButtons).toHaveLength(2);
      
      chevronButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Collapse category');
      });
    });
  });
});
