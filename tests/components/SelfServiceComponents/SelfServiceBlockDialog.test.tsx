import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SelfServiceBlockDialog from '../../../src/components/SelfService/SelfServiceBlockDialog';
import type { SelfServiceDialog } from '../../../src/data/self-service/selfServiceBlocks';

// Mock Dialog components
vi.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    // Find the DialogTrigger and DialogContent children
    const childrenArray = Array.isArray(children) ? children : [children];
    const triggerChild = childrenArray.find((child: any) => child?.type?.name === 'DialogTrigger' || child?.props?.['data-testid'] === 'dialog-trigger');
    const contentChild = childrenArray.find((child: any) => child?.type?.name === 'DialogContent' || child?.props?.['data-testid'] === 'dialog-content');
    
    return (
      <div data-testid="dialog">
        <div onClick={() => onOpenChange && onOpenChange(true)}>
          {triggerChild}
        </div>
        {open && contentChild}
      </div>
    );
  },
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTrigger: ({ children, asChild }: any) => {
    // If asChild is true, return the children directly (they will be wrapped by Dialog)
    if (asChild && children) {
      return children;
    }
    return <div data-testid="dialog-trigger">{children}</div>;
  },
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}));

// Mock the wizard component
vi.mock('../../../src/components/SelfService/SelfServiceWizard', () => ({
  SelfServiceWizard: ({ block }: any) => <div data-testid="self-service-wizard">{block.title}</div>
}));

// Mock icon component
const MockIcon = () => <div data-testid="mock-icon" />;

describe('SelfServiceBlockDialog', () => {
  const mockOnOpenDialog = vi.fn();
  const mockOnCloseDialog = vi.fn();
  const mockOnFormChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();
  const mockOnCancel = vi.fn();

  const mockStaticBlock: SelfServiceDialog = {
    id: 'static-test-block',
    title: 'Static Test Block',
    description: 'This is a static test block for testing',
    category: 'Deployment',
    icon: MockIcon,
    dialogType: 'static',
    jenkinsJob: {
      jaasName: 'test-jaas',
      jobName: 'test-job'
    }
  };

  const mockDynamicBlock: SelfServiceDialog = {
    id: 'dynamic-test-block',
    title: 'Dynamic Test Block',
    description: 'This is a dynamic test block for testing',
    category: 'Configuration',
    icon: MockIcon,
    dialogType: 'dynamic',
    jenkinsJob: {
      jaasName: 'dynamic-jaas',
      jobName: 'dynamic-job'
    }
  };

  const mockJenkinsParameters = {
    parameterDefinitions: [
      {
        name: 'DEPLOY_VERSION',
        type: 'StringParameterDefinition',
        description: 'Version to deploy',
        defaultParameterValue: { value: '1.0.0' }
      }
    ]
  };

  const mockSteps = [
    {
      id: 'step1',
      title: 'Step 1',
      elements: [
        { id: 'field1', title: 'Field 1', type: 'text' }
      ]
    }
  ];

  const mockFormData = {
    DEPLOY_VERSION: '2.0.0',
    field1: 'test value'
  };

  const defaultStaticProps = {
    block: mockStaticBlock,
    isOpen: false,
    isLoading: false,
    formData: mockFormData,
    currentStepIndex: 0,
    currentStep: undefined,
    steps: [],
    jenkinsParameters: mockJenkinsParameters,
    staticJobParameters: undefined,
    onOpenDialog: mockOnOpenDialog,
    onCloseDialog: mockOnCloseDialog,
    onFormChange: mockOnFormChange,
    onSubmit: mockOnSubmit,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    onCancel: mockOnCancel
  };

  const defaultDynamicProps = {
    ...defaultStaticProps,
    block: mockDynamicBlock,
    currentStep: mockSteps[0],
    steps: mockSteps,
    jenkinsParameters: undefined,
    staticJobParameters: mockSteps
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Rendering and State Management', () => {
    it('renders card trigger and wizard content correctly for both dialog types', () => {
      // Test static block trigger card
      const { rerender } = render(<SelfServiceBlockDialog {...defaultStaticProps} />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Static Test Block');
      expect(screen.getByText('This is a static test block for testing')).toBeInTheDocument();
      expect(screen.getByText('Deployment')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /launch/i })).toBeInTheDocument();

      // Test click handler
      fireEvent.click(screen.getByRole('button', { name: /launch/i }));
      expect(mockOnOpenDialog).toHaveBeenCalledTimes(1);

      // Test closed dialog state
      expect(screen.queryByTestId('self-service-wizard')).not.toBeInTheDocument();

      // Test open dialog with static block
      rerender(<SelfServiceBlockDialog {...defaultStaticProps} isOpen={true} />);
      expect(screen.getByTestId('self-service-wizard')).toBeInTheDocument();
      const staticWizard = screen.getByTestId('self-service-wizard');
      expect(staticWizard).toHaveTextContent('Static Test Block');

      // Test dynamic block dialog
      rerender(<SelfServiceBlockDialog {...defaultDynamicProps} isOpen={true} />);
      expect(screen.getByTestId('self-service-wizard')).toBeInTheDocument();
      const dynamicWizard = screen.getByTestId('self-service-wizard');
      expect(dynamicWizard).toHaveTextContent('Dynamic Test Block');

      // Test missing step information
      const propsWithoutSteps = {
        ...defaultDynamicProps,
        currentStep: undefined,
        steps: []
      };
      rerender(<SelfServiceBlockDialog {...propsWithoutSteps} isOpen={true} />);
      expect(screen.getByTestId('self-service-wizard')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing block properties gracefully', () => {
      const incompleteBlock = {
        id: 'incomplete-block',
        title: 'Incomplete Block',
        icon: MockIcon,
        dialogType: 'static' as const
      };

      const propsWithIncompleteBlock = {
        ...defaultStaticProps,
        block: incompleteBlock as any
      };

      render(<SelfServiceBlockDialog {...propsWithIncompleteBlock} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Incomplete Block');
    });

    it('handles null jenkins parameters', () => {
      const propsWithNullJenkins = {
        ...defaultStaticProps,
        jenkinsParameters: null
      };

      render(<SelfServiceBlockDialog {...propsWithNullJenkins} isOpen={true} />);
      expect(screen.getByTestId('self-service-wizard')).toBeInTheDocument();
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = render(<SelfServiceBlockDialog {...defaultStaticProps} isOpen={true} />);
      expect(() => unmount()).not.toThrow();
    });
  });
});
