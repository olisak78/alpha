import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useDualAuthStore
vi.mock('@/stores/useDualAuthStore', () => ({
  useDualAuthStore: vi.fn(),
}));

// Mock authService functions
vi.mock('@/services/authService', () => ({
  authService: vi.fn(),
  authServiceWdf: vi.fn(),
}));

// Mock react-router-dom Navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>),
  };
});

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children, className }) => <div data-testid="card" className={className}>{children}</div>),
  CardContent: vi.fn(({ children, className }) => <div data-testid="card-content" className={className}>{children}</div>),
  CardDescription: vi.fn(({ children }) => <div data-testid="card-description">{children}</div>),
  CardHeader: vi.fn(({ children, className }) => <div data-testid="card-header" className={className}>{children}</div>),
  CardTitle: vi.fn(({ children, className }) => <div data-testid="card-title" className={className}>{children}</div>),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, disabled, className, variant }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  )),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Github: vi.fn(() => <div data-testid="github-icon">GitHub Icon</div>),
  CheckCircle2: vi.fn(() => <div data-testid="check-icon">Check Icon</div>),
  AlertCircle: vi.fn(() => <div data-testid="alert-icon">Alert Icon</div>),
}));

import { useAuth } from '@/contexts/AuthContext';
import { useDualAuthStore } from '@/stores/useDualAuthStore';
import { authService, authServiceWdf } from '@/services/authService';
import { Navigate } from 'react-router-dom';

describe('LoginPage', () => {
  const mockSetGithubToolsAuthenticated = vi.fn();
  const mockSetGithubWdfAuthenticated = vi.fn();
  const mockSetGithubToolsLoading = vi.fn();
  const mockSetGithubWdfLoading = vi.fn();
  const mockSetGithubToolsError = vi.fn();
  const mockSetGithubWdfError = vi.fn();
  const mockIsBothAuthenticated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear sessionStorage
    sessionStorage.clear();

    // Default useAuth mock
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Default useDualAuthStore mock
    vi.mocked(useDualAuthStore).mockReturnValue({
      isGithubToolsAuthenticated: false,
      isGithubWdfAuthenticated: false,
      isGithubToolsLoading: false,
      isGithubWdfLoading: false,
      githubToolsError: null,
      githubWdfError: null,
      setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
      setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
      setGithubToolsLoading: mockSetGithubToolsLoading,
      setGithubWdfLoading: mockSetGithubWdfLoading,
      setGithubToolsError: mockSetGithubToolsError,
      setGithubWdfError: mockSetGithubWdfError,
      isBothAuthenticated: mockIsBothAuthenticated,
      reset: vi.fn(),
    });

    // Default authService mocks
    vi.mocked(authService).mockResolvedValue(undefined);
    vi.mocked(authServiceWdf).mockResolvedValue(undefined);
    
    // Default isBothAuthenticated returns false
    mockIsBothAuthenticated.mockReturnValue(false);

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render login card', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render card header', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should render card title', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Developer Portal')).toBeInTheDocument();
    });

    it('should render card description with default text', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByTestId('card-description')).toBeInTheDocument();
      expect(screen.getByText('Complete both authentications to access the portal')).toBeInTheDocument();
    });

    it('should render card content', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should render both login buttons with SAP prefix', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByText('Sign in with SAP GitHub Tools')).toBeInTheDocument();
      expect(screen.getByText('Sign in with SAP GitHub WDF')).toBeInTheDocument();
    });

    it('should render GitHub icons in buttons', () => {
      renderWithRouter(<LoginPage />);
      const githubIcons = screen.getAllByTestId('github-icon');
      expect(githubIcons).toHaveLength(2);
    });

    it('should render terms of service text', () => {
      renderWithRouter(<LoginPage />);
      expect(screen.getByText(/By signing in, you agree to our terms of service and privacy policy/)).toBeInTheDocument();
    });
  });

  describe('Authentication State - Redirect', () => {
    it('should redirect to home when both authentications complete', () => {
      mockIsBothAuthenticated.mockReturnValue(true);
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User' },
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('should not render login card when fully authenticated', () => {
      mockIsBothAuthenticated.mockReturnValue(true);
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User' },
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('should call Navigate with replace prop', () => {
      mockIsBothAuthenticated.mockReturnValue(true);
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User' },
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/',
          replace: true,
        }),
        expect.anything()
      );
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading spinner element when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { container } = renderWithRouter(<LoginPage />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render login card when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });
  });


  describe('Alert Boxes Removed', () => {
    it('should not display blue alert box after one authentication', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      // Should NOT show blue completion message
      expect(screen.queryByText(/authenticated. Please sign in/)).not.toBeInTheDocument();
    });

    it('should not display green alert box after both authentications', () => {
      mockIsBothAuthenticated.mockReturnValue(true);
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      // Should NOT show green redirecting message
      expect(screen.queryByText(/Both authentications complete/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Redirecting to portal/)).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display Tools error message', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: 'Tools authentication failed',
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByText('Tools authentication failed')).toBeInTheDocument();
    });

    it('should display WDF error message', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: 'WDF authentication failed',
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByText('WDF authentication failed')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable Tools button when loading', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: true,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      const toolsButton = screen.getByText('Connecting...');
      expect(toolsButton.closest('button')).toBeDisabled();
    });

    it('should disable Tools button when authenticated', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      const toolsButton = screen.getByText(/SAP GitHub Tools - Authenticated/);
      expect(toolsButton.closest('button')).toBeDisabled();
    });

    it('should change Tools button variant when authenticated', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      const toolsButton = screen.getByText(/SAP GitHub Tools - Authenticated/).closest('button');
      expect(toolsButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Redirect Timing', () => {
   

    it('should clear justLoggedOut flag before redirect', async () => {
      sessionStorage.setItem('justLoggedOut', 'true');
      mockIsBothAuthenticated.mockReturnValue(true);
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
        setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
        setGithubToolsLoading: mockSetGithubToolsLoading,
        setGithubWdfLoading: mockSetGithubWdfLoading,
        setGithubToolsError: mockSetGithubToolsError,
        setGithubWdfError: mockSetGithubWdfError,
        isBothAuthenticated: mockIsBothAuthenticated,
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);

      // Advance timers slightly to allow React effects to run
      // sessionStorage is cleared before the 1000ms setTimeout
      await vi.advanceTimersByTimeAsync(0);
      
      // sessionStorage should be cleared immediately after effect runs
      expect(sessionStorage.getItem('justLoggedOut')).toBeNull();
    });
  });

  describe('UI Styling', () => {
    it('should apply correct container styling', () => {
      const { container } = renderWithRouter(<LoginPage />);
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center', 'bg-background', 'p-4');
    });

    it('should apply correct card styling', () => {
      renderWithRouter(<LoginPage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-full', 'max-w-md');
    });

    it('should apply text-center to header', () => {
      renderWithRouter(<LoginPage />);
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('text-center');
    });

    it('should apply correct title styling', () => {
      renderWithRouter(<LoginPage />);
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });

    it('should apply space-y-4 to card content', () => {
      renderWithRouter(<LoginPage />);
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('space-y-4');
    });
  });
});