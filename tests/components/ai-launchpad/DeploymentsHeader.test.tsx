import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { DeploymentsHeader } from '../../../src/components/AILaunchpad/DeploymentsHeader';

const mockProps = {
  teams: ['team-alpha', 'team-beta', 'team-gamma'],
  selectedTeam: 'all',
  hasMultipleTeams: true,
  isRefreshing: false,
  onTeamChange: vi.fn(),
  onRefresh: vi.fn(),
  onCreateDeployment: vi.fn(),
};

describe('DeploymentsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render action buttons', () => {
    render(<DeploymentsHeader {...mockProps} />);

    expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deploy Model/ })).toBeInTheDocument();
  });

  it('should handle button clicks', async () => {
    const user = userEvent.setup();
    render(<DeploymentsHeader {...mockProps} />);
    
    // Test refresh button
    await user.click(screen.getByRole('button', { name: /Refresh/ }));
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
    
    // Test deploy button
    await user.click(screen.getByRole('button', { name: /Deploy Model/ }));
    expect(mockProps.onCreateDeployment).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when refreshing', () => {
    const refreshingProps = {
      ...mockProps,
      isRefreshing: true,
    };

    render(<DeploymentsHeader {...refreshingProps} />);

    const refreshButton = screen.getByRole('button', { name: /Refresh/ });
    expect(refreshButton).toBeDisabled();

    const spinningIcon = refreshButton.querySelector('[class*="animate-spin"]');
    expect(spinningIcon).toBeInTheDocument();
  });
});
