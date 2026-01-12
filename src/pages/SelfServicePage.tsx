import { useState, useEffect } from "react";
import SelfServiceBlockDialog from "@/components/SelfService/SelfServiceBlockDialog";
import ExecutionHistoryPanel from "@/components/SelfService/ExecutionHistoryPanel";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { toast } from "@/components/ui/use-toast";
import { useFetchJenkinsJobParameters } from "@/hooks/api/useSelfService";
import { useTriggerJenkinsJob } from "@/hooks/api/mutations/useSelfServiceMutations";
import { fetchAndPopulateDynamicSteps } from "@/services/SelfServiceApi";
import { selfServiceBlocks, type SelfServiceDialog } from "@/data/self-service/selfServiceBlocks";
import { Wrench } from "lucide-react";
import JobsHistoryTable from '@/components/SelfService/JobsHistoryTable';
import { useJenkinsJobHistory } from '@/hooks/api/useJenkinsJobHistory';

export default function SelfServicePage() {
  const [activeBlock, setActiveBlock] = useState<SelfServiceDialog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [staticJobData, setStaticJobData] = useState<any>(null);

  // Execution History Panel State
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [selectedJobForHistory, setSelectedJobForHistory] = useState<{
    jobName: string;
    serviceTitle: string;
  } | null>(null);

  // Fetch job history for calculating counts
  const { data: jobHistory } = useJenkinsJobHistory(10, 0);

  const jenkinsQuery = useFetchJenkinsJobParameters(
    staticJobData?.jenkinsJob?.jaasName || "",
    staticJobData?.jenkinsJob?.jobName || "",
    {
      enabled: activeBlock?.dialogType === 'dynamic' && activeBlock?.dataFilePath && isOpen && !!staticJobData?.jenkinsJob
    }
  );

  const triggerMutation = useTriggerJenkinsJob();

  // Calculate history count for a specific service/job
  const getServiceHistoryCount = (jobName?: string): number => {
    if (!jobName || !jobHistory) return 0;
    return jobHistory.jobs.filter(job => job.jobName === jobName).length;
  };

  // Handle history button click - open the execution history panel
  const handleHistoryClick = (block: SelfServiceDialog) => {
    const jobName = block.jenkinsJob?.jobName;

    if (!jobName) {
      toast({
        title: "Error",
        description: "Job name not configured for this service",
        variant: "destructive"
      });
      return;
    }

    setSelectedJobForHistory({
      jobName: jobName,
      serviceTitle: block.title
    });
    setHistoryPanelOpen(true);
  };

  // Close history panel
  const closeHistoryPanel = () => {
    setHistoryPanelOpen(false);
    setSelectedJobForHistory(null);
  };

  const loadStaticData = async (path: string) => {
    try {
      const publicPath = path.startsWith('/') ? path.substring(1) : path;
      const response = await fetch(`/${publicPath}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive"
      });
      return null;
    }
  };

  const openDialog = async (block: SelfServiceDialog) => {
    setActiveBlock(block);
    setIsOpen(true);

    if (block.dataFilePath) {
      const staticData = await loadStaticData(block.dataFilePath);
      if (staticData) {
        setStaticJobData(staticData);

        if (staticData.jenkinsJob) {
          const hasDynamicSteps = staticData.steps?.some((step: any) => step.isDynamic);

          if (hasDynamicSteps) {
            try {
              const { jaasName, jobName } = staticData.jenkinsJob;
              const populatedData = await fetchAndPopulateDynamicSteps(
                jaasName,
                jobName,
                staticData.steps
              );

              setStaticJobData({
                ...staticData,
                steps: populatedData.steps
              });

              const allParams: any[] = [];
              populatedData.steps.forEach((step: any) => {
                if (step.fields) {
                  allParams.push(...step.fields);
                }
              });

              if (allParams.length > 0) {
                setFormData(getDefaults(allParams));
              }
            } catch (error) {
              console.error('Failed to load dynamic steps:', error);
              toast({
                title: "Error",
                description: "Failed to load dynamic configuration",
                variant: "destructive"
              });
            }
          } else {
            const allParams: any[] = [];
            (staticData.steps || []).forEach((step: any) => {
              if (step.fields) {
                allParams.push(...step.fields);
              }
            });

            if (allParams.length > 0) {
              setFormData(getDefaults(allParams));
            }
          }
        }
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
    if (jenkinsQuery.data && activeBlock?.dialogType === 'dynamic') {
      const params = jenkinsQuery.data.steps?.[0]?.fields || [];
      if (params.length > 0) {
        setFormData(getDefaults(params));
      }
    }
  }, [jenkinsQuery.data, activeBlock]);

  const getDefaults = (params: any[]) => {
    const defaults: Record<string, any> = {};

    const hiddenTypes = ['WHideParameterDefinition'];

    params.forEach(param => {
      if (hiddenTypes.includes(param.type)) {
        return;
      }

      const key = param.id || param.name;
      const value = param.defaultValue !== undefined ? param.defaultValue : param.value;

      if (key === 'ClusterName' && !value) {
        if (param.description && param.description.includes('$USERID')) {
          toast({
            title: "Note",
            description: "ClusterName must be entered manually.",
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
      // Skip false boolean values
      if (typeof value === 'boolean' && value === false) {
        return acc;
      }
      
      // Handle SLEEP_SECONDS field specially - must be a number, not empty string
      if (key === 'SLEEP_SECONDS') {
        // Convert to number
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        
        // If empty string, NaN, null, undefined, or invalid -> use 0
        if (value === '' || value === null || value === undefined || isNaN(numValue)) {
          acc[key] = 0;
        } else {
          acc[key] = numValue;
        }
        return acc;
      }
      
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    triggerMutation.mutate(
      { jaasName, jobName, parameters: filteredParams },
      {
        onSuccess: (response) => {
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
                historyCount={getServiceHistoryCount(block.jenkinsJob?.jobName)}
                onHistoryClick={() => handleHistoryClick(block)}
              />
            ))}
          </div>
        </div>

        {/* Jobs History Table */}
        <div data-history-table>
          <JobsHistoryTable />
        </div>

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

      {/* Execution History Panel */}
      {selectedJobForHistory && (
        <ExecutionHistoryPanel
          isOpen={historyPanelOpen}
          onClose={closeHistoryPanel}
          jobName={selectedJobForHistory.jobName}
          serviceTitle={selectedJobForHistory.serviceTitle}
        />
      )}
    </BreadcrumbPage>
  );
}