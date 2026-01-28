import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthUtility } from '@/components/DeveloperUtilities/OAuthUtility';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

// Mock crypto.randomUUID
const mockUUID = '12345678-1234-1234-1234-123456789abc';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = 65; // 'A' character
    }
    return arr;
  })
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('OAuthUtility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render client ID and secret inputs', () => {
    render(<OAuthUtility />);
    
    expect(screen.getByLabelText('Client ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Client Secret')).toBeInTheDocument();
  });

  it('should render copy buttons for both fields', () => {
    render(<OAuthUtility />);
    
    const copyButtons = screen.getAllByRole('button', { name: '' });
    expect(copyButtons).toHaveLength(2); // Two copy buttons
  });

  it('should render regenerate button', () => {
    render(<OAuthUtility />);
    
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
  });

  it('should make input fields read-only', () => {
    render(<OAuthUtility />);
    
    const clientIdInput = screen.getByLabelText('Client ID');
    const clientSecretInput = screen.getByLabelText('Client Secret');
    
    expect(clientIdInput).toHaveAttribute('readonly');
    expect(clientSecretInput).toHaveAttribute('readonly');
  });

  it('should regenerate credentials when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    render(<OAuthUtility />);
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    await user.click(regenerateButton);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Regenerated',
      description: 'New OAuth credentials generated',
    });
  });

  it('should display informational note', () => {
    render(<OAuthUtility />);
    
    expect(screen.getByText(/These are randomly generated credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/never commit them to version control/i)).toBeInTheDocument();
  });

  it('should render Copy icons in buttons', () => {
    render(<OAuthUtility />);
    
    const copyButtons = screen.getAllByRole('button', { name: '' });
    copyButtons.forEach(button => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('should render RefreshCw icon in regenerate button', () => {
    render(<OAuthUtility />);
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    expect(regenerateButton.querySelector('svg')).toBeInTheDocument();
  });

  it('should generate different values on regenerate', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    vi.mocked(crypto.randomUUID).mockImplementation(() => {
      callCount++;
      return `uuid-${callCount}`;
    });
    
    render(<OAuthUtility />);
    
    const clientIdInput = screen.getByLabelText('Client ID') as HTMLInputElement;
    const initialValue = clientIdInput.value;
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    await user.click(regenerateButton);
    
    expect(clientIdInput.value).not.toBe(initialValue);
  });
});