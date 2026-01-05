import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter } from 'lucide-react';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';
import { FilterControls } from './FilterControls';
import { AppliedFilters } from '@/components/AppliedFilters';

export function TriggeredAlertsFilters() {
  const { filters, actions, appliedFilters } = useTriggeredAlertsContext();

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search - Always visible */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={filters.searchTerm}
              onChange={(e) => actions.setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Filters Popup */}
        <div className="flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[800px] p-4" align="start">
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
