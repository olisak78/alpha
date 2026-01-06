import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import RegisterPluginDialog from '@/plugins/components/RegisterPluginDialog';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('@/plugins/models/models', () => ({
  initialFormData: {
    name: '',
    title: '',
    description: '',
    bundleUrl: '',
    backendUrl: '',
  },
  validateForm: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children, asChild }: any) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, id, type, className, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      type={type}
      className={className}
      data-testid={`input-${id}`}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, id, rows, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      id={id}
      rows={rows}
      data-testid={`textarea-${id}`}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid={`label-${htmlFor}`}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Plus: ({ className }: any) => <div data-testid="plus-icon" className={className}>Plus</div>,
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className}>Loader</div>,
  Info: ({ className }: any) => <div data-testid="info-icon" className={className}>Info</div>,
  AlertCircle: ({ className }: any) => <div data-testid="alert-circle-icon" className={className}>Alert</div>,
}));

describe('RegisterPluginDialog', () => {
  const mockOnSuccess = vi.fn();
  const mockToast = vi.fn();
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mocks
    const { useAuth } = await import('@/contexts/AuthContext');
    const { useToast } = await import('@/hooks/use-toast');
    const { apiClient } = await import('@/services/ApiClient');
    const { validateForm } = await import('@/plugins/models/models');

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    });

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    } as any);

    vi.mocked(apiClient.post).mockResolvedValue({});

    vi.mocked(validateForm).mockReturnValue({});
  });

  describe('Component Rendering', () => {
    it('should render the trigger button', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // The trigger button is inside the dialog-trigger wrapper
      const triggerWrapper = screen.getByTestId('dialog-trigger');
      expect(triggerWrapper).toBeInTheDocument();
      
      // Should contain the Plus icon
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      
      // Should have the Register Plugin text (appears twice, so use getAllByText)
      const registerButtons = screen.getAllByText('Register Plugin');
      expect(registerButtons.length).toBeGreaterThan(0);
    });

    it('should render dialog structure', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    });

    it('should show dialog title and description when open', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Register New Plugin');
      expect(screen.getByTestId('dialog-description')).toHaveTextContent(
        'Add a new plugin to the portal. Fill in the details below.'
      );
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('input-pluginName')).toBeInTheDocument();
      expect(screen.getByTestId('input-pluginTitle')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-pluginDescription')).toBeInTheDocument();
      expect(screen.getByTestId('input-pluginBundleUrl')).toBeInTheDocument();
      expect(screen.getByTestId('input-pluginBackendUrl')).toBeInTheDocument();
    });

    it('should render labels for all fields', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('label-pluginName')).toBeInTheDocument();
      expect(screen.getByTestId('label-pluginTitle')).toBeInTheDocument();
      expect(screen.getByTestId('label-pluginDescription')).toBeInTheDocument();
      expect(screen.getByTestId('label-pluginBundleUrl')).toBeInTheDocument();
      expect(screen.getByTestId('label-pluginBackendUrl')).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const nameLabel = screen.getByTestId('label-pluginName');
      const titleLabel = screen.getByTestId('label-pluginTitle');
      const bundleUrlLabel = screen.getByTestId('label-pluginBundleUrl');
      const backendUrlLabel = screen.getByTestId('label-pluginBackendUrl');

      expect(nameLabel.textContent).toContain('*');
      expect(titleLabel.textContent).toContain('*');
      expect(bundleUrlLabel.textContent).toContain('*');
      expect(backendUrlLabel.textContent).toContain('*');
    });

    it('should have placeholders for all inputs', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('input-pluginName')).toHaveAttribute(
        'placeholder',
        'e.g., my-awesome-plugin'
      );
      expect(screen.getByTestId('input-pluginTitle')).toHaveAttribute(
        'placeholder',
        'e.g., My Awesome Plugin'
      );
      expect(screen.getByTestId('textarea-pluginDescription')).toHaveAttribute(
        'placeholder',
        'Describe what your plugin does...'
      );
      expect(screen.getByTestId('input-pluginBundleUrl')).toHaveAttribute(
        'placeholder',
        'e.g., https://example.com/plugin.js'
      );
      expect(screen.getByTestId('input-pluginBackendUrl')).toHaveAttribute(
        'placeholder',
        'e.g., https://api.example.com'
      );
    });

    it('should render info tooltips for URL fields', () => {
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const infoIcons = screen.getAllByTestId('info-icon');
      expect(infoIcons).toHaveLength(2);
    });
  });

  describe('Form Interaction', () => {
    it('should update name field on input', async () => {
      const user = userEvent.setup();
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByTestId('input-pluginName') as HTMLInputElement;
      await user.type(nameInput, 'test-plugin');

      expect(nameInput.value).toBe('test-plugin');
    });

    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByTestId('input-pluginTitle') as HTMLInputElement;
      await user.type(titleInput, 'Test Plugin');

      expect(titleInput.value).toBe('Test Plugin');
    });

    it('should update description field on input', async () => {
      const user = userEvent.setup();
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const descInput = screen.getByTestId('textarea-pluginDescription') as HTMLTextAreaElement;
      await user.type(descInput, 'Test description');

      expect(descInput.value).toBe('Test description');
    });

    it('should update bundleUrl field on input', async () => {
      const user = userEvent.setup();
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const bundleInput = screen.getByTestId('input-pluginBundleUrl') as HTMLInputElement;
      await user.type(bundleInput, 'https://example.com/bundle.js');

      expect(bundleInput.value).toBe('https://example.com/bundle.js');
    });

    it('should update backendUrl field on input', async () => {
      const user = userEvent.setup();
      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const backendInput = screen.getByTestId('input-pluginBackendUrl') as HTMLInputElement;
      await user.type(backendInput, 'https://api.example.com');

      expect(backendInput.value).toBe('https://api.example.com');
    });
  });

  describe('Form Validation', () => {
    it('should display validation errors when form is invalid', async () => {
      const user = userEvent.setup();
      const { validateForm } = await import('@/plugins/models/models');
      
      vi.mocked(validateForm).mockReturnValue({
        name: 'Name is required',
        title: 'Title is required',
        bundleUrl: 'Bundle URL is required',
        backendUrl: 'Backend URL is required',
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // Find and click the Register Plugin button (not the dialog trigger)
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Bundle URL is required')).toBeInTheDocument();
        expect(screen.getByText('Backend URL is required')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      const { validateForm } = await import('@/plugins/models/models');
      
      // First validation returns error
      vi.mocked(validateForm).mockReturnValueOnce({
        name: 'Name is required',
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // Trigger validation
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      // Type in the field
      const nameInput = screen.getByTestId('input-pluginName');
      await user.type(nameInput, 't');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('should apply error styling to invalid fields', async () => {
      const user = userEvent.setup();
      const { validateForm } = await import('@/plugins/models/models');
      
      vi.mocked(validateForm).mockReturnValue({
        name: 'Name is required',
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        const nameInput = screen.getByTestId('input-pluginName');
        expect(nameInput.className).toContain('border-red-500');
      });
    });

    it('should not submit form if validation fails', async () => {
      const user = userEvent.setup();
      const { validateForm } = await import('@/plugins/models/models');
      const { apiClient } = await import('@/services/ApiClient');
      
      vi.mocked(validateForm).mockReturnValue({
        name: 'Name is required',
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct payload', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // Fill in all fields
      await user.type(screen.getByTestId('input-pluginName'), 'test-plugin');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test Plugin');
      await user.type(screen.getByTestId('textarea-pluginDescription'), 'Test description');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      // Submit
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/plugins', {
          backend_server_url: 'https://api.example.com',
          description: 'Test description',
          icon: 'Puzzle',
          metadata: {},
          name: 'test-plugin',
          owner: 'user-123',
          react_component_path: 'https://example.com/bundle.js',
          title: 'Test Plugin',
        });
      });
    });

    it('should trim whitespace from form fields', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), '  test-plugin  ');
      await user.type(screen.getByTestId('input-pluginTitle'), '  Test Plugin  ');
      await user.type(screen.getByTestId('textarea-pluginDescription'), '  Test description  ');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), '  https://example.com/bundle.js  ');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), '  https://api.example.com  ');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/plugins', expect.objectContaining({
          name: 'test-plugin',
          title: 'Test Plugin',
          description: 'Test description',
          react_component_path: 'https://example.com/bundle.js',
          backend_server_url: 'https://api.example.com',
        }));
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Registering...')).toBeInTheDocument();
    });

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');

      await user.click(submitButton!);

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup();

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test Plugin');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Plugin "Test Plugin" registered successfully!',
          variant: 'default',
        });
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Form fields should be cleared
      const nameInput = screen.getByTestId('input-pluginName') as HTMLInputElement;
      const titleInput = screen.getByTestId('input-pluginTitle') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(titleInput.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should display error alert on submission failure', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show error toast on submission failure', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockRejectedValue(new Error('API error'));

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'API error',
          variant: 'destructive',
        });
      });
    });

    it('should not call onSuccess on submission failure', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Error'));

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should re-enable buttons after submission error', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Error'));

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Dialog Behavior', () => {
    it('should reset form when dialog is closed', async () => {
      const user = userEvent.setup();

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // Fill in fields
      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');

      // Close dialog (simulated via Cancel button)
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      await user.click(cancelButton!);

      // Fields should be reset
      const nameInput = screen.getByTestId('input-pluginName') as HTMLInputElement;
      const titleInput = screen.getByTestId('input-pluginTitle') as HTMLInputElement;
      
      expect(nameInput.value).toBe('');
      expect(titleInput.value).toBe('');
    });

    it('should clear errors when dialog is closed', async () => {
      const user = userEvent.setup();
      const { validateForm } = await import('@/plugins/models/models');
      
      vi.mocked(validateForm).mockReturnValue({
        name: 'Name is required',
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      // Trigger validation
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      await user.click(cancelButton!);

      // Error should be cleared
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('should clear submit error when dialog is closed', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Submit error'));

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Submit error')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      await user.click(cancelButton!);

      // Submit error should be cleared
      expect(screen.queryByText('Submit error')).not.toBeInTheDocument();
    });
  });

  describe('User Authentication', () => {
    it('should use authenticated user ID as owner', async () => {
      const user = userEvent.setup();
      const { apiClient } = await import('@/services/ApiClient');

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/plugins',
          expect.objectContaining({
            owner: 'user-123',
          })
        );
      });
    });

    it('should use "Unknown" as owner if user is not authenticated', async () => {
      const user = userEvent.setup();
      const { useAuth } = await import('@/contexts/AuthContext');
      const { apiClient } = await import('@/services/ApiClient');

      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      });

      render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);

      await user.type(screen.getByTestId('input-pluginName'), 'test');
      await user.type(screen.getByTestId('input-pluginTitle'), 'Test');
      await user.type(screen.getByTestId('input-pluginBundleUrl'), 'https://example.com/bundle.js');
      await user.type(screen.getByTestId('input-pluginBackendUrl'), 'https://api.example.com');

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Register Plugin');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/plugins',
          expect.objectContaining({
            owner: 'Unknown',
          })
        );
      });
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<RegisterPluginDialog onSuccess={mockOnSuccess} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});