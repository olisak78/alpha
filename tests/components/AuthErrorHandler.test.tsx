import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthErrorHandler } from '@/components/AuthErrorHandler';
import { authService } from '@/services/authService';

// Mock the authService
vi.mock('@/services/authService', () => ({
  authService: vi.fn(),
}));

describe('AuthErrorHandler', () => {
  const mockAuthService = vi.mocked(authService);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering and UI', () => {
    it('should render the dialog with correct title and message', () => {
      const testMessage = 'Your session has expired. Please log in again.';
      
      render(
        <AuthErrorHandler 
          message={testMessage}
        />
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('should render the dialog as open by default', () => {
      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should render login button with correct initial state', () => {
      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toBeDisabled();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

  });

  describe('Authentication Retry - Success', () => {
    it('should call authService with correct parameters when login button is clicked', async () => {
      const user = userEvent.setup();
      mockAuthService.mockResolvedValueOnce(undefined);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockAuthService).toHaveBeenCalledWith({
          storeReturnUrl: true,
        });
      });
    });

    it('should call onRetrySuccess callback when authentication succeeds', async () => {
      const user = userEvent.setup();
      const onRetrySuccess = vi.fn();
      mockAuthService.mockResolvedValueOnce(undefined);

      render(
        <AuthErrorHandler 
          message="Test message"
          onRetrySuccess={onRetrySuccess}
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(onRetrySuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should work correctly when onRetrySuccess is not provided', async () => {
      const user = userEvent.setup();
      mockAuthService.mockResolvedValueOnce(undefined);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Should not throw an error when onRetrySuccess is undefined
      await expect(user.click(loginButton)).resolves.not.toThrow();
    });
  });

  describe('Authentication Retry - Error Handling', () => {
    it('should call onRetryError when authService fails with Error object', async () => {
      const user = userEvent.setup();
      const onRetryError = vi.fn();
      const testError = new Error('Authentication failed');
      mockAuthService.mockRejectedValueOnce(testError);

      render(
        <AuthErrorHandler 
          message="Test message"
          onRetryError={onRetryError}
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(onRetryError).toHaveBeenCalledTimes(1);
        expect(onRetryError).toHaveBeenCalledWith(testError);
      });
    });

    it('should convert non-Error objects to Error in onRetryError callback', async () => {
      const user = userEvent.setup();
      const onRetryError = vi.fn();
      const nonErrorObject = { message: 'Something went wrong' };
      mockAuthService.mockRejectedValueOnce(nonErrorObject);

      render(
        <AuthErrorHandler 
          message="Test message"
          onRetryError={onRetryError}
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(onRetryError).toHaveBeenCalledTimes(1);
        const errorArg = onRetryError.mock.calls[0][0];
        expect(errorArg).toBeInstanceOf(Error);
        expect(errorArg.message).toBe('Authentication retry failed');
      });
    });

    it('should work correctly when onRetryError is not provided', async () => {
      const user = userEvent.setup();
      const testError = new Error('Authentication failed');
      mockAuthService.mockRejectedValueOnce(testError);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Should not throw an error when onRetryError is undefined
      await expect(user.click(loginButton)).resolves.not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while authentication is in progress', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.mockReturnValueOnce(authPromise);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Logging in...')).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(loginButton).toBeDisabled();

      // Should show spinning refresh icon
      const refreshIcon = screen.getByText('Logging in...').querySelector('svg');
      expect(refreshIcon).toHaveClass('animate-spin');

      // Resolve the auth to cleanup
      resolveAuth!();
      
      await waitFor(() => {
        expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();
      });
    });

    it('should disable button during retry attempt', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.mockReturnValueOnce(authPromise);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Initially enabled
      expect(loginButton).not.toBeDisabled();
      
      await user.click(loginButton);

      // Should be disabled during retry
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });

      // Resolve auth
      resolveAuth!();

      // Should be enabled again after completion
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });

    it('should reset loading state after successful authentication', async () => {
      const user = userEvent.setup();
      mockAuthService.mockResolvedValueOnce(undefined);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      // Wait for completion
      await waitFor(() => {
        expect(mockAuthService).toHaveBeenCalled();
      });

      // Should show normal state again
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();
      });
    });

    it('should reset loading state after authentication error', async () => {
      const user = userEvent.setup();
      const testError = new Error('Auth failed');
      mockAuthService.mockRejectedValueOnce(testError);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      // Wait for error handling
      await waitFor(() => {
        expect(mockAuthService).toHaveBeenCalled();
      });

      // Should show normal state again
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Multiple Interactions', () => {
    it('should allow retry after a failed authentication attempt', async () => {
      const user = userEvent.setup();
      const onRetryError = vi.fn();
      const testError = new Error('First attempt failed');
      
      // First attempt fails
      mockAuthService.mockRejectedValueOnce(testError);
      // Second attempt succeeds
      mockAuthService.mockResolvedValueOnce(undefined);

      render(
        <AuthErrorHandler 
          message="Test message"
          onRetryError={onRetryError}
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // First attempt
      await user.click(loginButton);
      
      await waitFor(() => {
        expect(onRetryError).toHaveBeenCalledTimes(1);
      });

      // Button should be re-enabled
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });

      // Second attempt
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockAuthService).toHaveBeenCalledTimes(2);
      });
    });

    it('should prevent multiple simultaneous retry attempts', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.mockReturnValueOnce(authPromise);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Click once
      await user.click(loginButton);

      // Wait for button to be disabled
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });

      // Try to click again while disabled (should not trigger another call)
      await user.click(loginButton);

      // Should only have been called once
      expect(mockAuthService).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveAuth!();
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog structure', () => {
      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      const title = screen.getByText('Authentication Required');
      expect(title).toBeInTheDocument();
    });

    it('should have accessible button with proper labeling', () => {
      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      expect(loginButton).toBeInTheDocument();
    });

    it('should maintain accessible button state during loading', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.mockReturnValueOnce(authPromise);

      render(
        <AuthErrorHandler 
          message="Test message"
        />
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(loginButton).toHaveAttribute('disabled');
      });

      // Cleanup
      resolveAuth!();
      await waitFor(() => {
        expect(loginButton).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('Custom Messages', () => {
    it('should display different error messages correctly', () => {
      const messages = [
        'Your session has expired',
        'Authentication token is invalid',
        'Please log in to continue',
        'Access denied. Please authenticate.',
      ];

      messages.forEach((message) => {
        const { unmount } = render(
          <AuthErrorHandler message={message} />
        );

        expect(screen.getByText(message)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle long error messages', () => {
      const longMessage = 'Your authentication session has expired due to inactivity. For security reasons, you will need to log in again to continue accessing the application. This helps protect your account and data.';
      
      render(
        <AuthErrorHandler 
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      render(
        <AuthErrorHandler 
          message=""
        />
      );

      // Should still render the dialog and button even with empty message
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });
});