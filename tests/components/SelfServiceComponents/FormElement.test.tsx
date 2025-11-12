import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormElement } from '../../../src/components/SelfService/FormElement';

describe('FormElement', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Core Functionality', () => {
    it('renders and handles text input interaction', () => {
      const textElement = {
        id: 'test-text',
        type: 'text',
        title: 'Test Text Field',
        description: 'This is a test text field',
        placeholder: 'Enter text here'
      };

      render(<FormElement element={textElement} value="initial value" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Test Text Field')).toBeInTheDocument();
      expect(screen.getByText('This is a test text field')).toBeInTheDocument();
      expect(screen.getByDisplayValue('initial value')).toBeInTheDocument();

      const textInput = screen.getByPlaceholderText('Enter text here');
      fireEvent.change(textInput, { target: { value: 'new value' } });
      expect(mockOnChange).toHaveBeenCalledWith('new value');
    });

    it('renders and handles select element interaction', () => {
      const selectElement = {
        id: 'test-select',
        type: 'select',
        title: 'Test Select Field',
        description: 'Choose an option',
        options: [
          { id: 'option1', value: 'value1', label: 'Option 1' },
          { id: 'option2', value: 'value2', label: 'Option 2' }
        ]
      };

      render(<FormElement element={selectElement} value="" onChange={mockOnChange} />);
      
      expect(screen.getByText('Test Select Field')).toBeInTheDocument();
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders and handles checkbox interaction', () => {
      const checkboxElement = {
        id: 'test-checkbox',
        type: 'checkbox',
        title: 'Test Checkbox'
      };

      render(<FormElement element={checkboxElement} value={true} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText('Test Checkbox')).toBeInTheDocument();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('renders and handles radio group interaction', () => {
      const radioElement = {
        id: 'test-radio',
        type: 'radio',
        title: 'Test Radio Group',
        options: [
          { id: 'radio1', value: 'value1', label: 'Radio Option 1' },
          { id: 'radio2', value: 'value2', label: 'Radio Option 2' }
        ]
      };

      render(<FormElement element={radioElement} value="" onChange={mockOnChange} />);
      
      expect(screen.getByText('Test Radio Group')).toBeInTheDocument();
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(2);

      fireEvent.click(screen.getByLabelText('Radio Option 1'));
      expect(mockOnChange).toHaveBeenCalledWith('value1');
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('handles unsupported element types and null values', () => {
      const unsupportedElement = {
        id: 'test-unsupported',
        type: 'unsupported-type',
        title: 'Unsupported Element'
      };

      render(<FormElement element={unsupportedElement} value={null} onChange={mockOnChange} />);
      
      // Should fall back to text input for unsupported types and handle null values
      expect(screen.getByLabelText('Unsupported Element')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles elements with missing properties and default values', () => {
      // Test element without id/title and with default values
      const elementWithDefaults = {
        name: 'test-name',
        type: 'text',
        defaultParameterValue: { value: 'param-default' },
        defaultValue: { value: 'regular-default' }
      };

      render(<FormElement element={elementWithDefaults} value={undefined} onChange={mockOnChange} />);
      
      // Should use name as fallback for both id and title, prioritize defaultParameterValue
      expect(screen.getByLabelText('test-name')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'test-name');
      expect(input).toHaveValue('param-default');
    });

    it('handles empty options and radio default selection', () => {
      // Test radio with defaultValue selection
      const radioWithDefault = {
        id: 'test-radio-default',
        type: 'radio',
        title: 'Radio with Default',
        defaultValue: { id: 'radio2' },
        options: [
          { id: 'radio1', value: 'value1', label: 'Option 1' },
          { id: 'radio2', value: 'value2', label: 'Option 2' }
        ]
      };

      const { unmount } = render(<FormElement element={radioWithDefault} value={undefined} onChange={mockOnChange} />);
      expect(screen.getByLabelText('Option 2')).toBeChecked();
      
      unmount();

      // Test elements with empty options
      const emptySelect = {
        id: 'test-select',
        type: 'select',
        title: 'Empty Select',
        options: []
      };

      render(<FormElement element={emptySelect} value="" onChange={mockOnChange} />);
      expect(screen.getByText('Empty Select')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
