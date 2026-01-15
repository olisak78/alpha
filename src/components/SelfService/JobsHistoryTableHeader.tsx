import { ChevronDown, ChevronUp, RefreshCw, Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TIME_PERIODS, type TimePeriod } from "@/utils/selfServiceUtils";
import { DateRangePicker, type CustomDateRange } from "./DateRangePicker";


interface JobsHistoryTableHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  filteredService: {
    jobName: string;
    serviceTitle: string;
  } | null;
  onClearFilter?: () => void;
  totalJobs: number;
  totalFilteredItems: number;
  hasSearchTerm: boolean;
  onlyMine: boolean;
  onToggleOnlyMine: (value: boolean) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  currentPeriodLabel: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  customDateRange: CustomDateRange;
  onCustomDateRangeChange: (range: CustomDateRange) => void;
  onClearCustomDateRange: () => void;
  hasCustomDateRange: boolean;
}

export const JobsHistoryTableHeader = ({
  isCollapsed,
  onToggleCollapse,
  filteredService,
  onClearFilter,
  totalJobs,
  totalFilteredItems,
  hasSearchTerm,
  onlyMine,
  onToggleOnlyMine,
  timePeriod,
  onTimePeriodChange,
  currentPeriodLabel,
  onRefresh,
  isRefreshing,
  searchTerm,
  onSearchChange,
  onClearSearch,
  customDateRange,
  onCustomDateRangeChange,
  onClearCustomDateRange,
  hasCustomDateRange,
}: JobsHistoryTableHeaderProps) => {
  return (
    <CardHeader className="border-b">
      <div className="space-y-4">
        {/* First Row - Title and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="flex items-center gap-2"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              <h2 className="text-lg font-semibold">
                {filteredService 
                  ? `All executions for: ${filteredService.serviceTitle}`
                  : (onlyMine ? 'My Latest Executions' : 'Latest Executions')
                }
              </h2>
            </Button>
            {totalJobs > 0 && (
              <Badge variant="secondary" className="text-xs">
                {hasSearchTerm || hasCustomDateRange ? `${totalFilteredItems} / ${totalJobs}` : (filteredService ? totalFilteredItems : totalJobs)}
              </Badge>
            )}
            {filteredService && onClearFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilter}
                className="gap-2"
              >
                <X className="h-3 w-3" />
                Back to All Jobs
              </Button>
            )}
            {!filteredService && (
              <button
                onClick={onToggleCollapse}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Click to {isCollapsed ? 'expand' : 'collapse'}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Custom Date Range Picker */}
            <DateRangePicker
              value={customDateRange}
              onChange={onCustomDateRangeChange}
              onClear={onClearCustomDateRange}
            />

            {/* Time Period Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={hasCustomDateRange ? "outline" : "default"}
                  size="sm"
                  className="gap-2"
                  disabled={hasCustomDateRange}
                >
                  <Calendar className="h-4 w-4" />
                  {currentPeriodLabel}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TIME_PERIODS.map((period) => (
                  <DropdownMenuItem
                    key={period.value}
                    onClick={() => onTimePeriodChange(period.value)}
                    className={timePeriod === period.value ? 'bg-accent' : ''}
                  >
                    {period.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle between "Only My Jobs" and "All Jobs" - Disabled when filtering by service */}
            {!filteredService && (
              <div className="flex items-center gap-2">
                <Label htmlFor="only-mine-toggle" className="text-sm text-muted-foreground cursor-pointer">
                  {onlyMine ? 'Only My Jobs' : 'All Jobs'}
                </Label>
                <Switch
                  id="only-mine-toggle"
                  checked={!onlyMine}
                  onCheckedChange={(checked) => onToggleOnlyMine(!checked)}
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Second Row - Search Bar */}
        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by job name, user, status, or build number..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </CardHeader>
  );
};