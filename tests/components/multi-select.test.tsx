import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MultiSelect, MultiSelectWithBadges } from '../../src/components/multi-select';
import type { MultiSelectOption } from '../../src/components/multi-select';

// Mock UI components
vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      data-testid="multi-select-button"
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onChange, className, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
      data-testid="multi-select-checkbox"
      {...props}
    />
  ),
}));

vi.mock('../../src/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverContent: ({ children, className }: any) => (
    <div data-testid="popover-content" className={className}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
}));

vi.mock('../../src/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children }: any) => <div data-testid="command-group">{children}</div>,
  CommandInput: ({ placeholder }: any) => (
    <input data-testid="command-input" placeholder={placeholder} />
  ),
  CommandItem: ({ children, onSelect, className }: any) => (
    <div 
      data-testid="command-item" 
      onClick={onSelect}
      className={className}
    >
      {children}
    </div>
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon">✓</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">▼</div>,
  X: () => <div data-testid="x-icon">✕</div>,
}));

// Mock utils
vi.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('MultiSelect', () => {
  const mockOptions: MultiSelectOption[] = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default placeholder', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Select items...')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          placeholder="Choose options..."
        />
      );

      expect(screen.getByText('Choose options...')).toBeInTheDocument();
    });

    it('should display selected items correctly', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={['option1', 'option2']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('option1, option2')).toBeInTheDocument();
    });

    it('should display truncated text with "more" indicator when maxDisplay is exceeded', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={['option1', 'option2', 'option3']}
          onChange={mockOnChange}
          maxDisplay={2}
        />
      );

      expect(screen.getByText('option1, option2 +1 more')).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    it('should handle selection and deselection of items', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelect
          options={mockOptions}
          selected={['option1']}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByTestId('multi-select-button');
      await user.click(button);

      const commandItems = screen.getAllByTestId('command-item');
      
      // Test selection of new item
      await user.click(commandItems[1]);
      expect(mockOnChange).toHaveBeenCalledWith(['option1', 'option2']);
      
      // Test deselection of existing item
      await user.click(commandItems[0]);
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('UI Components Integration', () => {
    it('should render checkboxes for each option with correct state', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={['option1']}
          onChange={mockOnChange}
        />
      );

      const checkboxes = screen.getAllByTestId('multi-select-checkbox');
      expect(checkboxes).toHaveLength(3);
      
      // First checkbox should be checked
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });
  });

  describe('Props and Configuration', () => {
    it('should apply custom className and handle disabled state', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          className="custom-class"
          disabled={true}
        />
      );

      const button = screen.getByTestId('multi-select-button');
      expect(button).toHaveClass('custom-class');
      expect(button).toBeDisabled();
    });

    it('should respect maxDisplay prop', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={['option1', 'option2', 'option3']}
          onChange={mockOnChange}
          maxDisplay={1}
        />
      );

      expect(screen.getByText('option1 +2 more')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(
        <MultiSelect
          options={[]}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Select items...')).toBeInTheDocument();
      expect(screen.getByText('No options found.')).toBeInTheDocument();
    });

    it('should handle selected values not in options and duplicates', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={['nonexistent', 'option1', 'option1']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('nonexistent, option1, option1')).toBeInTheDocument();
    });

    it('should handle non-array selected prop gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelect
          options={mockOptions}
          selected={null as any}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByTestId('multi-select-button');
      await user.click(button);

      const commandItems = screen.getAllByTestId('command-item');
      await user.click(commandItems[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['option1']);
    });
  });
});

describe('MultiSelectWithBadges', () => {
  const mockOptions: MultiSelectOption[] = [
    { label: 'Tag 1', value: 'tag1' },
    { label: 'Tag 2', value: 'tag2' },
    { label: 'Tag 3', value: 'tag3' },
  ];

  const mockOnChange = vi.fn();
  const mockOnRemoveBadge = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Badge Display', () => {
    it('should render badges for selected items', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1', 'tag2']}
          onChange={mockOnChange}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('Tag 1');
      expect(badges[1]).toHaveTextContent('Tag 2');
    });

    it('should not render badges when showBadges is false', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1', 'tag2']}
          onChange={mockOnChange}
          showBadges={false}
        />
      );

      const badges = screen.queryAllByTestId('badge');
      expect(badges).toHaveLength(0);
    });

    it('should not render badges when no items are selected', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const badges = screen.queryAllByTestId('badge');
      expect(badges).toHaveLength(0);
    });
  });

  describe('Badge Removal', () => {
    it('should remove badge when X button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1', 'tag2']}
          onChange={mockOnChange}
          onRemoveBadge={mockOnRemoveBadge}
        />
      );

      const xIcons = screen.getAllByTestId('x-icon');
      await user.click(xIcons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['tag2']);
      expect(mockOnRemoveBadge).toHaveBeenCalledWith('tag1');
    });

    it('should handle badge removal with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1']}
          onChange={mockOnChange}
        />
      );

      const xIcon = screen.getByTestId('x-icon');
      const button = xIcon.closest('button');
      
      if (button) {
        button.focus();
        await user.keyboard('{Enter}');
        expect(mockOnChange).toHaveBeenCalledWith([]);
      }
    });

    it('should handle badge removal without onRemoveBadge callback', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1', 'tag2']}
          onChange={mockOnChange}
        />
      );

      const xIcons = screen.getAllByTestId('x-icon');
      await user.click(xIcons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['tag2']);
    });
  });

  describe('Badge Labels', () => {
    it('should display option labels in badges', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1', 'tag2']}
          onChange={mockOnChange}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('Tag 1');
      expect(badges[1]).toHaveTextContent('Tag 2');
    });

    it('should fallback to value when option not found', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['nonexistent']}
          onChange={mockOnChange}
        />
      );

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('nonexistent');
    });
  });

  describe('Integration with MultiSelect', () => {
    it('should handle selection changes from MultiSelect', async () => {
      const user = userEvent.setup();
      
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1']}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByTestId('multi-select-button');
      await user.click(button);

      const commandItems = screen.getAllByTestId('command-item');
      await user.click(commandItems[1]); // Select tag2

      expect(mockOnChange).toHaveBeenCalledWith(['tag1', 'tag2']);
    });
  });


  describe('Accessibility', () => {
    it('should have proper button attributes for badge removal', () => {
      render(
        <MultiSelectWithBadges
          options={mockOptions}
          selected={['tag1']}
          onChange={mockOnChange}
        />
      );

      const xIcon = screen.getByTestId('x-icon');
      const button = xIcon.closest('button');
      
      expect(button).toHaveClass('ring-offset-background', 'rounded-full', 'outline-none');
    });
  });
});
