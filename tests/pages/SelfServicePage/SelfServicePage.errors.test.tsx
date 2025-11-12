import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Mock fetch for static job data
global.fetch = vi.fn();

// Mock the dependencies BEFORE importing
vi.mock('../../../src/hooks/api/useSelfService', () => ({
  useFetchJenkinsJobParameters: vi.fn()
}));

vi.mock('../../../src/hooks/api/mutations/useSelfServiceMutations', () => ({
  useTriggerJenkinsJob: vi.fn()
}));

vi.mock('../../../src/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock useCurrentUser hook
vi.mock('../../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(() => ({
    data: {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
      team_id: 'team-123'
    },
    isLoading: false,
    error: null
  }))
}));

// Mock useJobStatus and useAddJobStatus hooks
vi.mock('../../../src/hooks/api/useJobStatus', () => ({
  useJobStatus: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useAddJobStatus: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false
  }))
}));

vi.mock('../../../src/services/SelfServiceApi', () => ({
  fetchAndPopulateDynamicSteps: vi.fn(),
  triggerJenkinsJob: vi.fn()
}));

// Mock SelfServiceBlockDialog component with correct props structure
vi.mock('../../../src/components/SelfService/SelfServiceBlockDialog', () => ({
  default: ({ 
    block, 
    isOpen, 
    isLoading,
    formData, 
    currentStepIndex, 
    onOpenDialog, 
    onCloseDialog, 
    onFormChange, 
    onNext, 
    onPrevious, 
    onCancel,
    onSubmit
  }: any) => (
    <div>
      <div className="card-trigger" onClick={onOpenDialog} data-testid={`dialog-trigger-${block.id}`}>
        <h3>{block.title}</h3>
        <p>{block.description}</p>
        <span>{block.category}</span>
      </div>
      {isOpen && (
        <div data-testid={`dialog-${block.id}`}>
          <input 
            data-testid="form-input"
            onChange={(e) => onFormChange && onFormChange('testField', e.target.value)}
            value={formData?.testField || ''}
          />
          <button 
            onClick={onSubmit}
            data-testid="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
          <button onClick={onNext} data-testid="next-button">Next</button>
          <button onClick={onPrevious} data-testid="previous-button">Previous</button>
          <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
          <button onClick={() => onCloseDialog && onCloseDialog(false)} data-testid="close-button">Close</button>
          <div data-testid="current-step-index">{currentStepIndex}</div>
        </div>
      )}
    </div>
  )
}));

// Mock BreadcrumbPage component
vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="breadcrumb-page">{children}</div>
  ),
}));

// Mock selfServiceBlocks data
vi.mock('../../../src/data/self-service/selfServiceBlocks', () => ({
  selfServiceBlocks: [
    {
      id: 'create-landscape',
      title: 'Create Dev Landscape',
      description: 'Spin up a new development environment',
      icon: () => null,
      category: 'Infrastructure',
      dialogType: 'static',
      dataFilePath: '/data/self-service/static-jobs/create-dev-landscape.json',
      jenkinsJob: {
        jaasName: 'atom',
        jobName: 'deploy-dev-landscape'
      }
    },
    {
      id: 'create-multicis',
      title: 'Create MultiCIS Environment',
      description: 'Deploy CIS services to a Cloud Foundry environment',
      icon: () => null,
      category: 'Infrastructure',
      dialogType: 'dynamic',
      dataFilePath: '/data/self-service/dynamic-jobs/create-multicis.json',
      jenkinsJob: {
        jaasName: 'gkecfsmulticis2',
        jobName: 'multi-cis-v3-create'
      }
    }
  ]
}));

// Mock self-service JSON data
vi.mock('../../../src/data/self-service/self-service.json', () => ({
  default: {
    'self-service-wizards': [
      {
        id: 'create-dev-landscape',
        title: 'Create Dev Landscape',
        description: 'Spin up a new development environment',
        steps: [
          { 
            id: 'step-1', 
            title: 'Configuration', 
            description: 'Configure your settings',
            stepNumber: 1,
            elements: [],
            nextStepId: 'step-2',
            prevStepId: null,
            isLastStep: false
          },
          { 
            id: 'step-2', 
            title: 'Review', 
            description: 'Review your configuration',
            stepNumber: 2,
            elements: [],
            nextStepId: null,
            prevStepId: 'step-1',
            isLastStep: true
          }
        ]
      }
    ]
  }
}));

import { renderSelfServicePage, mockFetchError } from './__utils__/setupSelfServiceTests';
import { useFetchJenkinsJobParameters } from '../../../src/hooks/api/useSelfService';
import { useTriggerJenkinsJob } from '../../../src/hooks/api/mutations/useSelfServiceMutations';
import { toast } from '../../../src/components/ui/use-toast';
import { mockEnvironmentJobData } from './__fixtures__/mockJenkinsData';

describe('SelfServicePage - Error Handling', () => {
  let mockUseFetchJenkinsJobParameters: any;
  let mockUseTriggerJenkinsJob: any;
  let mockToast: any;

  beforeEach(() => {
    // Setup default mock return values
    mockUseFetchJenkinsJobParameters = vi.mocked(useFetchJenkinsJobParameters);
    mockUseTriggerJenkinsJob = vi.mocked(useTriggerJenkinsJob);
    mockToast = vi.mocked(toast);

    mockUseFetchJenkinsJobParameters.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    } as any);

    mockUseTriggerJenkinsJob.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
    } as any);

    // Setup fetch mock for static data loading
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ parameterDefinitions: [] })
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Static Job Data Loading', () => {
    it('loads static job data successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEnvironmentJobData)
      } as any);

      renderSelfServicePage();
      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/data/self-service/static-jobs/create-dev-landscape.json');
      });
    });

    it('handles static job data loading errors', async () => {
      mockFetchError(new Error('Failed to fetch'));
      
      renderSelfServicePage();
      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load configuration',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Jenkins API errors gracefully', async () => {
      mockUseFetchJenkinsJobParameters.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Jenkins API Error'),
        isError: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      renderSelfServicePage();
      fireEvent.click(screen.getByTestId('dialog-trigger-create-multicis'));

      await waitFor(() => {
        expect(screen.getByTestId('dialog-create-multicis')).toBeInTheDocument();
      });
    });
  });
});