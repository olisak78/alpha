import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
  };
});

import { useLocation } from 'react-router-dom';

describe('NotFound', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/unknown-route',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render 404 heading', () => {
      renderWithRouter(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('should render error message', () => {
      renderWithRouter(<NotFound />);

      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    });

    it('should render link to home', () => {
      renderWithRouter(<NotFound />);

      const homeLink = screen.getByText('Return to Home');
      expect(homeLink).toBeInTheDocument();
    });

    it('should have correct href on home link', () => {
      renderWithRouter(<NotFound />);

      const homeLink = screen.getByText('Return to Home');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Console Error Logging', () => {
    it('should log 404 error to console', () => {
      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with correct message', () => {
      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/unknown-route'
      );
    });

    it('should log the pathname from location', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/some/invalid/path',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/some/invalid/path'
      );
    });

    it('should log error only once on initial render', () => {
      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pathname Changes', () => {
    it('should log new error when pathname changes', () => {
      const { rerender } = renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/unknown-route'
      );

      // Change pathname
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/another/invalid/route',
        search: '',
        hash: '',
        state: null,
        key: 'new-key',
      });

      rerender(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenLastCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/another/invalid/route'
      );
    });

    it('should not log again if pathname stays the same', () => {
      const { rerender } = renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Rerender without changing pathname
      rerender(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      // Should still only be called once
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply correct container styling', () => {
      const { container } = renderWithRouter(<NotFound />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center', 'bg-gray-100');
    });

    it('should apply text-center to content wrapper', () => {
      const { container } = renderWithRouter(<NotFound />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should apply correct heading styling', () => {
      renderWithRouter(<NotFound />);

      const heading = screen.getByText('404');
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-4xl', 'font-bold', 'mb-4');
    });

    it('should apply correct paragraph styling', () => {
      renderWithRouter(<NotFound />);

      const paragraph = screen.getByText('Oops! Page not found');
      expect(paragraph.tagName).toBe('P');
      expect(paragraph).toHaveClass('text-xl', 'text-gray-600', 'mb-4');
    });

    it('should apply correct link styling', () => {
      renderWithRouter(<NotFound />);

      const link = screen.getByText('Return to Home');
      expect(link).toHaveClass('text-blue-500', 'hover:text-blue-700', 'underline');
    });
  });

  describe('Integration', () => {
    it('should call useLocation hook', () => {
      renderWithRouter(<NotFound />);

      expect(useLocation).toHaveBeenCalled();
    });

    it('should use pathname from useLocation', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/test-path',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/test-path'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle root path as 404', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/'
      );
    });

    it('should handle very long pathnames', () => {
      const longPath = '/very/long/path/that/goes/on/and/on/and/on/and/on';
      
      vi.mocked(useLocation).mockReturnValue({
        pathname: longPath,
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        longPath
      );
    });

    it('should handle pathnames with special characters', () => {
      const specialPath = '/path/with/special-chars_123!@#';
      
      vi.mocked(useLocation).mockReturnValue({
        pathname: specialPath,
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        specialPath
      );
    });

    it('should handle pathnames with query strings in location', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/invalid',
        search: '?param=value',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      // Should only log pathname, not search
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/invalid'
      );
    });

    it('should handle pathnames with hash in location', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/invalid',
        search: '',
        hash: '#section',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      // Should only log pathname, not hash
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/invalid'
      );
    });

    it('should handle empty pathname', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        ''
      );
    });

    it('should handle pathname with trailing slash', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/invalid/path/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/invalid/path/'
      );
    });
  });

  describe('Link Behavior', () => {
    it('should render as anchor tag', () => {
      renderWithRouter(<NotFound />);

      const link = screen.getByText('Return to Home');
      expect(link.tagName).toBe('A');
    });

    it('should have accessible link text', () => {
      renderWithRouter(<NotFound />);

      const link = screen.getByRole('link', { name: 'Return to Home' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('Multiple Renders', () => {
    it('should handle multiple renders with same pathname', () => {
      const { rerender } = renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      for (let i = 0; i < 5; i++) {
        rerender(
          <MemoryRouter>
            <NotFound />
          </MemoryRouter>
        );
      }

      // Should still only be called once if pathname doesn't change
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should log for each unique pathname', () => {
      const paths = ['/path1', '/path2', '/path3'];
      const { rerender } = renderWithRouter(<NotFound />);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      paths.forEach((path, index) => {
        vi.mocked(useLocation).mockReturnValue({
          pathname: path,
          search: '',
          hash: '',
          state: null,
          key: `key-${index}`,
        });

        rerender(
          <MemoryRouter>
            <NotFound />
          </MemoryRouter>
        );
      });

      // Should be called 4 times total (1 initial + 3 path changes)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Accessibility', () => {
    it('should have heading with correct hierarchy', () => {
      renderWithRouter(<NotFound />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('404');
    });

    it('should have accessible link', () => {
      renderWithRouter(<NotFound />);

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Return to Home');
    });
  });
});