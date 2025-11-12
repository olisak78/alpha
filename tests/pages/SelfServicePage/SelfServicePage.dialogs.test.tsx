import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch for static job data
global.fetch = vi.fn();

// Mock the dependencies
vi.mock('../../../src/hooks/api/useSelfService');
vi.mock('../../../src/hooks/api/mutations/useSelfServiceMutations');
vi.mock('../../../src/components/ui/use-toast');
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
            onChange={(e) => onFormChange('testField', e.target.value)}
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

import { renderSelfServicePage, setupDefaultMocks } from './__utils__/setupSelfServiceTests';

describe('SelfServicePage - Dialog Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Management', () => {
    it('opens and closes dialogs with proper state management', async () => {
      renderSelfServicePage();

      // Open dialog
      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog-create-landscape')).toBeInTheDocument();
      });

      // Make changes to form
      const input = screen.getByTestId('form-input');
      fireEvent.change(input, { target: { value: 'test value' } });
      expect(input).toHaveValue('test value');

      // Close dialog
      fireEvent.click(screen.getByTestId('close-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-create-landscape')).not.toBeInTheDocument();
      });

      // Reopen dialog and verify state was reset
      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));

      await waitFor(() => {
        const newInput = screen.getByTestId('form-input');
        expect(newInput).toHaveValue('');
        expect(screen.getByTestId('current-step-index')).toHaveTextContent('0');
      });
    });

    it('handles cancel action correctly', async () => {
      renderSelfServicePage();

      fireEvent.click(screen.getByTestId('dialog-trigger-create-landscape'));
      fireEvent.click(screen.getByTestId('cancel-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-create-landscape')).not.toBeInTheDocument();
      });
    });
  });
});
