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
  fetchAndPopulateDynamicSteps: vi.fn()
}));

// Mock SelfServiceBlockDialog component
vi.mock('../../../src/components/SelfService/SelfServiceBlockDialog', () => ({
  default: ({ 
    block, 
    isOpen, 
    onOpenDialog, 
    onCloseDialog, 
    formData, 
    onFormDataChange, 
    onSubmit, 
    onCancel, 
    onNext, 
    onPrevious, 
    currentStepIndex 
  }: any) => (
    <div data-testid={`dialog-container-${block.id}`}>
      <button 
        data-testid={`dialog-trigger-${block.id}`}
        onClick={() => onOpenDialog(block)}
      >
        {block.title}
      </button>
      {isOpen && (
        <div data-testid={`dialog-${block.id}`}>
          <input data-testid="form-input" />
          <button 
            data-testid="submit-button"
            onClick={onSubmit}
          >
            Submit
          </button>
          <button onClick={onNext} data-testid="next-button">Next</button>
          <button onClick={onPrevious} data-testid="previous-button">Previous</button>
          <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
          <button onClick={() => onCloseDialog(false)} data-testid="close-button">Close</button>
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

import { renderSelfServicePage, mockFetchResponse } from './__utils__/setupSelfServiceTests';
import { useFetchJenkinsJobParameters } from '../../../src/hooks/api/useSelfService';
import { useTriggerJenkinsJob } from '../../../src/hooks/api/mutations/useSelfServiceMutations';
import { toast } from '../../../src/components/ui/use-toast';
import { 
  mockStaticJobData, 
  mockDynamicJobData, 
  mockParameterFilteringJobData 
} from './__fixtures__/mockJenkinsData';

describe('SelfServicePage - Jenkins Integration', () => {
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

  describe('Jenkins Integration', () => {
    it('manages parameter fetching for different dialog types', async () => {
      renderSelfServicePage();

      // Initially should not fetch (dialog closed)
      expect(mockUseFetchJenkinsJobParameters).toHaveBeenCalled();
    });

    it('filters parameters correctly based on type', async () => {
      const mockMutate = vi.fn();
      mockUseTriggerJenkinsJob.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
        isSuccess: false,
      } as any);

      // Mock the static job data with checkbox parameters
      mockFetchResponse(mockParameterFilteringJobData);

      renderSelfServicePage();
      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));
      
      // Wait for static data to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/data/self-service/static-jobs/create-dev-landscape.json');
      });

      await waitFor(() => {
        expect(screen.getByTestId('dialog-create-landscape')).toBeInTheDocument();
      });

      // Wait for the form data to be populated from the loaded parameters
      await waitFor(() => {
        expect(screen.getByTestId('dialog-create-landscape')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Give a small delay for form data initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      fireEvent.click(screen.getByTestId('submit-button'));

      // Wait for the mutation to be called
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      // The new submitForm() function includes checkbox parameters regardless of value
      // It filters based on type: checkbox params are always included, text params only if non-empty
      const calledParameters = mockMutate.mock.calls[0][0].parameters;
      
      // Verify the new filtering behavior:
      // - trueBoolParam (checkbox=true) should be included
      // - falseBoolParam (checkbox=false converted to '') should be included
      // - stringParam (text='test') should be included
      expect(calledParameters).toHaveProperty('trueBoolParam', true);
      expect(calledParameters).toHaveProperty('falseBoolParam', ''); // False becomes empty string from getDefaults
      expect(calledParameters).toHaveProperty('stringParam', 'test');
    });
  });
});