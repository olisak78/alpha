import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QuickLinkFormDialog } from '../../../src/components/QuickLinks/QuickLinkFormDialog';
import { QuickLinkFormData } from '../../../src/types/developer-portal';
import { createMockFormProps, FORM_FIELD_TESTS } from '../../utils/testHelpers';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
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
  DialogTrigger: ({ children, asChild }: any) => (
    <div data-testid="dialog-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ id, placeholder, value, onChange, onBlur, className, list }: any) => (
    <input
      data-testid="input"
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={className}
      list={list}
    />
  ),
}));

vi.mock('../../../src/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label data-testid="label" htmlFor={htmlFor}>
      {children}
    </label>
  ),
}));

describe('QuickLinkFormDialog', () => {
  let defaultProps: any;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = createMockFormProps();
  });

  it('renders dialog trigger button', () => {
    render(<QuickLinkFormDialog {...defaultProps} />);
    
    const triggerButton = screen.getByRole('button', { name: /add quick link/i });
    expect(triggerButton).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(<QuickLinkFormDialog {...defaultProps} open={true} />);
    
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Add Quick Link');
  });

  it('renders all form fields', () => {
    render(<QuickLinkFormDialog {...defaultProps} open={true} />);
    
    // Check labels
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    
    // Check inputs
    const inputs = screen.getAllByTestId('input');
    expect(inputs).toHaveLength(3);
    
    // Check specific inputs by placeholder
    expect(screen.getByPlaceholderText('e.g., Jira Dashboard')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select or type a new category')).toBeInTheDocument();
  });

  it('displays form data values in inputs', () => {
    const formData = {
      title: 'Test Title',
      url: 'https://test.com',
      category: 'Development',
      icon: 'link',
    };
    
    render(<QuickLinkFormDialog {...defaultProps} formData={formData} open={true} />);
    
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Development')).toBeInTheDocument();
  });

  describe('Form Field Interactions', () => {
    it('handles field changes and blur events correctly', () => {
      render(<QuickLinkFormDialog {...defaultProps} open={true} />);
      
      FORM_FIELD_TESTS.forEach(({ field, placeholder, testValue }) => {
        const input = screen.getByPlaceholderText(placeholder);
        
        // Test onChange
        fireEvent.change(input, { target: { value: testValue } });
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith(field, testValue);
        
        // Test onBlur
        fireEvent.blur(input);
        expect(defaultProps.onFieldBlur).toHaveBeenCalledWith(field);
      });
    });
  });

  it('displays error styling when field has error', () => {
    const formErrors = { title: 'Title is required' };
    render(<QuickLinkFormDialog {...defaultProps} formErrors={formErrors} open={true} />);
    
    const titleInput = screen.getByPlaceholderText('e.g., Jira Dashboard');
    expect(titleInput).toHaveClass('border-destructive');
  });

  it('displays error message when shouldShowError returns true', () => {
    const formErrors = { title: 'Title is required' };
    const shouldShowError = vi.fn((field) => field === 'title');
    
    render(
      <QuickLinkFormDialog 
        {...defaultProps} 
        formErrors={formErrors} 
        shouldShowError={shouldShowError}
        open={true} 
      />
    );
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('does not display error message when shouldShowError returns false', () => {
    const formErrors = { title: 'Title is required' };
    const shouldShowError = vi.fn(() => false);
    
    render(
      <QuickLinkFormDialog 
        {...defaultProps} 
        formErrors={formErrors} 
        shouldShowError={shouldShowError}
        open={true} 
      />
    );
    
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('renders datalist with existing categories', () => {
    render(<QuickLinkFormDialog {...defaultProps} open={true} />);
    
    const datalist = document.querySelector('#categories');
    expect(datalist).toBeInTheDocument();
    
    const options = datalist?.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options?.[0]).toHaveAttribute('value', 'Development');
    expect(options?.[1]).toHaveAttribute('value', 'Documentation');
    expect(options?.[2]).toHaveAttribute('value', 'Tools');
  });

  it('shows different placeholder when no existing categories', () => {
    render(<QuickLinkFormDialog {...defaultProps} existingCategories={[]} open={true} />);
    
    expect(screen.getByPlaceholderText('Type a new category')).toBeInTheDocument();
  });

  describe('Button Interactions', () => {
    it('renders and handles action buttons correctly', () => {
      render(<QuickLinkFormDialog {...defaultProps} open={true} />);
      
      const buttons = screen.getAllByTestId('button');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      const submitButton = buttons.find(btn => btn.textContent === 'Add Link');
      
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      
      // Test button clicks
      fireEvent.click(cancelButton!);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('handles submit button states correctly', () => {
      // Test valid form
      const { rerender } = render(<QuickLinkFormDialog {...defaultProps} isFormValid={true} open={true} />);
      
      let buttons = screen.getAllByTestId('button');
      let submitButton = buttons.find(btn => btn.textContent === 'Add Link');
      expect(submitButton).not.toBeDisabled();
      
      fireEvent.click(submitButton!);
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
      
      // Test invalid form
      rerender(<QuickLinkFormDialog {...defaultProps} isFormValid={false} open={true} />);
      buttons = screen.getAllByTestId('button');
      submitButton = buttons.find(btn => btn.textContent === 'Add Link');
      expect(submitButton).toBeDisabled();
      
      // Test submitting state
      rerender(<QuickLinkFormDialog {...defaultProps} isSubmitting={true} open={true} />);
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      
      buttons = screen.getAllByTestId('button');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      submitButton = buttons.find(btn => btn.textContent === 'Adding...');
      
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  it('applies correct CSS classes to dialog content', () => {
    render(<QuickLinkFormDialog {...defaultProps} open={true} />);
    
    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent).toHaveClass('sm:max-w-[500px]');
  });

  it('renders form with proper grid layout', () => {
    render(<QuickLinkFormDialog {...defaultProps} open={true} />);
    
    const formContainer = document.querySelector('.grid.gap-4.py-4');
    expect(formContainer).toBeInTheDocument();
    
    const fieldContainers = document.querySelectorAll('.grid.gap-2');
    expect(fieldContainers).toHaveLength(3); // title, url, category
  });

  it('handles multiple error fields correctly', () => {
    const formErrors = {
      title: 'Title is required',
      url: 'Invalid URL format',
      category: 'Category is required',
    };
    const shouldShowError = vi.fn(() => true);
    
    render(
      <QuickLinkFormDialog 
        {...defaultProps} 
        formErrors={formErrors} 
        shouldShowError={shouldShowError}
        open={true} 
      />
    );
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    
    // Check that all inputs have error styling
    const inputs = screen.getAllByTestId('input');
    inputs.forEach(input => {
      expect(input).toHaveClass('border-destructive');
    });
  });

  it('calls onOpenChange when dialog state changes', () => {
    render(<QuickLinkFormDialog {...defaultProps} />);
    
    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);
    
    expect(defaultProps.onOpenChange).toHaveBeenCalled();
  });
});
