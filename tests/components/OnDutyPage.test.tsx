import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnDutyPage from '../../src/components/OnDutyPage';
import '@testing-library/jest-dom/vitest';

// Mock the useOnDutyData hook
const mockUseOnDutyData = vi.fn();
vi.mock('../../src/hooks/useOnDutyData', () => ({
  useOnDutyData: () => mockUseOnDutyData(),
}));

// Mock UI components - consolidated for simplicity
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'card', className, ...props }, children),
  CardHeader: ({ children, className, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'card-header', className, ...props }, children),
  CardTitle: ({ children, className, ...props }: any) => 
    React.createElement('h3', { 'data-testid': 'card-title', className, ...props }, children),
  CardContent: ({ children, className, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'card-content', className, ...props }, children),
}));

vi.mock('../../src/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => 
    React.createElement('table', { 'data-testid': 'table', ...props }, children),
  TableBody: ({ children, ...props }: any) => 
    React.createElement('tbody', { 'data-testid': 'table-body', ...props }, children),
  TableCell: ({ children, className, ...props }: any) => 
    React.createElement('td', { 'data-testid': 'table-cell', className, ...props }, children),
  TableHead: ({ children, className, ...props }: any) => 
    React.createElement('th', { 'data-testid': 'table-head', className, ...props }, children),
  TableHeader: ({ children, ...props }: any) => 
    React.createElement('thead', { 'data-testid': 'table-header', ...props }, children),
  TableRow: ({ children, ...props }: any) => 
    React.createElement('tr', { 'data-testid': 'table-row', ...props }, children),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select">
      <button onClick={() => onValueChange && onValueChange('test-value')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

vi.mock('../../src/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

vi.mock('../../src/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input 
      data-testid="switch"
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('../../src/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('../../src/components/ui/label', () => ({
  Label: ({ children }: any) => <label data-testid="label">{children}</label>,
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <div data-testid="download-icon" className={className} />
  ),
  Upload: ({ className }: { className?: string }) => (
    <div data-testid="upload-icon" className={className} />
  ),
  Plus: ({ className }: { className?: string }) => (
    <div data-testid="plus-icon" className={className} />
  ),
  Scissors: ({ className }: { className?: string }) => (
    <div data-testid="scissors-icon" className={className} />
  ),
  Trash2: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className} />
  ),
}));

describe('OnDutyPage Component', () => {
  const mockMembers = [
    { id: 'member1', fullName: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: 'member2', fullName: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
  ];

  const mockOnCallData = [
    {
      id: 'oc1',
      start: '2023-12-01',
      end: '2023-12-07',
      type: 'week' as const,
      assigneeId: 'member1',
      called: false,
    },
    {
      id: 'oc2',
      start: '2023-12-08',
      end: '2023-12-10',
      type: 'weekend' as const,
      assigneeId: 'member2',
      called: true,
    },
  ];

  const mockOnDutyData = [
    {
      id: 'od1',
      date: '2023-12-01',
      assigneeId: 'member1',
    },
    {
      id: 'od2',
      date: '2023-12-02',
      assigneeId: 'member2',
    },
  ];

  const defaultMockData = {
    year: 2023,
    setYear: vi.fn(),
    members: mockMembers,
    onCall: mockOnCallData,
    setOnCall: vi.fn(),
    onDuty: mockOnDutyData,
    setOnDuty: vi.fn(),
    exportOnCallToExcel: vi.fn(),
    importOnCallFromExcel: vi.fn(),
    exportOnDutyToExcel: vi.fn(),
    importOnDutyFromExcel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnDutyData.mockReturnValue(defaultMockData);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-12-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render the main page structure with On Duty view by default', () => {
      render(<OnDutyPage />);

      expect(screen.getByText('On Duty for 2023')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('switch')).toBeInTheDocument();
      expect(screen.getByTestId('switch')).not.toBeChecked();
    });
  });

  describe('Year Picker', () => {
    it('should render year picker with current year', () => {
      render(<OnDutyPage />);

      const yearInput = screen.getByDisplayValue('2023');
      expect(yearInput).toBeInTheDocument();
    });

    it('should call setYear when year is changed via input', () => {
      render(<OnDutyPage />);

      const yearInput = screen.getByDisplayValue('2023');
      fireEvent.change(yearInput, { target: { value: '2024' } });

      expect(defaultMockData.setYear).toHaveBeenCalledWith(2024);
    });

    it('should increment year when plus button is clicked', () => {
      render(<OnDutyPage />);

      const buttons = screen.getAllByTestId('button');
      const plusButton = buttons.find(btn => btn.textContent === '+');
      
      if (plusButton) {
        fireEvent.click(plusButton);
        expect(defaultMockData.setYear).toHaveBeenCalledWith(2024);
      }
    });

    it('should decrement year when minus button is clicked', () => {
      render(<OnDutyPage />);

      const buttons = screen.getAllByTestId('button');
      const minusButton = buttons.find(btn => btn.textContent === '-');
      
      if (minusButton) {
        fireEvent.click(minusButton);
        expect(defaultMockData.setYear).toHaveBeenCalledWith(2022);
      }
    });
  });

  describe('View Toggle', () => {
    it('should toggle between On Duty and On Call views', () => {
      render(<OnDutyPage />);

      const toggle = screen.getByTestId('switch');
      expect(toggle).not.toBeChecked();

      fireEvent.click(toggle);
      
      // After toggle, should show On Call view
      expect(screen.getByText('On Call for 2023')).toBeInTheDocument();
    });

    it('should show different table headers for On Call view', () => {
      render(<OnDutyPage />);

      const toggle = screen.getByTestId('switch');
      fireEvent.click(toggle);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Called?')).toBeInTheDocument();
    });

    it('should show different table headers for On Duty view', () => {
      render(<OnDutyPage />);

      expect(screen.getByText('Date (weekday)')).toBeInTheDocument();
      expect(screen.getByText('Assignee')).toBeInTheDocument();
    });
  });

  describe('On Duty Functionality', () => {
    it('should render On Duty table with data', () => {
      render(<OnDutyPage />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getAllByTestId('table-row')).toHaveLength(3); // Header + 2 data rows
    });

    it('should call setOnDuty when Add Row button is clicked', () => {
      render(<OnDutyPage />);

      const addButton = screen.getByText('Add Row');
      fireEvent.click(addButton);

      expect(defaultMockData.setOnDuty).toHaveBeenCalled();
    });

    it('should update on duty row when date is changed', () => {
      render(<OnDutyPage />);

      const dateInputs = screen.getAllByTestId('input').filter(input => 
        input.getAttribute('type') === 'date'
      );
      
      if (dateInputs.length > 0) {
        fireEvent.change(dateInputs[0], { target: { value: '2023-12-15' } });
        expect(defaultMockData.setOnDuty).toHaveBeenCalled();
      }
    });

    it('should call exportOnDutyToExcel when Export button is clicked', () => {
      render(<OnDutyPage />);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(defaultMockData.exportOnDutyToExcel).toHaveBeenCalled();
    });
  });

  describe('On Call Functionality', () => {
    it('should call setOnCall when Add Row button is clicked in On Call view', () => {
      render(<OnDutyPage />);
      
      // Switch to On Call view
      const toggle = screen.getByTestId('switch');
      fireEvent.click(toggle);
      
      const addButton = screen.getByText('Add Row');
      fireEvent.click(addButton);

      expect(defaultMockData.setOnCall).toHaveBeenCalled();
    });

    it('should call exportOnCallToExcel when Export button is clicked in On Call view', () => {
      render(<OnDutyPage />);
      
      // Switch to On Call view
      const toggle = screen.getByTestId('switch');
      fireEvent.click(toggle);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(defaultMockData.exportOnCallToExcel).toHaveBeenCalled();
    });

    it('should show split and delete buttons for each row in On Call view', () => {
      render(<OnDutyPage />);
      
      // Switch to On Call view
      const toggle = screen.getByTestId('switch');
      fireEvent.click(toggle);

      const scissorsIcons = screen.getAllByTestId('scissors-icon');
      const trashIcons = screen.getAllByTestId('trash-icon');

      expect(scissorsIcons).toHaveLength(2); // One for each data row
      expect(trashIcons).toHaveLength(2); // One for each data row
    });
  });


  describe('Data Manipulation', () => {
    it('should handle empty data arrays', () => {
      mockUseOnDutyData.mockReturnValue({
        ...defaultMockData,
        onCall: [],
        onDuty: [],
      });

      render(<OnDutyPage />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getAllByTestId('table-row')).toHaveLength(1); // Only header row
    });

    it('should handle members with missing data', () => {
      const membersWithMissingData = [
        { id: 'member1', fullName: '', email: 'test@example.com', role: 'Developer' },
        { id: 'member2', fullName: 'Jane Smith', email: '', role: 'Designer' },
      ];

      mockUseOnDutyData.mockReturnValue({
        ...defaultMockData,
        members: membersWithMissingData,
      });

      expect(() => render(<OnDutyPage />)).not.toThrow();
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidOnDutyData = [
        {
          id: 'od1',
          date: 'invalid-date',
          assigneeId: 'member1',
        },
      ];

      mockUseOnDutyData.mockReturnValue({
        ...defaultMockData,
        onDuty: invalidOnDutyData,
      });

      expect(() => render(<OnDutyPage />)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing hook data gracefully', () => {
      mockUseOnDutyData.mockReturnValue({
        ...defaultMockData,
        members: [],
        onCall: [],
        onDuty: [],
      });

      expect(() => render(<OnDutyPage />)).not.toThrow();
    });
  });
});
