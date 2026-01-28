import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { CreateDeploymentDialog } from '../../../src/components/AILaunchpad/CreateDeploymentDialog';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/services/aiPlatformApi', () => ({
  useFoundationModels: vi.fn(),
  useCreateConfiguration: vi.fn(),
  useCreateDeployment: vi.fn(),
}));

vi.mock('../../../src/components/AILaunchpad/ModelSearchStep', () => ({
  ModelSearchStep: ({ onModelSelect }: any) => (
    <div data-testid="model-search">
      <button onClick={() => onModelSelect({ id: 'model-1', displayName: 'Test Model' })}>
        Select Model
      </button>
    </div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentConfigurationStep', () => ({
  DeploymentConfigurationStep: () => <div data-testid="deployment-config">Configuration</div>,
}));

vi.mock('../../../src/components/AILaunchpad/CreateDeploymentDialogButtons', () => ({
  CreateDeploymentDialogButtons: ({ onDeploy, onCancel }: any) => (
    <div data-testid="dialog-buttons">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onDeploy}>Deploy</button>
    </div>
  ),
}));

describe('CreateDeploymentDialog', () => {
  const mockToast = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockCreateConfiguration = { mutateAsync: vi.fn(), isPending: false };
  const mockCreateDeployment = { mutateAsync: vi.fn(), isPending: false };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    const { useFoundationModels, useCreateConfiguration, useCreateDeployment } = await import('../../../src/services/aiPlatformApi');
    
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useFoundationModels as any).mockReturnValue({
      data: { resources: [] },
      isLoading: false,
    });
    (useCreateConfiguration as any).mockReturnValue(mockCreateConfiguration);
    (useCreateDeployment as any).mockReturnValue(mockCreateDeployment);
  });

  it('should render model search step and progress to configuration', () => {
    render(<CreateDeploymentDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByText('Deploy AI Model')).toBeInTheDocument();
    expect(screen.getByTestId('model-search')).toBeInTheDocument();
    
    // Progress to configuration step
    fireEvent.click(screen.getByText('Select Model'));
    
    expect(screen.getByText('Deploy Test Model')).toBeInTheDocument();
    expect(screen.getByTestId('deployment-config')).toBeInTheDocument();
  });

  it('should handle deployment flow and cancel action', async () => {
    mockCreateConfiguration.mutateAsync.mockResolvedValue({ id: 'config-123' });
    mockCreateDeployment.mutateAsync.mockResolvedValue({});

    render(<CreateDeploymentDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    // Select model and deploy
    fireEvent.click(screen.getByText('Select Model'));
    fireEvent.click(screen.getByText('Deploy'));
    
    expect(mockCreateDeployment.mutateAsync).toHaveBeenCalled();
    
    // Test cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should prevent deployment when teams are available but none selected', async () => {
    const availableTeams = ['team-1', 'team-2'];
    
    render(
      <CreateDeploymentDialog 
        open={true} 
        onOpenChange={mockOnOpenChange}
        availableTeams={availableTeams}
      />
    );
    
    // Select model and attempt to deploy without selecting team
    fireEvent.click(screen.getByText('Select Model'));
    fireEvent.click(screen.getByText('Deploy'));
    
    // Should show error toast and not call deployment API
    expect(mockToast).toHaveBeenCalledWith({
      title: "Team Required",
      description: "Please select a team before deploying",
      variant: "destructive",
    });
    expect(mockCreateDeployment.mutateAsync).not.toHaveBeenCalled();
  });

  it('should allow deployment when teams are available and one is selected', async () => {
    const availableTeams = ['team-1', 'team-2'];
    const user = userEvent.setup();
    
    mockCreateDeployment.mutateAsync.mockResolvedValue({});
    
    render(
      <CreateDeploymentDialog 
        open={true} 
        onOpenChange={mockOnOpenChange}
        availableTeams={availableTeams}
      />
    );
    
    // Select a team
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    await user.click(screen.getByRole('option', { name: 'team-1' }));
    
    // Select model and deploy
    fireEvent.click(screen.getByText('Select Model'));
    fireEvent.click(screen.getByText('Deploy'));
    
    // Should call deployment API with team
    expect(mockCreateDeployment.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        team: 'team-1'
      })
    );
  });

  it('should not render when closed', () => {
    render(<CreateDeploymentDialog open={false} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.queryByText('Deploy AI Model')).not.toBeInTheDocument();
  });

  describe('Team Selection Dropdown', () => {
    it('should not render team selection when availableTeams is empty', () => {
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={[]}
        />
      );
      
      expect(screen.queryByText('Team:')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should not render team selection when availableTeams is not provided', () => {
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.queryByText('Team:')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should render team selection when availableTeams has items', () => {
      const availableTeams = ['team-1', 'team-2', 'team-3'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      expect(screen.getByText('Team:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select team')).toBeInTheDocument();
    });

    it('should render team label with correct attributes', () => {
      const availableTeams = ['team-1', 'team-2'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      const label = screen.getByText('Team:');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'team-select');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-muted-foreground');
    });

    it('should render select trigger with correct styling when no team is selected', () => {
      const availableTeams = ['team-1', 'team-2'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveAttribute('id', 'team-select');
      expect(selectTrigger).toHaveClass('w-64', 'h-10', 'border-red-500', 'focus:border-red-500');
    });

    it('should render select trigger without error styling when team is selected', async () => {
      const availableTeams = ['team-1', 'team-2'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
          selectedTeam="team-1"
        />
      );
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveAttribute('id', 'team-select');
      expect(selectTrigger).toHaveClass('w-64', 'h-10');
      expect(selectTrigger).not.toHaveClass('border-red-500', 'focus:border-red-500');
    });

    it('should display available teams in dropdown options', async () => {
      const availableTeams = ['team-alpha', 'team-beta', 'team-gamma'];
      const user = userEvent.setup();
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      // Click to open dropdown
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      // Check that all teams are rendered as options
      for (const team of availableTeams) {
        expect(screen.getByRole('option', { name: team })).toBeInTheDocument();
      }
    });

    it('should handle team selection change', async () => {
      const availableTeams = ['team-1', 'team-2', 'team-3'];
      const user = userEvent.setup();
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      // Open dropdown and select a team
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      const teamOption = screen.getByRole('option', { name: 'team-2' });
      await user.click(teamOption);
      
      // Verify the selected value is displayed in the trigger
      await waitFor(() => {
        expect(screen.getByText('team-2')).toBeInTheDocument();
      });
    });

    it('should set default team when selectedTeam prop is provided and not "all"', () => {
      const availableTeams = ['team-1', 'team-2'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
          selectedTeam="team-1"
        />
      );
      
      expect(screen.getByText('team-1')).toBeInTheDocument();
    });

    it('should not set default team when selectedTeam is "all"', () => {
      const availableTeams = ['team-1', 'team-2'];
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
          selectedTeam="all"
        />
      );
      
      expect(screen.getByText('Select team')).toBeInTheDocument();
      expect(screen.queryByText('all')).not.toBeInTheDocument();
    });

    it('should maintain team selection state during step transitions', async () => {
      const availableTeams = ['team-1', 'team-2'];
      const user = userEvent.setup();
      
      render(
        <CreateDeploymentDialog 
          open={true} 
          onOpenChange={mockOnOpenChange}
          availableTeams={availableTeams}
        />
      );
      
      // Select a team
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await user.click(screen.getByRole('option', { name: 'team-1' }));
      
      // Progress to configuration step
      fireEvent.click(screen.getByText('Select Model'));
      
      // Verify team selection is maintained
      await waitFor(() => {
        expect(screen.getByText('team-1')).toBeInTheDocument();
      });
    });
  });
});
