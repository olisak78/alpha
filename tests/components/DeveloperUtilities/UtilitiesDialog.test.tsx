import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UtilitiesDialog } from '@/components/DeveloperUtilities/UtilitiesDialog';

// Mock the child components
vi.mock('@/components/DeveloperUtilities/Base64Utility', () => ({
  Base64Utility: () => <div data-testid="base64-utility">Base64 Utility</div>
}));

vi.mock('@/components/DeveloperUtilities/OAuthUtility', () => ({
  OAuthUtility: () => <div data-testid="oauth-utility">OAuth Utility</div>
}));

vi.mock('@/components/DeveloperUtilities/GuidUtility', () => ({
  GuidUtility: () => <div data-testid="guid-utility">GUID Utility</div>
}));

describe('UtilitiesDialog', () => {
  const mockOnOpenChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(<UtilitiesDialog open={false} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.queryByText('Developer Utilities')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByText('Developer Utilities')).toBeInTheDocument();
    expect(screen.getByText('Essential tools for developers: encoding, credentials, and ID generation')).toBeInTheDocument();
  });

  it('should display the Wrench icon', () => {
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    const title = screen.getByText('Developer Utilities');
    expect(title.parentElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('should render all three tab triggers', () => {
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByRole('tab', { name: /base64/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /oauth/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /guid/i })).toBeInTheDocument();
  });

  it('should have Base64 tab selected by default', () => {
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    const base64Tab = screen.getByRole('tab', { name: /base64/i });
    expect(base64Tab).toHaveAttribute('data-state', 'active');
  });

  it('should switch to OAuth tab when clicked', async () => {
    const user = userEvent.setup();
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    const oauthTab = screen.getByRole('tab', { name: /oauth/i });
    await user.click(oauthTab);
    
    expect(oauthTab).toHaveAttribute('data-state', 'active');
  });

  it('should switch to GUID tab when clicked', async () => {
    const user = userEvent.setup();
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    const guidTab = screen.getByRole('tab', { name: /guid/i });
    await user.click(guidTab);
    
    expect(guidTab).toHaveAttribute('data-state', 'active');
  });

  it('should render all child utility components', () => {
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByTestId('base64-utility')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-utility')).toBeInTheDocument();
    expect(screen.getByTestId('guid-utility')).toBeInTheDocument();
  });

  it('should call onOpenChange when dialog is closed', async () => {
    const user = userEvent.setup();
    render(<UtilitiesDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    // Press Escape to close dialog
    await user.keyboard('{Escape}');
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});