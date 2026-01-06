import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ModelConfigurationSection } from '../../../src/components/AILaunchpad/ModelConfigurationSection';
import { Deployment } from '../../../src/services/aiPlatformApi';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-abc-123',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
};

describe('ModelConfigurationSection', () => {
  const mockToast = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    (useToast as any).mockReturnValue({ toast: mockToast });

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn() },
    });
  });

  it('should render configuration ID with copy functionality', () => {
    const mockOnCopyId = vi.fn();
    render(<ModelConfigurationSection deployment={mockDeployment} onCopyId={mockOnCopyId} />);
    
    expect(screen.getByText('Config ID:')).toBeInTheDocument();
    expect(screen.getByText('config-abc-123')).toBeInTheDocument();
    
    // Get all buttons and click the second one (Config ID copy button)
    const copyButtons = screen.getAllByRole('button');
    expect(copyButtons).toHaveLength(2);
    
    // Click the second button (Config ID copy button)
    fireEvent.click(copyButtons[1]);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('config-abc-123');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Copied",
      description: "Configuration ID copied to clipboard",
    });
  });

  it('should display configuration ID in code format', () => {
    const mockOnCopyId = vi.fn();
    render(<ModelConfigurationSection deployment={mockDeployment} onCopyId={mockOnCopyId} />);
    
    const codeElement = screen.getByText('config-abc-123');
    expect(codeElement.tagName.toLowerCase()).toBe('code');
    expect(codeElement).toHaveClass('bg-muted');
  });
});
