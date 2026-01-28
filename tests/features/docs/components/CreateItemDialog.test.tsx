import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateItemDialog } from '@/features/docs/components/CreateItemDialog';

describe('CreateItemDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Folder Creation', () => {
    it('should render folder creation dialog when open', () => {
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath="test-path"
        />
      );

      expect(screen.getByText('Create New Folder')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('folder-name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <CreateItemDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      expect(screen.queryByText('Create New Folder')).not.toBeInTheDocument();
    });

    it('should disable create button when folder name is empty', () => {
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const createButton = screen.getByRole('button', { name: /create/i });

      // Button should be disabled when input is empty
      expect(createButton).toBeDisabled();
    });

    it('should validate invalid characters in folder name', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      // Test various invalid characters
      const invalidChars = ['<', '>', ':', '"', '|', '?', '*', '\\'];

      for (const char of invalidChars) {
        await user.clear(input);
        await user.type(input, `folder${char}name`);
        await user.click(createButton);

        await waitFor(() => {
          expect(screen.getByText(/Name contains invalid characters/i)).toBeInTheDocument();
        });
      }

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should validate spaces in folder name', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'folder name with spaces');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Name should not contain spaces. Use hyphens (-) instead.')).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should validate folder name starting with dot', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, '.hidden-folder');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Name should not start with a dot')).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should successfully create folder at root', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-folder');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('test-folder');
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should successfully create folder in subdirectory', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath="existing-folder"
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'new-subfolder');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('new-subfolder');
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state during folder creation', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-folder');
      await user.click(createButton);

      // Check loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(createButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle folder creation API error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create folder';
      mockOnConfirm.mockRejectedValue(new Error(errorMessage));

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-folder');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Document Creation', () => {
    it('should render document creation dialog when open', () => {
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath="test-path"
        />
      );

      expect(screen.getByText('Create New Document')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('document-name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should disable create button when document name is empty', () => {
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const createButton = screen.getByRole('button', { name: /create/i });

      // Button should be disabled when input is empty
      expect(createButton).toBeDisabled();
    });

    it('should validate invalid characters in document name', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'doc*name');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Name contains invalid characters/i)).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should successfully create document at root', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-doc');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('test-doc');
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should successfully create document in subdirectory', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath="guides/tutorials"
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'getting-started');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('getting-started');
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state during document creation', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-doc');
      await user.click(createButton);

      // Check loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(createButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle document creation API error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create document';
      mockOnConfirm.mockRejectedValue(new Error(errorMessage));

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-doc');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Interaction', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      await user.type(input, 'test-folder{Enter}');

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should clear error when typing after validation error', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      // Type invalid characters to trigger validation error
      await user.type(input, 'folder*name');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Name contains invalid characters/i)).toBeInTheDocument();
      });

      // Clear and type valid text - error should clear
      await user.clear(input);
      await user.type(input, 'valid-folder');

      await waitFor(() => {
        expect(screen.queryByText(/Name contains invalid characters/i)).not.toBeInTheDocument();
      });
    });

    it('should disable create button during creation', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );

      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('folder-name');
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(input, 'test-folder');
      await user.click(createButton);

      // Button should be disabled during creation
      expect(createButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should display current path when provided', () => {
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="folder"
          currentPath="existing-folder/subfolder"
        />
      );

      expect(screen.getByText('existing-folder/subfolder')).toBeInTheDocument();
    });

    it('should show .md extension preview for documents', async () => {
      const user = userEvent.setup();
      render(
        <CreateItemDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="document"
          currentPath=""
        />
      );

      const input = screen.getByPlaceholderText('document-name');
      await user.type(input, 'my-doc');

      expect(screen.getByText(/my-doc\.md/)).toBeInTheDocument();
    });
  });
});
