import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";

export function LoadingState() {
  return (
    <div className="text-sm text-muted-foreground text-center py-8">
      Loading quick links...
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Failed to load quick links: {error.message}
      </AlertDescription>
    </Alert>
  );
}

interface EmptyStateProps {
  message: string;
  onAddLinkClick?: () => void;
}

export function EmptyState({ message, onAddLinkClick }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="text-base text-muted-foreground text-center">
          {message}
        </div>
        {onAddLinkClick && (
          <Button
            size="sm"
            onClick={onAddLinkClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        )}
      </div>
    </div>
  );
}
