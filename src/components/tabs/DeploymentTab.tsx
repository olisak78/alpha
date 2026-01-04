import { useState, useMemo } from 'react';
import { useConcourse } from '@/hooks/api/useConcourse';
import type { ConcourseJob, JobSection } from '@/types/concourse';
import type { Landscape } from '@/types/developer-portal';
import { getJobSection, getStatusColor } from '@/types/concourse';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeploymentTabProps {
  projectId: string;
  selectedLandscape?: string;
  landscapeData?: Landscape | null;
}

export function DeploymentTab({ projectId, selectedLandscape, landscapeData }: DeploymentTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch deployment jobs with landscape filter
  const { jobs, isLoading, error } = useConcourse({
    landscape: selectedLandscape || 'all',
    enabled: true,
  });

  // Group jobs by section (Deploy, Validate, Monitor)
  const jobsBySection = useMemo(() => {
    const sections: Record<JobSection, ConcourseJob[]> = {
      deploy: [],
      validate: [],
      monitor: [],
    };

    jobs.forEach((job) => {
      const section = getJobSection(job.pipeline, job.name);
      sections[section].push(job);
    });

    return sections;
  }, [jobs]);

  const handleToggleExpand = (jobKey: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobKey)) {
        newSet.delete(jobKey);
      } else {
        newSet.add(jobKey);
      }
      return newSet;
    });
  };

  const handleOpenInDeploymentTool = (job: ConcourseJob) => {
    // Build URL from landscape deployment tool link if available, otherwise fall back to domain
    let deploymentUrl: string;

    if (landscapeData?.concourse) {
      // Use the deployment tool link from landscape links and append the job path
      deploymentUrl = `${landscapeData.concourse}/jobs/${job.name}/builds/${job.build}`;
    } else {
      // Fallback to constructing from domain
      deploymentUrl = `https://${job.domain}/teams/main/pipelines/${job.pipeline}/jobs/${job.name}/builds/${job.build}`;
    }

    window.open(deploymentUrl, '_blank', 'noopener,noreferrer');
  };

  const renderJobsTable = (sectionJobs: ConcourseJob[], sectionTitle: string) => {
    if (sectionJobs.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {sectionTitle.toLowerCase()} jobs found</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-3 border-b bg-muted/30 text-sm font-medium">
          <div className="col-span-4">Job</div>
          <div className="col-span-2">Landscape</div>
          <div className="col-span-1">Last build</div>
          <div className="col-span-2">Result</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Table Body */}
        <div>
          {sectionJobs.map((job) => {
            const jobKey = `${job.landscape}-${job.name}-${job.build}`;
            const isExpanded = expandedRows.has(jobKey);

            return (
              <div key={jobKey}>
                {/* Main Row */}
                <div
                  className="grid grid-cols-12 px-4 py-3 border-b hover:bg-muted/50 text-sm items-center transition-colors cursor-pointer"
                  onClick={() => handleToggleExpand(jobKey)}
                >
                  {/* Job Name with Status Indicator */}
                  <div className="col-span-4 flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0",
                      job.status === 'succeeded' && "bg-green-500",
                      job.status === 'failed' && "bg-red-500",
                      job.status === 'running' && "bg-amber-500 animate-pulse",
                      job.status === 'paused' && "bg-slate-400"
                    )} />
                    <span className="truncate font-medium">{job.name}</span>
                  </div>

                  {/* Landscape */}
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {job.landscape}
                    </Badge>
                  </div>

                  {/* Last Build */}
                  <div className="col-span-1">
                    <span className="text-muted-foreground">#{job.build}</span>
                  </div>

                  {/* Result Badge */}
                  <div className="col-span-2">
                    <Badge className={cn("text-xs capitalize", getStatusColor(job.status))}>
                      {job.status}
                    </Badge>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {job.duration}
                    </Badge>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInDeploymentTool(job);
                      }}
                      title="Open in Deployment Tool"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 py-4 border-b bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Pipeline Info */}
                      <div>
                        <span className="font-medium text-muted-foreground">Pipeline:</span>
                        <span className="ml-2 font-mono">{job.pipeline}</span>
                      </div>

                      {/* Start/End Time */}
                      <div className="text-right">
                        <span className="font-medium text-muted-foreground">Time:</span>
                        <span className="ml-2">{job.dateTime}</span>
                      </div>

                      {/* Paused Status */}
                      {job.paused === 'yes' && (
                        <div className="col-span-1 md:col-span-2">
                          <Badge variant="secondary" className="text-xs">Paused</Badge>
                        </div>
                      )}

                      {/* Commit Message and Link */}
                      {(job.message || job.commit) && (
                        <div className="col-span-1 md:col-span-2 flex items-start justify-between gap-4">
                          {job.message && (
                            <div className="flex-1">
                              <span className="font-medium text-muted-foreground">Message:</span>
                              <span className="ml-2 text-sm">{job.message}</span>
                            </div>
                          )}
                          {job.commit && (
                            <div className="flex-shrink-0">
                              <a
                                href={job.commit}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View commit
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading deployment jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        <AlertTriangle className="h-8 w-8 mr-3" />
        <span>Failed to load deployment jobs: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deploy Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Deploy</h3>
        {renderJobsTable(jobsBySection.deploy, 'Deploy')}
      </div>

      {/* Validate Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Validate</h3>
        {renderJobsTable(jobsBySection.validate, 'Validate')}
      </div>

      {/* Monitor Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Monitor</h3>
        {renderJobsTable(jobsBySection.monitor, 'Monitor')}
      </div>
    </div>
  );
}
