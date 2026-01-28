import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableSort, type SortDirection } from '../../src/hooks/useTableSort';

describe('useTableSort', () => {
  const mockData = [
    { id: 1, name: 'Alice', age: 30, score: 85 },
    { id: 2, name: 'Bob', age: 25, score: 92 },
    { id: 3, name: 'Charlie', age: 35, score: 78 },
  ];

  const mockSortFn = vi.fn((items, field, direction) => {
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no sorting applied and return original data', () => {
    const { result } = renderHook(() => 
      useTableSort({ data: mockData, sortFn: mockSortFn })
    );

    expect(result.current.sortState).toEqual({
      field: null,
      direction: 'asc'
    });
    expect(result.current.sortedData).toBe(mockData);
    expect(mockSortFn).not.toHaveBeenCalled();
  });

  it('should handle sort state transitions correctly', () => {
    const { result } = renderHook(() => 
      useTableSort({ data: mockData, sortFn: mockSortFn })
    );

    // First click: asc
    act(() => {
      result.current.handleSort('name');
    });
    expect(result.current.sortState).toEqual({ field: 'name', direction: 'asc' });

    // Second click: desc
    act(() => {
      result.current.handleSort('name');
    });
    expect(result.current.sortState).toEqual({ field: 'name', direction: 'desc' });

    // Third click: back to asc
    act(() => {
      result.current.handleSort('name');
    });
    expect(result.current.sortState).toEqual({ field: 'name', direction: 'asc' });

    // Switch field: resets to asc
    act(() => {
      result.current.handleSort('age');
    });
    expect(result.current.sortState).toEqual({ field: 'age', direction: 'asc' });
  });

  it('should call sortFn and return sorted data correctly', () => {
    const sortedMockData = [mockData[0], mockData[2], mockData[1]];
    mockSortFn.mockReturnValue(sortedMockData);

    const { result } = renderHook(() => 
      useTableSort({ data: mockData, sortFn: mockSortFn })
    );

    act(() => {
      result.current.handleSort('name');
    });

    expect(mockSortFn).toHaveBeenCalledWith(mockData, 'name', 'asc');
    expect(result.current.sortedData).toEqual(sortedMockData);
  });

  it('should recalculate when data changes and maintain memoization', () => {
    const newData = [{ id: 4, name: 'David', age: 28, score: 88 }];
    
    const { result, rerender } = renderHook(
      ({ data }) => useTableSort({ data, sortFn: mockSortFn }),
      { initialProps: { data: mockData } }
    );

    act(() => {
      result.current.handleSort('name');
    });

    const firstHandleSort = result.current.handleSort;
    const firstSortedData = result.current.sortedData;
    mockSortFn.mockClear();

    // Test memoization - no change
    rerender({ data: mockData });
    expect(result.current.handleSort).toBe(firstHandleSort);
    expect(result.current.sortedData).toBe(firstSortedData);
    expect(mockSortFn).not.toHaveBeenCalled();

    // Test data change
    rerender({ data: newData });
    expect(mockSortFn).toHaveBeenCalledWith(newData, 'name', 'asc');
  });

  it('should handle edge cases gracefully', () => {
    // Empty data
    const { result: emptyResult } = renderHook(() => 
      useTableSort({ data: [], sortFn: mockSortFn })
    );
    expect(emptyResult.current.sortedData).toEqual([]);

    // Data with null values
    const dataWithNulls = [
      { id: 1, name: 'Alice', value: null },
      { id: 2, name: null, value: 10 },
    ];
    const { result: nullResult } = renderHook(() => 
      useTableSort({ data: dataWithNulls, sortFn: mockSortFn })
    );

    act(() => {
      nullResult.current.handleSort('name');
    });
    expect(mockSortFn).toHaveBeenCalledWith(dataWithNulls, 'name', 'asc');
  });
});
