import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertFile } from "@/hooks/api/useAlerts";
import { Activity, Clock, FileCode, AlertCircle, FileText, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AlertViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: Alert;
  file: AlertFile;
}

export function AlertViewDialog({
  open,
  onOpenChange,
  alert,
  file,
}: AlertViewDialogProps) {
  const getSeverityColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "critical") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (s === "warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (s === "info") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  };

  const getSeverityBorderColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "critical") return "border-l-red-500";
    if (s === "warning") return "border-l-amber-500";
    if (s === "info") return "border-l-blue-500";
    return "border-l-slate-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-mono">{alert.alert}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs">{file.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs">{file.category}</span>
              </DialogDescription>
            </div>
            {alert.labels?.severity && (
              <Badge className={`${getSeverityColor(alert.labels.severity)} px-2 py-0.5 text-xs`}>
                {alert.labels.severity.toUpperCase()}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Expression */}
          {alert.expr && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Expression</h4>
              <div className="bg-muted/50 rounded border p-3">
                <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
                  {alert.expr}
                </pre>
              </div>
            </div>
          )}

          {/* Duration */}
          {alert.for && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
              <div className="font-mono text-sm">{alert.for}</div>
            </div>
          )}

          {/* Summary */}
          {alert.annotations?.summary && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Summary</h4>
              <p className="text-sm">{alert.annotations.summary}</p>
            </div>
          )}

          {/* Description */}
          {alert.annotations?.description && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {alert.annotations.description}
              </p>
            </div>
          )}

          {/* Labels */}
          {alert.labels && Object.keys(alert.labels).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Labels</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(alert.labels).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="font-mono text-xs px-2 py-0.5">
                    <span className="font-medium">{key}</span>
                    <span className="mx-1 text-muted-foreground">=</span>
                    <span>{String(value)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
