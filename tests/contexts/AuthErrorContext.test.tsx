import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthErrorProvider, triggerGlobalAuthError } from '@/contexts/AuthErrorContext';
import * as useAuthRefresh from '@/hooks/useAuthRefresh';
import * as authRefreshService from '@/lib/authRefreshService';
import * as AuthErrorHandler from '@/components/AuthErrorHandler';
import React from 'react';

// Mock all dependencies
vi.mock('@/hooks/useAuthRefresh', () => ({
  useAuthRefresh: vi.fn(),
}));

vi.mock('@/lib/authRefreshService', () => ({
  setGlobalAuthErrorTrigger: vi.fn(),
  clearGlobalAuthErrorTrigger: vi.fn(),
}));

vi.mock('@/components/AuthErrorHandler', () => ({
  AuthErrorHandler: vi.fn(({ message, onRetrySuccess, onRetryError }) => (
    <div data-testid="auth-error-handler">
      <div data-testid="error-message">{message}</div>
      <button
        data-testid="retry-success-btn"
        onClick={() => onRetrySuccess && onRetrySuccess()}
      >
        Retry Success
      </button>
      <button
        data-testid="retry-error-btn"
        onClick={() => onRetryError && onRetryError(new Error('Retry failed'))}
      >
        Retry Error
      </button>
    </div>
  )),
}));

describe('AuthErrorContext', () => {
  const mockUseAuthRefresh = {
    isAuthenticated: null,
    authError: null,
    retry: vi.fn(),
    isLoading: false,
  };

  // Test component that uses the provider
  const TestComponent = () => {
    return <div data-testid="test-content">Test Content</div>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useAuthRefresh
    vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue(mockUseAuthRefresh);

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should render children', () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should call useAuthRefresh on mount', () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(useAuthRefresh.useAuthRefresh).toHaveBeenCalled();
    });

    it('should set global auth error trigger on mount', () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(authRefreshService.setGlobalAuthErrorTrigger).toHaveBeenCalled();
      expect(authRefreshService.setGlobalAuthErrorTrigger).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should not show auth error handler initially', () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
    });
  });

  describe('Provider Cleanup', () => {
    it('should clear global auth error trigger on unmount', () => {
      const { unmount } = render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      unmount();

      expect(authRefreshService.clearGlobalAuthErrorTrigger).toHaveBeenCalled();
    });
  });

  describe('Automatic Auth Error Display', () => {
    it('should show auth error when globalAuthError is detected', async () => {
      const errorMessage = 'Session expired. Please log in again.';

      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: errorMessage,
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });

    it('should not show duplicate errors when already visible', async () => {
      const errorMessage = 'Session expired';

      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: errorMessage,
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Component should only render once
      expect(screen.getAllByTestId('auth-error-handler')).toHaveLength(1);
    });

    it('should not show auth error when globalAuthError is null', () => {
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: null,
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
    });
  });

  describe('triggerGlobalAuthError Function', () => {
    it('should show auth error when triggerGlobalAuthError is called', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      const errorMessage = 'Custom error message';
      triggerGlobalAuthError(errorMessage);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });

    it('should handle triggerGlobalAuthError called before provider mounts', () => {
      // This should not throw an error
      expect(() => {
        triggerGlobalAuthError('Error before mount');
      }).not.toThrow();
    });

    it('should work after provider mounts', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Test error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });
    });

    it('should not work after provider unmounts', async () => {
      const { unmount } = render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      unmount();

      // This should not cause any errors
      expect(() => {
        triggerGlobalAuthError('Error after unmount');
      }).not.toThrow();
    });
  });

  describe('Auth Error Callbacks', () => {
    it('should call onRetrySuccess callback and hide error', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Test error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      screen.getByTestId('retry-success-btn').click();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });
    });

    it('should handle retry success from globalAuthError', async () => {
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: 'Session expired',
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      screen.getByTestId('retry-success-btn').click();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });
    });

    it('should handle retry error from globalAuthError', async () => {
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: 'Session expired',
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      screen.getByTestId('retry-error-btn').click();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Authentication retry failed:',
          expect.any(Error)
        );
      });
    });
  });

  describe('AuthErrorHandler Component Integration', () => {
    it('should pass correct props to AuthErrorHandler', async () => {
      const errorMessage = 'Test error message';

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError(errorMessage);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(AuthErrorHandler.AuthErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage,
          onRetrySuccess: expect.any(Function),
          onRetryError: expect.any(Function),
        }),
        expect.anything()
      );
    });

    it('should only render AuthErrorHandler when error is visible', () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();

      triggerGlobalAuthError('Error');

      waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Children', () => {
    it('should render multiple children correctly', () => {
      render(
        <AuthErrorProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AuthErrorProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });

  describe('Error Message Variations', () => {
    it('should handle empty error message', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('');
    });

    it('should handle long error message', async () => {
      const longMessage = 'A'.repeat(500);

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError(longMessage);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(longMessage);
    });

    it('should handle special characters in error message', async () => {
      const specialMessage = '<script>alert("xss")</script> & "quotes" \'apostrophes\'';

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError(specialMessage);

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(specialMessage);
    });
  });

  describe('Context Provider Value', () => {
    it('should provide empty context value', () => {
      // The context value is empty by design, just verify provider works
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive calls to triggerGlobalAuthError', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Error 1');
      triggerGlobalAuthError('Error 2');
      triggerGlobalAuthError('Error 3');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Should show the last error
      expect(screen.getByTestId('error-message')).toHaveTextContent('Error 3');
    });

    it('should handle error while another error is visible', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('First error');

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('First error');
      });

      triggerGlobalAuthError('Second error');

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Second error');
      });
    });

    it('should handle globalAuthError changing from null to error', async () => {
      const { rerender } = render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();

      // Change mock to return error
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: 'New error',
      });

      rerender(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });
    });

    it('should handle useAuthRefresh returning undefined error', () => {
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: undefined as any,
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
    });
  });

  describe('Callback Optional Parameters', () => {
    it('should work without onRetrySuccess callback', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Error without callbacks');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Should not throw when clicking retry success
      expect(() => {
        screen.getByTestId('retry-success-btn').click();
      }).not.toThrow();

      // Error should be hidden after success
      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });
    });

    it('should work without onRetryError callback', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Error without callbacks');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      // Should not throw when clicking retry error
      expect(() => {
        screen.getByTestId('retry-error-btn').click();
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should maintain separate error state from global auth error', async () => {
      vi.mocked(useAuthRefresh.useAuthRefresh).mockReturnValue({
        ...mockUseAuthRefresh,
        authError: 'Global error',
      });

      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Global error');
      });

      // Trigger manual error
      triggerGlobalAuthError('Manual error');

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Manual error');
      });
    });

    it('should reset error state when hidden', async () => {
      render(
        <AuthErrorProvider>
          <TestComponent />
        </AuthErrorProvider>
      );

      triggerGlobalAuthError('Test error');

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-handler')).toBeInTheDocument();
      });

      screen.getByTestId('retry-success-btn').click();

      await waitFor(() => {
        expect(screen.queryByTestId('auth-error-handler')).not.toBeInTheDocument();
      });

      // Show error again
      triggerGlobalAuthError('New error');

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('New error');
      });
    });
  });
});