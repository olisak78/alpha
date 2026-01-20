import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench } from 'lucide-react';
import { Base64Utility } from './Base64Utility';
import { OAuthUtility } from './OAuthUtility';
import { GuidUtility } from './GuidUtility';

interface UtilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UtilitiesDialog({ open, onOpenChange }: UtilitiesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Developer Utilities
          </DialogTitle>
          <DialogDescription>
            Essential tools for developers: encoding, credentials, and ID generation
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="base64" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base64">Base64</TabsTrigger>
            <TabsTrigger value="oauth">OAuth</TabsTrigger>
            <TabsTrigger value="guid">GUID</TabsTrigger>
          </TabsList>

          <Base64Utility />
          <OAuthUtility />
          <GuidUtility />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}