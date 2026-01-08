import { useState, useCallback, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string | null;
  direction: SortDirection;
}

interface UseTableSortProps<T> {
  data: T[];
  sortFn: (items: T[], field: string, direction: SortDirection) => T[];
}

export function useTableSort<T>({ data, sortFn }: UseTableSortProps<T>) {
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: 'asc' });

  const handleSort = useCallback((field: string) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.field) return data;
    return sortFn(data, sortState.field, sortState.direction);
  }, [data, sortState, sortFn]);

  return {
    sortState,
    handleSort,
    sortedData,
  };
}
