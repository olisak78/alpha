import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileDropdown } from '@/components/DeveloperPortalHeader/UserProfileDropdown';

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/constants/developer-portal', () => ({
  getNewBackendUrl: () => 'https://api.example.com'
}));

// Mock the SettingsDialog component
vi.mock('@/components/dialogs/SettingsDialog', () => ({
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="settings-dialog" style={{ display: open ? 'block' : 'none' }}>
      Settings Dialog
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  )
}));

// Mock the SwaggerIcon component
vi.mock('@/components/icons/SwaggerIcon', () => ({
  SwaggerIcon: ({ className }: { className?: string }) => (
    <div data-testid="swagger-icon" className={className}>Swagger Icon</div>
  )
}));

// Mock UI components to render dropdown content immediately
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div role="separator" />
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}));

import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/api/useMembers';

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  picture: 'https://example.com/avatar.jpg',
  memberId: '123'
};

const mockOnLogout = vi.fn();

describe('UserProfileDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useCurrentUser
    (useCurrentUser as any).mockReturnValue({
      data: {
        first_name: 'John',
        last_name: 'Doe'
      }
    });
  });

  describe('Swagger menu item visibility', () => {
    it('should show Swagger menu item when user organization is sap-cfs', () => {
      // Mock useAuth to return user with sap-cfs organization
      (useAuth as any).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          organization: 'sap-cfs'
        }
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Check that Swagger menu item is visible
      expect(screen.getByText('Swagger')).toBeInTheDocument();
      expect(screen.getByTestId('swagger-icon')).toBeInTheDocument();
    });

    it('should hide Swagger menu item when user organization is not sap-cfs', () => {
      // Mock useAuth to return user with different organization
      (useAuth as any).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          organization: 'other-org'
        }
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Check that Swagger menu item is not visible
      expect(screen.queryByText('Swagger')).not.toBeInTheDocument();
      expect(screen.queryByTestId('swagger-icon')).not.toBeInTheDocument();
    });

    it('should hide Swagger menu item when user organization is undefined', () => {
      // Mock useAuth to return user without organization
      (useAuth as any).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe'
          // organization is undefined
        }
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Check that Swagger menu item is not visible
      expect(screen.queryByText('Swagger')).not.toBeInTheDocument();
      expect(screen.queryByTestId('swagger-icon')).not.toBeInTheDocument();
    });

    it('should hide Swagger menu item when authUser is null', () => {
      // Mock useAuth to return null user
      (useAuth as any).mockReturnValue({
        user: null
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Check that Swagger menu item is not visible
      expect(screen.queryByText('Swagger')).not.toBeInTheDocument();
      expect(screen.queryByTestId('swagger-icon')).not.toBeInTheDocument();
    });
  });

  describe('Other menu items', () => {
    it('should always show Settings and Log out menu items regardless of organization', () => {
      // Mock useAuth to return user with different organization
      (useAuth as any).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          organization: 'other-org'
        }
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Check that Settings and Log out are always visible
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });
  });

  describe('Swagger functionality', () => {
    it('should open Swagger URL when Swagger menu item is clicked', () => {
      // Mock window.open
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true
      });

      // Mock useAuth to return user with sap-cfs organization
      (useAuth as any).mockReturnValue({
        user: {
          id: '1',
          name: 'John Doe',
          organization: 'sap-cfs'
        }
      });

      render(
        <UserProfileDropdown
          user={mockUser}
          onLogout={mockOnLogout}
        />
      );

      // Click to open the dropdown
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Click on Swagger menu item
      const swaggerMenuItem = screen.getByText('Swagger');
      fireEvent.click(swaggerMenuItem);

      // Check that window.open was called with correct URL
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://api.example.com/swagger/index.html#/',
        '_blank'
      );
    });
  });
});
