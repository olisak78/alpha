import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EditDocumentationDialog } from '../../../src/components/dialogs/EditDocumentationDialog';
import type { Documentation } from '../../../src/types/documentation';

/**
 * EditDocumentationDialog Component Tests
 * 
 * Tests for the EditDocumentationDialog component which displays a dialog
 * for editing documentation endpoints with GitHub URL validation and form handling.
 */

// Mock the hooks
const mockToast = vi.fn();
const mockMutateAsync = vi.fn();
const mockTeamData = {
  id: 'team1',
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
  useUpdateDocumentation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(() => ({
    data: mockTeamData,
    isLoading: false,
    error: null,
  })),
}));

describe('EditDocumentationDialog Component', () => {
  const mockOnOpenChange = vi.fn();

  const mockDocumentation: Documentation = {
    id: 'doc1',
    team_id: 'team1',
    provider: 'github', // NEW: Add provider field
    title: 'Test Documentation',
    description: 'Test description',
    owner: 'test-org',
    repo: 'test-repo',
    branch: 'main',
    docs_path: 'docs',
    created_at: '2023-01-01T00:00:00Z',
    created_by: 'test-user',
    updated_at: '2023-01-01T00:00:00Z',
    updated_by: 'test-user',
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    documentation: mockDocumentation,
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
    it('should render dialog with all essential elements', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      expect(screen.getByText('Edit Documentation')).toBeInTheDocument();
      expect(screen.getByText('Update the GitHub documentation endpoint for this team.')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update documentation/i })).toBeInTheDocument();
      expect(screen.getAllByText('*')).toHaveLength(2);
      expect(screen.getByText('16/200 characters')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM INITIALIZATION TESTS
  // ============================================================================

  describe('Form Initialization', () => {
    it('should initialize form with documentation data for github.com provider', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      expect(screen.getByDisplayValue('Test Documentation')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://github.com/test-org/test-repo/tree/main/docs')).toBeInTheDocument();
    });

    it('should handle githubtools provider (github.tools.sap domain)', () => {
      const sapDocumentation: Documentation = {
        ...mockDocumentation,
        provider: 'githubtools', // NEW: Use githubtools provider
        owner: 'sap-org',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={sapDocumentation} />);

      expect(screen.getByDisplayValue('https://github.tools.sap/sap-org/test-repo/tree/main/docs')).toBeInTheDocument();
    });

    it('should handle githubwdf provider (github.wdf.sap.corp domain)', () => {
      const wdfDocumentation: Documentation = {
        ...mockDocumentation,
        provider: 'githubwdf', // NEW: Use githubwdf provider
        owner: 'wdf-org',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={wdfDocumentation} />);

      expect(screen.getByDisplayValue('https://github.wdf.sap.corp/wdf-org/test-repo/tree/main/docs')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const docWithoutDescription: Documentation = {
        ...mockDocumentation,
        description: '',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={docWithoutDescription} />);

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    describe('Title Validation', () => {
      it('should show error for empty title', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const titleInput = screen.getByLabelText(/title/i);
        fireEvent.change(titleInput, { target: { value: '' } });
        fireEvent.blur(titleInput);

        await waitFor(() => {
          expect(screen.getByText('Title is required')).toBeInTheDocument();
        });
      });

      it('should show error for title too long', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const titleInput = screen.getByLabelText(/title/i);
        const longTitle = 'A'.repeat(101);
        fireEvent.change(titleInput, { target: { value: longTitle } });
        fireEvent.blur(titleInput);

        await waitFor(() => {
          expect(screen.getByText('Title must be at most 100 characters')).toBeInTheDocument();
        });
      });
    });

    describe('URL Validation', () => {
      it('should show error for invalid URL format', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value: 'not-a-url' } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.getByText(/Please enter a valid GitHub URL/)).toBeInTheDocument();
        });
      });

      it('should accept valid GitHub URLs from github.com', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value: 'https://github.com/org/repo/tree/main/docs' } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.queryByText(/Please enter a valid GitHub URL/)).not.toBeInTheDocument();
        });
      });

      it('should accept valid GitHub URLs from github.tools.sap', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value: 'https://github.tools.sap/org/repo/tree/main/docs' } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.queryByText(/Please enter a valid GitHub URL/)).not.toBeInTheDocument();
        });
      });

      it('should reject URLs from unsupported providers', async () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const urlInput = screen.getByLabelText(/github url/i);
        fireEvent.change(urlInput, { target: { value: 'https://gitlab.com/org/repo/tree/main/docs' } });
        fireEvent.blur(urlInput);

        await waitFor(() => {
          expect(screen.getByText(/Please enter a valid GitHub URL/)).toBeInTheDocument();
        });
      });
    });

    describe('Form State Validation', () => {
      it('should disable submit button when form is invalid', () => {
        render(<EditDocumentationDialog {...defaultProps} />);

        const titleInput = screen.getByLabelText(/title/i);
        fireEvent.change(titleInput, { target: { value: '' } });

        const submitButton = screen.getByRole('button', { name: /update documentation/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should update form fields when user types', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(titleInput).toHaveValue('New Title');
    });

    it('should update character count for description', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'New description' } });

      expect(screen.getByText('15/200 characters')).toBeInTheDocument();
    });

    it('should validate fields on blur after being touched', async () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Valid' } });
      fireEvent.blur(titleInput);
      fireEvent.change(titleInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('should call onOpenChange when cancel button is clicked', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================

  describe('Form Submission', () => {
    it('should call updateDocumentation with correct data on valid form submission', async () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'doc1',
          team_id: 'team1',
          url: 'https://github.com/test-org/test-repo/tree/main/docs',
          title: 'Test Documentation',
          description: 'Test description',
        });
      });
    });

    it('should call updateDocumentation with githubtools provider URL', async () => {
      const sapDocumentation: Documentation = {
        ...mockDocumentation,
        provider: 'githubtools',
        owner: 'sap-org',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={sapDocumentation} />);

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'doc1',
          team_id: 'team1',
          url: 'https://github.tools.sap/sap-org/test-repo/tree/main/docs',
          title: 'Test Documentation',
          description: 'Test description',
        });
      });
    });

    it('should show success toast and close dialog on successful submission', async () => {
      mockMutateAsync.mockResolvedValueOnce({});

      render(<EditDocumentationDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Documentation updated',
          description: 'Documentation endpoint has been updated successfully',
        });
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should show error toast on submission failure', async () => {
      const error = new Error('Update failed');
      mockMutateAsync.mockRejectedValueOnce(error);

      render(<EditDocumentationDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to update documentation',
          description: 'Update failed',
          variant: 'destructive',
        });
      });
    });
  });

  // ============================================================================
  // DIALOG STATE TESTS
  // ============================================================================

  describe('Dialog State', () => {
    it('should control dialog visibility based on open prop', () => {
      const { rerender } = render(<EditDocumentationDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('Edit Documentation')).not.toBeInTheDocument();

      rerender(<EditDocumentationDialog {...defaultProps} open={true} />);
      expect(screen.getByText('Edit Documentation')).toBeInTheDocument();
    });

    it('should handle button states correctly', () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Buttons should be enabled when form is valid
      expect(submitButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();

      // Submit button should be disabled when form is invalid
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // EDGE CASES & ACCESSIBILITY
  // ============================================================================

  describe('Edge Cases & Accessibility', () => {
    it('should handle special characters and long content', () => {
      const specialDocumentation: Documentation = {
        ...mockDocumentation,
        title: 'Test & "Special" <Characters>',
        description: "Description with 'quotes' and & symbols",
        docs_path: 'very/long/path/to/documentation/that/exceeds/normal/length',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={specialDocumentation} />);

      expect(screen.getByDisplayValue('Test & "Special" <Characters>')).toBeInTheDocument();
      expect(screen.getByDisplayValue("Description with 'quotes' and & symbols")).toBeInTheDocument();
    });

    it('should trim whitespace from form fields on submission', async () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      const urlInput = screen.getByLabelText(/github url/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(titleInput, { target: { value: '  Trimmed Title  ' } });
      fireEvent.change(urlInput, { target: { value: '  https://github.com/org/repo/tree/main/docs  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  Trimmed Description  ' } });

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'doc1',
          team_id: 'team1',
          url: 'https://github.com/org/repo/tree/main/docs',
          title: 'Trimmed Title',
          description: 'Trimmed Description',
        });
      });
    });

    it('should have proper accessibility attributes', async () => {
      render(<EditDocumentationDialog {...defaultProps} />);

      // Check form labels
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

      // Check button roles
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update documentation/i })).toBeInTheDocument();

      // Check error state styling
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(titleInput).toHaveClass('border-red-500');
      });
    });
  });

  // ============================================================================
  // PROVIDER-SPECIFIC TESTS
  // ============================================================================

  describe('Provider-Specific Tests', () => {
    it('should correctly construct URL for different providers', () => {
      const providers = [
        { provider: 'github', expectedUrl: 'https://github.com/test-org/test-repo/tree/main/docs' },
        { provider: 'githubtools', expectedUrl: 'https://github.tools.sap/test-org/test-repo/tree/main/docs' },
        { provider: 'githubwdf', expectedUrl: 'https://github.wdf.sap.corp/test-org/test-repo/tree/main/docs' },
      ];

      providers.forEach(({ provider, expectedUrl }) => {
        const documentation: Documentation = {
          ...mockDocumentation,
          provider,
        };

        const { unmount } = render(<EditDocumentationDialog {...defaultProps} documentation={documentation} />);
        expect(screen.getByDisplayValue(expectedUrl)).toBeInTheDocument();
        unmount();
      });
    });

    it('should preserve provider when updating documentation', async () => {
      const githubToolsDoc: Documentation = {
        ...mockDocumentation,
        provider: 'githubtools',
      };

      render(<EditDocumentationDialog {...defaultProps} documentation={githubToolsDoc} />);

      // Change title but keep the URL
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      const submitButton = screen.getByRole('button', { name: /update documentation/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'doc1',
          team_id: 'team1',
          url: 'https://github.tools.sap/test-org/test-repo/tree/main/docs',
          title: 'Updated Title',
          description: 'Test description',
        });
      });
    });
  });
});