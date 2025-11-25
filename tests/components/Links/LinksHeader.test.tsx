import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LinksHeader } from '../../../src/components/Links/LinksHeader';

// Mock the Badge component
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('LinksHeader', () => {
  // Mock the LinksPageContext
  const mockContextValue = vi.hoisted(() => ({ 
    current: {
      filteredLinks: [],
    } as any 
  }));

  vi.mock('../../../src/contexts/LinksPageContext', () => ({
    useLinksPageContext: () => mockContextValue.current,
    SHARED_ICON_MAP: {},
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    // Initialize mock context with default values
    mockContextValue.current = {
      filteredLinks: [],
    };
  });

  describe('Component Rendering', () => {
    it('renders header with title and correct structure', () => {
      render(<LinksHeader />);
      
      expect(screen.getByText('Important Links')).toBeInTheDocument();
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Important Links');
      expect(heading).toHaveClass('text-xl', 'font-semibold');
      
      const container = screen.getByText('Important Links').closest('.flex.items-center.gap-3');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Link Count Badge', () => {
    it('displays correct link count with proper singular/plural form', () => {
      // Test 0 links
      mockContextValue.current.filteredLinks = [];
      const { rerender } = render(<LinksHeader />);
      expect(screen.getByText('0 links')).toBeInTheDocument();
      
      // Test 1 link (singular)
      mockContextValue.current.filteredLinks = [
        { id: '1', title: 'Test Link', url: 'https://example.com' }
      ];
      rerender(<LinksHeader />);
      expect(screen.getByText('1 link')).toBeInTheDocument();
      
      // Test multiple links (plural)
      mockContextValue.current.filteredLinks = [
        { id: '1', title: 'Test Link 1', url: 'https://example1.com' },
        { id: '2', title: 'Test Link 2', url: 'https://example2.com' }
      ];
      rerender(<LinksHeader />);
      expect(screen.getByText('2 links')).toBeInTheDocument();
    });

    it('renders badge with correct styling and variant', () => {
      render(<LinksHeader />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'outline');
      expect(badge).toHaveClass('text-sm');
    });
  });

  describe('Edge Cases & Accessibility', () => {
    it('handles invalid filteredLinks gracefully', () => {
      mockContextValue.current.filteredLinks = undefined as any;
      
      expect(() => render(<LinksHeader />)).not.toThrow();
      expect(screen.getByText('0 links')).toBeInTheDocument();
    });

    it('provides proper semantic structure and styling', () => {
      render(<LinksHeader />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Important Links');
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });
  });
});
