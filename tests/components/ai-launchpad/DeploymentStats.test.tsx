import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../src/test/setup';
import { DeploymentStats } from '../../../src/components/AILaunchpad/DeploymentStats';
import { Deployment } from '../../../src/services/aiPlatformApi';

const createMockDeployment = (overrides: Partial<Deployment> = {}): Deployment => ({
  id: 'deployment-1',
  status: 'RUNNING',
  configurationId: 'config-1',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
  configurationName: 'Test Model Config',
  ...overrides,
});

describe('DeploymentStats', () => {
  it('should not render when no deployments are provided', () => {
    render(<DeploymentStats deployments={[]} />);
    
    expect(screen.queryByText('Deployment Summary')).not.toBeInTheDocument();
  });

  it('should render deployment counts correctly', () => {
    const deployments = [
      createMockDeployment({ status: 'RUNNING' }),
      createMockDeployment({ id: 'deployment-2', status: 'RUNNING' }),
      createMockDeployment({ id: 'deployment-3', status: 'STOPPED' }),
    ];

    render(<DeploymentStats deployments={deployments} />);
    
    expect(screen.getByText('Deployment Summary')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Running count
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total count
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should count unique model types correctly', () => {
    const deployments = [
      createMockDeployment({ 
        configurationName: 'GPT-4 Config',
        details: {
          resources: {
            backendDetails: {
              model: { name: 'gpt-4', version: '1.0' }
            }
          }
        }
      }),
      createMockDeployment({ 
        id: 'deployment-2',
        configurationName: 'Claude Config',
        details: {
          resources: {
            backendDetails: {
              model: { name: 'claude-3', version: '1.0' }
            }
          }
        }
      }),
      createMockDeployment({ 
        id: 'deployment-3',
        configurationName: 'GPT-4 Config', // Same model, should not increase count
        details: {
          resources: {
            backendDetails: {
              model: { name: 'gpt-4', version: '1.0' }
            }
          }
        }
      }),
    ];

    render(<DeploymentStats deployments={deployments} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Unique models count
    expect(screen.getByText('Model Types')).toBeInTheDocument();
  });

  it('should show issues badge when there are problem deployments', () => {
    const deployments = [
      createMockDeployment({ status: 'RUNNING' }),
      createMockDeployment({ id: 'deployment-2', status: 'DEAD' }),
      createMockDeployment({ id: 'deployment-3', status: 'UNKNOWN' }),
    ];

    render(<DeploymentStats deployments={deployments} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Issues count
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('should not show issues badge when no problem deployments exist', () => {
    const deployments = [
      createMockDeployment({ status: 'RUNNING' }),
      createMockDeployment({ id: 'deployment-2', status: 'STOPPED' }),
      createMockDeployment({ id: 'deployment-3', status: 'PENDING' }),
    ];

    render(<DeploymentStats deployments={deployments} />);
    
    expect(screen.queryByText('Issues')).not.toBeInTheDocument();
  });

  it('should handle various deployment statuses correctly', () => {
    const deployments = [
      createMockDeployment({ status: 'RUNNING' }),
      createMockDeployment({ id: 'deployment-2', status: 'PENDING' }),
      createMockDeployment({ id: 'deployment-3', status: 'STOPPED' }),
      createMockDeployment({ id: 'deployment-4', status: 'COMPLETED' }),
      createMockDeployment({ id: 'deployment-5', status: 'DEAD' }),
      createMockDeployment({ id: 'deployment-6', status: 'UNKNOWN' }),
    ];

    render(<DeploymentStats deployments={deployments} />);
    
    // Only RUNNING and PENDING should count as "running"
    expect(screen.getByText('2')).toBeInTheDocument(); // Running count
    expect(screen.getByText('6')).toBeInTheDocument(); // Total count
    expect(screen.getByText('2')).toBeInTheDocument(); // Issues count (DEAD + UNKNOWN)
  });
});
