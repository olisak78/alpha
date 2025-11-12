import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SelfServiceWizard } from '../../../src/components/SelfService/SelfServiceWizard';

// Mock the UI components that require Dialog context
vi.mock('../../../src/components/ui/dialog', () => ({
  DialogHeader: ({ children, className }: any) => <div className={className} data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className} data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}));

// Mock the UI Card components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className} data-testid="card-content">{children}</div>,
}));

// Mock the StepIndicator component
vi.mock('../../../src/components/SelfService/StepIndicator', () => ({
  StepIndicator: ({ currentStepIndex }: any) => (
    <div data-testid="step-indicator">
      Step {currentStepIndex + 1}
    </div>
  ),
}));

// Mock the SelfServiceDialogButtons component
vi.mock('../../../src/components/SelfService/SelfServiceDialogButtons', () => ({
  SelfServiceDialogButtons: ({ currentStep, isLoading, canProceed, onCancel, onPrevious, onNext, onSubmit }: any) => (
    <div data-testid="dialog-buttons">
      <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
      <button onClick={onPrevious} data-testid="previous-button">Previous</button>
      <button onClick={onNext} data-testid="next-button" disabled={!canProceed}>
        Next
      </button>
      <button onClick={onSubmit} data-testid="submit-button" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  ),
}));

// Mock the FormElement component
vi.mock('../../../src/components/SelfService/FormElement', () => ({
  FormElement: ({ element, value, onChange }: any) => (
    <div data-testid={`form-element-${element.id || element.name}`}>
      <label>{element.title}</label>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${element.id || element.name}`}
      />
    </div>
  ),
}));

// Mock the FormPreview component
vi.mock('../../../src/components/SelfService/FormPreview', () => ({
  FormPreview: ({ parameters, formData }: any) => (
    <div data-testid="form-preview">
      Preview for {parameters?.length || 0} parameters
    </div>
  ),
}));

// Mock icon component
const MockIcon = () => <div data-testid="mock-icon" />;

describe('SelfServiceWizard', () => {
  const mockOnElementChange = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockBlock = {
    icon: MockIcon,
    title: 'Test Wizard',
    description: 'This is a test wizard description'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wizard Functionality', () => {
    it('renders wizard with comprehensive functionality and parameter handling', () => {
      // Test basic rendering with standard parameters
      const mockParameters = [
        {
          name: 'DEPLOY_VERSION',
          type: 'text',
          description: 'Version to deploy',
          defaultParameterValue: { value: '1.0.0' }
        },
        {
          name: 'ENABLE_DEBUG',
          type: 'checkbox',
          description: 'Enable debug mode',
          defaultParameterValue: { value: false }
        }
      ];

      const { rerender } = render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={mockParameters}
          formData={{ DEPLOY_VERSION: 'value1', ENABLE_DEBUG: true }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      // Header elements
      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
      expect(screen.getByText('This is a test wizard description')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();

      // Form elements
      expect(screen.getByTestId('form-element-DEPLOY_VERSION')).toBeInTheDocument();
      expect(screen.getByTestId('form-element-ENABLE_DEBUG')).toBeInTheDocument();

      // Step indicator and buttons
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Test Jenkins parameter format
      const jenkinsParameters = [
        {
          name: 'JENKINS_VERSION',
          type: 'StringParameterDefinition',
          description: 'Jenkins version',
          defaultParameterValue: { value: '2.0.0' }
        }
      ];

      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={jenkinsParameters}
          formData={{ JENKINS_VERSION: '2.0.0' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('form-element-JENKINS_VERSION')).toBeInTheDocument();

      // Test hidden parameter filtering
      const parametersWithHidden = [
        {
          name: 'VISIBLE_PARAM',
          type: 'StringParameterDefinition',
          description: 'Visible parameter'
        },
        {
          name: 'HIDDEN_PARAM',
          type: 'WHideParameterDefinition',
          description: 'Hidden parameter'
        }
      ];

      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithHidden}
          formData={{ VISIBLE_PARAM: 'test' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('form-element-VISIBLE_PARAM')).toBeInTheDocument();
      expect(screen.queryByTestId('form-element-HIDDEN_PARAM')).not.toBeInTheDocument();
    });

    it('handles interactions and parameter type mapping', () => {
      // Test form interactions
      const { rerender } = render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={[{ name: 'TEST_PARAM', type: 'StringParameterDefinition' }]}
          formData={{ TEST_PARAM: 'initial' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      // Test form change callback
      const input = screen.getByTestId('input-TEST_PARAM');
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(mockOnElementChange).toHaveBeenCalledWith('TEST_PARAM', 'new value');

      // Test button actions
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);

      // Test parameter type mapping
      const mixedParameters = [
        { name: 'STRING_PARAM', type: 'text' },
        { name: 'BOOLEAN_PARAM', type: 'checkbox' },
        { name: 'CHOICE_PARAM', type: 'select', options: [] }
      ];

      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={mixedParameters}
          formData={{}}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('form-element-STRING_PARAM')).toBeInTheDocument();
      expect(screen.getByTestId('form-element-BOOLEAN_PARAM')).toBeInTheDocument();
      expect(screen.getByTestId('form-element-CHOICE_PARAM')).toBeInTheDocument();
    });

    it('handles empty and edge states correctly', () => {
      // Test empty parameters
      const { rerender } = render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={[]}
          formData={{}}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
      expect(screen.getByText('No parameters available for this service.')).toBeInTheDocument();

      // Test empty formData
      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={[{ name: 'TEST_PARAM', type: 'StringParameterDefinition' }]}
          formData={{}}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('Test Wizard')).toBeInTheDocument();

      // Test null formData
      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={[{ name: 'TEST_PARAM', type: 'StringParameterDefinition' }]}
          formData={null as any}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('Test Wizard')).toBeInTheDocument();
    });
  });

  describe('Required Field Validation', () => {
    it('disables Next button when required fields are empty', () => {
      const parametersWithRequired = [
        {
          name: 'ClusterName',
          type: 'text',
          description: 'Cluster name is required',
          required: true,
          defaultParameterValue: { value: '' }
        },
        {
          name: 'OptionalField',
          type: 'text',
          description: 'Optional field'
        }
      ];

      render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithRequired}
          formData={{ ClusterName: '', OptionalField: 'some value' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('enables Next button when all required fields are filled', () => {
      const parametersWithRequired = [
        {
          name: 'ClusterName',
          type: 'text',
          description: 'Cluster name is required',
          required: true,
          defaultParameterValue: { value: '' }
        },
        {
          name: 'OptionalField',
          type: 'text',
          description: 'Optional field'
        }
      ];

      render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithRequired}
          formData={{ ClusterName: 'my-cluster', OptionalField: '' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();
    });

    it('validates multiple required fields correctly', () => {
      const parametersWithMultipleRequired = [
        {
          name: 'ClusterName',
          type: 'text',
          required: true,
          defaultParameterValue: { value: '' }
        },
        {
          name: 'Environment',
          type: 'text',
          required: true,
          defaultParameterValue: { value: '' }
        },
        {
          name: 'OptionalField',
          type: 'text'
        }
      ];

      const { rerender } = render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithMultipleRequired}
          formData={{ ClusterName: '', Environment: '', OptionalField: '' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      // Both required fields empty - button should be disabled
      let nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();

      // One required field filled - button should still be disabled
      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithMultipleRequired}
          formData={{ ClusterName: 'my-cluster', Environment: '', OptionalField: '' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();

      // Both required fields filled - button should be enabled
      rerender(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithMultipleRequired}
          formData={{ ClusterName: 'my-cluster', Environment: 'dev', OptionalField: '' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();
    });

    it('handles whitespace-only values in required fields as empty', () => {
      const parametersWithRequired = [
        {
          name: 'ClusterName',
          type: 'text',
          required: true,
          defaultParameterValue: { value: '' }
        }
      ];

      render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithRequired}
          formData={{ ClusterName: '   ' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('allows proceeding when no required fields exist', () => {
      const parametersWithoutRequired = [
        {
          name: 'OptionalField1',
          type: 'text'
        },
        {
          name: 'OptionalField2',
          type: 'text'
        }
      ];

      render(
        <SelfServiceWizard 
          block={mockBlock}
          parameters={parametersWithoutRequired}
          formData={{ OptionalField1: '', OptionalField2: '' }}
          onElementChange={mockOnElementChange}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();
    });
  });
});
