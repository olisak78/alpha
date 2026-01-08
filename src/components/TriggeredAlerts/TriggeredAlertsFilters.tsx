import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter } from 'lucide-react';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';
import { FilterControls } from './FilterControls';
import { AppliedFilters } from '@/components/AppliedFilters';
import { SearchInput } from './SearchInput';

export function TriggeredAlertsFilters() {
  const { actions, appliedFilters } = useTriggeredAlertsContext();

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search - Always visible */}
        <SearchInput placeholder="Search alerts..." />

        {/* Filters Popup */}
        <div className="flex-shrink-0">
          <Popover modal={false}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[800px] p-4" align="start" side="bottom" sideOffset={4}>
              <FilterControls />
            </PopoverContent>
          </Popover>
        </div>

        {/* Applied Filters as Badges - inline */}
        <AppliedFilters
          filters={appliedFilters}
          onClearAllFilters={actions.resetFilters}
        />
      </div>
    </div>
  );
}
