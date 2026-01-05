import { ExternalLink, Briefcase, X } from "lucide-react";
import { useJobStatus, useRemoveJobStatus, useClearJobStatus } from "@/hooks/api/useJobStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * JobStatusIndicator Component
 * 
 * A reusable component that displays job status and can be placed anywhere
 * (e.g., in navigation bar, header, or any page)
 * 
 * Features:
 * - Shows count badge when jobs exist
 * - Dropdown menu with job list
 * - Click to view job details
 * - Remove individual jobs
 * - Clear all jobs
 */
export function JobStatusIndicator() {
  const { data: jobs = [], isLoading } = useJobStatus();
  const removeJobMutation = useRemoveJobStatus();
  const clearJobsMutation = useClearJobStatus();

  const handleRemoveJob = (queueItemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeJobMutation.mutate(queueItemId);
  };

  const handleClearAll = () => {
    clearJobsMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500';
      case 'queued':
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'text-green-700';
      case 'failed': return 'text-red-700';
      case 'running': return 'text-blue-700';
      case 'queued':
      case 'pending': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Briefcase className="h-5 w-5" />
          {jobs.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {jobs.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Job Status</span>
          {jobs.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="h-6 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {jobs.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No recent jobs
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {jobs.map((job) => (
              <DropdownMenuItem 
                key={job.queueItemId}
                className="flex items-start gap-2 p-2 cursor-pointer"
                onClick={() => window.open(job.queueUrl, '_blank')}
              >
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${getStatusColor(job.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {job.jobName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 flex-shrink-0"
                      onClick={(e) => handleRemoveJob(job.queueItemId, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      #{job.queueItemId}
                    </span>
                    <span className={`text-xs capitalize ${getStatusTextColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.message && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {job.message}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact version for use in tight spaces
 */
export function JobStatusBadge() {
  const { data: jobs = [] } = useJobStatus();
  
  if (jobs.length === 0) {
    return null;
  }

  const runningJobs = jobs.filter(j => j.status.toLowerCase() === 'running').length;
  const queuedJobs = jobs.filter(j => ['queued', 'pending'].includes(j.status.toLowerCase())).length;
  
  return (
    <div className="flex items-center gap-2">
      {runningJobs > 0 && (
        <Badge variant="default" className="bg-blue-500">
          {runningJobs} Running
        </Badge>
      )}
      {queuedJobs > 0 && (
        <Badge variant="secondary">
          {queuedJobs} Queued
        </Badge>
      )}
    </div>
  );
}