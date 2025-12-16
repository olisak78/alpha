import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Puzzle, ExternalLink, Server, Loader2, AlertCircle, RefreshCw, ChevronDown, Plus, Info, CheckCircle2, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PluginMetadata } from '@/plugins/types/plugin.types';
import { BasePlugin } from '@/plugins/components/BasePlugin';
import { apiClient } from '@/services/ApiClient';
import { useAuth } from '@/contexts/AuthContext';

// API response types
interface PluginApiResponse {
  id: string;
  name: string;
  title: string;
  description: string;
  icon?: string;
  react_component_path?: string;
  backend_server_url?: string;
  owner: string;
}

interface PluginsApiResponse {
  plugins: PluginApiResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Map API response to PluginMetadata
function mapApiPluginToMetadata(apiPlugin: PluginApiResponse): PluginMetadata {
  return {
    id: apiPlugin.id,
    name: apiPlugin.name,
    title: apiPlugin.title,
    description: apiPlugin.description,
    createdBy: apiPlugin.owner,
    version: '1.0.0', // API doesn't provide version yet
    icon: apiPlugin.icon,
    componentPath: apiPlugin.react_component_path,
    jsPath: apiPlugin.react_component_path,
    bundleUrl: apiPlugin.react_component_path,
    // Store backend URL for later use when loading the plugin
    ...(apiPlugin.backend_server_url && { backendUrl: apiPlugin.backend_server_url }),
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const metadataTemplate = {
  id: 'string',
  created_by: 'string',
  name: 'string',
  title: 'string',
  description: 'string',
  component_path: 'string',
  js_path: 'string',
  version: 'string (optional)',
  icon: 'string (optional)',
};

// Registration form types
interface RegistrationFormData {
  name: string;
  title: string;
  description: string;
  bundleUrl: string;
  backendUrl: string;
}

interface RegistrationFormErrors {
  name?: string;
  title?: string;
  bundleUrl?: string;
  backendUrl?: string;
}

const initialFormData: RegistrationFormData = {
  name: '',
  title: '',
  description: '',
  bundleUrl: '',
  backendUrl: '',
};

// URL validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Form validation
function validateForm(data: RegistrationFormData): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.title || data.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters';
  }

  if (!data.bundleUrl || data.bundleUrl.trim() === '') {
    errors.bundleUrl = 'Bundle URL is required';
  } else if (!isValidUrl(data.bundleUrl)) {
    errors.bundleUrl = 'Please enter a valid URL';
  }

  if (!data.backendUrl || data.backendUrl.trim() === '') {
    errors.backendUrl = 'Backend URL is required';
  } else if (!isValidUrl(data.backendUrl)) {
    errors.backendUrl = 'Please enter a valid URL';
  }

  return errors;
}

export default function PluginsPage() {
  const { user } = useAuth();
  
  const [selectedPlugin, setSelectedPlugin] = useState<PluginMetadata | null>(null);
  const [customBundleUrl, setCustomBundleUrl] = useState('');
  const [customBackendUrl, setCustomBackendUrl] = useState('');
  const [customPluginMetadata, setCustomPluginMetadata] = useState<PluginMetadata | null>(null);
  const [backendProxyActive, setBackendProxyActive] = useState(false);
  const [isTestSectionOpen, setIsTestSectionOpen] = useState(false);

  // State for fetching plugins from API
  const [registeredPlugins, setRegisteredPlugins] = useState<PluginMetadata[]>([]);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(true);
  const [pluginsError, setPluginsError] = useState<string | null>(null);

  // State for registration dialog
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<RegistrationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pluginToDelete, setPluginToDelete] = useState<PluginMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if we're in production environment
  const isProduction = import.meta.env.PROD;

  const metadataTemplateString = useMemo(
    () => JSON.stringify(metadataTemplate, null, 2),
    []
  );

  // Fetch plugins from backend API
  const fetchPlugins = async () => {
    setIsLoadingPlugins(true);
    setPluginsError(null);

    try {
      const response = await apiClient.get<PluginsApiResponse>('/plugins');
      const mappedPlugins = response.plugins.map(mapApiPluginToMetadata);
      setRegisteredPlugins(mappedPlugins);
    } catch (error) {
      console.error('[PluginsPage] Failed to fetch plugins:', error);
      setPluginsError(error instanceof Error ? error.message : 'Failed to load plugins');
    } finally {
      setIsLoadingPlugins(false);
    }
  };

  // Fetch plugins on mount
  useEffect(() => {
    fetchPlugins();
  }, []);

  // Handle form field changes
  const handleFormChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof RegistrationFormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleRegisterPlugin = async () => {
    // Validate form
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        backend_server_url: formData.backendUrl.trim(),
        description: formData.description.trim(),
        icon: 'Puzzle',
        metadata: {},
        name: formData.name.trim(),
        owner: user?.id || 'Unknown',
        react_component_path: formData.bundleUrl.trim(),
        title: formData.title.trim(),
      };

      await apiClient.post('/plugins', payload);

      // Save title for success message before resetting form
      const registeredTitle = formData.title;

      // Reset form and close dialog
      setFormData(initialFormData);
      setFormErrors({});
      setIsRegisterDialogOpen(false);

      // Show success message
      setSubmitSuccess(`Plugin "${registeredTitle}" registered successfully!`);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 5000);

      // Refresh plugins list
      await fetchPlugins();
    } catch (error) {
      console.error('[PluginsPage] Failed to register plugin:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to register plugin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsRegisterDialogOpen(open);
    if (!open) {
      setFormData(initialFormData);
      setFormErrors({});
      setSubmitError(null);
    } else {
      // Clear any previous success message when opening dialog
      setSubmitSuccess(null);
    }
  };

  // Handle delete plugin confirmation
  const handleDeleteClick = (plugin: PluginMetadata, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    setPluginToDelete(plugin);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete plugin
  const handleDeletePlugin = async () => {
    if (!pluginToDelete) return;

    setIsDeleting(true);
    setSubmitError(null);

    try {
      await apiClient.delete(`/plugins/${pluginToDelete.id}`);

      // Show success message
      setSubmitSuccess(`Plugin "${pluginToDelete.title}" deleted successfully!`);

      // Close dialog and reset
      setIsDeleteDialogOpen(false);
      setPluginToDelete(null);

      // Clear selected plugin if it was the deleted one
      if (selectedPlugin?.id === pluginToDelete.id) {
        setSelectedPlugin(null);
      }

      // Refresh plugins list
      await fetchPlugins();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('[PluginsPage] Failed to delete plugin:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete plugin');
      setIsDeleteDialogOpen(false);
      setPluginToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadCustomPlugin = () => {
    if (!customBundleUrl.trim()) {
      return;
    }

    // Create temporary metadata for the custom plugin
    const tempMetadata: PluginMetadata = {
      id: `custom-plugin-${Date.now()}`,
      name: 'custom-plugin',
      title: 'Custom Plugin Preview',
      description: 'Plugin loaded from custom bundle URL',
      createdBy: 'Developer',
      version: '1.0.0',
      componentPath: 'CustomPlugin',
      jsPath: customBundleUrl,
      bundleUrl: customBundleUrl,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add custom backend URL if provided
      ...(customBackendUrl.trim() && { backendUrl: customBackendUrl.trim() })
    };

    setCustomPluginMetadata(tempMetadata);
    setSelectedPlugin(null);
    
    // Set backend proxy flag if backend URL is provided
    if (customBackendUrl.trim()) {
      setBackendProxyActive(true);
      // Store backend URL in sessionStorage for the API client to use
      sessionStorage.setItem('plugin-backend-proxy', customBackendUrl.trim());
    } else {
      setBackendProxyActive(false);
      sessionStorage.removeItem('plugin-backend-proxy');
    }
  };

  const handleClearCustomPlugin = () => {
    setCustomPluginMetadata(null);
    setCustomBundleUrl('');
    setCustomBackendUrl('');
    setBackendProxyActive(false);
    sessionStorage.removeItem('plugin-backend-proxy');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-xl">Plugins</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Load plugin bundles on demand. Click a plugin below to fetch its metadata and JavaScript bundle, then render it inside the portal with the BasePlugin wrapper.
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitSuccess && (
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200 flex items-center justify-between">
            <span>{submitSuccess}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/50"
              onClick={() => setSubmitSuccess(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {submitError && !isRegisterDialogOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{submitError}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setSubmitError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Plugin Preview Section - Hidden in production */}
      {!isProduction && (
        <Collapsible open={isTestSectionOpen} onOpenChange={setIsTestSectionOpen}>
          <Card className="border-dashed border-2">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    <CardTitle className="text-lg">Test Your Plugin</CardTitle>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      isTestSectionOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
                <CardDescription>
                  Enter the URLs to your local plugin bundle and backend service to preview before registering
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Plugin Bundle URL */}
                <div className="space-y-2">
                  <Label htmlFor="customBundleUrl" className="flex items-center gap-2">
                    <Puzzle className="h-4 w-4" />
                    Plugin Bundle URL
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customBundleUrl"
                    type="url"
                    placeholder="e.g., http://localhost:8000/plugin.js"
                    value={customBundleUrl}
                    onChange={(e) => setCustomBundleUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadCustomPlugin();
                      }
                    }}
                  />
                </div>

                {/* Backend URL (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="customBackendUrl" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Plugin Backend URL
                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="customBackendUrl"
                    type="url"
                    placeholder="e.g., http://localhost:4000"
                    value={customBackendUrl}
                    onChange={(e) => setCustomBackendUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadCustomPlugin();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    If your plugin needs backend APIs, enter your local backend server URL. 
                    API calls via <code className="bg-muted px-1 py-0.5 rounded">context.apiClient</code> will be proxied to this server.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleLoadCustomPlugin} disabled={!customBundleUrl.trim()}>
                    Load Plugin
                  </Button>
                  {customPluginMetadata && (
                    <Button onClick={handleClearCustomPlugin} variant="outline">
                      Clear
                    </Button>
                  )}
                </div>

                {/* Status Messages */}
                {customPluginMetadata && (
                  <div className="space-y-2">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✓ Plugin bundle loaded from: <code className="text-xs break-all">{customBundleUrl}</code>
                      </p>
                    </div>
                    {backendProxyActive && customBackendUrl && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          ✓ Backend proxy active: <code className="text-xs break-all">{customBackendUrl}</code>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          API calls will be proxied to this backend server
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Separator />

      {/* Registered plugins */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Registered Plugins</h3>
          <div className="flex gap-2">
            <Dialog open={isRegisterDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Plugin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Register New Plugin</DialogTitle>
                  <DialogDescription>
                    Add a new plugin to the portal. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Submit Error Alert */}
                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Name Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pluginName">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>A unique identifier for the plugin (min 2 characters)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="pluginName"
                      placeholder="e.g., my-awesome-plugin"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Title Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pluginTitle">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Display name shown in the portal (min 2 characters)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="pluginTitle"
                      placeholder="e.g., My Awesome Plugin"
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      className={formErrors.title ? 'border-red-500' : ''}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-red-500">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pluginDescription">Description</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>A brief description of what the plugin does (optional)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="pluginDescription"
                      placeholder="e.g., Displays metrics and analytics"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </div>

                  {/* Bundle URL Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pluginBundleUrl">
                        Bundle URL <span className="text-red-500">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>URL to the compiled JavaScript bundle</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="pluginBundleUrl"
                      type="url"
                      placeholder="e.g., https://cdn.example.com/plugin.js"
                      value={formData.bundleUrl}
                      onChange={(e) => handleFormChange('bundleUrl', e.target.value)}
                      className={formErrors.bundleUrl ? 'border-red-500' : ''}
                    />
                    {formErrors.bundleUrl && (
                      <p className="text-xs text-red-500">{formErrors.bundleUrl}</p>
                    )}
                  </div>

                  {/* Backend URL Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pluginBackendUrl">
                        Backend URL <span className="text-red-500">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>URL to the plugin's backend server for API calls</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="pluginBackendUrl"
                      type="url"
                      placeholder="e.g., https://api.example.com"
                      value={formData.backendUrl}
                      onChange={(e) => handleFormChange('backendUrl', e.target.value)}
                      className={formErrors.backendUrl ? 'border-red-500' : ''}
                    />
                    {formErrors.backendUrl && (
                      <p className="text-xs text-red-500">{formErrors.backendUrl}</p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegisterPlugin}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register Plugin'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPlugins}
              disabled={isLoadingPlugins}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPlugins ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Plugin</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the plugin "{pluginToDelete?.title}"?
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The plugin will be permanently removed from the registry.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setPluginToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlugin}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Loading state */}
        {isLoadingPlugins && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading plugins...</span>
          </div>
        )}

        {/* Error state */}
        {pluginsError && !isLoadingPlugins && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load plugins
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{pluginsError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPlugins}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoadingPlugins && !pluginsError && registeredPlugins.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No plugins registered yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the "Test Your Plugin" section above to preview a plugin
              </p>
            </CardContent>
          </Card>
        )}

        {/* Plugins grid */}
        {!isLoadingPlugins && !pluginsError && registeredPlugins.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {registeredPlugins.map((plugin) => (
              <Card 
                key={plugin.id}
                className={`hover:shadow-md transition-shadow relative ${
                  selectedPlugin?.id === plugin.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDeleteClick(plugin, e)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-3 pr-10">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {plugin.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <CardDescription className="text-xs line-clamp-2">
                    {plugin.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {plugin.createdBy}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setCustomPluginMetadata(null);
                      setBackendProxyActive(false);
                      sessionStorage.removeItem('plugin-backend-proxy');
                    }}
                    size="sm"
                    className="w-full"
                    variant={selectedPlugin?.id === plugin.id ? 'default' : 'outline'}
                  >
                    {selectedPlugin?.id === plugin.id ? 'Selected' : 'Load Plugin'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Plugin metadata shape - Hidden but code kept */}
      {false && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plugin metadata shape</CardTitle>
            <CardDescription>Example payload used to request the JS bundle.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64 rounded-md border bg-muted/30 p-4 text-xs">
              <pre className="whitespace-pre-wrap break-all font-mono">{metadataTemplateString}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Plugin Preview */}
      {(selectedPlugin || customPluginMetadata) && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Plugin preview</h3>
            <p className="text-sm text-muted-foreground">
              {customPluginMetadata 
                ? backendProxyActive 
                  ? 'Previewing custom plugin with backend proxy enabled'
                  : 'Previewing custom plugin from provided URL' 
                : 'Using BasePlugin to mount the selected bundle'
              }
            </p>
          </div>
          <BasePlugin metadata={customPluginMetadata || selectedPlugin} />
        </div>
      )}
    </div>
  );
}