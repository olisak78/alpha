import { useDeployments, type Deployment } from "@/services/aiPlatformApi";
import { useChatCtx } from "../AIPage";
import { ChevronDown, Sparkles, AlertCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeploymentSelector() {
  const { settings, updateSettings } = useChatCtx();
  const { data: deploymentsData, isLoading, error } = useDeployments();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten deployments from all teams
  const deployments: Deployment[] = deploymentsData?.deployments?.flatMap(td => td.deployments) ?? [];

  // Filter, search, and sort RUNNING deployments
  const runningDeployments = useMemo(() => {
    let filtered = deployments.filter(d => d.status === 'RUNNING');

    // Filter for chat-compatible models only (GPT, Claude, Gemini)
    const chatModelPattern = /(gpt|claude|gemini)/i;
    filtered = filtered.filter(d => {
      const modelName = d.details?.resources?.backendDetails?.model?.name ||
                       d.details?.resources?.backend_details?.model?.name ||
                       d.configurationName ||
                       '';
      return chatModelPattern.test(modelName);
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const modelName = d.details?.resources?.backendDetails?.model?.name ||
                         d.details?.resources?.backend_details?.model?.name ||
                         d.configurationName ||
                         'Unknown Model';
        return (
          modelName.toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query) ||
          d.configurationName?.toLowerCase().includes(query)
        );
      });
    }

    // Sort alphabetically by model name
    filtered.sort((a, b) => {
      const getModelName = (d: Deployment) =>
        d.details?.resources?.backendDetails?.model?.name ||
        d.details?.resources?.backend_details?.model?.name ||
        d.configurationName ||
        'Unknown Model';

      return getModelName(a).localeCompare(getModelName(b));
    });

    return filtered;
  }, [deployments, searchQuery]);

  // Find currently selected deployment
  const selectedDeployment = settings.deploymentId
    ? runningDeployments.find(d => d.id === settings.deploymentId)
    : null;

  const handleSelect = (deploymentId: string) => {
    updateSettings({ deploymentId });
    setOpen(false);
    setSearchQuery(''); // Clear search when selecting
  };

  // Get display name for deployment
  const getDeploymentName = (deployment: Deployment) => {
    const modelName = deployment.details?.resources?.backendDetails?.model?.name ||
                      deployment.details?.resources?.backend_details?.model?.name ||
                      deployment.configurationName ||
                      'Unknown Model';
    return `${modelName} (${deployment.id.slice(0, 8)})`;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121]">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Loading deployments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121]">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load deployments</span>
        </div>
      </div>
    );
  }

  if (runningDeployments.length === 0) {
    return (
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121]">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
          <AlertCircle className="h-4 w-4" />
          <span>No running deployments available. Please create and start a deployment first.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121] ${!selectedDeployment ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <div className="flex items-center gap-2 ml-4">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`h-9 px-3 gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 ${
                !selectedDeployment ? 'border-2 border-amber-500 dark:border-amber-600 animate-pulse' : ''
              }`}
            >
              <Sparkles className="h-4 w-4 text-[#AB68FF]" />
              <span className={`${selectedDeployment ? 'text-gray-700 dark:text-gray-200' : 'text-amber-600 dark:text-amber-500 font-semibold'}`}>
                {selectedDeployment ? getDeploymentName(selectedDeployment) : 'Select Model Deployment'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px]">
            {/* Search Box */}
            <div className="px-2 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 h-9"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Deployments List */}
            <div className="max-h-[300px] overflow-y-auto">
              {runningDeployments.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  {searchQuery ? 'No models found matching your search' : 'No deployments available'}
                </div>
              ) : (
                runningDeployments.map((deployment) => (
                  <DropdownMenuItem
                    key={deployment.id}
                    onClick={() => handleSelect(deployment.id)}
                    className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Sparkles className="h-4 w-4 text-[#AB68FF]" />
                      <span className="font-medium">{getDeploymentName(deployment)}</span>
                      {deployment.id === settings.deploymentId && (
                        <span className="ml-auto text-xs bg-[#AB68FF] text-white px-2 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    {deployment.team && (
                      <span className="text-xs text-gray-500 ml-6">Team: {deployment.team}</span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
        </DropdownMenuContent>
      </DropdownMenu>
        {!selectedDeployment && (
          <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
            Required to start chatting
          </span>
        )}
      </div>
    </div>
  );
}
