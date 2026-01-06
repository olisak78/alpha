import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocsSearch } from '../../../src/features/docs/components/DocsSearch';
import '@testing-library/jest-dom/vitest';

describe('DocsSearch', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input with placeholder', () => {
    render(<DocsSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search docs...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('should display the provided value', () => {
    render(<DocsSearch {...defaultProps} value="test query" />);
    
    const searchInput = screen.getByDisplayValue('test query');
    expect(searchInput).toBeInTheDocument();
  });

  it('should render search icon', () => {
    render(<DocsSearch {...defaultProps} />);
    
    // Search icon should be present (lucide-react Search component)
    const searchIcon = document.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should call onChange when typing in input', () => {
    const onChange = vi.fn();
    render(<DocsSearch {...defaultProps} onChange={onChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search docs...');
    fireEvent.change(searchInput, { target: { value: 'new search term' } });
    
    expect(onChange).toHaveBeenCalledWith('new search term');
  });

  it('should show clear button when value is not empty', () => {
    render(<DocsSearch {...defaultProps} value="test" />);
    
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    render(<DocsSearch {...defaultProps} value="" />);
    
    const clearButton = screen.queryByRole('button');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should call onChange with empty string when clear button is clicked', () => {
    const onChange = vi.fn();
    render(<DocsSearch {...defaultProps} value="test" onChange={onChange} />);
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should have proper styling classes', () => {
    render(<DocsSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search docs...');
    expect(searchInput).toHaveClass('w-full', 'pl-9', 'pr-9', 'py-2', 'text-sm');
  });

  it('should support dark mode classes', () => {
    render(<DocsSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search docs...');
    expect(searchInput.className).toContain('dark:bg-gray-800');
    expect(searchInput.className).toContain('dark:text-gray-100');
    expect(searchInput.className).toContain('dark:border-gray-700');
  });

  it('should have focus styles', () => {
    render(<DocsSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search docs...');
    expect(searchInput.className).toContain('focus:ring-2');
    expect(searchInput.className).toContain('focus:ring-blue-500');
    expect(searchInput.className).toContain('focus:border-transparent');
  });
});
