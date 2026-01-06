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
    it('should render header container', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const header = screen.getByText('Developer Portal').closest('div');
      expect(header).toBeInTheDocument();
    });

    it('should render Developer Portal title', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByText('Developer Portal')).toBeInTheDocument();
    });

    it('should render Breadcrumbs component', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    it('should render theme toggle button', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText(/switch to/i);
      expect(themeButton).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const notificationsButton = screen.getByLabelText('Notifications');
      expect(notificationsButton).toBeInTheDocument();
    });

    it('should render UserProfileDropdown when user is logged in', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

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
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when title is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      await user.click(title);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should have cursor pointer on title', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      expect(title).toHaveClass('cursor-pointer');
    });

    it('should have hover styles on title', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      expect(title).toHaveClass('hover:text-blue-600');
      expect(title).toHaveClass('dark:hover:text-blue-400');
    });
  });

  describe('Theme Toggle', () => {
    it('should show Moon icon when theme is light', () => {
      vi.mocked(useActualTheme).mockReturnValue('light');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText('Switch to dark mode');
      expect(themeButton).toBeInTheDocument();
    });

    it('should show Sun icon when theme is dark', () => {
      vi.mocked(useActualTheme).mockReturnValue('dark');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText('Switch to light mode');
      expect(themeButton).toBeInTheDocument();
    });

    it('should call toggleTheme when theme button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText(/switch to/i);
      await user.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label for light theme', () => {
      vi.mocked(useActualTheme).mockReturnValue('light');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });

    it('should have proper aria-label for dark theme', () => {
      vi.mocked(useActualTheme).mockReturnValue('dark');

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    it('should call onNotificationClick when notifications button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const notificationsButton = screen.getByLabelText('Notifications');
      await user.click(notificationsButton);

      expect(mockOnNotificationClick).toHaveBeenCalledTimes(1);
    });

    it('should not show badge when unreadCount is 0', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={0} />);

      const badge = screen.queryByText('0');
      expect(badge).not.toBeInTheDocument();
    });

    it('should show badge when unreadCount is greater than 0', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display correct unreadCount in badge', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should style badge correctly', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={3} />);

      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-red-500');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should position badge absolutely', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={1} />);

      const badge = screen.getByText('1');
      expect(badge).toHaveClass('absolute');
      expect(badge).toHaveClass('-top-1');
      expect(badge).toHaveClass('-right-1');
    });

    it('should handle large unreadCount numbers', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={999} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('User Authentication', () => {
    it('should pass user to UserProfileDropdown', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    it('should call logout when UserProfileDropdown logout is triggered', async () => {
      const user = userEvent.setup();

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

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

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Logout failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not throw error when logout succeeds', async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValueOnce(undefined);

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on theme toggle button', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText(/switch to/i);
      expect(themeButton).toHaveAttribute('aria-label');
    });

    it('should have aria-label on notifications button', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const notificationsButton = screen.getByLabelText('Notifications');
      expect(notificationsButton).toHaveAttribute('aria-label', 'Notifications');
    });

    it('should have proper button roles', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should apply correct background color to header', () => {
      const { container } = renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const header = container.querySelector('.bg-background');
      expect(header).toBeInTheDocument();
    });

    it('should apply correct spacing classes', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      const headerRow = title.closest('.px-4');
      
      expect(headerRow).toHaveClass('px-4');
      expect(headerRow).toHaveClass('py-3');
      expect(headerRow).toHaveClass('pl-6');
    });

    it('should style buttons correctly', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const themeButton = screen.getByLabelText(/switch to/i);
      
      expect(themeButton).toHaveClass('hover:bg-accent');
      expect(themeButton).toHaveClass('border');
      expect(themeButton).toHaveClass('border-border');
    });

    it('should apply transition classes', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      expect(title).toHaveClass('transition-colors');

      const themeButton = screen.getByLabelText(/switch to/i);
      expect(themeButton).toHaveClass('transition-colors');
    });
  });

  describe('Layout', () => {
    it('should render elements in correct order', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const header = screen.getByText('Developer Portal').closest('div')?.parentElement;
      const children = Array.from(header?.children || []);

      // Should have title section, breadcrumbs, and action buttons
      expect(children.length).toBeGreaterThan(0);
    });

    it('should have proper spacing between action buttons', () => {
      const { container } = renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const actionsContainer = container.querySelector('.space-x-3');
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept unreadCount prop', () => {
      renderWithRouter(<DeveloperPortalHeader unreadCount={10} onNotificationClick={mockOnNotificationClick} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should accept onNotificationClick prop', async () => {
      const user = userEvent.setup();
      const customHandler = vi.fn();

      renderWithRouter(<DeveloperPortalHeader unreadCount={0} onNotificationClick={customHandler} />);

      const notificationsButton = screen.getByLabelText('Notifications');
      await user.click(notificationsButton);

      expect(customHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large unreadCount', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={9999} />);

      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('should handle negative unreadCount gracefully', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} unreadCount={-1} />);

      // Should not show badge for negative numbers
      expect(screen.queryByText('-1')).not.toBeInTheDocument();
    });

    it('should handle missing user gracefully', () => {
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
    });

    it('should render without crashing when all features are missing', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: mockLogout,
        refreshAuth: vi.fn(),
      });

      renderWithRouter(<DeveloperPortalHeader unreadCount={0} onNotificationClick={mockOnNotificationClick} />);

      expect(screen.getByText('Developer Portal')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with AuthContext correctly', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(useAuth).toHaveBeenCalled();
      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();
    });

    it('should integrate with themeStore correctly', () => {
      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      expect(useActualTheme).toHaveBeenCalled();
      expect(useThemeStore).toHaveBeenCalled();
    });

    it('should integrate with react-router correctly', async () => {
      const user = userEvent.setup();

      renderWithRouter(<DeveloperPortalHeader {...defaultProps} />);

      const title = screen.getByText('Developer Portal');
      await user.click(title);

      expect(useNavigate).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
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