import { useState, useEffect } from "react";
import SelfServiceBlockDialog from "@/components/SelfService/SelfServiceBlockDialog";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent} from "@/components/ui/card";
import { useFetchJenkinsJobParameters } from "@/hooks/api/useSelfService";
import { useTriggerJenkinsJob } from "@/hooks/api/mutations/useSelfServiceMutations";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { fetchAndPopulateDynamicSteps } from "@/services/SelfServiceApi";
import { selfServiceBlocks, type SelfServiceDialog } from "@/data/self-service/selfServiceBlocks";
import { Wrench } from "lucide-react";
import { useJobStatus, useAddJobStatus, type Job } from "@/hooks/api/useJobStatus";
import { JobStatusPoller } from "@/components/SelfService/JobStatusPoller";

export default function SelfServicePage() {
  const [activeBlock, setActiveBlock] = useState<SelfServiceDialog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [staticJobData, setStaticJobData] = useState<any>(null);
  const [activeQueuePolls, setActiveQueuePolls] = useState<
    Array<{ jaasName: string; queueItemId: string; jobName: string }>
  >([]);
  const [showJobs, setShowJobs] = useState(true);

  const { data: jobs = [], isLoading: isLoadingJobs } = useJobStatus();
  const addJobMutation = useAddJobStatus();
  const { data: currentUser } = useCurrentUser();

  const jenkinsQuery = useFetchJenkinsJobParameters(
    staticJobData?.jenkinsJob?.jaasName || "",
    staticJobData?.jenkinsJob?.jobName || "",
    {
      enabled: activeBlock?.dialogType === 'dynamic' && activeBlock?.dataFilePath && isOpen && !!staticJobData?.jenkinsJob
    }
  );

  const triggerMutation = useTriggerJenkinsJob();

  // Calculate statistics
  const stats = {
    total: jobs.length,
    success: jobs.filter(j => j.status?.toLowerCase() === 'success').length,
    failed: jobs.filter(j => j.status?.toLowerCase() === 'failed' || j.status?.toLowerCase() === 'aborted').length,
    running: jobs.filter(j => j.status?.toLowerCase() === 'running').length,
    pending: jobs.filter(j => ['queued', 'pending'].includes(j.status?.toLowerCase())).length,
  };

  const loadStaticData = async (path: string) => {
    try {
      const publicPath = path.startsWith('/') ? path.substring(1) : path;
      const response = await fetch(`/${publicPath}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      toast({ title: "Error", description: "Failed to load configuration", variant: "destructive" });
      return null;
    }
  };

  const openDialog = async (block: SelfServiceDialog) => {
    setActiveBlock(block);
    setIsOpen(true);

    if (block.dataFilePath) {
      const data = await loadStaticData(block.dataFilePath);
      setStaticJobData(data);

      if (data?.jenkinsJob && data?.steps?.some((s: any) => s.isDynamic)) {
        const populatedData = await fetchAndPopulateDynamicSteps(
          data.jenkinsJob.jaasName,
          data.jenkinsJob.jobName,
          data.steps
        );
        setStaticJobData({ ...data, steps: populatedData.steps });
      }
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    setActiveBlock(null);
    setFormData({});
    setStaticJobData(null);
  };

  useEffect(() => {
    if (!isOpen || !staticJobData) return;

    const allParams: any[] = [];

    if (activeBlock?.dialogType === 'static' || activeBlock?.dialogType === 'dynamic') {
      if (staticJobData?.steps) {
        staticJobData.steps.forEach((step: any) => {
          if (step.fields) allParams.push(...step.fields);
        });
      } else if (Array.isArray(staticJobData)) {
        allParams.push(...staticJobData);
      }
    }

    if (activeBlock?.dialogType === 'dynamic' && jenkinsQuery.data) {
      jenkinsQuery.data.steps.forEach((step: any) => {
        if (step.fields) allParams.push(...step.fields);
      });
    }

    if (allParams.length > 0) {
      setFormData(getDefaults(allParams));
    }
  }, [isOpen, staticJobData, jenkinsQuery.data, activeBlock]);

  const getDefaults = (params: any[]) => {
    const defaults: Record<string, any> = {};
    params.filter(p => p.type !== "WHideParameterDefinition").forEach(p => {
      const key = p.name || p.id;
      const value = p.defaultParameterValue?.value || p.defaultValue?.value;

      if (key === 'ClusterName') {
        const userId = (currentUser as any)?.iuser || (currentUser as any)?.id || '';
        if (userId) {
          defaults[key] = userId;
        } else if (!currentUser) {
          toast({
            title: "Warning",
            description: "Unable to retrieve user ID. ClusterName must be entered manually.",
            variant: "destructive"
          });
          defaults[key] = '';
        } else {
          defaults[key] = '';
        }
      } else {
        defaults[key] = value || '';
      }
    });

    return defaults;
  };

  const updateForm = (elementId: string, value: any) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
  };

  const submitForm = async () => {
    if (!staticJobData?.jenkinsJob) {
      toast({
        title: "Error",
        description: "Job configuration is missing",
        variant: "destructive"
      });
      return;
    }

    const { jaasName, jobName } = staticJobData.jenkinsJob;

    const filteredParams = Object.entries(formData).reduce((acc, [key, value]) => {
      if (typeof value === 'boolean' && value === false) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    triggerMutation.mutate(
      { jaasName, jobName, parameters: filteredParams },
      {
        onSuccess: (response) => {
          const queueItemId = response.queueItemId || String(Date.now());
          const queueUrl = response.queueUrl || response.buildUrl || `#jenkins-job-${jaasName}-${jobName}-${queueItemId}`;
          const baseJobUrl = response.buildUrl ? response.buildUrl.split('/job/')[0] : `#jenkins-${jaasName}`;

          addJobMutation.mutate({
            status: 'queued',
            message: response.message || 'Job queued successfully',
            queueUrl: queueUrl,
            queueItemId: queueItemId,
            baseJobUrl: baseJobUrl,
            jobName: jobName,
            jaasName: jaasName,
          });

          if (response.queueItemId) {
            setActiveQueuePolls(prev => [
              ...prev,
              { jaasName, queueItemId: response.queueItemId!, jobName }
            ]);
          }

          toast({
            title: "Success",
            description: response.message || `Job queued successfully`
          });
          closeDialog();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed: ${error.message}`,
            variant: "destructive"
          });
        }
      }
    );
  };

  // Get circle border color based on status
  const getCircleColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'border-green-500';
      case 'failed':
      case 'aborted': return 'border-red-500';
      case 'running': return 'border-blue-500';
      case 'queued':
      case 'pending': return 'border-yellow-500';
      default: return 'border-gray-400';
    }
  };

  const calculateDuration = (job: Job) => {
    // For queued/pending jobs, use waitTime from queue status endpoint
    if (['queued', 'pending'].includes(job.status?.toLowerCase()) && job.waitTime !== undefined) {
      const seconds = Math.floor(job.waitTime / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    }

    // For running/aborted/completed jobs, use duration from build status endpoint
    if (['running', 'aborted', 'success', 'failed'].includes(job.status?.toLowerCase()) && job.duration !== undefined) {
      const seconds = Math.floor(job.duration / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    }

    // Fallback: calculate from timestamp
    if (!job.timestamp) return '';
    const seconds = Math.floor((Date.now() - job.timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Get display text for job circle (buildNumber or "Queued")
  const getJobDisplayText = (job: Job) => {
    if (job.status?.toLowerCase() === 'queued' || job.status?.toLowerCase() === 'pending') {
      return 'Queued';
    }

    if (job.queueUrl) {
      const match = job.queueUrl.match(/\/(\d+)\/?$/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return job.status?.substring(0, 3).toUpperCase() || '?';
  };

  return (
    <BreadcrumbPage>
      <div className="space-y-6 px-6 pt-4">
        {/* Page Header */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Self Service</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quick access to automated tools and processes
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Available Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selfServiceBlocks.map((block) => (
              <SelfServiceBlockDialog
                key={block.id}
                block={block}
                isOpen={isOpen && activeBlock?.id === block.id}
                isLoading={jenkinsQuery.isLoading || triggerMutation.isPending}
                formData={formData}
                currentStepIndex={0}
                currentStep={undefined}
                steps={[]}
                jenkinsParameters={jenkinsQuery.data}
                staticJobParameters={staticJobData}
                onOpenDialog={() => openDialog(block)}
                onCloseDialog={closeDialog}
                onFormChange={updateForm}
                onSubmit={submitForm}
                onCancel={closeDialog}
              />
            ))}
          </div>
        </div>

          {/* Circular Job Status Dashboard */}
          {jobs.length > 0 && (
            <div className="mt-12 max-w-4xl mx-auto">
              <Card className="bg-transparent border-none shadow-none">
                {showJobs && (
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4">
                      {jobs.map((job) => {
                        const hasUrl = job.queueUrl && job.queueUrl.trim() !== '' && !job.queueUrl.startsWith('#');
                        const Element = hasUrl ? 'a' : 'div';
                        const elementProps = hasUrl ? {
                          href: job.queueUrl,
                          target: "_blank",
                          rel: "noopener noreferrer"
                        } : {};

                        return (
                          <Element
                            key={job.queueItemId}
                            {...elementProps}
                            className={`
                              group relative flex flex-col items-center justify-center
                              w-20 h-20 rounded-full border-4 bg-card/90 backdrop-blur-sm
                              transition-all duration-300 transform-gpu
                              ${getCircleColor(job.status)}
                              ${hasUrl ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-default opacity-70'}
                            `}
                            title={`${job.jobName} - ${job.status}${job.message ? `: ${job.message}` : ''}`}
                          >
                            {/* Pulsing effect for running jobs */}
                            {job.status?.toLowerCase() === 'running' && (
                              <span className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping" />
                            )}

                            {/* Job Number or Status Text */}
                            <span className="text-sm font-bold leading-none text-center px-1">
                              {job.status?.toLowerCase() !== 'queued' && (
                                <span >#</span>
                              )} {getJobDisplayText(job)}
                            </span>

                            {/* Hover tooltip - appears above the circle */}
                            <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-slate-600 whitespace-nowrap">
                              {job.status}
                            </div>
                          </Element>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
          </div>
        )}

        {/* Empty State */}
        {selfServiceBlocks.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-4">
              <Wrench className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are currently no self-service operations configured. Check back later or contact your administrator.
            </p>
          </div>
        )}
      </div>

      {/* Job Status Pollers - headless components that manage polling */}
      {activeQueuePolls.map((poll) => (
        <JobStatusPoller
          key={poll.queueItemId}
          jaasName={poll.jaasName}
          queueItemId={poll.queueItemId}
          jobName={poll.jobName}
          onComplete={() => {
            setActiveQueuePolls(prev =>
              prev.filter(p => p.queueItemId !== poll.queueItemId)
            );
          }}
        />
      ))}
    </BreadcrumbPage>
  );
}