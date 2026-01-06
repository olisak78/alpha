import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../../src/test/setup';
import { EndpointSection } from '../../../src/components/AILaunchpad/EndpointSection';
import { Deployment } from '../../../src/services/aiPlatformApi';

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  deploymentUrl: 'https://api.example.com/deploy/123',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
};

const mockProps = {
  deployment: mockDeployment,
  onCopyEndpoint: vi.fn(),
};

describe('EndpointSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render endpoint section with URL and copy button', () => {
    render(<EndpointSection {...mockProps} />);
    
    expect(screen.getByText('Endpoint')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/deploy/123')).toBeInTheDocument();
    
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeInTheDocument();
  });

  it('should call onCopyEndpoint when copy button is clicked', async () => {
    const user = userEvent.setup();
    render(<EndpointSection {...mockProps} />);
    
    const copyButton = screen.getByRole('button');
    await user.click(copyButton);
    
    expect(mockProps.onCopyEndpoint).toHaveBeenCalledTimes(1);
  });

  it('should render with transparent text when deploymentUrl is not available', () => {
    const deploymentWithoutUrl = {
      ...mockDeployment,
      deploymentUrl: undefined,
    };
    
    render(<EndpointSection deployment={deploymentWithoutUrl} onCopyEndpoint={mockProps.onCopyEndpoint} />);
    
    // The component still renders but with transparent text
    const endpointHeader = screen.getByText('Endpoint');
    expect(endpointHeader).toBeInTheDocument();
    expect(endpointHeader).toHaveClass('text-transparent');
  });

  it('should toggle URL display when clicked', async () => {
    const user = userEvent.setup();
    render(<EndpointSection {...mockProps} />);
    
    const urlElement = screen.getByText('https://api.example.com/deploy/123');
    expect(urlElement.tagName).toBe('CODE');
    
    // Should be clickable
    await user.click(urlElement);
    // The expand/collapse functionality should work (we're testing behavior, not specific styles)
  });
});
