// Concourse job data types

export interface ConcourseJob {
  key: string;
  domain: string;
  landscape: string;
  pipeline: string;
  name: string;
  build: string;
  paused: string;
  status: string;
  start_time: number;
  end_time: number;
  duration: string;
  message: string;
  commit: string;
  dateTime: string;
}

export interface ConcourseJobsByLandscape {
  [landscape: string]: ConcourseJob[];
}

export interface ConcourseLatestExecutionResponse {
  buildNumber: number;
}

export interface ConcourseJobsResponse extends ConcourseJobsByLandscape {}

// Pipeline types
export type PipelineType = 'landscape-update-pipeline' | 'landscape-monitoring-pipeline';

// Job status types
export type JobStatus = 'succeeded' | 'failed' | 'running' | 'paused' | 'aborted';

// Section types for grouping jobs
export type JobSection = 'deploy' | 'validate' | 'monitor';

// Helper function to determine section based on pipeline and job name
export function getJobSection(pipeline: string, jobName: string): JobSection {
  if (pipeline.includes('monitoring')) {
    return 'monitor';
  }

  if (jobName.includes('validate') || jobName.includes('test') || jobName.includes('check')) {
    return 'validate';
  }

  return 'deploy';
}

// Helper function to get status badge color
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();

  if (statusLower === 'succeeded') {
    return 'bg-green-500/10 text-green-600 dark:text-green-400';
  }

  if (statusLower === 'failed') {
    return 'bg-red-500/10 text-red-600 dark:text-red-400';
  }

  if (statusLower === 'running') {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  if (statusLower === 'paused') {
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
  }

  return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
}
