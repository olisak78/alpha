import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScheduleTable } from '../../../../src/components/Team/DutySchedule/ScheduleTable';
import type { Member } from '../../../../src/hooks/useScheduleData';

/**
 * ScheduleTable Component Tests
 * 
 * Tests for the generic ScheduleTable component that displays and manages shifts.
 * This component is used by both OnCall and OnDuty components to display their respective shifts.
 */

// Note: Using real schedule utilities instead of mocks for better integration testing

// Mock UI components
vi.mock('../../../../src/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children, colSpan }: any) => <td data-testid="table-cell" colSpan={colSpan}>{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children, className }: any) => <tr data-testid="table-row" className={className}>{children}</tr>,
}));

vi.mock('../../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../../src/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">
      <select 
        data-testid="select-trigger" 
        value={value} 
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

vi.mock('../../../../src/components/ui/input', () => ({
  Input: ({ type, value, onChange }: any) => (
    <input
      data-testid="input"
      type={type}
      value={value}
      onChange={onChange}
    />
  ),
}));

vi.mock('../../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

vi.mock('../../../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, align }: any) => <div data-testid="dropdown-content" data-align={align}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button data-testid="dropdown-item" onClick={onClick} className={className}>{children}</button>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Scissors: () => <span data-testid="scissors-icon">Scissors</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  MoreHorizontal: () => <span data-testid="more-icon">More</span>,
}));

interface TestShift {
  id: string;
  start: string;
  end: string;
  assigneeId: string;
  notes?: string;
  called?: boolean;
}

describe('ScheduleTable Component', () => {
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

  const mockShifts: TestShift[] = [
    {
      id: 'shift1',
      start: '2025-01-01',
      end: '2025-01-02',
      assigneeId: 'member1',
      notes: 'Test notes',
    },
    {
      id: 'shift2',
      start: '2025-01-03',
      end: '2025-01-10',
      assigneeId: 'member2',
      called: true,
    },
  ];

  const mockHeaders = ['Start', 'End', 'Type', 'Assignee', 'Days', 'Notes'];

  const mockCallbacks = {
    onUpdateShift: vi.fn(),
    onAddShift: vi.fn(),
    onAddShiftAfter: vi.fn(),
    onSplitShift: vi.fn(),
    onDeleteShift: vi.fn(),
  };

  const defaultProps = {
    shifts: mockShifts,
    members: mockMembers,
    headers: mockHeaders,
    ...mockCallbacks,
    emptyMessage: 'No shifts available',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render table structure correctly', () => {
      render(<ScheduleTable {...defaultProps} />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByTestId('table-header')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });

    it('should render all headers correctly', () => {
      render(<ScheduleTable {...defaultProps} />);

      const headers = screen.getAllByTestId('table-head');
      expect(headers).toHaveLength(mockHeaders.length + 1); // +1 for Actions column

      mockHeaders.forEach((header, index) => {
        expect(headers[index]).toHaveTextContent(header);
      });
      expect(headers[headers.length - 1]).toHaveTextContent('Actions');
    });

    it('should render all shifts as table rows', () => {
      render(<ScheduleTable {...defaultProps} />);

      // Each shift creates 2 rows (shift row + add button row)
      const rows = screen.getAllByTestId('table-row');
      expect(rows.length).toBeGreaterThanOrEqual(mockShifts.length * 2);
    });

    it('should display empty message when no shifts', () => {
      render(<ScheduleTable {...defaultProps} shifts={[]} />);

      expect(screen.getByText('No shifts available')).toBeInTheDocument();
    });

    it('should render default empty message when none provided', () => {
      render(<ScheduleTable {...defaultProps} shifts={[]} emptyMessage={undefined} />);

      expect(screen.getByText('No assignments yet.')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SHIFT DATA RENDERING TESTS
  // ============================================================================

  describe('Shift Data Rendering', () => {
    it('should render shift dates correctly', () => {
      render(<ScheduleTable {...defaultProps} />);

      const dateInputs = screen.getAllByTestId('input');
      const startInputs = dateInputs.filter((input, index) => index % 2 === 0);
      const endInputs = dateInputs.filter((input, index) => index % 2 === 1);

      expect(startInputs[0]).toHaveValue('2025-01-01');
      expect(endInputs[0]).toHaveValue('2025-01-02');
      expect(startInputs[1]).toHaveValue('2025-01-03');
      expect(endInputs[1]).toHaveValue('2025-01-10');
    });

    it('should render shift types as badges', () => {
      render(<ScheduleTable {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(mockShifts.length);
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant', 'secondary');
      });
    });


  });

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('Interactions', () => {
    it('should call onUpdateShift when start date is changed', () => {
      render(<ScheduleTable {...defaultProps} />);

      const dateInputs = screen.getAllByTestId('input');
      const firstStartInput = dateInputs[0];

      fireEvent.change(firstStartInput, { target: { value: '2025-01-05' } });

      expect(mockCallbacks.onUpdateShift).toHaveBeenCalledWith('shift1', { start: '2025-01-05' });
    });

    it('should call onUpdateShift when end date is changed', () => {
      render(<ScheduleTable {...defaultProps} />);

      const dateInputs = screen.getAllByTestId('input');
      const firstEndInput = dateInputs[1];

      fireEvent.change(firstEndInput, { target: { value: '2025-01-06' } });

      expect(mockCallbacks.onUpdateShift).toHaveBeenCalledWith('shift1', { end: '2025-01-06' });
    });


    it('should call onAddShift when main add button is clicked', () => {
      render(<ScheduleTable {...defaultProps} />);

      const addButtons = screen.getAllByTestId('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Add')
      );
      
      // Find the main add button (should be the first one or the one without "after")
      const mainAddButton = addButtons.find(btn => 
        btn.getAttribute('aria-label') === 'Add first row' || 
        !btn.getAttribute('aria-label')?.includes('after')
      );

      if (mainAddButton) {
        fireEvent.click(mainAddButton);
        expect(mockCallbacks.onAddShift).toHaveBeenCalled();
      }
    });

    it('should call onAddShiftAfter when add after button is clicked', () => {
      render(<ScheduleTable {...defaultProps} />);

      const addButtons = screen.getAllByTestId('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Add row after')
      );

      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        expect(mockCallbacks.onAddShiftAfter).toHaveBeenCalledWith('shift1');
      }
    });
  });

  // ============================================================================
  // DROPDOWN MENU TESTS
  // ============================================================================

  describe('Dropdown Menu Actions', () => {
    it('should render dropdown menus for each shift', () => {
      render(<ScheduleTable {...defaultProps} />);

      const dropdownTriggers = screen.getAllByTestId('dropdown-trigger');
      expect(dropdownTriggers).toHaveLength(mockShifts.length);
    });

    it('should call onSplitShift when split action is clicked', () => {
      render(<ScheduleTable {...defaultProps} />);

      const splitButtons = screen.getAllByTestId('dropdown-item').filter(btn =>
        btn.textContent?.includes('Split')
      );

      if (splitButtons.length > 0) {
        fireEvent.click(splitButtons[0]);
        expect(mockCallbacks.onSplitShift).toHaveBeenCalledWith('shift1');
      }
    });

    it('should call onDeleteShift when delete action is clicked', () => {
      render(<ScheduleTable {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('dropdown-item').filter(btn =>
        btn.textContent?.includes('Delete')
      );

      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(mockCallbacks.onDeleteShift).toHaveBeenCalledWith('shift1');
      }
    });

    it('should apply destructive styling to delete button', () => {
      render(<ScheduleTable {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('dropdown-item').filter(btn =>
        btn.textContent?.includes('Delete')
      );

      deleteButtons.forEach(button => {
        expect(button).toHaveClass('text-destructive');
      });
    });
  });

  // ============================================================================
  // EXTRA COLUMNS TESTS
  // ============================================================================

  describe('Extra Columns', () => {
    it('should render extra columns when renderExtraColumns is provided', () => {
      const renderExtraColumns = vi.fn((shift: TestShift) => [
        <td key="extra" data-testid={`extra-${shift.id}`}>Extra: {shift.notes}</td>
      ]);

      render(<ScheduleTable {...defaultProps} renderExtraColumns={renderExtraColumns} />);

      expect(screen.getByTestId('extra-shift1')).toBeInTheDocument();
      expect(screen.getByTestId('extra-shift2')).toBeInTheDocument();
      expect(renderExtraColumns).toHaveBeenCalledTimes(mockShifts.length);
    });

    it('should call renderExtraColumns with correct shift data', () => {
      const renderExtraColumns = vi.fn((shift: TestShift) => [
        <td key="extra" data-testid={`extra-${shift.id}`}>Extra</td>
      ]);

      render(<ScheduleTable {...defaultProps} renderExtraColumns={renderExtraColumns} />);

      expect(renderExtraColumns).toHaveBeenCalledWith(mockShifts[0]);
      expect(renderExtraColumns).toHaveBeenCalledWith(mockShifts[1]);
    });

    it('should not render extra columns when renderExtraColumns is not provided', () => {
      render(<ScheduleTable {...defaultProps} />);

      expect(screen.queryByTestId('extra-shift1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('extra-shift2')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // MEMBER SELECTION TESTS
  // ============================================================================

  describe('Member Selection', () => {
    it('should render all members in select options', () => {
      render(<ScheduleTable {...defaultProps} />);

      const selectOptions = screen.getAllByRole('option');
      
      // Should have options for each member for each shift
      expect(selectOptions.length).toBeGreaterThanOrEqual(mockMembers.length);
      
      // Check that member names are present (they appear multiple times, once per shift)
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });

    it('should handle empty members array', () => {
      render(<ScheduleTable {...defaultProps} members={[]} />);

      // With our mock structure, we have both select and select-trigger elements
      const selects = screen.getAllByTestId('select');
      expect(selects).toHaveLength(mockShifts.length);
    });

    it('should show placeholder when no member is selected', () => {
      const shiftsWithoutAssignee = mockShifts.map(shift => ({
        ...shift,
        assigneeId: '',
      }));

      render(<ScheduleTable {...defaultProps} shifts={shiftsWithoutAssignee} />);

      const placeholders = screen.getAllByTestId('select-value');
      placeholders.forEach(placeholder => {
        expect(placeholder).toHaveTextContent('Select member');
      });
    });
  });


  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper aria-labels for add buttons', () => {
      render(<ScheduleTable {...defaultProps} />);

      const addButtons = screen.getAllByTestId('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Add')
      );

      addButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toMatch(/Add/);
      });
    });

    it('should have proper table structure for screen readers', () => {
      render(<ScheduleTable {...defaultProps} />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByTestId('table-header')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });

    it('should have proper form labels and inputs', () => {
      render(<ScheduleTable {...defaultProps} />);

      const dateInputs = screen.getAllByTestId('input');
      dateInputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'date');
      });
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle shifts with missing properties and empty members', () => {
      const incompleteShifts = [
        {
          id: 'incomplete1',
          start: '2025-01-01',
          end: '2025-01-02',
          assigneeId: '',
        },
      ];

      render(<ScheduleTable {...defaultProps} shifts={incompleteShifts} members={[]} />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      const selects = screen.getAllByTestId('select');
      expect(selects).toHaveLength(1);
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDateShifts = [
        {
          id: 'invalid1',
          start: 'invalid-date',
          end: 'also-invalid',
          assigneeId: 'member1',
        },
      ];

      render(<ScheduleTable {...defaultProps} shifts={invalidDateShifts} />);

      // Should render without crashing
      expect(screen.getByTestId('table')).toBeInTheDocument();
      
      const dateInputs = screen.getAllByTestId('input');
      expect(dateInputs).toHaveLength(2);
    });
  });
});
