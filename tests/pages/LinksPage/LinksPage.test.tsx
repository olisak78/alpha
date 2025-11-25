import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LinksPage from '../../../src/pages/LinksPage';

// Mock all the child components
vi.mock('../../../src/components/Links/LinksHeader', () => ({
  LinksHeader: () => <div data-testid="links-header">Links Header</div>,
}));

vi.mock('../../../src/components/Links/LinksSearchFilter', () => ({
  LinksSearchFilter: () => <div data-testid="links-search-filter">Search Filter</div>,
}));

vi.mock('../../../src/components/Links/LinksGrid', () => ({
  LinksGrid: () => <div data-testid="links-grid">Links Grid</div>,
}));

vi.mock('../../../src/components/Links/NoLinksFound', () => ({
  NoLinksFound: () => <div data-testid="no-links-found">No Links Found</div>,
}));

vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

// Mock the LinksPageContext
const mockContextValue = vi.hoisted(() => ({
  current: {
    isLoading: false,
    filteredLinks: [],
  } as any,
}));

vi.mock('../../../src/contexts/LinksPageContext', () => ({
  LinksProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="links-provider">{children}</div>
  ),
  useLinksPageContext: () => mockContextValue.current,
}));

describe('LinksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context to default values
    mockContextValue.current = {
      isLoading: false,
      filteredLinks: [],
    };
  });

  describe('Component Rendering', () => {
    it('renders with correct structure and components', () => {
      render(<LinksPage />);
      
      expect(screen.getByTestId('links-provider')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      expect(screen.getByTestId('links-header')).toBeInTheDocument();
      expect(screen.getByTestId('links-search-filter')).toBeInTheDocument();
      expect(screen.getByTestId('links-grid')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      mockContextValue.current.isLoading = true;
      
      render(<LinksPage />);
      
      expect(screen.getByText('Loading links...')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('links-header')).not.toBeInTheDocument();
    });
  });

  describe('No Links Found State', () => {
    it('shows/hides NoLinksFound based on filteredLinks', () => {
      // Test empty links
      mockContextValue.current.filteredLinks = [];
      const { rerender } = render(<LinksPage />);
      expect(screen.getByTestId('no-links-found')).toBeInTheDocument();
      
      // Test with links
      mockContextValue.current.filteredLinks = [
        { id: '1', title: 'Test Link', url: 'https://example.com' }
      ];
      rerender(<LinksPage />);
      expect(screen.queryByTestId('no-links-found')).not.toBeInTheDocument();
    });
  });

  describe('Context Integration & Edge Cases', () => {
    it('responds to context changes', () => {
      const { rerender } = render(<LinksPage />);
      
      // Change to loading
      mockContextValue.current.isLoading = true;
      rerender(<LinksPage />);
      expect(screen.getByText('Loading links...')).toBeInTheDocument();
      
      // Back to normal
      mockContextValue.current.isLoading = false;
      rerender(<LinksPage />);
      expect(screen.getByTestId('links-header')).toBeInTheDocument();
    });

    it('handles invalid filteredLinks gracefully', () => {
      mockContextValue.current.filteredLinks = undefined as any;
      expect(() => render(<LinksPage />)).not.toThrow();
      
      mockContextValue.current.filteredLinks = null as any;
      expect(() => render(<LinksPage />)).not.toThrow();
    });
  });
});
