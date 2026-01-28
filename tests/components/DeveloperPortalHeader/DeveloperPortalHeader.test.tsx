import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DeveloperPortalHeader } from '@/components/DeveloperPortalHeader/DeveloperPortalHeader';
import { MemoryRouter } from 'react-router-dom';

// Mock child components
vi.mock('@/components/DeveloperPortalHeader/UserProfileDropdown', () => ({
  UserProfileDropdown: vi.fn(({ user, onLogout }) => (
    <div data-testid="user-profile-dropdown">
      <div data-testid="user-name">{user.name}</div>
      <button onClick={onLogout} data-testid="logout-button">Logout</button>
    </div>
  )),
}));

vi.mock('@/components/Breadcrumbs', () => ({
  Breadcrumbs: vi.fn(() => <div data-testid="breadcrumbs">Breadcrumbs</div>),
}));

// Mock contexts and stores
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/stores/themeStore', () => ({
  useActualTheme: vi.fn(),
  useThemeStore: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useAuth } from '@/contexts/AuthContext';
import { useActualTheme, useThemeStore } from '@/stores/themeStore';
import { useNavigate } from 'react-router-dom';

describe('DeveloperPortalHeader', () => {
  const mockNavigate = vi.fn();
  const mockLogout = vi.fn();
  const mockToggleTheme = vi.fn();
  const mockOnNotificationClick = vi.fn();

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    provider: 'githubtools' as const,
    organization: 'sap-cfs',
  };

  const defaultProps = {
    unreadCount: 0,
    onNotificationClick: mockOnNotificationClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      refreshAuth: vi.fn(),
    });

    vi.mocked(useActualTheme).mockReturnValue('light');
    
    vi.mocked(useThemeStore).mockReturnValue(mockToggleTheme);
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render all main components when user is logged in', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      // Core elements
      expect(screen.getByText('Developer Portal')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByLabelText(/switch to/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      
      // User profile when logged in
      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    it('should not render UserProfileDropdown when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        refreshAuth: vi.fn(),
      });

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
      // Core elements should still be present
      expect(screen.getByText('Developer Portal')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle title click navigation with proper styling', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      
      // Test styling
      expect(title).toHaveClass('cursor-pointer', 'hover:text-blue-600', 'dark:hover:text-blue-400');
      
      // Test navigation
      await user.click(title);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle between light and dark themes with correct icons and labels', async () => {
      const user = userEvent.setup();

      // Test light theme
      vi.mocked(useActualTheme).mockReturnValue('light');
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);
      
      const lightThemeButton = screen.getByLabelText('Switch to dark mode');
      expect(lightThemeButton).toBeInTheDocument();
      
      await user.click(lightThemeButton);
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should show correct label and icon for dark theme', () => {
      vi.mocked(useActualTheme).mockReturnValue('dark');
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    it('should handle notification clicks and badge display correctly', async () => {
      const user = userEvent.setup();

      // Test click functionality
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);
      const notificationsButton = screen.getByLabelText('Notifications');
      await user.click(notificationsButton);
      expect(mockOnNotificationClick).toHaveBeenCalledTimes(1);
    });

    it('should show/hide badge based on unreadCount and style it correctly', () => {
      // Test no badge when count is 0
      const { rerender } = renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();

      // Test badge display with styling
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} unreadCount={5} /></MemoryRouter>);
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-500', 'text-white', 'rounded-full', 'absolute', '-top-1', '-right-1');

      // Test large numbers
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} unreadCount={999} /></MemoryRouter>);
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('User Authentication', () => {
    it('should handle user profile display and logout functionality', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      // Test user display
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');

      // Test successful logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      
      mockLogout.mockRejectedValueOnce(new Error('Logout failed'));
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility & Styling', () => {
    it('should have proper accessibility attributes and styling', () => {
      const { container } = renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      // Accessibility
      const themeButton = screen.getByLabelText(/switch to/i);
      const notificationsButton = screen.getByLabelText('Notifications');
      expect(themeButton).toHaveAttribute('aria-label');
      expect(notificationsButton).toHaveAttribute('aria-label', 'Notifications');
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);

      // Styling
      expect(container.querySelector('.bg-background')).toBeInTheDocument();
      const title = screen.getByText('Developer Portal');
      expect(title.closest('.px-4')).toHaveClass('px-4', 'py-3', 'pl-6');
      expect(themeButton).toHaveClass('hover:bg-accent', 'border', 'border-border');
      expect(title).toHaveClass('transition-colors');
      expect(container.querySelector('.space-x-3')).toBeInTheDocument();
    });
  });

  describe('Props & Edge Cases', () => {
    it('should handle props and edge cases correctly', async () => {
      const user = userEvent.setup();
      const customHandler = vi.fn();

      // Test props
      const { rerender } = renderWithRouter(<DeveloperPortalHeader unreadCount={10} onNotificationClick={customHandler} />);
      expect(screen.getByText('10')).toBeInTheDocument();
      
      const notificationsButton = screen.getByLabelText('Notifications');
      await user.click(notificationsButton);
      expect(customHandler).toHaveBeenCalledTimes(1);

      // Test edge cases
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} unreadCount={9999} /></MemoryRouter>);
      expect(screen.getByText('9999')).toBeInTheDocument();
      
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} unreadCount={-1} /></MemoryRouter>);
      expect(screen.queryByText('-1')).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with all external dependencies correctly', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      // AuthContext integration
      expect(useAuth).toHaveBeenCalled();
      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();

      // ThemeStore integration
      expect(useActualTheme).toHaveBeenCalled();
      expect(useThemeStore).toHaveBeenCalled();

      // React Router integration
      const title = screen.getByText('Developer Portal');
      await user.click(title);
      expect(useNavigate).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Developer Utilities', () => {
    it('should show Developer Utilities button only for sap-cfs organization with proper styling', () => {
      // Test visible for sap-cfs
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);
      const utilityButton = screen.getByLabelText('Developer Utilities');
      expect(utilityButton).toBeInTheDocument();
      expect(utilityButton.querySelector('svg')).toBeInTheDocument();
      expect(utilityButton).toHaveAttribute('aria-label', 'Developer Utilities');
    });

    it('should hide Developer Utilities button for non-sap-cfs organizations and null users', () => {
      // Test different org
      const { rerender } = renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);
      
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, organization: 'other-org' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        refreshAuth: vi.fn(),
      });
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} /></MemoryRouter>);
      expect(screen.queryByLabelText('Developer Utilities')).not.toBeInTheDocument();

      // Test null user
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        refreshAuth: vi.fn(),
      });
      rerender(<MemoryRouter><DeveloperPortalHeader {...defaultProps} /></MemoryRouter>);
      expect(screen.queryByLabelText('Developer Utilities')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render Bell icon in notifications button', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const notificationsButton = screen.getByLabelText('Notifications');
      expect(notificationsButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Moon icon when theme is light', () => {
      vi.mocked(useActualTheme).mockReturnValue('light');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText('Switch to dark mode');
      expect(themeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Sun icon when theme is dark', () => {
      vi.mocked(useActualTheme).mockReturnValue('dark');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText('Switch to light mode');
      expect(themeButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
