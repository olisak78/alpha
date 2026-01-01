import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GlobalAuthErrorHandler } from '@/components/GlobalAuthErrorHandler';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import { setGlobalAuthErrorTrigger, clearGlobalAuthErrorTrigger } from '@/lib/authRefreshService';
import { AuthErrorHandler } from '@/components/AuthErrorHandler';

// Mock the dependencies
vi.mock('@/hooks/useAuthRefresh');
vi.mock('@/lib/authRefreshService');
vi.mock('@/components/AuthErrorHandler');

describe('GlobalAuthErrorHandler', () => {
  const mockUseAuthRefresh = vi.mocked(useAuthRefresh);
  const mockSetGlobalAuthErrorTrigger = vi.mocked(setGlobalAuthErrorTrigger);
  const mockClearGlobalAuthErrorTrigger = vi.mocked(clearGlobalAuthErrorTrigger);
  const mockAuthErrorHandler = vi.mocked(AuthErrorHandler);

  // Default mock implementation for useAuthRefresh
  const defaultAuthRefreshState = {
    isAuthenticated: true,
    authError: null,
    retry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseAuthRefresh.mockReturnValue(defaultAuthRefreshState);
    mockAuthErrorHandler.mockImplementation(({ message }) => (
      <div data-testid="auth-error-handler">{message}</div>
    ));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render without showing auth error dialog by default', () => {
      render(<GlobalAuthErrorHandler />);

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
    });

    it('should not render AuthErrorHandler when no error exists', () => {
      render(<GlobalAuthErrorHandler />);

      expect(mockAuthErrorHandler).not.toHaveBeenCalled();
    });

    it('should render empty fragment when no error is visible', () => {
      const { container } = render(<GlobalAuthErrorHandler />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Global Auth Error Trigger Registration', () => {
    it('should register global auth error trigger on mount', () => {
      render(<GlobalAuthErrorHandler />);

      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);
      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear global auth error trigger on unmount', () => {
      const { unmount } = render(<GlobalAuthErrorHandler />);

      expect(mockClearGlobalAuthErrorTrigger).not.toHaveBeenCalled();

      unmount();

      expect(mockClearGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);
    });

    it('should register trigger before clearing on remount', () => {
      const { unmount } = render(<GlobalAuthErrorHandler />);

      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);

      unmount();

      expect(mockClearGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);

      // Render a new instance (not rerender)
      render(<GlobalAuthErrorHandler />);

      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledTimes(2);
    });
  });

  describe('Global Auth Error Detection from Hook', () => {
    it('should show auth error when globalAuthError is detected', async () => {
      const errorMessage = 'Session expired. Please log in again.';
      
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: errorMessage,
      });

      render(<GlobalAuthErrorHandler />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should pass correct message to AuthErrorHandler', async () => {
      const errorMessage = 'Authentication token is invalid';
      
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: errorMessage,
      });

      render(<GlobalAuthErrorHandler />);

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: errorMessage,
          }),
          expect.anything()
        );
      });
    });

    it('should not show duplicate dialogs if already visible', async () => {
      const errorMessage = 'Session expired';
      
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: errorMessage,
      });

      const { rerender } = render(<GlobalAuthErrorHandler />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Rerender with same error
      rerender(<GlobalAuthErrorHandler />);

      // Dialog should still be visible with the same message (not reset/duplicated)
      expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Should only have one auth error handler in the DOM
      expect(screen.getAllByTestId('auth-error-handler')).toHaveLength(1);
    });

    it('should update when globalAuthError changes', async () => {
      const { rerender } = render(<GlobalAuthErrorHandler />);

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();

      // Update to show error
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: 'New error occurred',
      });

      rerender(<GlobalAuthErrorHandler />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
        expect(screen.getByText('New error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Global Trigger Function', () => {
    it('should show auth error when global trigger is called', async () => {
      render(<GlobalAuthErrorHandler />);

      // Get the registered trigger function
      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];

      // Call the trigger
      triggerFunction('Manual trigger error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
        expect(screen.getByText('Manual trigger error')).toBeInTheDocument();
      });
    });

    it('should accept callbacks when trigger is called', async () => {
      const onRetrySuccess = vi.fn();
      const onRetryError = vi.fn();

      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];

      triggerFunction('Error with callbacks', onRetrySuccess, onRetryError);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Verify callbacks are stored (they'll be tested in callback tests)
      expect(mockAuthErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          onRetrySuccess: expect.any(Function),
          onRetryError: expect.any(Function),
        }),
        expect.anything()
      );
    });

    it('should work without callbacks', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];

      // Call without callbacks
      triggerFunction('Error without callbacks');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
        expect(screen.getByText('Error without callbacks')).toBeInTheDocument();
      });
    });
  });

  describe('Retry Success Handling', () => {
    it('should call onRetrySuccess callback when retry succeeds', async () => {
      const onRetrySuccess = vi.fn();

      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error', onRetrySuccess);

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalled();
      });

      // Get the onRetrySuccess prop passed to AuthErrorHandler
      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      
      // Call the onRetrySuccess handler
      authErrorHandlerProps.onRetrySuccess();

      expect(onRetrySuccess).toHaveBeenCalledTimes(1);
    });

    it('should hide dialog after successful retry', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Get the onRetrySuccess prop
      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      
      // Call onRetrySuccess
      authErrorHandlerProps.onRetrySuccess();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });
    });

    it('should work when no onRetrySuccess callback is provided', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error'); // No callback

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalled();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      
      // Should not throw when calling onRetrySuccess
      expect(() => authErrorHandlerProps.onRetrySuccess()).not.toThrow();
    });

    it('should hide dialog even when callback is not provided', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      authErrorHandlerProps.onRetrySuccess();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });
    });
  });

  describe('Retry Error Handling', () => {
    it('should call onRetryError callback when retry fails', async () => {
      const onRetryError = vi.fn();
      const testError = new Error('Retry failed');

      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error', undefined, onRetryError);

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalled();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      
      // Call onRetryError
      authErrorHandlerProps.onRetryError(testError);

      expect(onRetryError).toHaveBeenCalledTimes(1);
      expect(onRetryError).toHaveBeenCalledWith(testError);
    });

    it('should keep dialog visible after retry error', async () => {
      const onRetryError = vi.fn();
      const testError = new Error('Retry failed');

      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error', undefined, onRetryError);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      authErrorHandlerProps.onRetryError(testError);

      // Dialog should still be visible
      expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
    });

    it('should work when no onRetryError callback is provided', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Test error'); // No callback

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalled();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      const testError = new Error('Test error');
      
      // Should not throw when calling onRetryError
      expect(() => authErrorHandlerProps.onRetryError(testError)).not.toThrow();
    });

    it('should log error to console when retry fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: 'Test error',
      });

      render(<GlobalAuthErrorHandler />);

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalled();
      });

      const authErrorHandlerProps = mockAuthErrorHandler.mock.calls[0][0];
      const testError = new Error('Retry failed');
      
      authErrorHandlerProps.onRetryError(testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Authentication retry failed:',
        testError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Multiple Error Scenarios', () => {
    it('should handle multiple sequential errors', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];

      // First error
      triggerFunction('First error');

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Trigger success to hide
      const firstProps = mockAuthErrorHandler.mock.calls[0][0];
      firstProps.onRetrySuccess();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });

      // Second error
      triggerFunction('Second error');

      await waitFor(() => {
        expect(screen.getByText('Second error')).toBeInTheDocument();
      });
    });

    it('should handle error from hook while trigger-based error is visible', async () => {
      const { rerender } = render(<GlobalAuthErrorHandler />);

      // Show error via trigger
      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Trigger error');

      await waitFor(() => {
        expect(screen.getByText('Trigger error')).toBeInTheDocument();
      });

      // Try to show error from hook (should not show duplicate)
      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        authError: 'Hook error',
      });

      rerender(<GlobalAuthErrorHandler />);

      // Should still show only the first error
      expect(screen.getByText('Trigger error')).toBeInTheDocument();
      expect(screen.queryByText('Hook error')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('');

      await waitFor(() => {
        expect(mockAuthErrorHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '',
          }),
          expect.anything()
        );
      });
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(500);
      
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction(longMessage);

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });

    it('should handle special characters in error message', async () => {
      const specialMessage = 'Error: <script>alert("test")</script> & "quotes" \'single\'';
      
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction(specialMessage);

      await waitFor(() => {
        expect(screen.getByText(specialMessage)).toBeInTheDocument();
      });
    });

    it('should handle rapid successive trigger calls', async () => {
      render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];

      // Rapid calls
      triggerFunction('Error 1');
      triggerFunction('Error 2');
      triggerFunction('Error 3');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Should show the last error (Error 3)
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });
  });

  describe('Hook State Changes', () => {
    it('should react to isAuthenticated changes', () => {
      const { rerender } = render(<GlobalAuthErrorHandler />);

      mockUseAuthRefresh.mockReturnValue({
        ...defaultAuthRefreshState,
        isAuthenticated: false,
      });

      rerender(<GlobalAuthErrorHandler />);

      expect(mockUseAuthRefresh).toHaveBeenCalled();
    });

  });

  describe('Component Lifecycle', () => {
    it('should maintain state across re-renders', async () => {
      const { rerender } = render(<GlobalAuthErrorHandler />);

      const triggerFunction = mockSetGlobalAuthErrorTrigger.mock.calls[0][0];
      triggerFunction('Persistent error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Re-render without changing state
      rerender(<GlobalAuthErrorHandler />);

      // Error should still be visible
      expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      expect(screen.getByText('Persistent error')).toBeInTheDocument();
    });

    it('should cleanup properly on multiple mount/unmount cycles', () => {
      const { unmount } = render(<GlobalAuthErrorHandler />);

      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);

      unmount();
      expect(mockClearGlobalAuthErrorTrigger).toHaveBeenCalledTimes(1);

      // Render a new instance
      const { unmount: unmount2 } = render(<GlobalAuthErrorHandler />);
      expect(mockSetGlobalAuthErrorTrigger).toHaveBeenCalledTimes(2);

      unmount2();
      expect(mockClearGlobalAuthErrorTrigger).toHaveBeenCalledTimes(2);
    });
  });
});