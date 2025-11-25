import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { LinksGrid } from '../../../src/components/Links/LinksGrid';
import { LinkCategory } from '../../../src/types/developer-portal';
import { Code, Database } from 'lucide-react';

// Mock the UnifiedLinksGrid component
vi.mock('../../../src/components/Links/UnifiedLinksGrid', () => ({
  UnifiedLinksGrid: ({ links, linkCategories, viewMode, linksByCategory }: any) => (
    <div data-testid="unified-links-grid">
      <div data-testid="links-count">{links.length}</div>
      <div data-testid="categories-count">{linkCategories.length}</div>
      <div data-testid="view-mode">{viewMode}</div>
      <div data-testid="has-links-by-category">{linksByCategory ? 'true' : 'false'}</div>
    </div>
  ),
}));

describe('LinksGrid', () => {
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

  // Mock the LinksPageContext
  const mockContextValue = vi.hoisted(() => ({ 
    current: {
      filteredLinks: [],
      linksByCategory: {},
      linkCategories: [],
      viewMode: 'categorized' as const,
    } as any 
  }));
  
  vi.mock('../../../src/contexts/LinksPageContext', () => ({
    useLinksPageContext: () => mockContextValue.current,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize mock context with default values
    mockContextValue.current = {
      filteredLinks: mockLinks,
      linksByCategory: mockLinksByCategory,
      linkCategories: mockCategories,
      viewMode: 'categorized' as const,
    };
  });

  describe('Component Integration', () => {
    it('renders UnifiedLinksGrid with correct props', () => {
      render(<LinksGrid />);
      
      expect(screen.getByTestId('unified-links-grid')).toBeInTheDocument();
      expect(screen.getByTestId('links-count')).toHaveTextContent('3');
      expect(screen.getByTestId('categories-count')).toHaveTextContent('2');
      expect(screen.getByTestId('view-mode')).toHaveTextContent('categorized');
      expect(screen.getByTestId('has-links-by-category')).toHaveTextContent('true');
    });

    it('passes filteredLinks from context', () => {
      mockContextValue.current.filteredLinks = [mockLinks[0]];
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('links-count')).toHaveTextContent('1');
    });

    it('passes linkCategories from context', () => {
      mockContextValue.current.linkCategories = [mockCategories[0]];
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    });

    it('passes viewMode from context', () => {
      mockContextValue.current.viewMode = 'simple';
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('view-mode')).toHaveTextContent('simple');
    });

    it('passes linksByCategory from context', () => {
      mockContextValue.current.linksByCategory = undefined;
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('has-links-by-category')).toHaveTextContent('false');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty filteredLinks', () => {
      mockContextValue.current.filteredLinks = [];
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('links-count')).toHaveTextContent('0');
    });

    it('handles empty linkCategories', () => {
      mockContextValue.current.linkCategories = [];
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
    });

    it('handles missing linksByCategory', () => {
      mockContextValue.current.linksByCategory = null;
      
      render(<LinksGrid />);
      
      expect(screen.getByTestId('has-links-by-category')).toHaveTextContent('false');
    });
  });
});
