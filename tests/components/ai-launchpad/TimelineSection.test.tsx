import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../src/test/setup';
import { TimelineSection } from '../../../src/components/AILaunchpad/TimelineSection';
import { Deployment } from '../../../src/services/aiPlatformApi';

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  createdAt: '2023-01-01T12:30:45Z',
  modifiedAt: '2023-01-01T12:35:20Z',
};

const mockProps = {
  deployment: mockDeployment,
};

describe('TimelineSection', () => {
  it('should render timeline with proper structure and styling', () => {
    const { container } = render(<TimelineSection {...mockProps} />);
    
    // Check basic content
    expect(screen.getByText('Created:')).toBeInTheDocument();
    const formattedDate = new Date(mockDeployment.createdAt).toLocaleString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    
    // Check structure exists
    const timelineContainer = screen.getByText('Created:').closest('.space-y-3');
    expect(timelineContainer).toBeInTheDocument();
    
    const timelineItem = screen.getByText('Created:').closest('.flex.items-center.gap-2');
    expect(timelineItem).toBeInTheDocument();
    
    // Check visual indicator exists
    const blueDot = container.querySelector('.w-2.h-2.bg-blue-500.rounded-full');
    expect(blueDot).toBeInTheDocument();
  });

  it('should apply correct text styling', () => {
    render(<TimelineSection {...mockProps} />);
    
    const createdLabel = screen.getByText('Created:');
    expect(createdLabel).toBeInTheDocument();
    
    const formattedDate = new Date(mockDeployment.createdAt).toLocaleString();
    const timestamp = screen.getByText(formattedDate);
    expect(timestamp).toBeInTheDocument();
  });

  it('should handle different date formats', () => {
    const deploymentWithDifferentDate = {
      ...mockDeployment,
      createdAt: '2023-12-25T09:15:30Z',
    };
    
    render(<TimelineSection deployment={deploymentWithDifferentDate} />);
    
    const formattedDate = new Date(deploymentWithDifferentDate.createdAt).toLocaleString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('should handle invalid date gracefully', () => {
    const deploymentWithInvalidDate = {
      ...mockDeployment,
      createdAt: 'invalid-date',
    };
    
    render(<TimelineSection deployment={deploymentWithInvalidDate} />);
    
    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Invalid Date')).toBeInTheDocument();
  });

  it('should display only essential timeline information', () => {
    render(<TimelineSection {...mockProps} />);
    
    // Should show created date
    expect(screen.getByText('Created:')).toBeInTheDocument();
    
    // Should not show other timeline events that aren't implemented
    expect(screen.queryByText('Modified:')).not.toBeInTheDocument();
    expect(screen.queryByText('Started:')).not.toBeInTheDocument();
  });

  it('should handle missing createdAt gracefully', () => {
    const deploymentWithoutCreatedAt = {
      ...mockDeployment,
      createdAt: undefined as any,
    };
    
    render(<TimelineSection deployment={deploymentWithoutCreatedAt} />);
    
    expect(screen.getByText('Created:')).toBeInTheDocument();
  });
});
