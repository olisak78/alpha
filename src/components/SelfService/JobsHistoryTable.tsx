import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, CheckCircle2, XCircle, Loader2, Clock, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
 * JobsHistoryTable Component
 * 
 * Displays a collapsible table of Jenkins job execution history
 * with pagination, refresh capabilities, and toggle between "My Jobs" and "All Jobs"
 */
export default function JobsHistoryTable() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Load onlyMine state from localStorage, default to true (Only My Jobs)
  const [onlyMine, setOnlyMine] = useState<boolean>(() => {
    const stored = localStorage.getItem('jobsHistory_onlyMine');
    return stored === null ? true : stored === 'true';
  });

  // Persist onlyMine state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobsHistory_onlyMine', String(onlyMine));
  }, [onlyMine]);

  // Reset to page 1 when toggling between "Only My Jobs" and "All Jobs"
  useEffect(() => {
    setCurrentPage(1);
  }, [onlyMine]);
  
  const offset = (currentPage - 1) * itemsPerPage;
  const { data, isLoading, refetch, isFetching } = useJenkinsJobHistory(itemsPerPage, offset, onlyMine);

  /**
   * Get current user email from authentication
   * This should be replaced with actual auth context/state
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

  const totalPages = data ? Math.ceil(data.total / itemsPerPage) : 0;

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
                {onlyMine ? 'My Latest Executions' : 'Latest Executions'}
              </h2>
            </Button>
            {data && (
              <Badge variant="secondary" className="text-xs">
                {data.total}
              </Badge>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Click to {isCollapsed ? 'expand' : 'collapse'}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Toggle between "Only My Jobs" and "All Jobs" */}
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
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
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
                    {data.jobs.map((job: JenkinsJobHistoryItem) => (
                      <TableRow 
                        key={job.id} 
                        className={`hover:bg-muted/30 ${
                          isMyJob(job) 
                            ? 'bg-blue-50 dark:bg-blue-950/20' 
                            : ''
                        }`}
                      >
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={data.total}
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