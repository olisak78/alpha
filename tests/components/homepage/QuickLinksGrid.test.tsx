import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QuickLinksGrid } from '../../../src/components/tabs/MePageTabs/QuickLinksGrid';
import { LinkCategory } from '../../../src/types/developer-portal';
import { Code, Database } from 'lucide-react';

// Mock the UnifiedLinksGrid component
vi.mock('../../../src/components/Links/UnifiedLinksGrid', () => ({
  UnifiedLinksGrid: ({ links, linkCategories, viewMode }: any) => (
    <div data-testid="unified-links-grid">
      <div data-testid="links-count">{links?.length || 0}</div>
      <div data-testid="categories-count">{linkCategories?.length || 0}</div>
      <div data-testid="view-mode">{viewMode || 'undefined'}</div>
    </div>
  ),
}));

describe('QuickLinksGrid', () => {
  const mockCategories: LinkCategory[] = [
    { id: 'tools', name: 'Development Tools', icon: Code, color: 'bg-blue-500' },
  ];

  const mockQuickLinks = [
    {
      id: 'link-1',
      title: 'VS Code',
      url: 'https://code.visualstudio.com',
      icon: 'Code',
      category: 'Development Tools',
      categoryId: 'tools',
      categoryColor: 'bg-blue-500',
      description: 'Code editor',
      tags: ['editor'],
      isFavorite: true,
    },
  ];

  // Mock the QuickLinksContext
  const mockContextValue = vi.hoisted(() => ({ 
    current: {
      filteredQuickLinks: [],
      linkCategories: [],
      viewMode: 'categorized' as const,
    } as any 
  }));
  
  vi.mock('../../../src/contexts/QuickLinksContext', () => ({
    useQuickLinksContext: () => mockContextValue.current,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue.current = {
      filteredQuickLinks: mockQuickLinks,
      linkCategories: mockCategories,
      viewMode: 'categorized' as const,
    };
  });

  it('renders UnifiedLinksGrid with QuickLinksContext data', () => {
    render(<QuickLinksGrid />);
    
    expect(screen.getByTestId('unified-links-grid')).toBeInTheDocument();
    expect(screen.getByTestId('links-count')).toHaveTextContent('1');
    expect(screen.getByTestId('categories-count')).toHaveTextContent('1');
    expect(screen.getByTestId('view-mode')).toHaveTextContent('categorized');
  });

  it('handles QuickLink data structure with all properties', () => {
    const quickLinkWithAllProperties = {
      id: 'test-link',
      title: 'Test Link',
      url: 'https://test.com',
      icon: 'TestIcon',
      category: 'Test Category',
      categoryId: 'test-category',
      categoryColor: 'bg-test-500',
      description: 'Test description',
      tags: ['test', 'example'],
      isFavorite: true,
    };
    
    mockContextValue.current.filteredQuickLinks = [quickLinkWithAllProperties];
    
    render(<QuickLinksGrid />);
    
    expect(screen.getByTestId('links-count')).toHaveTextContent('1');
  });

  it('handles empty context gracefully', () => {
    mockContextValue.current = {
      filteredQuickLinks: [],
      linkCategories: [],
      viewMode: 'simple',
    };
    
    render(<QuickLinksGrid />);
    
    expect(screen.getByTestId('unified-links-grid')).toBeInTheDocument();
    expect(screen.getByTestId('links-count')).toHaveTextContent('0');
    expect(screen.getByTestId('view-mode')).toHaveTextContent('simple');
  });
});
