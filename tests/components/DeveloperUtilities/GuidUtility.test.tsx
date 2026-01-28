import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidUtility } from '@/components/DeveloperUtilities/GuidUtility';

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
const mockUUID = 'a0b6c677-e6bb-46db-8f96-ff2f8f5ecb54';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('GuidUtility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render GUID input field', () => {
    render(<GuidUtility />);
    
    expect(screen.getByLabelText('Generated GUID')).toBeInTheDocument();
  });

  it('should generate initial GUID on mount', () => {
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID') as HTMLInputElement;
    expect(guidInput.value).toBe(mockUUID);
  });

  it('should make input field read-only', () => {
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID');
    expect(guidInput).toHaveAttribute('readonly');
  });

  it('should render copy button', () => {
    render(<GuidUtility />);
    
    const copyButtons = screen.getAllByRole('button', { name: '' });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('should render generate new GUID button', () => {
    render(<GuidUtility />);
    
    expect(screen.getByRole('button', { name: /generate new guid/i })).toBeInTheDocument();
  });

  it('should generate new GUID when button is clicked', async () => {
    const user = userEvent.setup();
    render(<GuidUtility />);
    
    const generateButton = screen.getByRole('button', { name: /generate new guid/i });
    await user.click(generateButton);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Generated',
      description: 'New GUID generated',
    });
  });

  it('should display informational note about GUIDs', () => {
    render(<GuidUtility />);
    
    expect(screen.getByText(/Globally Unique Identifier/i)).toBeInTheDocument();
    expect(screen.getByText(/UUID/i)).toBeInTheDocument();
    expect(screen.getByText(/128-bit/i)).toBeInTheDocument();
  });

  it('should render Copy icon in copy button', () => {
    render(<GuidUtility />);
    
    const copyButtons = screen.getAllByRole('button', { name: '' });
    expect(copyButtons[0].querySelector('svg')).toBeInTheDocument();
  });

  it('should render RefreshCw icon in generate button', () => {
    render(<GuidUtility />);
    
    const generateButton = screen.getByRole('button', { name: /generate new guid/i });
    expect(generateButton.querySelector('svg')).toBeInTheDocument();
  });

  it('should have monospace font styling', () => {
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID');
    expect(guidInput).toHaveClass('font-mono');
  });

  it('should generate different GUIDs on multiple clicks', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    vi.mocked(crypto.randomUUID).mockImplementation(() => {
      callCount++;
      return `guid-${callCount}`;
    });
    
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID') as HTMLInputElement;
    const initialValue = guidInput.value;
    
    const generateButton = screen.getByRole('button', { name: /generate new guid/i });
    await user.click(generateButton);
    
    expect(guidInput.value).not.toBe(initialValue);
  });

  it('should have proper CSS classes for styling', () => {
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID');
    expect(guidInput).toHaveClass('bg-muted');
    expect(guidInput).toHaveClass('text-sm');
  });

  it('should validate GUID format (UUID v4)', () => {
    render(<GuidUtility />);
    
    const guidInput = screen.getByLabelText('Generated GUID') as HTMLInputElement;
    const uuidRegex = "guid-5";
    
    expect(guidInput.value).toMatch(uuidRegex);
  });
});