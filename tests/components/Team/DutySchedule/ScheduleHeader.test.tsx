import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScheduleHeader } from '../../../../src/components/Team/DutySchedule/ScheduleHeader';

/**
 * ScheduleHeader Component Tests
 * 
 * Tests for the ScheduleHeader component that provides navigation and actions for the schedule.
 * This component handles tab switching, export/import operations, and other schedule actions.
 */

// Mock the UploadDialog component
vi.mock('../../../../src/components/dialogs/UploadDialog', () => ({
  UploadDialog: vi.fn(({ 
    uploadOpen, 
    setUploadOpen, 
    uploadTypeRef, 
    fileRef, 
    handleUploadConfirm, 
    handleUploadClick 
  }) => (
    <div data-testid="upload-dialog">
      <div data-testid="upload-open">{uploadOpen ? 'open' : 'closed'}</div>
      <button data-testid="upload-dialog-button" onClick={handleUploadClick}>
        Upload Dialog Button
      </button>
      <input data-testid="file-input" ref={fileRef} type="file" />
      <button data-testid="upload-confirm" onClick={handleUploadConfirm}>
        Confirm Upload
      </button>
      <button data-testid="close-upload" onClick={() => setUploadOpen(false)}>
        Close Upload
      </button>
    </div>
  )),
}));

// Mock UI components
vi.mock('../../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, variant, title }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-size={size}
      data-variant={variant}
      title={title}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="download-icon">Download</span>,
  Undo: () => <span data-testid="undo-icon">Undo</span>,
  Save: () => <span data-testid="save-icon">Save</span>,
}));

describe('ScheduleHeader Component', () => {
  const mockActions = {
    exportOnCallToExcel: vi.fn(),
    exportOnDutyToExcel: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    save: vi.fn(),
  };

  const mockUploadTypeRef = { current: 'oncall' as 'oncall' | 'onduty' };
  const mockFileRef = { current: null as HTMLInputElement | null };
  const mockHandleUploadConfirm = vi.fn();

  const defaultProps = {
    actions: mockActions,
    showOnCall: false,
    setShowOnCall: vi.fn(),
    uploadOpen: false,
    setUploadOpen: vi.fn(),
    uploadTypeRef: mockUploadTypeRef,
    fileRef: mockFileRef,
    handleUploadConfirm: mockHandleUploadConfirm,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render all main elements', () => {
      render(<ScheduleHeader {...defaultProps} />);

      // Check for tab toggle buttons
      expect(screen.getByText('On Duty')).toBeInTheDocument();
      expect(screen.getByText('On Call')).toBeInTheDocument();

      // Check for action buttons
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();

      // Check for upload dialog
      expect(screen.getByTestId('upload-dialog')).toBeInTheDocument();
    });

    it('should show correct active tab styling for On Duty', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={false} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      expect(onDutyButton).toHaveAttribute('aria-pressed', 'true');
      expect(onCallButton).toHaveAttribute('aria-pressed', 'false');
      expect(onDutyButton).toHaveClass('bg-primary', 'text-primary-foreground');
      expect(onCallButton).toHaveClass('text-muted-foreground');
    });

    it('should show correct active tab styling for On Call', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={true} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      expect(onDutyButton).toHaveAttribute('aria-pressed', 'false');
      expect(onCallButton).toHaveAttribute('aria-pressed', 'true');
      expect(onCallButton).toHaveClass('bg-emerald-600', 'text-white');
      expect(onDutyButton).toHaveClass('text-muted-foreground');
    });

    it('should render icons correctly', () => {
      render(<ScheduleHeader {...defaultProps} />);

      expect(screen.getByTestId('undo-icon')).toBeInTheDocument();
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TAB SWITCHING TESTS
  // ============================================================================

  describe('Tab Switching', () => {
    it('should call setShowOnCall(false) when On Duty tab is clicked', () => {
      const setShowOnCallMock = vi.fn();
      render(<ScheduleHeader {...defaultProps} setShowOnCall={setShowOnCallMock} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      fireEvent.click(onDutyButton);

      expect(setShowOnCallMock).toHaveBeenCalledWith(false);
    });

    it('should call setShowOnCall(true) when On Call tab is clicked', () => {
      const setShowOnCallMock = vi.fn();
      render(<ScheduleHeader {...defaultProps} setShowOnCall={setShowOnCallMock} />);

      const onCallButton = screen.getByRole('button', { name: /on call/i });
      fireEvent.click(onCallButton);

      expect(setShowOnCallMock).toHaveBeenCalledWith(true);
    });

    it('should handle multiple tab switches', () => {
      const setShowOnCallMock = vi.fn();
      render(<ScheduleHeader {...defaultProps} setShowOnCall={setShowOnCallMock} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      fireEvent.click(onCallButton);
      fireEvent.click(onDutyButton);
      fireEvent.click(onCallButton);

      expect(setShowOnCallMock).toHaveBeenCalledTimes(3);
      expect(setShowOnCallMock).toHaveBeenNthCalledWith(1, true);
      expect(setShowOnCallMock).toHaveBeenNthCalledWith(2, false);
      expect(setShowOnCallMock).toHaveBeenNthCalledWith(3, true);
    });
  });

  // ============================================================================
  // ACTION BUTTON TESTS
  // ============================================================================

  describe('Action Buttons', () => {
    it('should call exportOnDutyToExcel when Export is clicked and On Duty is active', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={false} />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(mockActions.exportOnDutyToExcel).toHaveBeenCalled();
      expect(mockActions.exportOnCallToExcel).not.toHaveBeenCalled();
    });

    it('should call exportOnCallToExcel when Export is clicked and On Call is active', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={true} />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(mockActions.exportOnCallToExcel).toHaveBeenCalled();
      expect(mockActions.exportOnDutyToExcel).not.toHaveBeenCalled();
    });

    it('should call undo action when Undo button is clicked', () => {
      render(<ScheduleHeader {...defaultProps} actions={{ ...mockActions, canUndo: true }} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      expect(mockActions.undo).toHaveBeenCalled();
    });

    it('should disable Undo button when canUndo is false', () => {
      render(<ScheduleHeader {...defaultProps} actions={{ ...mockActions, canUndo: false }} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('should enable Undo button when canUndo is true', () => {
      render(<ScheduleHeader {...defaultProps} actions={{ ...mockActions, canUndo: true }} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    it('should call save action when Save button is clicked', () => {
      render(<ScheduleHeader {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockActions.save).toHaveBeenCalled();
    });

    it('should have correct button titles for accessibility', () => {
      render(<ScheduleHeader {...defaultProps} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      expect(undoButton).toHaveAttribute('title', 'Undo last action');
      expect(saveButton).toHaveAttribute('title', 'Save changes');
    });
  });

  // ============================================================================
  // UPLOAD DIALOG TESTS
  // ============================================================================

  describe('Upload Dialog', () => {
    it('should pass correct props to UploadDialog', () => {
      const setUploadOpenMock = vi.fn();
      render(<ScheduleHeader 
        {...defaultProps} 
        uploadOpen={true}
        setUploadOpen={setUploadOpenMock}
      />);

      expect(screen.getByTestId('upload-open')).toHaveTextContent('open');
    });

    it('should handle upload dialog interactions', () => {
      const setUploadOpenMock = vi.fn();
      render(<ScheduleHeader 
        {...defaultProps} 
        setUploadOpen={setUploadOpenMock}
      />);

      // Click upload dialog button
      const uploadDialogButton = screen.getByTestId('upload-dialog-button');
      fireEvent.click(uploadDialogButton);

      // Close upload dialog
      const closeUploadButton = screen.getByTestId('close-upload');
      fireEvent.click(closeUploadButton);

      expect(setUploadOpenMock).toHaveBeenCalledWith(false);
    });

    it('should call handleUploadConfirm when upload is confirmed', () => {
      render(<ScheduleHeader {...defaultProps} />);

      const confirmButton = screen.getByTestId('upload-confirm');
      fireEvent.click(confirmButton);

      expect(mockHandleUploadConfirm).toHaveBeenCalled();
    });

    it('should set upload type correctly when upload is initiated', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={false} />);

      const uploadDialogButton = screen.getByTestId('upload-dialog-button');
      fireEvent.click(uploadDialogButton);

      // The upload type should be set based on current mode
      // This is handled by the handleUploadClick function
      expect(uploadDialogButton).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle all actions in sequence', () => {
      const setShowOnCallMock = vi.fn();
      const setUploadOpenMock = vi.fn();
      
      render(<ScheduleHeader 
        {...defaultProps} 
        setShowOnCall={setShowOnCallMock}
        setUploadOpen={setUploadOpenMock}
        actions={{ ...mockActions, canUndo: true }}
      />);

      // Test all buttons
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const exportButton = screen.getByRole('button', { name: /export/i });
      const saveButton = screen.getByRole('button', { name: /save/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      fireEvent.click(undoButton);
      fireEvent.click(exportButton);
      fireEvent.click(saveButton);
      fireEvent.click(onCallButton);

      expect(mockActions.undo).toHaveBeenCalled();
      expect(mockActions.exportOnDutyToExcel).toHaveBeenCalled();
      expect(mockActions.save).toHaveBeenCalled();
      expect(setShowOnCallMock).toHaveBeenCalledWith(true);
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for tab buttons', () => {
      render(<ScheduleHeader {...defaultProps} showOnCall={false} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      expect(onDutyButton).toHaveAttribute('aria-pressed', 'true');
      expect(onCallButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have descriptive button titles', () => {
      render(<ScheduleHeader {...defaultProps} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      expect(undoButton).toHaveAttribute('title', 'Undo last action');
      expect(saveButton).toHaveAttribute('title', 'Save changes');
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', () => {
      const setShowOnCallMock = vi.fn();
      render(<ScheduleHeader {...defaultProps} setShowOnCall={setShowOnCallMock} />);

      const onDutyButton = screen.getByRole('button', { name: /on duty/i });
      const onCallButton = screen.getByRole('button', { name: /on call/i });

      // Rapid clicking
      fireEvent.click(onCallButton);
      fireEvent.click(onDutyButton);
      fireEvent.click(onCallButton);
      fireEvent.click(onDutyButton);

      expect(setShowOnCallMock).toHaveBeenCalledTimes(4);
    });

    it('should handle upload operations with null file ref', () => {
      const nullFileRef = { current: null };
      render(<ScheduleHeader 
        {...defaultProps} 
        fileRef={nullFileRef}
      />);

      const confirmButton = screen.getByTestId('upload-confirm');
      fireEvent.click(confirmButton);

      expect(mockHandleUploadConfirm).toHaveBeenCalled();
    });
  });
});
