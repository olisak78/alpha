import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfileDropdown } from '@/components/DeveloperPortalHeader/UserProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { getNewBackendUrl } from '@/constants/developer-portal';

// Mock external dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/api/useMembers');
vi.mock('@/constants/developer-portal');

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-testid="dropdown-trigger"
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div className={className} data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children }: any) => (
    <div data-testid="avatar-fallback">{children}</div>
  )
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: any) => (
    <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-menu-content">{children}</div>
  ),
  DropdownMenuLabel: ({ children }: any) => (
    <div data-testid="dropdown-menu-label">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, disabled }: any) => (
    <button 
      data-testid="dropdown-menu-item" 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => (
    <div data-testid="dropdown-menu-separator" />
  )
}));

// Mock icons
vi.mock('lucide-react', () => ({
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>
}));

vi.mock('@/components/icons/SwaggerIcon', () => ({
  SwaggerIcon: () => <div data-testid="swagger-icon">Swagger</div>
}));

// Mock SettingsDialog
vi.mock('@/components/dialogs/SettingsDialog', () => ({
  default: ({ open, onOpenChange }: any) => (
    <div 
      data-testid="settings-dialog" 
      data-open={open}
    >
      <button data-testid="close-settings" onClick={() => onOpenChange(false)}>
        Close Settings
      </button>
    </div>
  )
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Default test data
const defaultUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  picture: 'https://example.com/avatar.jpg',
  memberId: 'member-123'
};

const defaultProps = {
  user: defaultUser,
  onProfileClick: vi.fn(),
  onLogout: vi.fn(),
  isLoading: false
};

describe('UserProfileDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuth).mockReturnValue({ user: defaultUser } as any);
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { first_name: 'John', last_name: 'Doe' },
      isLoading: false,
      error: null
    } as any);
    vi.mocked(getNewBackendUrl).mockReturnValue('https://api.example.com');
  });

  it('renders dropdown with avatar and user information', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', defaultUser.picture);
    expect(screen.getByTestId('dropdown-menu-label')).toHaveTextContent(defaultUser.name);
    expect(screen.getByTestId('dropdown-menu-label')).toHaveTextContent(defaultUser.email!);
  });

  it('renders all menu items with correct icons', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    expect(menuItems).toHaveLength(4);
    
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    expect(screen.getByTestId('swagger-icon')).toBeInTheDocument();
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  it('generates user initials correctly', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
  });

  it('falls back to name splitting when member data unavailable', () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    } as any);

    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
  });

  it('handles menu item clicks correctly', () => {
    const onProfileClick = vi.fn();
    const onLogout = vi.fn();
    
    render(
      <TestWrapper>
        <UserProfileDropdown 
          {...defaultProps} 
          onProfileClick={onProfileClick}
          onLogout={onLogout}
        />
      </TestWrapper>
    );

    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    
    // Test Profile click
    const profileItem = menuItems.find(item => 
      item.textContent?.includes('Profile')
    );
    fireEvent.click(profileItem!);
    expect(onProfileClick).toHaveBeenCalledTimes(1);

    // Test Logout click
    const logoutItem = menuItems.find(item => 
      item.textContent?.includes('Log out')
    );
    fireEvent.click(logoutItem!);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('opens settings dialog when Settings clicked', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    const settingsItem = menuItems.find(item => 
      item.textContent?.includes('Settings')
    );
    
    fireEvent.click(settingsItem!);
    
    const settingsDialog = screen.getByTestId('settings-dialog');
    expect(settingsDialog).toHaveAttribute('data-open', 'true');
  });

  it('opens Swagger in new window when clicked', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} />
      </TestWrapper>
    );

    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    const swaggerItem = menuItems.find(item => 
      item.textContent?.includes('Swagger')
    );
    
    fireEvent.click(swaggerItem!);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://api.example.com/swagger/index.html#/',
      '_blank'
    );
  });

  it('handles loading state correctly', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown {...defaultProps} isLoading={true} />
      </TestWrapper>
    );

    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    const logoutItem = menuItems.find(item => 
      item.textContent?.includes('Logging out...')
    );
    
    expect(logoutItem).toBeDisabled();
    expect(logoutItem).toHaveTextContent('Logging out...');
  });

  it('handles user without email gracefully', () => {
    const userWithoutEmail = { name: 'John Doe', memberId: 'member-123' };

    render(
      <TestWrapper>
        <UserProfileDropdown 
          {...defaultProps} 
          user={userWithoutEmail} 
        />
      </TestWrapper>
    );

    const label = screen.getByTestId('dropdown-menu-label');
    expect(label).toHaveTextContent(userWithoutEmail.name);
    expect(label).not.toHaveTextContent('@');
  });
});
