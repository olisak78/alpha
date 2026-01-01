import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to, state, replace }) => (
      <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)} data-replace={replace}>
        Navigate to {to}
      </div>
    )),
  };
});

describe('ProtectedRoute', () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display loading spinner with correct styling', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-primary');
    });

    it('should center loading spinner on screen', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const loadingContainer = container.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should not render children during loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not navigate during loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Not Authenticated State', () => {
    it('should navigate to /login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toBeInTheDocument();
      expect(navigate).toHaveAttribute('data-to', '/login');
    });

    it('should pass current location in state when redirecting', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/protected/page']}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const stateAttr = navigate.getAttribute('data-state');
      expect(stateAttr).toBeTruthy();
      
      const state = JSON.parse(stateAttr!);
      expect(state).toHaveProperty('from');
      expect(state.from).toHaveProperty('pathname', '/protected/page');
    });

    it('should use replace navigation when redirecting', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-replace', 'true');
    });

    it('should not render children when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not show loading spinner when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not show loading spinner when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should not navigate when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('should render fragment wrapper around children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="child">Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const child = screen.getByTestId('child');
      expect(child).toBeInTheDocument();
    });
  });

  describe('Different Children Rendering', () => {
    it('should render simple text children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            Simple text content
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('should render complex component children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const ComplexComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      );

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ComplexComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>First Child</div>
            <div>Second Child</div>
            <div>Third Child</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('should render nested children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>
              <div>
                <span>Deeply nested content</span>
              </div>
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Deeply nested content')).toBeInTheDocument();
    });

    it('should render children with props', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const ChildWithProps = ({ message }: { message: string }) => (
        <div>{message}</div>
      );

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ChildWithProps message="Hello from props" />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Hello from props')).toBeInTheDocument();
    });
  });

  describe('Location State Scenarios', () => {
    it('should pass pathname from current location', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Dashboard</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from.pathname).toBe('/dashboard');
    });

    it('should pass search params from current location', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/search?query=test&page=2']}>
          <ProtectedRoute>
            <div>Search Results</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from.search).toBe('?query=test&page=2');
    });

    it('should pass hash from current location', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/page#section']}>
          <ProtectedRoute>
            <div>Page with Section</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from.hash).toBe('#section');
    });

    it('should handle root path', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/']}>
          <ProtectedRoute>
            <div>Home</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from.pathname).toBe('/');
    });

    it('should handle deeply nested paths', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/app/users/123/settings/profile']}>
          <ProtectedRoute>
            <div>User Settings</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from.pathname).toBe('/app/users/123/settings/profile');
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Update to authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should transition from loading to not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Update to not authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });

    it('should transition from authenticated to not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();

      // User logs out
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            {null}
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            {undefined}
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            {false}
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      const showContent = true;

      render(
        <MemoryRouter>
          <ProtectedRoute>
            {showContent && <div>Conditional Content</div>}
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
    });

    it('should prioritize loading state over authentication state', () => {
      // Even if authenticated, should show loading if isLoading is true
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Integration with Router', () => {
    it('should work with MemoryRouter', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Content in MemoryRouter</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Content in MemoryRouter')).toBeInTheDocument();
    });

    it('should preserve location context', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <div>Protected</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const navigate = screen.getByTestId('navigate');
      const state = JSON.parse(navigate.getAttribute('data-state')!);
      expect(state.from).toBeDefined();
      expect(state.from.pathname).toBe('/protected');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should maintain semantic structure in loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });
  });
});