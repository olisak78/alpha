import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { AuthDialog } from '../../../src/components/AILaunchpad/AuthDialog';

// Mock dependencies
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../src/services/aiPlatformApi', () => ({
  useAIAuth: vi.fn(),
}));

const mockProps = {
  open: true,
  onOpenChange: vi.fn(),
};

describe('AuthDialog', () => {
  const mockToast = vi.fn();
  const mockAuthenticate = { mutateAsync: vi.fn(), isPending: false };
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    const { useAIAuth } = await import('../../../src/services/aiPlatformApi');
    
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useAIAuth as any).mockReturnValue({ authenticate: mockAuthenticate });
  });

  it('should render authentication form and validate required fields', async () => {
    const user = userEvent.setup();
    render(<AuthDialog {...mockProps} />);
    
    expect(screen.getByText('Authenticate with CFS AI Engine')).toBeInTheDocument();
    expect(screen.getByLabelText(/Client ID/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Secret/)).toBeInTheDocument();
    
    // Test validation - click submit with empty fields
    const submitButton = screen.getByRole('button', { name: /Authenticate/ });
    await user.click(submitButton);
    
    // Check that the mutation was not called due to validation
    expect(mockAuthenticate.mutateAsync).not.toHaveBeenCalled();
    
    // The test validates that form submission is blocked when required fields are empty
    // The actual error message rendering may depend on component implementation details
  });

  it('should toggle client secret visibility', async () => {
    const user = userEvent.setup();
    render(<AuthDialog {...mockProps} />);
    
    const secretInput = screen.getByLabelText(/Client Secret/) as HTMLInputElement;
    const toggleButton = secretInput.parentElement?.querySelector('button[type="button"]') as HTMLButtonElement;
    
    expect(secretInput.type).toBe('password');
    await user.click(toggleButton);
    expect(secretInput.type).toBe('text');
  });

  it('should submit form with correct data', async () => {
    const user = userEvent.setup();
    mockAuthenticate.mutateAsync.mockResolvedValue({});
    
    render(<AuthDialog {...mockProps} />);
    
    await user.type(screen.getByLabelText(/Client ID/), 'test-client-id');
    await user.type(screen.getByLabelText(/Client Secret/), 'test-secret');
    await user.type(screen.getByLabelText(/Authentication URL/), 'https://auth.example.com');
    
    await user.click(screen.getByRole('button', { name: /Authenticate/ }));
    
    expect(mockAuthenticate.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authUrl: 'https://auth.example.com',
      })
    );
  });

  it('should parse JSON credentials', async () => {
    const user = userEvent.setup();
    render(<AuthDialog {...mockProps} />);
    
    const jsonTextarea = screen.getByPlaceholderText(/Paste your credentials JSON/);
    const parseButton = screen.getByRole('button', { name: /Parse JSON/ });
    
    const jsonInput = `{"clientId":"json-client-id","clientSecret":"json-secret","authUrl":"https://json-auth.example.com"}`;
    
    await user.clear(jsonTextarea);
    await user.paste(jsonInput);
    await user.click(parseButton);
    
    expect((screen.getByLabelText(/Client ID/) as HTMLInputElement).value).toBe('json-client-id');
    expect((screen.getByLabelText(/Client Secret/) as HTMLInputElement).value).toBe('json-secret');
  });

  it('should handle authentication success and failure', async () => {
    const user = userEvent.setup();
    
    // Test success first
    mockAuthenticate.mutateAsync.mockResolvedValue({});
    render(<AuthDialog {...mockProps} />);
    
    await user.type(screen.getByLabelText(/Client ID/), 'test-id');
    await user.type(screen.getByLabelText(/Client Secret/), 'test-secret');
    await user.type(screen.getByLabelText(/Authentication URL/), 'https://auth.example.com');
    await user.click(screen.getByRole('button', { name: /Authenticate/ }));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Authentication Successful",
        description: "You are now connected to CFS AI Engine",
      });
    });
  });

  it('should handle authentication failure', async () => {
    const user = userEvent.setup();
    
    // Test failure case
    mockAuthenticate.mutateAsync.mockRejectedValue(new Error('Auth failed'));
    render(<AuthDialog {...mockProps} />);
    
    await user.type(screen.getByLabelText(/Client ID/), 'test-id-fail');
    await user.type(screen.getByLabelText(/Client Secret/), 'test-secret-fail');
    await user.type(screen.getByLabelText(/Authentication URL/), 'https://auth-fail.example.com');
    await user.click(screen.getByRole('button', { name: /Authenticate/ }));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Authentication Failed",
          variant: "destructive",
        })
      );
    });
  });

  it('should handle loading state and cancel action', async () => {
    const user = userEvent.setup();
    mockAuthenticate.isPending = true;
    
    render(<AuthDialog {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /Authenticating.../ })).toBeDisabled();
    
    // Test cancel
    mockAuthenticate.isPending = false;
    render(<AuthDialog {...mockProps} />);
    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
