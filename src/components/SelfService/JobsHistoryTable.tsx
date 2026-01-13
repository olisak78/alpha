import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, CheckCircle2, XCircle, Loader2, Clock, StopCircle, Calendar, Search, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/TablePagination";
import { useJenkinsJobHistory } from "@/hooks/api/useJenkinsJobHistory";
import type { JenkinsJobHistoryItem } from "@/services/SelfServiceApi";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Time period options for job history filtering
 */
type TimePeriod = 'last24h' | 'last48h' | 'thisWeek' | 'thisMonth';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  hours: number | (() => number);
}

/**
 * Calculate hours since the start of Sunday (week start)
 */
const getHoursSinceSundayStart = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate start of Sunday
  const sundayStart = new Date(now);
  sundayStart.setDate(now.getDate() - dayOfWeek);
  sundayStart.setHours(0, 0, 0, 0);
  
  // Calculate hours difference
  const diffMs = now.getTime() - sundayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/**
 * Calculate hours since the start of the current month (1st day at 00:00)
 */
const getHoursSinceMonthStart = (): number => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  
  // Calculate hours difference
  const diffMs = now.getTime() - monthStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/**
 * Time period options configuration
 */
const TIME_PERIODS: TimePeriodOption[] = [
  { value: 'last24h', label: 'Last 24 hours', hours: 24 },
  { value: 'last48h', label: 'Last 48 hours', hours: 48 },
  { value: 'thisWeek', label: 'This week', hours: getHoursSinceSundayStart },
  { value: 'thisMonth', label: 'This month', hours: getHoursSinceMonthStart },
];

/**
 * Get hours value for a time period
 */
const getHoursForPeriod = (period: TimePeriod): number => {
  const option = TIME_PERIODS.find(p => p.value === period);
  if (!option) return 48; // Default fallback
  
  return typeof option.hours === 'function' ? option.hours() : option.hours;
};

/**
 * Custom hook for debounced value
 */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Format a date string to a readable format
 */
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return dateString;
  }
};

/**
 * Check if a parameter value is empty/null and should be filtered out
 */
const isEmptyParameter = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length === 0) return true;
    if (Object.keys(value).length === 0) return true;
  }
  return false;
};

/**
 * Component to display job parameters in a nice format
 */
const ParametersDisplay = ({ parameters }: { parameters: Record<string, any> }) => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return <span className="text-sm text-muted-foreground italic">No parameters</span>;
  }

  // Filter out empty/null parameters
  const filteredParameters = Object.entries(parameters).filter(([_, value]) => !isEmptyParameter(value));

  if (filteredParameters.length === 0) {
    return <span className="text-sm text-muted-foreground italic">No parameters</span>;
  }

  return (
    <div className="space-y-2">
      {filteredParameters.map(([key, value]) => (
        <div key={key} className="flex gap-3 text-sm">
          <span className="font-medium text-foreground min-w-[140px] break-words">{key}:</span>
          <span className="text-muted-foreground break-all flex-1">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Expanded row content component
 */
const ExpandedRowContent = ({ job }: { job: JenkinsJobHistoryItem }) => {
  return (
    <div className="bg-muted/30 border-t border-b">
      <div className="px-6 py-4 space-y-4">
        {/* Top row - JAAS Name and Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">JAAS Name</Label>
            <p className="text-sm font-mono mt-1">{job.jaasName || '-'}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Result</Label>
            <p className="text-sm font-mono mt-1">{job.result || '-'}</p>
          </div>
        </div>

        {/* Timestamps row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Started at</Label>
            <p className="text-sm mt-1">{formatDateTime(job.createdAt)}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Ended at</Label>
            <p className="text-sm mt-1">{formatDateTime(job.completedAt)}</p>
          </div>
        </div>

        {/* Parameters section - full width */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Parameters</Label>
          <div className="bg-card rounded-md border p-4 max-h-[300px] overflow-y-auto">
            <ParametersDisplay parameters={job.parameters} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * JobsHistoryTable Component
 * 
 * Displays a collapsible table of Jenkins job execution history
 * with pagination, refresh capabilities, toggle between "My Jobs" and "All Jobs",
 * time period filtering, search functionality, and expandable rows
 */
interface JobsHistoryTableProps {
  filteredService?: {
    jobName: string;
    serviceTitle: string;
  } | null;
  onClearFilter?: () => void;
}

export default function JobsHistoryTable({ filteredService, onClearFilter }: JobsHistoryTableProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // When filtering by service, always use onlyMine=false
  // Otherwise load from localStorage
  const [onlyMine, setOnlyMine] = useState<boolean>(() => {
    if (filteredService) return false; // Always show all users when filtered
    const stored = localStorage.getItem('jobsHistory_onlyMine');
    return stored === null ? true : stored === 'true';
  });

  // Load time period from localStorage, default to 'last48h'
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const stored = localStorage.getItem('jobsHistory_timePeriod');
    return (stored as TimePeriod) || 'last48h';
  });

  // Persist onlyMine state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobsHistory_onlyMine', String(onlyMine));
  }, [onlyMine]);

  // Persist time period to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobsHistory_timePeriod', timePeriod);
  }, [timePeriod]);

  // When filteredService changes, force onlyMine to false and reset page
  useEffect(() => {
    if (filteredService) {
      setOnlyMine(false);
      setCurrentPage(1);
    }
  }, [filteredService]);

  // Reset to page 1 when toggling between "Only My Jobs" and "All Jobs"
  useEffect(() => {
    setCurrentPage(1);
  }, [onlyMine]);

  // Reset to page 1 when changing time period
  useEffect(() => {
    setCurrentPage(1);
  }, [timePeriod]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);
  
  const offset = (currentPage - 1) * itemsPerPage;
  const lastUpdatedHours = getHoursForPeriod(timePeriod);
  const { data, isLoading, refetch, isFetching } = useJenkinsJobHistory(
    itemsPerPage, 
    offset, 
    onlyMine,
    lastUpdatedHours
  );

  /**
   * Get current user email from authentication
   */
  const getCurrentUserEmail = (): string => {
     const { user } = useAuth();
     return user?.email || '';
  };

  /**
   * Check if a job was triggered by the current user
   */
  const isMyJob = (job: JenkinsJobHistoryItem): boolean => {
    if (onlyMine) return false; // Don't highlight in "Only My Jobs" mode
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail || !job.triggeredBy) return false;
    
    // Case-insensitive comparison
    return job.triggeredBy.toLowerCase() === currentUserEmail.toLowerCase();
  };

  /**
   * Toggle row expansion
   */
  const toggleRowExpansion = (jobId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  /**
   * Check if a row is expanded
   */
  const isRowExpanded = (jobId: string): boolean => {
    return expandedRows.has(jobId);
  };

  /**
   * Filter jobs based on selected service and search term
   * 1. First filter by service jobName if filteredService is set
   * 2. Then apply search term filter
   */
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];
    
    let jobs = data.jobs;

    // First, filter by service if one is selected
    if (filteredService) {
      jobs = jobs.filter((job) => job.jobName === filteredService.jobName);
    }

    // Then apply search filter
    if (!debouncedSearchTerm.trim()) return jobs;

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    return jobs.filter((job) => {
      const jobName = job.jobName?.toLowerCase() || '';
      const triggeredBy = job.triggeredBy?.toLowerCase() || '';
      const status = job.status?.toLowerCase() || '';
      const buildNumber = job.buildNumber?.toString() || '';
      
      return (
        jobName.includes(searchLower) ||
        triggeredBy.includes(searchLower) ||
        status.includes(searchLower) ||
        buildNumber.includes(searchLower)
      );
    });
  }, [data?.jobs, debouncedSearchTerm, filteredService]);

  /**
   * Paginate filtered jobs
   */
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalFilteredItems = filteredJobs.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  /**
   * Get the label for the currently selected time period
   */
  const getCurrentPeriodLabel = (): string => {
    const option = TIME_PERIODS.find(p => p.value === timePeriod);
    return option?.label || 'Last 48 hours';
  };

  /**
   * Get status badge styling based on job status
   */
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'success':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0">
            Success
          </Badge>
        );
      case 'failure':
      case 'failed':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">
            Running
          </Badge>
        );
      case 'queued':
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
            Queued
          </Badge>
        );
      case 'aborted':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
            Aborted
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  /**
   * Format duration in milliseconds to human-readable format
   */
  const formatDuration = (durationMs: number): string => {
    if (!durationMs) return '-';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Calculate time ago from lastPolledAt timestamp
   */
  const getTimeAgo = (lastPolledAt: string): string => {
    if (!lastPolledAt) return '-';
    
    const now = new Date();
    const polledTime = new Date(lastPolledAt);
    const diffMs = now.getTime() - polledTime.getTime();
    
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ago`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card className="mt-8 mb-12 bg-card">
      <CardHeader className="border-b">
        <div className="space-y-4">
          {/* First Row - Title and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
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
              {data && (
                <Badge variant="secondary" className="text-xs">
                  {debouncedSearchTerm ? `${totalFilteredItems} / ${data.total}` : (filteredService ? totalFilteredItems : data.total)}
                </Badge>
              )}
              {filteredService && (
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
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Click to {isCollapsed ? 'expand' : 'collapse'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Period Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    {getCurrentPeriodLabel()}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {TIME_PERIODS.map((period) => (
                    <DropdownMenuItem
                      key={period.value}
                      onClick={() => handleTimePeriodChange(period.value)}
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
                    onCheckedChange={(checked) => setOnlyMine(!checked)}
                  />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
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
                onChange={handleSearchChange}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading executions...</div>
            </div>
          ) : !data || data.jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">No executions found</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-sm font-medium text-foreground">No jobs match your search</div>
              <div className="text-xs text-muted-foreground">
                Try adjusting your search term or <button onClick={handleClearSearch} className="text-primary hover:underline">clear the search</button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead>Job Name</TableHead>
                      {!onlyMine && (
                        <TableHead className="w-[180px]">Triggered By</TableHead>
                      )}
                      <TableHead className="w-[100px]">Build</TableHead>
                      <TableHead className="w-[150px]">Last Updated</TableHead>
                      <TableHead className="w-[120px]">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job: JenkinsJobHistoryItem) => (
                      <>
                        <TableRow 
                          key={job.id} 
                          className={`hover:bg-muted/30 ${
                            isMyJob(job) 
                              ? 'bg-blue-50 dark:bg-blue-950/20' 
                              : ''
                          }`}
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(job.id)}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  isRowExpanded(job.id) ? 'rotate-90' : ''
                                }`}
                              />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {job.status?.toLowerCase() === 'success' && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {(job.status?.toLowerCase() === 'failure' || job.status?.toLowerCase() === 'failed') && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {job.status?.toLowerCase() === 'running' && (
                                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                              )}
                              {(job.status?.toLowerCase() === 'queued' || job.status?.toLowerCase() === 'pending') && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              {job.status?.toLowerCase() === 'aborted' && (
                                <StopCircle className="h-4 w-4 text-orange-500" />
                              )}
                              {getStatusBadge(job.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{job.jobName}</span>
                              <span className="text-xs text-muted-foreground">
                                Build #{job.buildNumber} • {job.buildNumber ? `${job.buildNumber}m ago` : getTimeAgo(job.lastPolledAt)}
                              </span>
                            </div>
                          </TableCell>
                          {!onlyMine && (
                            <TableCell className="text-sm">
                              <span className={isMyJob(job) ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}>
                                {job.triggeredBy || '-'}
                              </span>
                            </TableCell>
                          )}
                          <TableCell>
                            {job.buildUrl ? (
                              <a
                                href={job.buildUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                #{job.buildNumber}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span>#{job.buildNumber}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {getTimeAgo(job.lastPolledAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDuration(job.duration)}
                          </TableCell>
                        </TableRow>
                        {isRowExpanded(job.id) && (
                          <TableRow key={`${job.id}-expanded`}>
                            <TableCell colSpan={onlyMine ? 6 : 7} className="p-0">
                              <ExpandedRowContent job={job} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalFilteredItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}