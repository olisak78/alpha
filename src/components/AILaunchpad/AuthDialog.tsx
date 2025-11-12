import React, { useState } from 'react';
import { Eye, EyeOff, Key, Loader2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAIAuth, AuthCredentials } from '@/services/aiPlatformApi';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState<AuthCredentials>({
    clientId: '',
    clientSecret: '',
    authUrl: '',
    resourceGroup: 'default',
  });
  const [showSecrets, setShowSecrets] = useState({
    clientSecret: false,
  });
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { toast } = useToast();
  const { authenticate } = useAIAuth();

  const handleInputChange = (field: keyof AuthCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.clientId || !formData.clientSecret || !formData.authUrl) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await authenticate.mutateAsync(formData);
      toast({
        title: "Authentication Successful",
        description: "You are now connected to CFS AI Engine",
      });
      onOpenChange(false);
      // Reset form
      // Reset form
      setFormData({
        clientId: '',
        clientSecret: '',
        authUrl: '',
        resourceGroup: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleSecretVisibility = (field: 'clientSecret') => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const parseJsonCredentials = () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON credentials');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      // Extract credentials from various possible JSON structures
      const credentials: Partial<AuthCredentials> = {};
      
      // Common field mappings
      if (parsed.clientId || parsed.client_id || parsed['client-id']) {
        credentials.clientId = parsed.clientId || parsed.client_id || parsed['client-id'];
      }
      
      if (parsed.clientSecret || parsed.client_secret || parsed['client-secret']) {
        credentials.clientSecret = parsed.clientSecret || parsed.client_secret || parsed['client-secret'];
      }
      
      if (parsed.authUrl || parsed.auth_url || parsed['auth-url'] || parsed.url || parsed.tokenUrl || parsed.token_url) {
        credentials.authUrl = parsed.authUrl || parsed.auth_url || parsed['auth-url'] || parsed.url || parsed.tokenUrl || parsed.token_url;
      }
      
      if (parsed.resourceGroup || parsed.resource_group || parsed['resource-group']) {
        credentials.resourceGroup = parsed.resourceGroup || parsed.resource_group || parsed['resource-group'];
      }

      // Validate required fields
      if (!credentials.clientId || !credentials.clientSecret) {
        setError('JSON must contain clientId and clientSecret fields');
        return;
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        ...credentials,
        authUrl: credentials.authUrl || prev.authUrl,
        resourceGroup: credentials.resourceGroup || prev.resourceGroup,
      }));

      setJsonInput('');
      setError('');
    } catch (err) {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Authenticate with CFS AI Engine</DialogTitle>
              <DialogDescription>
                Enter your credentials to access AI model deployments
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* JSON Input Section */}
          <div className="space-y-2">
            <Label htmlFor="jsonInput">Import from JSON (Optional)</Label>
            <div className="space-y-2">
              <textarea
                id="jsonInput"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your credentials JSON here, e.g.:
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "authUrl": "https://your-auth-url.com/oauth/token",
  "resourceGroup": "default"
}'
                className="w-full h-24 px-3 py-2 text-sm border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={parseJsonCredentials}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Parse JSON
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID *</Label>
            <Input
              id="clientId"
              type="text"
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              placeholder="Enter your client ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret *</Label>
            <div className="relative">
              <Input
                id="clientSecret"
                type={showSecrets.clientSecret ? 'text' : 'password'}
                value={formData.clientSecret}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                placeholder="Enter your client secret"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleSecretVisibility('clientSecret')}
              >
                {showSecrets.clientSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authUrl">Authentication URL *</Label>
            <Input
              id="authUrl"
              type="url"
              value={formData.authUrl}
              onChange={(e) => handleInputChange('authUrl', e.target.value)}
              placeholder="https://your-auth-url.authentication.sap.hana.ondemand.com/oauth/token"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resourceGroup">Resource Group</Label>
            <Input
              id="resourceGroup"
              type="text"
              value={formData.resourceGroup}
              onChange={(e) => handleInputChange('resourceGroup', e.target.value)}
              placeholder="default"
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={authenticate.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={authenticate.isPending}
              className="flex items-center gap-2"
            >
              {authenticate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Authenticate'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
