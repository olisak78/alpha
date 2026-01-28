import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OnDutySchedule } from '../../../../src/components/Team/DutySchedule/OnDutySchedule';
import type { Member } from '../../../../src/hooks/useScheduleData';

/**
 * OnDutySchedule Component Tests
 * 
 * Tests for the main OnDutySchedule component that orchestrates duty scheduling functionality.
 * This component manages the display of both on-duty and on-call schedules with year selection.
 */

// Mock the hooks
vi.mock('../../../../src/hooks/useScheduleData', () => ({
  useScheduleData: vi.fn(() => ({
    onCall: [],
    onDuty: [],
    setOnCall: vi.fn(),
    setOnDuty: vi.fn(),
    todayAssignments: {
      dayMember: null,
      nightMember: null,
    },
    membersById: {},
  })),
}));

vi.mock('../../../../src/hooks/useScheduleExcel', () => ({
  useScheduleExcel: vi.fn(() => ({
    exportOnCallToExcel: vi.fn(),
    exportOnDutyToExcel: vi.fn(),
    importOnCallFromExcel: vi.fn(),
    importOnDutyFromExcel: vi.fn(),
  })),
}));

// Mock child components
vi.mock('../../../../src/components/Team/DutySchedule/OnDuty', () => ({
  OnDuty: vi.fn(({ shifts, members, onUpdateShifts }) => (
    <div data-testid="on-duty-component">
      <div data-testid="on-duty-shifts-count">{shifts.length}</div>
      <div data-testid="on-duty-members-count">{members.length}</div>
      <button 
        data-testid="on-duty-update-shifts" 
        onClick={() => onUpdateShifts([...shifts, { id: 'new', start: '2025-01-01', end: '2025-01-02', assigneeId: 'member1', notes: '' }])}
      >
        Update Shifts
      </button>
    </div>
  )),
}));

vi.mock('../../../../src/components/Team/DutySchedule/OnCall', () => ({
  OnCall: vi.fn(({ shifts, members, onUpdateShifts }) => (
    <div data-testid="on-call-component">
      <div data-testid="on-call-shifts-count">{shifts.length}</div>
      <div data-testid="on-call-members-count">{members.length}</div>
      <button 
        data-testid="on-call-update-shifts" 
        onClick={() => onUpdateShifts([...shifts, { id: 'new', start: '2025-01-01', end: '2025-01-07', type: 'week', assigneeId: 'member1', called: false }])}
      >
        Update Shifts
      </button>
    </div>
  )),
}));

vi.mock('../../../../src/components/Team/DutySchedule/ScheduleHeader', () => ({
  ScheduleHeader: vi.fn(({ 
    actions, 
    showOnCall, 
    setShowOnCall, 
    uploadOpen, 
    setUploadOpen, 
    uploadTypeRef, 
    fileRef, 
    handleUploadConfirm 
  }) => (
    <div data-testid="schedule-header">
      <button 
        data-testid="toggle-on-duty" 
        onClick={() => setShowOnCall(false)}
        className={!showOnCall ? 'active' : ''}
      >
        On Duty
      </button>
      <button 
        data-testid="toggle-on-call" 
        onClick={() => setShowOnCall(true)}
        className={showOnCall ? 'active' : ''}
      >
        On Call
      </button>
      <button data-testid="export-button" onClick={showOnCall ? actions.exportOnCallToExcel : actions.exportOnDutyToExcel}>
        Export
      </button>
      <button data-testid="undo-button" onClick={actions.undo} disabled={!actions.canUndo}>
        Undo
      </button>
      <button data-testid="save-button" onClick={actions.save}>
        Save
      </button>
      <button data-testid="upload-button" onClick={() => setUploadOpen(true)}>
        Upload
      </button>
      {uploadOpen && (
        <div data-testid="upload-dialog">
          <input data-testid="file-input" ref={fileRef} type="file" />
          <button data-testid="upload-confirm" onClick={handleUploadConfirm}>
            Confirm Upload
          </button>
        </div>
      )}
    </div>
  )),
}));

// Mock UI components
vi.mock('../../../../src/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className} data-testid="card-title">{children}</div>,
}));

vi.mock('../../../../src/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">
      <select 
        data-testid="select-input" 
        value={value || ''} 
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

describe('OnDutySchedule Component', () => {
  const mockMembers: Member[] = [
    {
      id: 'member1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      avatar: 'avatar1.jpg',
      team: 'Team A',
    },
    {
      id: 'member2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Manager',
      avatar: 'avatar2.jpg',
      team: 'Team A',
    },
  ];

  const defaultProps = {
    members: mockMembers,
    year: 2025,
    setYear: vi.fn(),
  };

  const mockScheduleData = {
    onCall: [
      { id: 'oc1', start: '2025-01-01', end: '2025-01-07', type: 'week' as const, assigneeId: 'member1', called: false },
    ],
    onDuty: [
      { id: 'od1', start: '2025-01-01', end: '2025-01-02', assigneeId: 'member2', notes: 'Test note' },
    ],
    setOnCall: vi.fn(),
    setOnDuty: vi.fn(),
    todayAssignments: {
      dayMember: undefined,
      nightMember: undefined,
    },
    membersById: {
      member1: mockMembers[0],
      member2: mockMembers[1],
    },
  };

  const mockExcelOperations = {
    exportOnCallToExcel: vi.fn(),
    exportOnDutyToExcel: vi.fn(),
    importOnCallFromExcel: vi.fn(),
    importOnDutyFromExcel: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { useScheduleData } = vi.mocked(await import('../../../../src/hooks/useScheduleData'));
    const { useScheduleExcel } = vi.mocked(await import('../../../../src/hooks/useScheduleExcel'));
    
    useScheduleData.mockReturnValue(mockScheduleData);
    useScheduleExcel.mockReturnValue(mockExcelOperations);
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render the component with default props', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should display the correct year in the title', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByText('On Duty for 2025')).toBeInTheDocument();
    });


    it('should render schedule header component', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByTestId('schedule-header')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TAB SWITCHING TESTS
  // ============================================================================

  describe('Tab Switching', () => {
    it('should show OnDuty component by default', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByTestId('on-duty-component')).toBeInTheDocument();
      expect(screen.queryByTestId('on-call-component')).not.toBeInTheDocument();
      expect(screen.getByText('On Duty for 2025')).toBeInTheDocument();
    });

    it('should switch to OnCall component when toggled', () => {
      render(<OnDutySchedule {...defaultProps} />);

      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);

      expect(screen.getByTestId('on-call-component')).toBeInTheDocument();
      expect(screen.queryByTestId('on-duty-component')).not.toBeInTheDocument();
      expect(screen.getByText('On Call for 2025')).toBeInTheDocument();
    });

    it('should switch back to OnDuty component', () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Switch to OnCall first
      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);
      expect(screen.getByTestId('on-call-component')).toBeInTheDocument();

      // Switch back to OnDuty
      const onDutyToggle = screen.getByTestId('toggle-on-duty');
      fireEvent.click(onDutyToggle);
      expect(screen.getByTestId('on-duty-component')).toBeInTheDocument();
      expect(screen.queryByTestId('on-call-component')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // YEAR SELECTION TESTS
  // ============================================================================

  describe('Year Selection', () => {
    it('should render available years in select', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByText('2025')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DATA INTEGRATION TESTS
  // ============================================================================

  describe('Data Integration', () => {
    it('should pass correct data to OnDuty component', () => {
      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByTestId('on-duty-shifts-count')).toHaveTextContent('1');
      expect(screen.getByTestId('on-duty-members-count')).toHaveTextContent('2');
    });

    it('should pass correct data to OnCall component when switched', () => {
      render(<OnDutySchedule {...defaultProps} />);

      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);

      expect(screen.getByTestId('on-call-shifts-count')).toHaveTextContent('1');
      expect(screen.getByTestId('on-call-members-count')).toHaveTextContent('2');
    });

    it('should handle shift updates for OnDuty', () => {
      render(<OnDutySchedule {...defaultProps} />);

      const updateButton = screen.getByTestId('on-duty-update-shifts');
      fireEvent.click(updateButton);

      expect(mockScheduleData.setOnDuty).toHaveBeenCalledWith([
        mockScheduleData.onDuty[0],
        { id: 'new', start: '2025-01-01', end: '2025-01-02', assigneeId: 'member1', notes: '' }
      ]);
    });

    it('should handle shift updates for OnCall', () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Switch to OnCall
      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);

      const updateButton = screen.getByTestId('on-call-update-shifts');
      fireEvent.click(updateButton);

      expect(mockScheduleData.setOnCall).toHaveBeenCalledWith([
        mockScheduleData.onCall[0],
        { id: 'new', start: '2025-01-01', end: '2025-01-07', type: 'week', assigneeId: 'member1', called: false }
      ]);
    });
  });

  // ============================================================================
  // EXCEL OPERATIONS TESTS
  // ============================================================================

  describe('Excel Operations', () => {
    it('should handle OnDuty export', () => {
      render(<OnDutySchedule {...defaultProps} />);

      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      expect(mockExcelOperations.exportOnDutyToExcel).toHaveBeenCalled();
    });

    it('should handle OnCall export when switched', () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Switch to OnCall
      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);

      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      expect(mockExcelOperations.exportOnCallToExcel).toHaveBeenCalled();
    });


    it('should handle file upload for OnCall', async () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Switch to OnCall
      const onCallToggle = screen.getByTestId('toggle-on-call');
      fireEvent.click(onCallToggle);

      // Open upload dialog
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Mock file upload
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = screen.getByTestId('file-input');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      const confirmButton = screen.getByTestId('upload-confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockExcelOperations.importOnCallFromExcel).toHaveBeenCalledWith(file);
      });
    });
  });

  // ============================================================================
  // SCHEDULE ACTIONS TESTS
  // ============================================================================

  describe('Schedule Actions', () => {
    it('should provide correct schedule actions to header', () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Test undo button (should be disabled by default)
      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).toBeDisabled();

      // Test save button
      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);
      // Save is a no-op in the current implementation
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty members array', () => {
      render(<OnDutySchedule {...defaultProps} members={[]} />);

      expect(screen.getByTestId('on-duty-members-count')).toHaveTextContent('0');
    });

    it('should handle empty shifts arrays', async () => {
      const emptyScheduleData = {
        ...mockScheduleData,
        onCall: [],
        onDuty: [],
      };

      const { useScheduleData } = vi.mocked(await import('../../../../src/hooks/useScheduleData'));
      useScheduleData.mockReturnValue(emptyScheduleData);

      render(<OnDutySchedule {...defaultProps} />);

      expect(screen.getByTestId('on-duty-shifts-count')).toHaveTextContent('0');
    });

    it('should handle upload without file selected', async () => {
      render(<OnDutySchedule {...defaultProps} />);

      // Open upload dialog
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Try to confirm without selecting file
      const confirmButton = screen.getByTestId('upload-confirm');
      fireEvent.click(confirmButton);

      // Should not call import functions
      expect(mockExcelOperations.importOnDutyFromExcel).not.toHaveBeenCalled();
      expect(mockExcelOperations.importOnCallFromExcel).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // HOOK INTEGRATION TESTS
  // ============================================================================

  describe('Hook Integration', () => {
    it('should call useScheduleData with correct parameters', async () => {
      const { useScheduleData } = vi.mocked(await import('../../../../src/hooks/useScheduleData'));
      
      render(<OnDutySchedule {...defaultProps} />);

      expect(useScheduleData).toHaveBeenCalledWith(mockMembers, 2025);
    });

    it('should call useScheduleExcel with correct parameters', async () => {
      const { useScheduleExcel } = vi.mocked(await import('../../../../src/hooks/useScheduleExcel'));
      
      render(<OnDutySchedule {...defaultProps} />);

      expect(useScheduleExcel).toHaveBeenCalledWith(
        mockMembers,
        2025,
        mockScheduleData.onCall,
        mockScheduleData.onDuty,
        mockScheduleData.setOnCall,
        mockScheduleData.setOnDuty
      );
    });

    it('should update hooks when year changes', async () => {
      const { useScheduleData } = vi.mocked(await import('../../../../src/hooks/useScheduleData'));
      
      const { rerender } = render(<OnDutySchedule {...defaultProps} />);
      
      rerender(<OnDutySchedule {...defaultProps} year={2026} />);

      expect(useScheduleData).toHaveBeenLastCalledWith(mockMembers, 2026);
    });
  });
});
