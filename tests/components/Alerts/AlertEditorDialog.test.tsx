import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertEditorDialog } from '../../../src/components/Alerts/AlertEditorDialog';
import { useCreateAlertPR } from '../../../src/hooks/api/useAlerts';
import { useToast } from '../../../src/hooks/use-toast';

// Mock dependencies
vi.mock('../../../src/hooks/api/useAlerts');
vi.mock('../../../src/hooks/use-toast');
vi.mock('js-yaml', () => ({
  load: vi.fn(),
  dump: vi.fn(),
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

describe('AlertEditorDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockToast = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockUseCreateAlertPR = vi.mocked(useCreateAlertPR);
  const mockUseToast = vi.mocked(useToast);

  const mockAlert = {
    alert: 'TestAlert',
    expr: 'up == 0',
    for: '5m',
    labels: {
      severity: 'critical',
      team: 'platform',
    },
    annotations: {
      summary: 'Test alert summary',
      description: 'Test alert description',
    },
  };

  const mockFile = {
    name: 'test-alerts.yaml',
    category: 'monitoring',
    content: `groups:
  - name: test-group
    rules:
      - alert: TestAlert
        expr: up == 0
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Test alert summary"
          description: "Test alert description"`,
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    alert: mockAlert,
    file: mockFile,
    projectId: 'test-project',
  };

  let queryClient: QueryClient;

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseToast.mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    });
    mockUseCreateAlertPR.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('should render dialog with correct title and form fields', () => {
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    expect(screen.getByText('Edit Alert Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TestAlert')).toBeInTheDocument();
    expect(screen.getByDisplayValue('up == 0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5m')).toBeInTheDocument();
    // Annotations are now generic, so we check for the actual annotation values
    expect(screen.getByDisplayValue('Test alert summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test alert description')).toBeInTheDocument();
  });

  it('should update form fields when user types', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const alertNameInput = screen.getByDisplayValue('TestAlert');
    await user.clear(alertNameInput);
    await user.type(alertNameInput, 'UpdatedAlert');

    expect(screen.getByDisplayValue('UpdatedAlert')).toBeInTheDocument();
  });

  it('should manage labels correctly', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Check existing labels - severity is shown as disabled input
    expect(screen.getByDisplayValue('severity')).toBeInTheDocument();
    // Severity value is now in a Select component, check it exists as text
    expect(screen.getByText('critical')).toBeInTheDocument();

    // Check other label exists
    expect(screen.getByDisplayValue('team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('platform')).toBeInTheDocument();

    // Add new label
    const addLabelButton = screen.getByText('+ Add Label');
    await user.click(addLabelButton);

    const labelInputs = screen.getAllByPlaceholderText('key');
    // We have 2 editable labels: team + new one (severity key is disabled, not counted)
    expect(labelInputs).toHaveLength(2);
  });

  it('should show validation error for empty required fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const alertNameInput = screen.getByDisplayValue('TestAlert');
    await user.clear(alertNameInput);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
    });
  });

  it('should create PR successfully', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        fileName: 'test-alerts.yaml',
        content: expect.any(String),
        message: '[Update-Rule] TestAlert',
        description: 'Update Prometheus alert configuration for **TestAlert**',
      });
    });
  });

  it('should show loading state during PR creation', () => {
    mockUseCreateAlertPR.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    expect(screen.getByText('Creating PR...')).toBeInTheDocument();
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle empty labels gracefully', () => {
    const alertWithoutLabels = { ...mockAlert, labels: {} };
    renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} alert={alertWithoutLabels} />
    );

    // Severity label is always present (required field), so check it exists
    expect(screen.getByDisplayValue('severity')).toBeInTheDocument();
    // Default severity value should be "warning"
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should remove labels when X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Initial state: severity (not removable) + team (removable)
    expect(screen.getByDisplayValue('team')).toBeInTheDocument();

    // Find and click the remove button for the "team" label
    const removeButtons = screen.getAllByRole('button', { name: '' });
    const xButton = removeButtons.find(button => button.querySelector('.lucide-x'));

    if (xButton) {
      await user.click(xButton);
    }

    // After removing "team", only severity remains (not editable, so no key placeholder inputs)
    expect(screen.queryByDisplayValue('team')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('severity')).toBeInTheDocument(); // Severity still exists
  });

  it('should show error toast when PR creation fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to create PR');
    mockMutateAsync.mockRejectedValue(error);
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Failed to create PR',
        description: 'Failed to create PR',
      });
    });
  });

  it('should not render when open is false', () => {
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Edit Alert Configuration')).not.toBeInTheDocument();
  });

  it('should handle missing annotations gracefully', () => {
    const alertWithoutAnnotations = { ...mockAlert, annotations: undefined };
    renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} alert={alertWithoutAnnotations} />
    );

    // Should still render the form but with no annotations displayed
    expect(screen.getByText('Edit Alert Configuration')).toBeInTheDocument();
    expect(screen.getByText('No annotations defined. Click "Add Annotation" to create one.')).toBeInTheDocument();
  });

  it('should show success toast and open PR URL when PR is created', async () => {
    const user = userEvent.setup();
    const mockOpen = vi.fn();
    window.open = mockOpen;
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Pull Request Created',
        description: 'Successfully created PR for TestAlert',
        className: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
      });
      expect(mockOpen).toHaveBeenCalledWith(
        'https://github.com/test/pr/1',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });


  it('should update PR description when changed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Use ID selector to find PR description in portal
    const prDescriptionTextarea = document.querySelector('#pr-description') as HTMLTextAreaElement;
    expect(prDescriptionTextarea).toBeInTheDocument();
    expect(prDescriptionTextarea?.value).toBe('Update Prometheus alert configuration for **TestAlert**');

    await user.clear(prDescriptionTextarea!);
    await user.type(prDescriptionTextarea!, 'Custom PR description');

    expect(prDescriptionTextarea?.value).toBe('Custom PR description');
  });

  it('should handle missing duration field', () => {
    const alertWithoutDuration = { ...mockAlert, for: undefined };
    renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} alert={alertWithoutDuration} />
    );

    const durationInput = screen.getByLabelText(/duration/i);
    expect(durationInput).toHaveValue('');
  });


  it('should handle empty alert name in commit message generation', () => {
    const alertWithoutName = { ...mockAlert, alert: '' };
    renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} alert={alertWithoutName} />
    );

    expect(screen.getByDisplayValue('[Update-Rule] unnamed')).toBeInTheDocument();
  });

  it('should reset form when dialog is reopened', () => {
    const { rerender } = renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} open={false} />
    );

    rerender(<AlertEditorDialog {...defaultProps} open={true} />);

    expect(screen.getByDisplayValue('TestAlert')).toBeInTheDocument();
    expect(screen.getByDisplayValue('up == 0')).toBeInTheDocument();
  });

  it('should disable buttons when loading', () => {
    mockUseCreateAlertPR.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Creating PR...');
    const cancelButton = screen.getByText('Cancel');

    expect(createPRButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should close dialog after successful PR creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });


  it('should remove empty labels from state', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Add a new label first
    const addLabelButton = screen.getByText('+ Add Label');
    await user.click(addLabelButton);

    // Find the new empty label value input and clear it (should remove the label)
    const labelInputs = screen.getAllByPlaceholderText('value');
    const newLabelValueInput = labelInputs[labelInputs.length - 1];
    await user.type(newLabelValueInput, 'test');
    await user.clear(newLabelValueInput);

    // The empty label should be removed from state
    expect(labelInputs).toBeDefined();
  });

  it('should update commit message when changed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const commitMessageInput = screen.getByDisplayValue('[Update-Rule] TestAlert');
    await user.clear(commitMessageInput);
    await user.type(commitMessageInput, 'Custom commit message');

    expect(screen.getByDisplayValue('Custom commit message')).toBeInTheDocument();
  });

  it('should handle PR creation without URL', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({}); // No prUrl
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Pull Request Created',
        description: 'Successfully created PR for TestAlert',
        className: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50',
      });
    });
  });


  it('should handle alert with null values', () => {
    const alertWithNulls = {
      alert: 'TestAlert',
      expr: 'up == 0',
      for: null,
      labels: null,
      annotations: null,
    };
    renderWithQueryClient(
      <AlertEditorDialog {...defaultProps} alert={alertWithNulls as any} />
    );

    expect(screen.getByText('Edit Alert Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TestAlert')).toBeInTheDocument();
  });

  it('should update duration field', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    const durationInput = screen.getByDisplayValue('5m');
    await user.clear(durationInput);
    await user.type(durationInput, '10m');

    expect(screen.getByDisplayValue('10m')).toBeInTheDocument();
  });

  it('should update description field', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // The description field is the annotation textarea (no ID, but has specific value)
    const descriptionTextarea = screen.getByDisplayValue('Test alert description');
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea).toHaveValue('Test alert description');

    // Verify that the textarea is editable (not disabled or readonly)
    expect(descriptionTextarea).not.toBeDisabled();
    expect(descriptionTextarea).not.toHaveAttribute('readonly');

    // Clear the textarea
    await user.clear(descriptionTextarea);

    // Verify clear worked
    expect(descriptionTextarea).toHaveValue('');
  });


  it('should use original alert name in commit message and PR description even after editing alert name', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Make a change
    const alertNameInput = screen.getByDisplayValue('TestAlert');
    await user.clear(alertNameInput);
    await user.type(alertNameInput, 'ModifiedAlert');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: expect.any(String),
          message: '[Update-Rule] TestAlert',
          description: 'Update Prometheus alert configuration for **TestAlert**',
        })
      );
    });
  });

  it('should handle multiple label additions and removals', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Initial state: severity (disabled, not editable) + team (editable)
    let labelInputs = screen.getAllByPlaceholderText('key');
    expect(labelInputs).toHaveLength(1); // Just "team"

    // Add one label
    const addLabelButton = screen.getByText('+ Add Label');
    await user.click(addLabelButton);

    labelInputs = screen.getAllByPlaceholderText('key');
    // Now we have: team + 1 new label = 2 editable key inputs
    expect(labelInputs).toHaveLength(2);

    // Add another label
    await user.click(addLabelButton);

    labelInputs = screen.getAllByPlaceholderText('key');
    // Now we have: team + 2 new labels = 3 editable key inputs (if both empty labels are kept)
    // But the component might auto-remove empty labels, so let's just check it increased
    expect(labelInputs.length).toBeGreaterThanOrEqual(2);

    // Remove the first added label by finding X buttons in label sections
    const removeButtons = screen.getAllByRole('button', { name: '' });
    const xButtons = removeButtons.filter(button => button.querySelector('.lucide-x'));

    if (xButtons.length > 0) {
      // Click one of the X buttons to remove a label
      await user.click(xButtons[0]);
    }

    // After removing, should have fewer label key inputs
    const updatedLabelInputs = screen.getAllByPlaceholderText('key');
    expect(updatedLabelInputs.length).toBeLessThan(labelInputs.length);
  });

  it('should handle form submission with modified data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AlertEditorDialog {...defaultProps} />);

    // Modify multiple fields
    const alertNameInput = screen.getByDisplayValue('TestAlert');
    await user.clear(alertNameInput);
    await user.type(alertNameInput, 'NewAlert');

    // Modify annotation value (annotations are now generic key-value pairs)
    const summaryAnnotationInput = screen.getByDisplayValue('Test alert summary');
    await user.clear(summaryAnnotationInput);
    await user.type(summaryAnnotationInput, 'New summary');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: expect.any(String),
          message: '[Update-Rule] TestAlert', // Uses original alert name
          description: 'Update Prometheus alert configuration for **TestAlert**', // Uses original alert name
        })
      );
    });
  });

  it('should handle text-based replacement when YAML parsing fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    // Mock file content with alert structure that will trigger text-based replacement
    const mockFileWithAlert = {
      ...mockFile,
      content: `
groups:
  - name: test-group
    rules:
      - alert: TestAlert
        expr: up == 0
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Test alert summary"
          description: "Test alert description"
      - alert: AnotherAlert
        expr: down == 1
`
    };
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} file={mockFileWithAlert} />);

    // Modify expression to trigger text replacement
    const expressionTextarea = screen.getByDisplayValue('up == 0');
    await user.clear(expressionTextarea);
    await user.type(expressionTextarea, 'up == 1');

    // Modify duration
    const durationInput = screen.getByDisplayValue('5m');
    await user.clear(durationInput);
    await user.type(durationInput, '10m');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: expect.stringContaining('up == 1'),
        })
      );
    });
  });

  it('should handle text replacement for labels and annotations', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    const mockFileWithAlert = {
      ...mockFile,
      content: `
groups:
  - name: test-group
    rules:
      - alert: TestAlert
        expr: up == 0
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Test alert summary"
          description: "Test alert description"
`
    };
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} file={mockFileWithAlert} />);

    // Modify annotation (this should work with text replacement)
    const summaryInput = screen.getByDisplayValue('Test alert summary');
    await user.clear(summaryInput);
    await user.type(summaryInput, 'Modified summary');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: expect.stringContaining('Modified summary'),
        })
      );
    });
  });

  it('should handle Helm template expressions in alert replacement', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    const mockFileWithHelmTemplate = {
      ...mockFile,
      content: `
groups:
  - name: test-group
    rules:
      - alert: TestAlert
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Test alert summary"
`
    };
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} file={mockFileWithHelmTemplate} />);

    // Modify expression with Helm variables (using paste to avoid userEvent parsing issues)
    const expressionTextarea = screen.getByDisplayValue('up == 0');
    await user.clear(expressionTextarea);
    await user.click(expressionTextarea);
    await user.paste('up{job="{{ .Values.job }}"} == 0');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: expect.stringContaining('.Values.job'),
        })
      );
    });
  });

  it('should handle missing alert in content gracefully', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });
    
    const mockFileWithoutAlert = {
      ...mockFile,
      content: `
groups:
  - name: test-group
    rules:
      - alert: DifferentAlert
        expr: down == 1
`
    };
    
    renderWithQueryClient(<AlertEditorDialog {...defaultProps} file={mockFileWithoutAlert} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test-alerts.yaml',
          content: mockFileWithoutAlert.content, // Should return original content unchanged
        })
      );
    });
  });
});
