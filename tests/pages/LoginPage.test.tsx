import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock all dependencies before importing the component
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/stores/useDualAuthStore', () => ({
  useDualAuthStore: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  authService: vi.fn(),
  authServiceWdf: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock('@/utils/developer-portal-helpers', () => ({
  buildUserFromMe: vi.fn(),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div data-testid="card-title" className={className}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Github: () => <div data-testid="github-icon">GitHub Icon</div>,
  CheckCircle2: () => <div data-testid="check-icon">Check Icon</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert Icon</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: any) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>,
  };
});

// Import the component after all mocks are set up
import LoginPage from '@/pages/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { useDualAuthStore } from '@/stores/useDualAuthStore';
import { authService, authServiceWdf } from '@/services/authService';
import { fetchCurrentUser } from '@/hooks/api/useMembers';
import { buildUserFromMe } from '@/utils/developer-portal-helpers';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    // Default mock implementations
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(useDualAuthStore).mockReturnValue({
      isGithubToolsAuthenticated: false,
      isGithubWdfAuthenticated: false,
      isGithubToolsLoading: false,
      isGithubWdfLoading: false,
      githubToolsError: null,
      githubWdfError: null,
      userOrganization: null,
      setGithubToolsAuthenticated: vi.fn(),
      setGithubWdfAuthenticated: vi.fn(),
      setGithubToolsLoading: vi.fn(),
      setGithubWdfLoading: vi.fn(),
      setGithubToolsError: vi.fn(),
      setGithubWdfError: vi.fn(),
      setUserOrganization: vi.fn(),
      isBothAuthenticated: vi.fn(() => false),
      isAnyLoading: vi.fn(() => false),
      requiresWdfAuth: vi.fn(() => false),
      reset: vi.fn(),
    });

    vi.mocked(authService).mockResolvedValue(undefined);
    vi.mocked(authServiceWdf).mockResolvedValue(undefined);
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      organization: 'sap-cfs'
    });
    vi.mocked(buildUserFromMe).mockReturnValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      organization: 'sap-cfs'
    });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Basic Rendering', () => {
    it('should render login page with essential elements', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Welcome to Developer Portal')).toBeInTheDocument();
      expect(screen.getByText('Sign in with GitHub Tools to access the portal')).toBeInTheDocument();
      expect(screen.getByText('Sign in with SAP GitHub Tools')).toBeInTheDocument();
      expect(screen.getByText('Sign in with SAP GitHub WDF')).toBeInTheDocument();
      expect(screen.getByText(/By signing in, you agree to our terms/)).toBeInTheDocument();
    });

    it('should show loading state when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('should redirect when fully authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User' },
        login: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: true,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => true),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });

    it('should show Tools button as authenticated when completed', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText(/SAP GitHub Tools - Authenticated/)).toBeInTheDocument();
    });

    it('should show loading state for Tools button', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: true,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display Tools authentication error', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: 'Tools authentication failed',
        githubWdfError: null,
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Tools authentication failed')).toBeInTheDocument();
    });

    it('should display WDF authentication error', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: false,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: 'WDF authentication failed',
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
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
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      const button = screen.getByText('Connecting...').closest('button');
      expect(button).toBeDisabled();
    });

    it('should disable Tools button when authenticated', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: null,
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      const button = screen.getByText(/SAP GitHub Tools - Authenticated/).closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Description Text Logic', () => {
    it('should show default description when not authenticated', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Sign in with GitHub Tools to access the portal')).toBeInTheDocument();
    });

    it('should show completion message when WDF auth is required', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: 'sap-cfs',
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => false),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => true),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('Please complete the second authentication to access the portal')).toBeInTheDocument();
    });

    it('should show completion message for non-sap-cfs users', () => {
      vi.mocked(useDualAuthStore).mockReturnValue({
        isGithubToolsAuthenticated: true,
        isGithubWdfAuthenticated: false,
        isGithubToolsLoading: false,
        isGithubWdfLoading: false,
        githubToolsError: null,
        githubWdfError: null,
        userOrganization: 'other-org',
        setGithubToolsAuthenticated: vi.fn(),
        setGithubWdfAuthenticated: vi.fn(),
        setGithubToolsLoading: vi.fn(),
        setGithubWdfLoading: vi.fn(),
        setGithubToolsError: vi.fn(),
        setGithubWdfError: vi.fn(),
        setUserOrganization: vi.fn(),
        isBothAuthenticated: vi.fn(() => true),
        isAnyLoading: vi.fn(() => false),
        requiresWdfAuth: vi.fn(() => false),
        reset: vi.fn(),
      });

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('GitHub Tools authentication complete! You can now access the portal.')).toBeInTheDocument();
    });
  });

  describe('UI Structure', () => {
    it('should have proper card structure', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-description')).toBeInTheDocument();
    });

    it('should show GitHub icons', () => {
      renderWithRouter(<LoginPage />);
      
      const githubIcons = screen.getAllByTestId('github-icon');
      expect(githubIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Session Storage', () => {
    it('should clear justLoggedOut flag on button click', async () => {
      sessionStorage.setItem('justLoggedOut', 'true');
      
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);
      
      const toolsButton = screen.getByText('Sign in with SAP GitHub Tools');
      await user.click(toolsButton);
      
      expect(sessionStorage.getItem('justLoggedOut')).toBeNull();
    });
  });
});
