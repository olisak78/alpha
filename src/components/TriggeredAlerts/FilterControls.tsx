import { Button } from '@/components/ui/button';
import { DateRangeCalendar } from '@/components/DateRangeCalendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { memo } from 'react';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';
import { MultiSelect, MultiSelectOption } from '@/components/multi-select';

export interface FilterControlConfig {
  type: 'timeRange' | 'severity' | 'status' | 'landscape' | 'region' | 'component';
  label: string;
  options?: string[];
  selected?: string[];
  onChange?: (values: string[]) => void;
}

interface FilterControlsProps {
  filterConfigs?: FilterControlConfig[];
}

export const FilterControls = memo(function FilterControls({ filterConfigs }: FilterControlsProps) {
  // Get context data if available (for TriggeredAlertsFilters)
  let contextData = null;
  try {
    contextData = useTriggeredAlertsContext();
  } catch {
    // Context not available, will use filterConfigs
  }

  // Use provided configs or build from context
  const configs = filterConfigs || (contextData ? [
    { type: 'timeRange' as const, label: 'Time Range' },
    { type: 'severity' as const, label: 'Severity', options: contextData.options.severities, selected: contextData.filters.selectedSeverity, onChange: contextData.actions.setSelectedSeverity },
    { type: 'status' as const, label: 'Status', options: contextData.options.statuses, selected: contextData.filters.selectedStatus, onChange: contextData.actions.setSelectedStatus },
    { type: 'landscape' as const, label: 'Landscape', options: contextData.options.landscapes, selected: contextData.filters.selectedLandscape, onChange: contextData.actions.setSelectedLandscape },
    { type: 'region' as const, label: 'Region', options: contextData.options.regions, selected: contextData.filters.selectedRegion, onChange: contextData.actions.setSelectedRegion },
    { type: 'component' as const, label: 'Component', options: contextData.options.components, selected: contextData.filters.selectedComponent, onChange: contextData.actions.setSelectedComponent },
  ] : []);

  const renderTimeRangeFilter = () => {
    if (!contextData) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Time Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {contextData.filters.startDate && contextData.filters.endDate ? (
                <>
                  {format(new Date(contextData.filters.startDate), "dd/MM/yyyy")} - {format(new Date(contextData.filters.endDate), "dd/MM/yyyy")}
                </>
              ) : (
                <span className="text-muted-foreground">Select dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangeCalendar
              mode="range"
              defaultMonth={contextData.filters.startDate ? new Date(contextData.filters.startDate) : new Date()}
              selected={{
                from: contextData.filters.startDate ? new Date(contextData.filters.startDate) : undefined,
                to: contextData.filters.endDate ? new Date(contextData.filters.endDate) : undefined,
              }}
              onSelect={contextData.actions.handleDateRangeSelect}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderMultiSelectFilter = (config: FilterControlConfig) => {
    if (!config.options || config.options.length === 0) return null;
    
    return (
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">{config.label}</label>
        <MultiSelect
          options={config.options.map((option): MultiSelectOption => ({
            label: option,
            value: option
          }))}
          selected={config.selected || []}
          onChange={config.onChange || (() => {})}
          placeholder={`Select ${config.label.toLowerCase()}...`}
        />
      </div>
    );
  };

  // Separate time range from other filters
  const hasTimeRange = configs.some(c => c.type === 'timeRange');
  const otherConfigs = configs.filter(c => c.type !== 'timeRange');
  
  // Split other configs into pairs for 2-column layout
  const configPairs: FilterControlConfig[][] = [];
  for (let i = 0; i < otherConfigs.length; i += 2) {
    configPairs.push(otherConfigs.slice(i, i + 2));
  }

  return (
    <div className="space-y-4">
      {/* Time Range Row */}
      {hasTimeRange && (
        <div className="grid grid-cols-1 gap-4">
          {renderTimeRangeFilter()}
        </div>
      )}

      {/* Other Filters in Pairs */}
      {configPairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pair.map((config) => (
            <div key={config.type}>
              {renderMultiSelectFilter(config)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
