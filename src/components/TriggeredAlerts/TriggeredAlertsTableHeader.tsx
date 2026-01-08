import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortState } from '@/hooks/useTableSort';

interface Column {
  key: string;
  label: string;
  colSpan: string;
}

interface TriggeredAlertsTableHeaderProps {
  showRegion: boolean;
  sortState: SortState;
  onSort: (field: string) => void;
}

export function TriggeredAlertsTableHeader({ showRegion, sortState, onSort }: TriggeredAlertsTableHeaderProps) {
  const getSortIcon = (field: string) => {
    if (sortState.field !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-foreground" />
      : <ChevronDown className="h-4 w-4 text-foreground" />;
  };

  const columns: Column[] = [
    { key: 'alertname', label: 'Alert Name', colSpan: 'col-span-4' },
    { key: 'severity', label: 'Severity', colSpan: 'col-span-1' },
    { key: 'startsAt', label: 'Start Time', colSpan: 'col-span-1' },
    { key: 'endsAt', label: 'End Time', colSpan: 'col-span-1' },
    { key: 'status', label: 'Status', colSpan: 'col-span-1' },
    { key: 'landscape', label: 'Landscape', colSpan: 'col-span-1' },
  ];

  if (showRegion) {
    columns.push({ key: 'region', label: 'Region', colSpan: 'col-span-1' });
  }

  return (
    <div className={`grid ${showRegion ? 'grid-cols-10' : 'grid-cols-9'} px-4 py-3 border-b bg-muted/30 text-sm font-medium`}>
      {columns.map((column) => (
        <button
          key={column.key}
          className={`${column.colSpan} flex items-center gap-2 text-left hover:text-foreground transition-colors`}
          onClick={() => onSort(column.key)}
        >
          {column.label}
          {getSortIcon(column.key)}
        </button>
      ))}
    </div>
  );
}
