import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export function Base64Utility() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const { toast } = useToast();

  const handleEncode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      toast({
        title: 'Success',
        description: 'String encoded to Base64',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to encode string. Make sure it contains valid characters.',
        variant: 'destructive',
      });
    }
  };

  const handleDecode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      toast({
        title: 'Success',
        description: 'Base64 string decoded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decode Base64 string. Make sure it\'s a valid Base64 string.',
        variant: 'destructive',
      });
    }
  };

  const handleParseJWT = () => {
    try {
      const token = input.trim().replace(/^Bearer\s+/i, '');
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      const result = {
        header,
        payload,
        signature: parts[2],
      };

      setOutput(JSON.stringify(result, null, 2));
      toast({
        title: 'Success',
        description: 'JWT parsed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse JWT. Make sure it\'s a valid JWT token.',
        variant: 'destructive',
      });
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    toast({
      title: 'Cleared',
      description: 'Input and output fields have been cleared',
    });
  };

  return (
    <TabsContent value="base64" className="space-y-4 min-h-[400px]">
      <div className="space-y-2">
        <Label htmlFor="input">Input</Label>
        <Textarea
          id="input"
          placeholder="Enter text to encode, Base64 string to decode, or JWT token to parse..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleEncode} 
          disabled={!input.trim()}
          variant="default"
          size="sm"
        >
          Encode
        </Button>
        <Button 
          onClick={handleDecode} 
          disabled={!input.trim()}
          variant="default"
          size="sm"
        >
          Decode
        </Button>
        <Button 
          onClick={handleParseJWT} 
          disabled={!input.trim()}
          variant="default"
          size="sm"
        >
          Parse JWT
        </Button>
        <Button 
          onClick={handleClear} 
          disabled={!input && !output}
          variant="outline"
          size="sm"
        >
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="output">Output</Label>
        <Textarea
          id="output"
          placeholder="Result will appear here..."
          value={output}
          readOnly
          className="min-h-[120px] font-mono text-sm bg-muted"
        />
      </div>
    </TabsContent>
  );
}