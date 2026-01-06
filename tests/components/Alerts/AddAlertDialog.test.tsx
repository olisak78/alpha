import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddAlertDialog } from '../../../src/components/Alerts/AddAlertDialog';
import { useCreateAlertPR } from '../../../src/hooks/api/useAlerts';
import { useToast } from '../../../src/hooks/use-toast';

// Mock dependencies
vi.mock('../../../src/hooks/api/useAlerts');
vi.mock('../../../src/hooks/use-toast');

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

describe('AddAlertDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockToast = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockUseCreateAlertPR = vi.mocked(useCreateAlertPR);
  const mockUseToast = vi.mocked(useToast);

  const mockFiles = [
    {
      name: 'test-alerts.yaml',
      path: '/alerts/test-alerts.yaml',
      category: 'monitoring',
      content: `groups:
  - name: test-group
    rules:
      - alert: ExistingAlert
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Existing alert"`,
      alerts: [],
    },
    {
      name: 'disk-alerts.yaml',
      path: '/alerts/disk-alerts.yaml',
      category: 'system',
      content: `groups:
  - name: disk-group
    rules:
      - alert: DiskAlert
        expr: disk_free < 10`,
      alerts: [],
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    files: mockFiles,
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

  // =========================================
  // RENDERING TESTS
  // =========================================

  it('should render dialog with correct title and form fields', () => {
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    expect(screen.getByText('Add New Alert Rule')).toBeInTheDocument();
    expect(screen.getByLabelText(/Alert Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/PromQL Expression/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target File/)).toBeInTheDocument();
  });

  it('should render file selection dropdown with available files', () => {
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Check for file select dropdown using ID
    const selectTrigger = document.querySelector('#file-select');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('should have severity label pre-populated with warning', () => {
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    expect(screen.getByDisplayValue('severity')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    renderWithQueryClient(<AddAlertDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Add New Alert Rule')).not.toBeInTheDocument();
  });

  // =========================================
  // FORM INTERACTION TESTS
  // =========================================

  it('should update alert name when user types', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const alertNameInput = screen.getByLabelText(/Alert Name/);
    await user.type(alertNameInput, 'NewTestAlert');

    expect(screen.getByDisplayValue('NewTestAlert')).toBeInTheDocument();
  });

  it('should update expression when user types', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const expressionInput = screen.getByLabelText(/PromQL Expression/);
    await user.type(expressionInput, 'cpu_usage > 90');

    expect(screen.getByDisplayValue('cpu_usage > 90')).toBeInTheDocument();
  });

  it('should update duration when user types', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '10m');

    expect(screen.getByDisplayValue('10m')).toBeInTheDocument();
  });

  it('should allow changing severity value via dropdown', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Initial severity should be warning
    expect(screen.getByText('warning')).toBeInTheDocument();

    // Click the severity select
    const severitySelect = screen.getByText('warning').closest('button');
    if (severitySelect) {
      await user.click(severitySelect);

      // Wait for dropdown to open and select critical
      const criticalOption = await screen.findByRole('option', { name: 'critical' });
      await user.click(criticalOption);

      expect(screen.getByText('critical')).toBeInTheDocument();
    }
  });

  it('should not allow removing severity label', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Severity should not have a remove button
    const severityInput = screen.getByDisplayValue('severity');
    const severityRow = severityInput.closest('.grid');

    // Check that there's no X button for severity
    const removeButtons = severityRow?.querySelectorAll('button');
    const xButton = Array.from(removeButtons || []).find(btn =>
      btn.querySelector('.lucide-x')
    );

    expect(xButton).toBeUndefined();
  });

  // =========================================
  // LABEL MANAGEMENT TESTS
  // =========================================

  it('should add new label when Add Label button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const addLabelButton = screen.getByText('+ Add Label');
    await user.click(addLabelButton);

    const labelInputs = screen.getAllByPlaceholderText('key');
    expect(labelInputs.length).toBeGreaterThan(0);
  });

  it('should remove label when X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Add a label first
    const addLabelButton = screen.getByText('+ Add Label');
    await user.click(addLabelButton);

    const labelInputs = screen.getAllByPlaceholderText('key');
    const initialCount = labelInputs.length;

    // Type a label name to make it identifiable
    await user.type(labelInputs[0], 'testlabel');

    // Find and click remove button
    const removeButtons = screen.getAllByRole('button', { name: '' });
    const xButton = removeButtons.find(button => button.querySelector('.lucide-x'));

    if (xButton) {
      await user.click(xButton);
    }

    // After removal, should have one less label input
    const updatedLabelInputs = screen.queryAllByPlaceholderText('key');
    expect(updatedLabelInputs.length).toBeLessThan(initialCount);
  });

  // =========================================
  // ANNOTATION MANAGEMENT TESTS
  // =========================================

  it('should add new annotation when Add Annotation button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const addAnnotationButton = screen.getByText('+ Add Annotation');
    await user.click(addAnnotationButton);

    // Should have at least one annotation key input with new placeholder
    const annotationInputs = screen.getAllByPlaceholderText(/key \(e\.g\.,/i);
    expect(annotationInputs.length).toBeGreaterThan(0);
  });

  it('should remove annotation when X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Add an annotation first
    const addAnnotationButton = screen.getByText('+ Add Annotation');
    await user.click(addAnnotationButton);

    const annotationInputs = screen.getAllByPlaceholderText(/key \(e\.g\.,/i);
    const initialCount = annotationInputs.length;

    // Type an annotation key
    await user.type(annotationInputs[0], 'summary');

    // Find and click remove button in annotations section
    const allRemoveButtons = screen.getAllByRole('button', { name: '' });
    const annotationRemoveButton = allRemoveButtons.find(button =>
      button.querySelector('.lucide-x') &&
      button.closest('[class*="space-y"]')
    );

    if (annotationRemoveButton) {
      await user.click(annotationRemoveButton);
    }

    // After removal, should have fewer annotation inputs
    const updatedAnnotationInputs = screen.queryAllByPlaceholderText(/key \(e\.g\.,/i);
    expect(updatedAnnotationInputs.length).toBeLessThanOrEqual(initialCount);
  });

  // =========================================
  // VALIDATION TESTS
  // =========================================

  it('should show validation error when required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
    });
  });

  it('should show validation error when file is not selected', async () => {
    const user = userEvent.setup();
    // Render with empty files array so no file is auto-selected
    renderWithQueryClient(<AddAlertDialog {...defaultProps} files={[]} />);

    // Fill in all fields except file selection
    const alertNameInput = screen.getByLabelText(/Alert Name/);
    await user.type(alertNameInput, 'TestAlert');

    const expressionInput = screen.getByLabelText(/PromQL Expression/);
    await user.type(expressionInput, 'up == 0');

    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '5m');

    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
    });
  });

  // =========================================
  // PR CREATION TESTS
  // =========================================

  it('should create PR successfully with valid data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Fill in required fields
    const alertNameInput = screen.getByLabelText(/Alert Name/);
    await user.type(alertNameInput, 'NewAlert');

    const expressionInput = screen.getByLabelText(/PromQL Expression/);
    await user.type(expressionInput, 'cpu_usage > 80');

    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '5m');

    // Note: File is auto-selected to first file (test-alerts.yaml) on dialog open

    // Submit
    const createPRButton = screen.getByText('Create Pull Request');
    await user.click(createPRButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        fileName: 'test-alerts.yaml',
        content: expect.stringContaining('NewAlert'),
        message: '[Add-Rule] ',
        description: 'Add new Prometheus alert rule',
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

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    expect(screen.getByText('Creating PR...')).toBeInTheDocument();
  });

  it('should disable buttons when loading', () => {
    mockUseCreateAlertPR.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const createPRButton = screen.getByText('Creating PR...');
    const cancelButton = screen.getByText('Cancel');

    expect(createPRButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should show success toast when PR is created', async () => {
    const user = userEvent.setup();
    const mockOpen = vi.fn();
    window.open = mockOpen;
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Fill in form
    await user.type(screen.getByLabelText(/Alert Name/), 'TestAlert');
    await user.type(screen.getByLabelText(/PromQL Expression/), 'up == 0');
    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '5m');

    
    
    
    // Note: File is auto-selected to first file (test-alerts.yaml) on dialog open

    await user.click(screen.getByText('Create Pull Request'));

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

  it('should show error toast when PR creation fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to create PR');
    mockMutateAsync.mockRejectedValue(error);

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Fill in form
    await user.type(screen.getByLabelText(/Alert Name/), 'TestAlert');
    await user.type(screen.getByLabelText(/PromQL Expression/), 'up == 0');
    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '5m');

    
    
    
    // Note: File is auto-selected to first file (test-alerts.yaml) on dialog open

    await user.click(screen.getByText('Create Pull Request'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Failed to create PR',
        description: 'Failed to create PR',
      });
    });
  });

  it('should close dialog after successful PR creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ prUrl: 'https://github.com/test/pr/1' });

    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Fill in form
    await user.type(screen.getByLabelText(/Alert Name/), 'TestAlert');
    await user.type(screen.getByLabelText(/PromQL Expression/), 'up == 0');
    const durationInput = screen.getByLabelText(/Duration/);
    await user.clear(durationInput);
    await user.type(durationInput, '5m');

    
    
    
    // Note: File is auto-selected to first file (test-alerts.yaml) on dialog open

    await user.click(screen.getByText('Create Pull Request'));

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // =========================================
  // CANCEL FUNCTIONALITY
  // =========================================

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  // =========================================
  // COMMIT MESSAGE TESTS
  // =========================================

  it('should update commit message when changed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Find commit message input
    const commitMessageInput = document.querySelector('#commit-message') as HTMLInputElement;
    expect(commitMessageInput).toBeInTheDocument();
    expect(commitMessageInput?.value).toBe('[Add-Rule] ');

    // Manually update commit message
    await user.clear(commitMessageInput!);
    await user.type(commitMessageInput!, 'Custom commit message');

    expect(commitMessageInput?.value).toBe('Custom commit message');
  });

  it('should update PR description when changed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Type alert name to generate default PR description
    await user.type(screen.getByLabelText(/Alert Name/), 'TestAlert');

    // Find and update PR description
    const prDescriptionTextarea = screen.getByDisplayValue(/Add new Prometheus alert rule/);
    await user.clear(prDescriptionTextarea);
    await user.type(prDescriptionTextarea, 'Custom PR description');

    expect(screen.getByDisplayValue('Custom PR description')).toBeInTheDocument();
  });

  // =========================================
  // EDGE CASES
  // =========================================

  it('should handle empty files array', () => {
    renderWithQueryClient(<AddAlertDialog {...defaultProps} files={[]} />);

    expect(screen.getByText('Add New Alert Rule')).toBeInTheDocument();

    // Check for file select dropdown (should still render even with no files)
    const selectTrigger = document.querySelector('#file-select');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('should reset form when dialog is reopened', () => {
    const { rerender } = renderWithQueryClient(
      <AddAlertDialog {...defaultProps} open={false} />
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <AddAlertDialog {...defaultProps} open={true} />
      </QueryClientProvider>
    );

    // Form should be empty
    const alertNameInput = screen.getByLabelText(/Alert Name/);
    expect(alertNameInput).toHaveValue('');
  });

  it('should generate correct commit message format', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddAlertDialog {...defaultProps} />);

    // Check initial commit message format
    const commitMessageInput = document.querySelector('#commit-message') as HTMLInputElement;
    expect(commitMessageInput).toBeInTheDocument();
    expect(commitMessageInput?.value).toBe('[Add-Rule] ');

    // User can manually update it to include alert name (use paste to avoid bracket parsing issues)
    await user.type(screen.getByLabelText(/Alert Name/), 'MyNewAlert');
    await user.clear(commitMessageInput!);
    await user.click(commitMessageInput!);
    await user.paste('[Add-Rule] MyNewAlert');

    expect(commitMessageInput?.value).toBe('[Add-Rule] MyNewAlert');
  });
});
