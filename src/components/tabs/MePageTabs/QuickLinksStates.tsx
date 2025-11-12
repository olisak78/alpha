import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-base text-muted-foreground text-center py-8">
      {message}
    </div>
  );
}
