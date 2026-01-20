import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Helper function to generate random secret
const generateSecret = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

// Helper function to generate UUID
const generateUUID = (): string => {
  return crypto.randomUUID();
};

export function OAuthUtility() {
  const [clientId, setClientId] = useState(generateUUID());
  const [clientSecret, setClientSecret] = useState(generateSecret());
  const { toast } = useToast();

  const handleRegenerateCredentials = () => {
    setClientId(generateUUID());
    setClientSecret(generateSecret());
    toast({
      title: 'Regenerated',
      description: 'New OAuth credentials generated',
    });
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <TabsContent value="oauth" className="space-y-4 min-h-[400px]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-id">Client ID</Label>
          <div className="flex gap-2">
            <Input
              id="client-id"
              value={clientId}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyToClipboard(clientId, 'Client ID')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-secret">Client Secret</Label>
          <div className="flex gap-2">
            <Input
              id="client-secret"
              value={clientSecret}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyToClipboard(clientSecret, 'Client Secret')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRegenerateCredentials}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These are randomly generated credentials for testing purposes. 
            Store them securely and never commit them to version control.
          </p>
        </div>
      </div>
    </TabsContent>
  );
}