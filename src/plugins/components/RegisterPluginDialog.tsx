import { useState } from 'react';
import { Plus, Loader2, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/ApiClient';
import {
  initialFormData,
  RegistrationFormData,
  RegistrationFormErrors,
  validateForm,
} from '@/plugins/models/models';

interface RegisterPluginDialogProps {
  onSuccess: () => void;
}

export default function RegisterPluginDialog({ onSuccess }: RegisterPluginDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<RegistrationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        backend_server_url: formData.backendUrl.trim() || null,
        description: formData.description.trim(),
        icon: 'Puzzle',
        metadata: {author_name: user?.name || ''},
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
      setIsOpen(false);

      // Show success toast
      toast({
        title: "Success",
        description: `Plugin "${registeredTitle}" registered successfully!`,
        variant: "default",
      });

      // Notify parent to refresh
      onSuccess();
    } catch (error) {
      console.error('[RegisterPluginDialog] Failed to register plugin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register plugin';
      setSubmitError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFormData(initialFormData);
      setFormErrors({});
      setSubmitError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
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

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="pluginName">
              Name <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="pluginTitle">
              Title <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="pluginDescription">Description</Label>
            <Textarea
              id="pluginDescription"
              placeholder="Describe what your plugin does..."
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={3}
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
                    <p>URL to the compiled JavaScript bundle (e.g., plugin.js)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="pluginBundleUrl"
              type="url"
              placeholder="e.g., https://example.com/plugin.js"
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
                Backend URL 
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>URL to the plugin's backend server for API calls (optional)</p>
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
  );
}