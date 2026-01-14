import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { LucideIcon } from 'lucide-react';

interface FilterItem {
  key: string;
  label: string;
  onRemove: () => void;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  isExclusion?: boolean;
}

interface AppliedFiltersProps {
  filters: FilterItem[];
  onClearAllFilters: () => void;
  className?: string;
}

// Legacy props interface for backward compatibility
interface LegacyAppliedFiltersProps {
  searchTerm: string;
  selectedSeverity: string;
  selectedLandscape: string;
  selectedRegion: string;
  selectedComponent: string;
  startDate: string;
  endDate: string;
  onRemoveSearchTerm: () => void;
  onRemoveSeverity: () => void;
  onRemoveLandscape: () => void;
  onRemoveRegion: () => void;
  onRemoveComponent: () => void;
  onRemoveDateRange: () => void;
  onClearAllFilters: () => void;
}

// Type guard to check if props are legacy format
function isLegacyProps(props: any): props is LegacyAppliedFiltersProps {
  return 'searchTerm' in props || 'selectedSeverity' in props;
}

export function AppliedFilters(props: AppliedFiltersProps | LegacyAppliedFiltersProps) {
  let appliedFilters: FilterItem[];
  let onClearAllFilters: () => void;
  let className: string | undefined;

  if (isLegacyProps(props)) {
    // Legacy implementation for backward compatibility
    const {
      searchTerm,
      selectedSeverity,
      selectedLandscape,
      selectedRegion,
      selectedComponent,
      startDate,
      endDate,
      onRemoveSearchTerm,
      onRemoveSeverity,
      onRemoveLandscape,
      onRemoveRegion,
      onRemoveComponent,
      onRemoveDateRange,
      onClearAllFilters: clearAll,
    } = props;

    appliedFilters = [];
    onClearAllFilters = clearAll;

    // Search term filter
    if (searchTerm) {
      appliedFilters.push({
        key: 'search',
        label: `Search: "${searchTerm}"`,
        onRemove: onRemoveSearchTerm,
      });
    }

    // Severity filter
    if (selectedSeverity && selectedSeverity !== 'all') {
      appliedFilters.push({
        key: 'severity',
        label: `Severity: ${selectedSeverity}`,
        onRemove: onRemoveSeverity,
      });
    }


    // Landscape filter
    if (selectedLandscape && selectedLandscape !== 'all') {
      appliedFilters.push({
        key: 'landscape',
        label: `Landscape: ${selectedLandscape}`,
        onRemove: onRemoveLandscape,
      });
    }

    // Region filter
    if (selectedRegion && selectedRegion !== 'all') {
      appliedFilters.push({
        key: 'region',
        label: `Region: ${selectedRegion}`,
        onRemove: onRemoveRegion,
      });
    }

    // Component filter
    if (selectedComponent && selectedComponent !== 'all') {
      appliedFilters.push({
        key: 'component',
        label: `Component: ${selectedComponent}`,
        onRemove: onRemoveComponent,
      });
    }

    // Date range filter
    if (startDate || endDate) {
      let dateLabel = 'Date: ';
      if (startDate && endDate) {
        dateLabel += `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      } else if (startDate) {
        dateLabel += `From ${format(new Date(startDate), 'dd/MM/yyyy')}`;
      } else if (endDate) {
        dateLabel += `Until ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      }

      appliedFilters.push({
        key: 'dateRange',
        label: dateLabel,
        onRemove: onRemoveDateRange,
        icon: Calendar,
      });
    }
  } else {
    // New generic implementation
    appliedFilters = props.filters;
    onClearAllFilters = props.onClearAllFilters;
    className = props.className;
  }

  // Don't render anything if no filters are applied
  if (appliedFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      {appliedFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className={`flex items-center gap-1 pr-1 text-xs flex-shrink-0 ${
            filter.isExclusion 
              ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' 
              : ''
          }`}
        >
          {filter.icon && <filter.icon className="h-3 w-3" />}
          <span>{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
            onClick={filter.onRemove}
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {appliedFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={onClearAllFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
