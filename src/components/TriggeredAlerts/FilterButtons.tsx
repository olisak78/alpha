import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';

interface FilterButtonsProps {
  filterType: 'severity' | 'status' | 'landscape' | 'region' | 'component' | 'alertname';
  value: string;
  className?: string;
  // Optional callbacks for custom handling (when not using TriggeredAlertsContext)
  onIncludeFilter?: (filterType: string, value: string) => void;
  onExcludeFilter?: (filterType: string, value: string) => void;
}

export function FilterButtons({ 
  filterType, 
  value, 
  className = '', 
  onIncludeFilter,
  onExcludeFilter
}: FilterButtonsProps) {
  // Try to use context, but don't throw error if not available
  let contextActions, contextFilters;
  try {
    const context = useTriggeredAlertsContext();
    contextActions = context.actions;
    contextFilters = context.filters;
  } catch {
    // Context not available, will use callback props instead
  }

  const handleIncludeFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use custom callback if provided
    if (onIncludeFilter) {
      onIncludeFilter(filterType, value);
      return;
    }
    
    // Use context if available
    if (contextActions && contextFilters) {
      switch (filterType) {
        case 'severity':
          const currentSeverity = contextFilters.selectedSeverity || [];
          if (!currentSeverity.includes(value)) {
            contextActions.setSelectedSeverity([...currentSeverity, value]);
          }
          break;
        case 'status':
          const currentStatus = contextFilters.selectedStatus || [];
          if (!currentStatus.includes(value)) {
            contextActions.setSelectedStatus([...currentStatus, value]);
          }
          break;
        case 'landscape':
          const currentLandscape = contextFilters.selectedLandscape || [];
          if (!currentLandscape.includes(value)) {
            contextActions.setSelectedLandscape([...currentLandscape, value]);
          }
          break;
        case 'region':
          const currentRegion = contextFilters.selectedRegion || [];
          if (!currentRegion.includes(value)) {
            contextActions.setSelectedRegion([...currentRegion, value]);
          }
          break;
        case 'component':
          const currentComponent = contextFilters.selectedComponent || [];
          if (!currentComponent.includes(value)) {
            contextActions.setSelectedComponent([...currentComponent, value]);
          }
          break;
        case 'alertname':
          contextActions.setSearchTerm(value);
          break;
      }
    }
  };

  const handleExcludeFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use custom callback if provided
    if (onExcludeFilter) {
      onExcludeFilter(filterType, value);
      return;
    }
    
    // Use context if available
    if (contextActions) {
      switch (filterType) {
        case 'severity':
          contextActions.addExcludedSeverity(value);
          break;
        case 'status':
          contextActions.addExcludedStatus(value);
          break;
        case 'landscape':
          contextActions.addExcludedLandscape(value);
          break;
        case 'region':
          contextActions.addExcludedRegion(value);
          break;
        case 'component':
          contextActions.addExcludedComponent(value);
          break;
        case 'alertname':
          contextActions.addExcludedAlertname(value);
          break;
      }
    }
  };

  return (
    <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-green-100 hover:text-green-700"
        onClick={ (e)=>handleIncludeFilter(e) }
        title={`Filter by ${filterType}: ${value}`}
      >
        <Plus className="h-2.5 w-2.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-700"
        onClick={ (e)=>handleExcludeFilter(e) }
        title={`Exclude ${filterType}: ${value}`}
      >
        <Minus className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}
