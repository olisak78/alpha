import React, { useState, useEffect, useMemo } from "react";
import { ExternalLink, CheckCircle2, XCircle, Loader2, Clock, StopCircle, Search, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ExpandedRowContent } from "./ExpandedRowContent";
import { StatusBadge } from "./StatusBadge";
import { JobsHistoryTableHeader } from "./JobsHistoryTableHeader";
import {
  TIME_PERIODS,
  getHoursForPeriod,
  formatDuration,
  getTimeAgo,
  type TimePeriod
} from "@/utils/selfServiceUtils";
import type { CustomDateRange } from "./DateRangePicker";

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
 * Calculate hours between two dates
 */
const getHoursBetweenDates = (startDate: Date, endDate: Date = new Date()): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/**
 * Check if a job's lastPolledAt falls within a date range
 */
const isJobInDateRange = (job: JenkinsJobHistoryItem, range: CustomDateRange): boolean => {
  if (!range.from) return true;

  const jobDate = new Date(job.lastPolledAt);
  const startDate = new Date(range.from);
  startDate.setHours(0, 0, 0, 0);

  if (!range.to) {
    // Only start date specified - include all jobs from that date onwards
    return jobDate >= startDate;
  }

  const endDate = new Date(range.to);
  endDate.setHours(23, 59, 59, 999);

  return jobDate >= startDate && jobDate <= endDate;
};

interface JobsHistoryTableProps {
  filteredService?: {
    jobName: string;
    serviceTitle: string;
  } | null;
  onClearFilter?: () => void;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
}

export default function JobsHistoryTable({
  filteredService,
  onClearFilter,
  timePeriod: controlledTimePeriod,
  onTimePeriodChange
}: JobsHistoryTableProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  // State for accumulating all jobs when filtering by service
  const [allAccumulatedJobs, setAllAccumulatedJobs] = useState<JenkinsJobHistoryItem[]>([]);
  const [isFetchingAllPages, setIsFetchingAllPages] = useState(false);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Custom date range state
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>(() => {
    const stored = localStorage.getItem('jobsHistory_customDateRange');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          from: parsed.from ? new Date(parsed.from) : undefined,
          to: parsed.to ? new Date(parsed.to) : undefined,
        };
      } catch {
        return { from: undefined, to: undefined };
      }
    }
    return { from: undefined, to: undefined };
  });

  // When filtering by service, always use onlyMine=false
  // Otherwise load from localStorage
  const [onlyMine, setOnlyMine] = useState<boolean>(() => {
    if (filteredService) return false; // Always show all users when filtered
    const stored = localStorage.getItem('jobsHistory_onlyMine');
    return stored === null ? true : stored === 'true';
  });

  // Time period state - use controlled prop if provided, otherwise manage internally
  const [internalTimePeriod, setInternalTimePeriod] = useState<TimePeriod>(() => {
    const stored = localStorage.getItem('jobsHistory_timePeriod');
    return (stored as TimePeriod) || 'last48h';
  });

  // Use controlled time period if provided, otherwise use internal state
  const timePeriod = controlledTimePeriod !== undefined ? controlledTimePeriod : internalTimePeriod;

  // Check if custom date range is active
  const hasCustomDateRange = !!(customDateRange.from);

  // Persist onlyMine state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobsHistory_onlyMine', String(onlyMine));
  }, [onlyMine]);

  // Persist time period to localStorage when using internal state
  useEffect(() => {
    if (controlledTimePeriod === undefined) {
      localStorage.setItem('jobsHistory_timePeriod', internalTimePeriod);
    }
  }, [internalTimePeriod, controlledTimePeriod]);

  // Persist custom date range to localStorage
  useEffect(() => {
    if (customDateRange.from || customDateRange.to) {
      localStorage.setItem('jobsHistory_customDateRange', JSON.stringify({
        from: customDateRange.from?.toISOString(),
        to: customDateRange.to?.toISOString(),
      }));
    } else {
      localStorage.removeItem('jobsHistory_customDateRange');
    }
  }, [customDateRange]);

  // When filteredService changes, force onlyMine to false and reset page
  // This ensures we see all users' jobs for the selected service
  useEffect(() => {
    if (filteredService) {
      setOnlyMine(false);
      setCurrentPage(1);
      setAllAccumulatedJobs([]); // Clear accumulated jobs
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

  // Reset to page 1 when custom date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [customDateRange.from, customDateRange.to]);

  const offset = (currentPage - 1) * itemsPerPage;

  // Calculate hours for API call based on custom date range or predefined period
  const lastUpdatedHours = useMemo(() => {
    if (hasCustomDateRange && customDateRange.from) {
      // Calculate hours from custom start date to now (or end date)
      const endDate = customDateRange.to || new Date();
      return getHoursBetweenDates(customDateRange.from, endDate);
    }
    return getHoursForPeriod(timePeriod);
  }, [hasCustomDateRange, customDateRange.from, customDateRange.to, timePeriod]);

  /**
   * When filtering by service, we need to fetch ALL jobs from backend
   * Backend caps responses at 10 jobs per request, so we make normal request first
   */
  const effectiveLimit = itemsPerPage; // Always use 10
  const effectiveOffset = offset; // Use normal pagination

  const { data, isLoading, refetch, isFetching } = useJenkinsJobHistory(
    effectiveLimit,
    effectiveOffset,
    onlyMine,
    lastUpdatedHours
  );

  /**
   * When filtering by service, fetch ALL pages from backend
   * Backend returns max 10 per request, so we need to paginate through all results
   */
  useEffect(() => {
    if (!filteredService || !data) return;

    const fetchAllPages = async () => {
      setIsFetchingAllPages(true);
      const accumulated: JenkinsJobHistoryItem[] = [];
      let currentOffset = 0;
      const pageSize = 10; // Backend caps at 10

      try {
        // Keep fetching pages until we have all jobs
        while (true) {
          // Import the API function dynamically
          const { fetchJenkinsJobHistory } = await import('@/services/SelfServiceApi');

          const pageData = await fetchJenkinsJobHistory(
            pageSize,
            currentOffset,
            false, // Always fetch all users when filtering by service
            lastUpdatedHours
          );

          accumulated.push(...pageData.jobs);

          // Stop if we've fetched all jobs
          if (accumulated.length >= pageData.total) {
            break;
          }

          // Stop if last page returned fewer jobs than requested
          if (pageData.jobs.length < pageSize) {
            break;
          }

          currentOffset += pageSize;

          // Safety: don't fetch more than 100 pages (1000 jobs)
          if (currentOffset >= 1000) {
            break;
          }
        }

        setAllAccumulatedJobs(accumulated);
      } catch (error) {
        setAllAccumulatedJobs([]);
      } finally {
        setIsFetchingAllPages(false);
      }
    };

    fetchAllPages();
  }, [filteredService, data, lastUpdatedHours]);

  // Get current user at the top level of the component (hooks must be called at top level)
  const { user } = useAuth();
  const currentUserEmail = user?.email || '';

  /**
   * Check if a job was triggered by the current user
   */
  const isMyJob = (job: JenkinsJobHistoryItem): boolean => {
    if (onlyMine) return false; // Don't highlight in "Only My Jobs" mode
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
   * Determine which jobs to use for filtering
   * If we have accumulated jobs (service filter active), use those
   * Otherwise use normal paginated data
   */
  const jobsToFilter = filteredService && allAccumulatedJobs.length > 0
    ? allAccumulatedJobs
    : (data?.jobs || []);

  const filteredJobs = useMemo(() => {
    let jobs = jobsToFilter;

    // First apply service filter if active
    if (filteredService) {
      jobs = jobs.filter((job) => job.jobName === filteredService.jobName);
    }

    // Then apply custom date range filter if active
    if (hasCustomDateRange) {
      jobs = jobs.filter((job) => isJobInDateRange(job, customDateRange));
    }

    // Then apply search filter
    if (!debouncedSearchTerm.trim()) {
      return jobs;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();

    const searchFiltered = jobs.filter((job) => {
      const jobName = job.jobName?.toLowerCase() || '';
      const triggeredByName = job.metadata?.name?.toLowerCase() || '';
      const status = job.status?.toLowerCase() || '';
      const buildNumber = job.buildNumber?.toString() || '';

      return (
        jobName.includes(searchLower) ||
        triggeredByName.includes(searchLower) ||
        status.includes(searchLower) ||
        buildNumber.includes(searchLower)
      );
    });

    return searchFiltered;
  }, [jobsToFilter, debouncedSearchTerm, filteredService, hasCustomDateRange, customDateRange, allAccumulatedJobs.length]);

  /**
   * Determine if we're using client-side filtering
   * If search, service filter, custom date range, or time period filter is active, we need to show filtered count
   * Otherwise, use server-side total
   */
  const hasClientSideFiltering = !!(debouncedSearchTerm || filteredService || hasCustomDateRange);

  /**
   * Calculate pagination based on whether we're filtering client-side or not
   */
  const paginationStats = useMemo(() => {

    if (hasClientSideFiltering) {
      // Client-side filtering: use filtered count
      const totalItems = filteredJobs.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return { totalItems, totalPages };
    } else {
      // Server-side pagination: use API total
      const totalItems = data?.total || 0;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return { totalItems, totalPages };
    }
  }, [hasClientSideFiltering, filteredJobs.length, data?.total, itemsPerPage]);

  /**
   * Paginate filtered jobs (only for client-side filtering)
   * For server-side pagination, display all items from current page
   */
  const paginatedJobs = useMemo(() => {

    if (hasClientSideFiltering) {
      // Client-side: paginate the filtered results
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = filteredJobs.slice(startIndex, endIndex);
      return paginated;
    } else {
      // Server-side: show all jobs from API (already paginated by server)
      return filteredJobs;
    }
  }, [hasClientSideFiltering, filteredJobs, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    setAllAccumulatedJobs([]); // Clear cache
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    // When selecting a predefined period, clear custom date range
    setCustomDateRange({ from: undefined, to: undefined });

    if (onTimePeriodChange) {
      // Controlled mode - notify parent
      onTimePeriodChange(period);
    } else {
      // Uncontrolled mode - update internal state
      setInternalTimePeriod(period);
    }
  };

  const handleCustomDateRangeChange = (range: CustomDateRange) => {
    setCustomDateRange(range);
    // Don't clear the predefined time period - it will just be ignored when custom range is active
  };

  const handleClearCustomDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
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

  // Show loading indicator while fetching all pages
  const effectiveIsLoading = isLoading || isFetchingAllPages;

  return (
    <Card className="mt-8 mb-12 bg-card">
      <JobsHistoryTableHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        filteredService={filteredService}
        onClearFilter={onClearFilter}
        totalJobs={data?.total || 0}
        totalFilteredItems={paginationStats.totalItems}
        hasSearchTerm={!!debouncedSearchTerm}
        onlyMine={onlyMine}
        onToggleOnlyMine={setOnlyMine}
        timePeriod={timePeriod}
        onTimePeriodChange={handleTimePeriodChange}
        currentPeriodLabel={getCurrentPeriodLabel()}
        onRefresh={handleRefresh}
        isRefreshing={isFetching || isFetchingAllPages}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={handleClearSearch}
        customDateRange={customDateRange}
        onCustomDateRangeChange={handleCustomDateRangeChange}
        onClearCustomDateRange={handleClearCustomDateRange}
        hasCustomDateRange={hasCustomDateRange}
      />

      {!isCollapsed && (
        <CardContent className="p-0">
          {effectiveIsLoading ? (
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
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job: JenkinsJobHistoryItem) => (
                      <React.Fragment key={job.id}>
                        <TableRow
                          className={`hover:bg-muted/30 ${isMyJob(job)
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
                                className={`h-4 w-4 transition-transform ${isRowExpanded(job.id) ? 'rotate-90' : ''
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
                              <StatusBadge status={job.status} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {job.baseJobUrl ? (
                                <a
                                  href={job.baseJobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                >
                                  {job.jobName}
                                </a>
                              ) : (
                                <span className="font-medium">{job.jobName}</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Build #{job.buildNumber} • {getTimeAgo(job.lastPolledAt)}
                              </span>
                            </div>
                          </TableCell>
                          {!onlyMine && (
                            <TableCell className="text-sm">
                              <span className={isMyJob(job) ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}>
                                {job.metadata?.name || 'unknown'}
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
                          <TableCell>
                            {job.buildUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`${job.buildUrl}rebuild/parameterized`, '_blank')}
                                className="h-8 gap-2"
                                title="Rebuild this job"
                              >
                                <RotateCw className="h-4 w-4" />
                                Rebuild
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isRowExpanded(job.id) && (
                          <TableRow key={`${job.id}-expanded`}>
                            <TableCell colSpan={onlyMine ? 6 : 7} className="p-0">
                              <ExpandedRowContent job={job} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {paginationStats.totalPages > 1 && (
                <div className="p-4 border-t">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={paginationStats.totalPages}
                    totalItems={paginationStats.totalItems}
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