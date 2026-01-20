import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Helper function to generate UUID
const generateUUID = (): string => {
  return crypto.randomUUID();
};

export function GuidUtility() {
  const [guid, setGuid] = useState(generateUUID());
  const { toast } = useToast();

  const handleGenerateGUID = () => {
    setGuid(generateUUID());
    toast({
      title: 'Generated',
      description: 'New GUID generated',
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
    <TabsContent value="guid" className="space-y-4 min-h-[400px]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guid">Generated GUID</Label>
          <div className="flex gap-2">
            <Input
              id="guid"
              value={guid}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyToClipboard(guid, 'GUID')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateGUID}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Generate New GUID
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>About GUIDs:</strong> A Globally Unique Identifier (GUID) is a 128-bit 
            unique reference number used in software development. Also known as UUID (Universally Unique Identifier).
          </p>
        </div>
      </div>
    </TabsContent>
  );
}