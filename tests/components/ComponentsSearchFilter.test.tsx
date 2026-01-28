import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { ComponentsSearchFilter } from '../../src/components/ComponentsSearchFilter';

describe('ComponentsSearchFilter', () => {
  const defaultProps = {
    searchTerm: '',
    setSearchTerm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input with default placeholder', () => {
    render(<ComponentsSearchFilter {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search components');
    expect(input).toBeInTheDocument();
  });

  it('renders the search input with custom placeholder', () => {
    const customPlaceholder = 'Search custom components';
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        placeholder={customPlaceholder} 
      />
    );
    
    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });

  it('renders the search icon', () => {
    render(<ComponentsSearchFilter {...defaultProps} />);
    
    const icon = document.querySelector('svg.lucide-search');
    expect(icon).toBeInTheDocument();
  });

  it('displays the current search term value', () => {
    const searchTerm = 'test component';
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        searchTerm={searchTerm} 
      />
    );
    
    const input = screen.getByDisplayValue(searchTerm);
    expect(input).toBeInTheDocument();
  });

  it('calls setSearchTerm when input value changes', () => {
    const setSearchTermMock = vi.fn();
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        setSearchTerm={setSearchTermMock} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search components');
    fireEvent.change(input, { target: { value: 'new search term' } });
    
    expect(setSearchTermMock).toHaveBeenCalledWith('new search term');
    expect(setSearchTermMock).toHaveBeenCalledTimes(1);
  });

  it('handles empty string input', () => {
    const setSearchTermMock = vi.fn();
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        searchTerm="existing term"
        setSearchTerm={setSearchTermMock} 
      />
    );
    
    const input = screen.getByDisplayValue('existing term');
    fireEvent.change(input, { target: { value: '' } });
    
    expect(setSearchTermMock).toHaveBeenCalledWith('');
  });

  it('has correct CSS classes applied', () => {
    render(<ComponentsSearchFilter {...defaultProps} />);

    const container = screen.getByPlaceholderText('Search components').parentElement;
    expect(container).toHaveClass('relative', 'flex-shrink', 'min-w-[150px]', 'w-80');

    const input = screen.getByPlaceholderText('Search components');
    expect(input).toHaveClass('pl-10', 'h-9');
  });

  it('maintains focus after typing', () => {
    const setSearchTermMock = vi.fn();
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        setSearchTerm={setSearchTermMock} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search components');
    input.focus();
    fireEvent.change(input, { target: { value: 'focused input' } });
    
    expect(document.activeElement).toBe(input);
  });

  it('handles special characters in search term', () => {
    const setSearchTermMock = vi.fn();
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        setSearchTerm={setSearchTermMock} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search components');
    const specialChars = '!@#$%^&*()';
    fireEvent.change(input, { target: { value: specialChars } });
    
    expect(setSearchTermMock).toHaveBeenCalledWith(specialChars);
  });

  it('handles multiple rapid changes', () => {
    const setSearchTermMock = vi.fn();
    render(
      <ComponentsSearchFilter 
        {...defaultProps} 
        setSearchTerm={setSearchTermMock} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search components');
    
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    
    expect(setSearchTermMock).toHaveBeenCalledTimes(3);
    expect(setSearchTermMock).toHaveBeenNthCalledWith(1, 'a');
    expect(setSearchTermMock).toHaveBeenNthCalledWith(2, 'ab');
    expect(setSearchTermMock).toHaveBeenNthCalledWith(3, 'abc');
  });
});
