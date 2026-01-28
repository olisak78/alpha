import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OnCall } from '../../../../src/components/Team/DutySchedule/OnCall';
import type { OnCallShift, Member } from '../../../../src/hooks/useScheduleData';

/**
 * OnCall Component Tests
 * 
 * Tests for the OnCall component that manages on-call shift scheduling.
 * This component handles creating, updating, splitting, and deleting on-call shifts.
 */

// Note: Using real schedule utilities instead of mocks for better integration testing

// Mock the ScheduleTable component
vi.mock('../../../../src/components/Team/DutySchedule/ScheduleTable', () => ({
  ScheduleTable: vi.fn(({ 
    shifts, 
    members, 
    headers, 
    onUpdateShift, 
    onAddShift, 
    onAddShiftAfter, 
    onSplitShift, 
    onDeleteShift, 
    renderExtraColumns, 
    emptyMessage 
  }) => (
    <div data-testid="schedule-table">
      <div data-testid="table-headers">{headers.join(', ')}</div>
      <div data-testid="shifts-count">{shifts.length}</div>
      <div data-testid="members-count">{members.length}</div>
      <div data-testid="empty-message">{emptyMessage}</div>
      
      {shifts.map((shift: OnCallShift, index: number) => (
        <div key={shift.id} data-testid={`shift-${shift.id}`}>
          <span data-testid={`shift-${shift.id}-start`}>{shift.start}</span>
          <span data-testid={`shift-${shift.id}-end`}>{shift.end}</span>
          <span data-testid={`shift-${shift.id}-type`}>{shift.type}</span>
          <span data-testid={`shift-${shift.id}-assignee`}>{shift.assigneeId}</span>
          <span data-testid={`shift-${shift.id}-called`}>{shift.called ? 'yes' : 'no'}</span>
          
          <button 
            data-testid={`update-shift-${shift.id}`}
            onClick={() => onUpdateShift(shift.id, { called: !shift.called })}
          >
            Update Shift
          </button>
          <button 
            data-testid={`split-shift-${shift.id}`}
            onClick={() => onSplitShift(shift.id)}
          >
            Split Shift
          </button>
          <button 
            data-testid={`delete-shift-${shift.id}`}
            onClick={() => onDeleteShift(shift.id)}
          >
            Delete Shift
          </button>
          <button 
            data-testid={`add-after-${shift.id}`}
            onClick={() => onAddShiftAfter(shift.id)}
          >
            Add After
          </button>
          
          {renderExtraColumns && (
            <div data-testid={`extra-columns-${shift.id}`}>
              {renderExtraColumns(shift)}
            </div>
          )}
        </div>
      ))}
      
      <button data-testid="add-shift" onClick={onAddShift}>
        Add Shift
      </button>
    </div>
  )),
}));

// Mock UI components
vi.mock('../../../../src/components/ui/table', () => ({
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
}));

vi.mock('../../../../src/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input
      data-testid="checkbox"
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

describe('OnCall Component', () => {
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

  const mockShifts: OnCallShift[] = [
    {
      id: 'oc1',
      start: '2025-01-01',
      end: '2025-01-07',
      type: 'week',
      assigneeId: 'member1',
      called: false,
    },
    {
      id: 'oc2',
      start: '2025-01-08',
      end: '2025-01-14',
      type: 'weekend',
      assigneeId: 'member2',
      called: true,
    },
  ];

  const mockOnUpdateShifts = vi.fn();

  const defaultProps = {
    shifts: mockShifts,
    members: mockMembers,
    onUpdateShifts: mockOnUpdateShifts,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Date.now() for consistent IDs
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render the ScheduleTable with correct props', () => {
      render(<OnCall {...defaultProps} />);

      expect(screen.getByTestId('schedule-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-headers')).toHaveTextContent('Start, End, Type, Assignee, Days, Called?');
      expect(screen.getByTestId('shifts-count')).toHaveTextContent('2');
      expect(screen.getByTestId('members-count')).toHaveTextContent('2');
      expect(screen.getByTestId('empty-message')).toHaveTextContent('No on call assignments yet.');
    });

    it('should render all shifts with correct data', () => {
      render(<OnCall {...defaultProps} />);

      // Check first shift
      expect(screen.getByTestId('shift-oc1')).toBeInTheDocument();
      expect(screen.getByTestId('shift-oc1-start')).toHaveTextContent('2025-01-01');
      expect(screen.getByTestId('shift-oc1-end')).toHaveTextContent('2025-01-07');
      expect(screen.getByTestId('shift-oc1-type')).toHaveTextContent('week');
      expect(screen.getByTestId('shift-oc1-assignee')).toHaveTextContent('member1');
      expect(screen.getByTestId('shift-oc1-called')).toHaveTextContent('no');

      // Check second shift
      expect(screen.getByTestId('shift-oc2')).toBeInTheDocument();
      expect(screen.getByTestId('shift-oc2-start')).toHaveTextContent('2025-01-08');
      expect(screen.getByTestId('shift-oc2-end')).toHaveTextContent('2025-01-14');
      expect(screen.getByTestId('shift-oc2-type')).toHaveTextContent('weekend');
      expect(screen.getByTestId('shift-oc2-assignee')).toHaveTextContent('member2');
      expect(screen.getByTestId('shift-oc2-called')).toHaveTextContent('yes');
    });

    it('should render extra columns with checkboxes', () => {
      render(<OnCall {...defaultProps} />);

      expect(screen.getByTestId('extra-columns-oc1')).toBeInTheDocument();
      expect(screen.getByTestId('extra-columns-oc2')).toBeInTheDocument();
      
      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });
  });

  // ============================================================================
  // SHIFT MANAGEMENT TESTS
  // ============================================================================

  describe('Shift Management', () => {
    it('should update shift when checkbox is toggled', () => {
      render(<OnCall {...defaultProps} />);

      const updateButton = screen.getByTestId('update-shift-oc1');
      fireEvent.click(updateButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        { ...mockShifts[0], called: true },
        mockShifts[1],
      ]);
    });

    it('should add new shift with correct default values', () => {
      render(<OnCall {...defaultProps} />);

      const addButton = screen.getByTestId('add-shift');
      fireEvent.click(addButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        ...mockShifts,
        expect.objectContaining({
          id: 'oc_1640995200000',
          type: 'week',
          assigneeId: 'member1',
          called: false,
        }),
      ]);
    });

    it('should add shift after specific shift', () => {
      render(<OnCall {...defaultProps} />);

      const addAfterButton = screen.getByTestId('add-after-oc1');
      fireEvent.click(addAfterButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        mockShifts[0],
        {
          id: 'oc_1640995200000',
          start: '2025-01-07',
          end: '2025-01-13',
          type: 'week',
          assigneeId: 'member1',
          called: false,
        },
        mockShifts[1],
      ]);
    });

    it('should split shift correctly', () => {
      render(<OnCall {...defaultProps} />);

      const splitButton = screen.getByTestId('split-shift-oc1');
      fireEvent.click(splitButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        {
          id: 'oc1_a',
          start: '2025-01-01',
          end: '2025-01-03',
          type: 'week',
          assigneeId: 'member1',
          called: false,
        },
        {
          id: 'oc1_b',
          start: '2025-01-04',
          end: '2025-01-07',
          type: 'week',
          assigneeId: 'member1',
          called: false,
        },
        mockShifts[1],
      ]);
    });

    it('should delete shift correctly', () => {
      render(<OnCall {...defaultProps} />);

      const deleteButton = screen.getByTestId('delete-shift-oc1');
      fireEvent.click(deleteButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([mockShifts[1]]);
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty shifts and members arrays', () => {
      render(<OnCall {...defaultProps} shifts={[]} members={[]} />);

      expect(screen.getByTestId('shifts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('members-count')).toHaveTextContent('0');
      expect(screen.getByTestId('add-shift')).toBeInTheDocument();
    });

    it('should handle adding shift when no members exist', () => {
      render(<OnCall {...defaultProps} members={[]} />);

      const addButton = screen.getByTestId('add-shift');
      fireEvent.click(addButton);

      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        ...mockShifts,
        expect.objectContaining({
          id: 'oc_1640995200000',
          type: 'week',
          assigneeId: '',
          called: false,
        }),
      ]);
    });
  });

  // ============================================================================
  // CHECKBOX INTERACTION TESTS
  // ============================================================================

  describe('Checkbox Interactions', () => {
    it('should toggle called status when checkbox is clicked', () => {
      render(<OnCall {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      
      // Click first checkbox (currently false)
      fireEvent.click(checkboxes[0]);

      // Should update the shift with called: true
      expect(mockOnUpdateShifts).toHaveBeenCalledWith([
        { ...mockShifts[0], called: true },
        mockShifts[1],
      ]);
    });

  });


  // ============================================================================
  // PROP VALIDATION TESTS
  // ============================================================================

  describe('Prop Validation', () => {
    it('should handle shifts with missing optional properties', () => {
      const shiftsWithMissingProps: OnCallShift[] = [
        {
          id: 'oc1',
          start: '2025-01-01',
          end: '2025-01-07',
          type: 'week',
          assigneeId: 'member1',
          // called property is optional and missing
        },
      ];

      render(<OnCall {...defaultProps} shifts={shiftsWithMissingProps} />);

      expect(screen.getByTestId('shift-oc1-called')).toHaveTextContent('no');
    });

    it('should handle different shift types correctly', () => {
      const weekendShift: OnCallShift = {
        id: 'oc_weekend',
        start: '2025-01-04',
        end: '2025-01-05',
        type: 'weekend',
        assigneeId: 'member1',
        called: false,
      };

      render(<OnCall {...defaultProps} shifts={[weekendShift]} />);

      expect(screen.getByTestId('shift-oc_weekend-type')).toHaveTextContent('weekend');
    });
  });

  // ============================================================================
  // CALLBACK FUNCTION TESTS
  // ============================================================================

  describe('Callback Functions', () => {
    it('should call onUpdateShifts with correct parameters for different operations', () => {
      render(<OnCall {...defaultProps} />);

      // Test update
      const updateButton = screen.getByTestId('update-shift-oc1');
      fireEvent.click(updateButton);
      expect(mockOnUpdateShifts).toHaveBeenLastCalledWith([
        { ...mockShifts[0], called: true },
        mockShifts[1],
      ]);

      // Test delete
      const deleteButton = screen.getByTestId('delete-shift-oc2');
      fireEvent.click(deleteButton);
      expect(mockOnUpdateShifts).toHaveBeenLastCalledWith([mockShifts[0]]);

      // Test add
      const addButton = screen.getByTestId('add-shift');
      fireEvent.click(addButton);
      expect(mockOnUpdateShifts).toHaveBeenLastCalledWith([
        ...mockShifts,
        expect.objectContaining({
          id: expect.stringContaining('oc_'),
          type: 'week',
          called: false,
        }),
      ]);
    });

    it('should maintain shift order when adding shifts after specific positions', () => {
      render(<OnCall {...defaultProps} />);

      const addAfterButton = screen.getByTestId('add-after-oc1');
      fireEvent.click(addAfterButton);

      const expectedShifts = [
        mockShifts[0], // Original first shift
        expect.objectContaining({ // New shift inserted
          id: expect.stringContaining('oc_'),
          start: '2025-01-07',
        }),
        mockShifts[1], // Original second shift
      ];

      expect(mockOnUpdateShifts).toHaveBeenCalledWith(expectedShifts);
    });
  });
});
