import { useState, useEffect } from "react";
import SelfServiceBlockDialog from "@/components/SelfService/SelfServiceBlockDialog";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { toast } from "@/components/ui/use-toast";
import { useFetchJenkinsJobParameters } from "@/hooks/api/useSelfService";
import { useTriggerJenkinsJob } from "@/hooks/api/mutations/useSelfServiceMutations";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { fetchAndPopulateDynamicSteps, triggerJenkinsJob } from "@/services/SelfServiceApi";
import { selfServiceBlocks, type SelfServiceDialog } from "@/data/self-service/selfServiceBlocks";
import { Wrench } from "lucide-react";

export default function SelfServicePage() {
  const [activeBlock, setActiveBlock] = useState<SelfServiceDialog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [staticJobData, setStaticJobData] = useState<any>(null);
  
  // Fetch current user to get member ID (iuser) for auto-population
  const { data: currentUser } = useCurrentUser();

  // Jenkins API for pure dynamic jobs (no static configuration file)
  const jenkinsQuery = useFetchJenkinsJobParameters(
    staticJobData?.jenkinsJob?.jaasName || "",
    staticJobData?.jenkinsJob?.jobName || "",
    {
      enabled: activeBlock?.dialogType === 'dynamic' && activeBlock?.dataFilePath && isOpen && !!staticJobData?.jenkinsJob
    }
  );

  const triggerMutation = useTriggerJenkinsJob();

  // Load static job data
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

  // Extract defaults from parameters
  const getDefaults = (params: any[]) => {
    const defaults: Record<string, any> = {};
    params.filter(p => p.type !== "WHideParameterDefinition").forEach(p => {
      const key = p.name || p.id;
      const value = p.defaultParameterValue?.value || p.defaultValue?.value;
      
      // Auto-populate ClusterName with current user's iuser (member ID like C5406081)
      if (key === 'ClusterName') {
        // Extract iuser from currentUser - it might be at different paths
        const userId = (currentUser as any)?.iuser || (currentUser as any)?.id || '';
        
        if (userId) {
          defaults[key] = userId;
        } else if (!currentUser) {
          // User data hasn't loaded yet or failed to load
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

  // Helper to extract fields from steps
  const extractFields = (steps: any[]) => 
    steps.flatMap(step => step.fields || []);

  // Load form data when dialog opens
  useEffect(() => {
    if (!activeBlock || !isOpen) return;

    const loadData = async () => {
      let parameters: any[] = [];

      // Handle static configuration jobs
      if (activeBlock.dataFilePath) {
        const jobData = await loadStaticData(activeBlock.dataFilePath);
        if (!jobData) return;

        setStaticJobData(jobData);

        // Check if any steps need dynamic population from Jenkins
        if (jobData.steps?.some((step: any) => step.isDynamic) && jobData.jenkinsJob) {
          const response = await fetchAndPopulateDynamicSteps(
            jobData.jenkinsJob.jaasName,
            jobData.jenkinsJob.jobName,
            jobData.steps
          );
          const updatedJobData = { ...jobData, steps: response.steps };
          setStaticJobData(updatedJobData);
          parameters = extractFields(response.steps);
        } else {
          parameters = extractFields(jobData.steps || []);
        }
      }

      // Set default values for form
      // jenkinsQuery.data is JenkinsJobParametersResponse with steps property
      const jenkinsParams = jenkinsQuery.data?.steps ? extractFields(jenkinsQuery.data.steps) : [];
      const allParams = parameters.length ? parameters : jenkinsParams;
      if (allParams.length > 0) {
        setFormData(getDefaults(allParams));
      }
    };

    loadData();
  }, [activeBlock, isOpen, jenkinsQuery.data]);

  // Dialog handlers
  const openDialog = (block: SelfServiceDialog) => {
    setActiveBlock(block);
    setIsOpen(true);
    setFormData({});
    setStaticJobData(null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setActiveBlock(null);
    setFormData({});
    setStaticJobData(null);
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Submit handler
  const submitForm = () => {
    if (!staticJobData?.jenkinsJob) {
      toast({ 
        title: "Error", 
        description: "Jenkins job configuration not found. Please try again.", 
        variant: "destructive" 
      });
      return;
    }

    // Only include text parameters that are not empty and checkbox parameters that are true
    const filteredParams: Record<string, any> = {};
    
    // Get parameter definitions to check types
    const parameters = staticJobData?.steps ? extractFields(staticJobData.steps) : [];
    
    Object.entries(formData).forEach(([key, value]) => {
      const param = parameters.find(p => p.name === key);
      const paramType = param?.type;
      if (paramType === 'checkbox') {
        // Include checkbox parameters: true values as-is, false values as empty string (from getDefaults)
        filteredParams[key] = value;
      } else if (paramType === 'text' && value && typeof value === 'string' && value.trim() !== '') {
        filteredParams[key] = value;
      } else if (paramType === 'radio' || paramType === 'select') {
        // Include radio and select parameters if they have values
        if (value !== null && value !== undefined && value !== '') {
          filteredParams[key] = value;
        }
      }
    });

    triggerMutation.mutate({
      jaasName: staticJobData.jenkinsJob.jaasName,
      jobName: staticJobData.jenkinsJob.jobName,
      parameters: filteredParams
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: `${activeBlock?.title} triggered successfully` });
        closeDialog();
      },
      onError: (error) => {
        toast({ title: "Error", description: `Failed: ${error.message}`, variant: "destructive" });
      }
    });
  }

  return (
    <BreadcrumbPage>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200">
              <div className="p-3 bg-primary rounded-xl">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-slate-900">Self Service</h1>
                <p className="text-lg text-slate-600 mt-1">
                  Quick access to automated tools and processes
                </p>
              </div>
            </div>
          </div>
          
          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
          
          {/* Empty State */}
          {selfServiceBlocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-3 bg-muted rounded-full mb-4">
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
              <p className="text-muted-foreground max-w-md">
                There are currently no self-service operations configured. Check back later or contact your administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </BreadcrumbPage>
  );
}