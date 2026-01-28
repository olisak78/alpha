import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrganizationProtectedRoute from '@/components/OrganizationProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/developer-portal';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OrganizationProtectedRoute', () => {
  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render children for users in sap-cfs organization', () => {
    const sapCfsUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@sap.com',
      provider: 'githubtools',
      organization: 'sap-cfs'
    };

    mockUseAuth.mockReturnValue({
      user: sapCfsUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
  });

  it('should redirect to home for users not in sap-cfs organization', () => {
    const nonSapCfsUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      provider: 'githubtools',
      organization: 'other-org'
    };

    mockUseAuth.mockReturnValue({
      user: nonSapCfsUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to home for users with no organization', () => {
    const userWithoutOrg: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      provider: 'githubtools'
    };

    mockUseAuth.mockReturnValue({
      user: userWithoutOrg,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to home for null user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should handle case-insensitive organization matching', () => {
    const sapCfsUserUpperCase: User = {
      id: '1',
      name: 'Test User',
      email: 'test@sap.com',
      provider: 'githubtools',
      organization: 'SAP-CFS'
    };

    mockUseAuth.mockReturnValue({
      user: sapCfsUserUpperCase,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    renderWithRouter(
      <OrganizationProtectedRoute>
        <TestComponent />
      </OrganizationProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
  });
});
