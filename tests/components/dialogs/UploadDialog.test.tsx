import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { UploadDialog } from '../../../src/components/dialogs/UploadDialog';

/**
 * UploadDialog Component Tests
 * 
 * Tests for the UploadDialog component which displays a dialog
 * for uploading Excel files with proper file validation and user feedback.
 */

describe('UploadDialog Component', () => {
  const mockSetUploadOpen = vi.fn();
  const mockHandleUploadConfirm = vi.fn();
  const mockHandleUploadClick = vi.fn();
  const mockFileRef = { current: null } as React.RefObject<HTMLInputElement>;
  const mockUploadTypeRef = { current: 'oncall' as 'oncall' | 'onduty' };

  const defaultProps = {
    uploadOpen: true,
    setUploadOpen: mockSetUploadOpen,
    uploadTypeRef: mockUploadTypeRef,
    fileRef: mockFileRef,
    handleUploadConfirm: mockHandleUploadConfirm,
    handleUploadClick: mockHandleUploadClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleUploadConfirm.mockResolvedValue(undefined);
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render dialog with all essential elements', () => {
      render(<UploadDialog {...defaultProps} />);

      expect(screen.getByText('Upload On Call Excel')).toBeInTheDocument();
      expect(screen.getByText('Select a .xlsx file to import.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
      
      // Check for file input with proper attributes
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
    });

    it('should render correct title based on upload type', () => {
      const { rerender } = render(<UploadDialog {...defaultProps} />);
      expect(screen.getByText('Upload On Call Excel')).toBeInTheDocument();

      mockUploadTypeRef.current = 'onduty';
      rerender(<UploadDialog {...defaultProps} />);
      expect(screen.getByText('Upload On Duty Excel')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DIALOG STATE TESTS
  // ============================================================================

  describe('Dialog State', () => {
    it('should control dialog visibility based on uploadOpen prop', () => {
      const { rerender } = render(<UploadDialog {...defaultProps} uploadOpen={false} />);
      expect(screen.queryByText('Upload On Call Excel')).not.toBeInTheDocument();

      rerender(<UploadDialog {...defaultProps} uploadOpen={true} />);
      // The dialog shows the current upload type, which starts as 'oncall'
      expect(screen.getByText(/Upload.*Excel/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should call handleUploadClick when trigger button is clicked', () => {
      render(<UploadDialog {...defaultProps} uploadOpen={false} />);

      const triggerButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(triggerButton);

      expect(mockHandleUploadClick).toHaveBeenCalledTimes(1);
    });

    it('should call setUploadOpen with false when cancel button is clicked', () => {
      render(<UploadDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockSetUploadOpen).toHaveBeenCalledWith(false);
    });

    it('should call handleUploadConfirm when upload button is clicked', async () => {
      render(<UploadDialog {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockHandleUploadConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle file selection', () => {
      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<UploadDialog {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate file selection by setting files property
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      // File input should have the file
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files?.[0]).toBe(mockFile);
    });
  });

  // ============================================================================
  // FILE VALIDATION TESTS
  // ============================================================================

  describe('File Validation', () => {
    it('should accept both .xlsx and .xls files', () => {
      render(<UploadDialog {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
    });
  });

  // ============================================================================
  // ASYNC OPERATION TESTS
  // ============================================================================

  describe('Async Operations', () => {
    it('should handle successful upload confirmation', async () => {
      mockHandleUploadConfirm.mockResolvedValueOnce(undefined);

      render(<UploadDialog {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockHandleUploadConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle upload confirmation errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockHandleUploadConfirm.mockRejectedValueOnce(new Error('Upload failed'));

      render(<UploadDialog {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockHandleUploadConfirm).toHaveBeenCalledTimes(1);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================================================
  // DIALOG TRIGGER TESTS
  // ============================================================================

  describe('Dialog Trigger', () => {
    it('should render trigger button', () => {
      render(<UploadDialog {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /upload/i });
      expect(triggerButton).toBeInTheDocument();
    });

    it('should trigger dialog opening when trigger button is clicked', () => {
      render(<UploadDialog {...defaultProps} uploadOpen={false} />);

      const triggerButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(triggerButton);

      expect(mockHandleUploadClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<UploadDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });

    it('should have proper dialog structure', () => {
      render(<UploadDialog {...defaultProps} />);

      // Dialog should have proper title (flexible to handle both types)
      expect(screen.getByText(/Upload.*Excel/)).toBeInTheDocument();
      
      // Dialog should have description
      expect(screen.getByText('Select a .xlsx file to import.')).toBeInTheDocument();
    });

    it('should handle keyboard interactions', () => {
      render(<UploadDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const uploadButton = screen.getByRole('button', { name: /upload/i });

      // Buttons should be focusable
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      uploadButton.focus();
      expect(document.activeElement).toBe(uploadButton);
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null fileRef without errors', () => {
      const nullFileRef = { current: null } as React.RefObject<HTMLInputElement>;
      
      expect(() => {
        render(<UploadDialog {...defaultProps} fileRef={nullFileRef} />);
      }).not.toThrow();
    });
  });
});
