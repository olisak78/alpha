import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AddDocumentationDialog } from '../../../src/components/dialogs/AddDocumentationDialog';

/**
 * AddDocumentationDialog Component Tests
 * 
 * Tests for the AddDocumentationDialog component which displays a dialog
 * for adding new documentation endpoints with GitHub URL validation and form handling.
 */

// Mock the hooks
const mockToast = vi.fn();
const mockMutateAsync = vi.fn();
const mockTeamData = {
  id: 'team-123',
  name: 'Test Team',
  title: 'Test Team',
  owner: 'test-owner',
  organization_id: 'org-123',
};

vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast,
  })),
}));

vi.mock('../../../src/hooks/api/useDocumentation', () => ({
  useCreateDocumentation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

// ✅ ADD THIS MOCK
vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(() => ({
    data: mockTeamData,
    isLoading: false,
    error: null,
  })),
}));

describe('AddDocumentationDialog Component', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    teamId: 'team-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockClear();
    mockToast.mockClear();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render dialog with all essential elements and proper content', () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      // Dialog structure and content
      expect(screen.getByRole('heading', { name: 'Add Documentation' })).toBeInTheDocument();
      expect(screen.getByText('Add a GitHub documentation endpoint for this team. The URL should point to a documentation folder in a GitHub repository.')).toBeInTheDocument();
      expect(screen.getByText(/Example: https:\/\/github\.tools\.sap\/cfs-platform-engineering\/cfs-platform-docs\/tree\/main\/docs\/coe/)).toBeInTheDocument();
      
      // Form fields with labels and placeholders
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      // ✅ CHANGED: Dynamic placeholder based on team name
      expect(screen.getByPlaceholderText('Test Team Documentation')).toBeInTheDocument();
      expect(screen.getByLabelText(/github url/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://github.tools.sap/org/repo/tree/main/docs')).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      // ✅ CHANGED: Dynamic placeholder based on team name
      expect(screen.getByPlaceholderText('Documentation for the Test Team team...')).toBeInTheDocument();
      
      // Buttons and UI elements
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add documentation/i })).toBeInTheDocument();
      expect(screen.getAllByText('*')).toHaveLength(2); // Required field indicators
      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM INITIALIZATION TESTS
  // ============================================================================

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/github url/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('should reset form when dialog closes and reopens', () => {
      const { rerender } = render(<AddDocumentationDialog {...defaultProps} />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Title' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/test/repo' } });

      // Close dialog
      rerender(<AddDocumentationDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<AddDocumentationDialog {...defaultProps} open={true} />);

      // Form should be reset
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/github url/i)).toHaveValue('');
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    describe('Title Validation', () => {
      it.each([
        ['', 'Title is required'],
        ['A', 'Title must be at least 2 characters'],
        ['A'.repeat(101), 'Title must be at most 100 characters'],
      ])('should show error for invalid title: "%s"', async (value, expectedError) => {
        render(<AddDocumentationDialog {...defaultProps} />);

        const titleInput = screen.getByLabelText(/title/i);
        fireEvent.change(titleInput, { target: { value } });
        fireEvent.blur(titleInput);

        await waitFor(() => {
          expect(screen.getByText(expectedError)).toBeInTheDocument();
        });
      });

      it('should accept valid title and show no errors', async () => {
        render(<AddDocumentationDialog {...defaultProps} />);

        const titleInput = screen.getByLabelText(/title/i);
        fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
        fireEvent.blur(titleInput);

        await waitFor(() => {
          expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
          expect(screen.queryByText('Title must be at least 2 characters')).not.toBeInTheDocument();
          expect(screen.queryByText('Title must be at most 100 characters')).not.toBeInTheDocument();
        });
      });
    });

    describe('URL Validation', () => {
      it.each([
        ['', 'GitHub URL is required'],
        ['not-a-url', /Please enter a valid GitHub URL/],
        ['https://gitlab.com/org/repo', /Please enter a valid GitHub URL/],
      ])('should show error for invalid URL: "%s"', async (value, expectedError) => {
        render(<AddDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.getByText(expectedError)).toBeInTheDocument();
        });
      });

      it.each([
        'https://github.com/org/repo',
        'https://github.tools.sap/org/repo',
        'https://github.com/org/repo/tree/main/docs',
        'https://github.com/org/repo/blob/main/README.md',
      ])('should accept valid GitHub URL: "%s"', async (url) => {
        render(<AddDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value: url } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.queryByText(/Please enter a valid GitHub URL/)).not.toBeInTheDocument();
        });
      });
    });

    describe('Form State Validation', () => {
      it('should disable submit button when form is invalid and enable when valid', () => {
        render(<AddDocumentationDialog {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /add documentation/i });
        expect(submitButton).toBeDisabled();

        // Fill valid form data
        fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid Title' } });
        fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/org/repo' } });

        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should update character count for description and handle validation styling', async () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      expect(screen.getByText('16/200 characters')).toBeInTheDocument();

      // Test validation styling on title field
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(titleInput).toHaveClass('border-red-500');
      });
    });

    it('should call onOpenChange when cancel button is clicked', () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================

  describe('Form Submission', () => {
    it('should call createDocumentation with correct data including optional description', async () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Documentation' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/org/repo/tree/main/docs' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test description' } });

      const submitButton = screen.getByRole('button', { name: /add documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          team_id: 'team-123',
          url: 'https://github.com/org/repo/tree/main/docs',
          title: 'Test Documentation',
          description: 'Test description',
        });
      });
    });

    it('should handle submission without optional description', async () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Documentation' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/org/repo' } });

      const submitButton = screen.getByRole('button', { name: /add documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          team_id: 'team-123',
          url: 'https://github.com/org/repo',
          title: 'Test Documentation',
          description: undefined,
        });
      });
    });

    it('should handle submission success and failure scenarios', async () => {
      // Test success scenario
      mockMutateAsync.mockResolvedValueOnce({});
      const { rerender } = render(<AddDocumentationDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Documentation' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/org/repo' } });

      fireEvent.click(screen.getByRole('button', { name: /add documentation/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Documentation added',
          description: 'Documentation endpoint has been added successfully',
        });
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Reset mocks and test failure scenario
      vi.clearAllMocks();
      const error = new Error('Creation failed');
      mockMutateAsync.mockRejectedValueOnce(error);

      rerender(<AddDocumentationDialog {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Documentation' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: 'https://github.com/org/repo' } });

      fireEvent.click(screen.getByRole('button', { name: /add documentation/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to add documentation',
          description: 'Creation failed',
          variant: 'destructive',
        });
      });
    });

    it('should not submit if form validation fails', () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /add documentation/i });
      fireEvent.click(submitButton);

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DIALOG STATE AND EDGE CASES
  // ============================================================================

  describe('Dialog State and Edge Cases', () => {
    it('should control dialog visibility based on open prop', () => {
      const { rerender } = render(<AddDocumentationDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole('heading', { name: 'Add Documentation' })).not.toBeInTheDocument();

      rerender(<AddDocumentationDialog {...defaultProps} open={true} />);
      expect(screen.getByRole('heading', { name: 'Add Documentation' })).toBeInTheDocument();
    });

    it('should handle special characters and trim whitespace on submission', async () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      // Test special characters
      fireEvent.change(titleInput, { target: { value: 'Test & "Special" <Characters>' } });
      fireEvent.change(descriptionInput, { target: { value: "Description with 'quotes' and & symbols" } });

      expect(titleInput).toHaveValue('Test & "Special" <Characters>');
      expect(descriptionInput).toHaveValue("Description with 'quotes' and & symbols");

      // Test whitespace trimming on submission
      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  Trimmed Title  ' } });
      fireEvent.change(screen.getByLabelText(/github url/i), { target: { value: '  https://github.com/org/repo  ' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Trimmed Description  ' } });

      const submitButton = screen.getByRole('button', { name: /add documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          team_id: 'team-123',
          url: 'https://github.com/org/repo',
          title: 'Trimmed Title',
          description: 'Trimmed Description',
        });
      });
    });

    it('should handle description character limit and maintain accessibility', () => {
      render(<AddDocumentationDialog {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      const longDescription = 'A'.repeat(200);
      
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      expect(screen.getByText('200/200 characters')).toBeInTheDocument();

      // Verify accessibility attributes are present
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add documentation/i })).toBeInTheDocument();
      expect(screen.getAllByText('*')).toHaveLength(2); // Required field indicators
    });
  });
});