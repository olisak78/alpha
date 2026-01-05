import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertFile } from "@/hooks/api/useAlerts";
import { getSeverityColor, getStatusColor } from "@/utils/alertUtils";
import { formatAlertDate } from "@/utils/dateUtils";

// Generic alert data interface that can handle both alert types
interface GenericAlertData {
  // Common fields
  name: string;
  severity?: string;
  labels?: Record<string, any>;
  annotations?: Record<string, any>;
  
  // Prometheus alert specific fields
  expr?: string;
  for?: string;
  
  // Triggered alert specific fields
  status?: string;
  landscape?: string;
  region?: string;
  component?: string;
  startsAt?: string;
  endsAt?: string;
  
  // Context info (file info for prometheus alerts)
  contextInfo?: {
    fileName?: string;
    category?: string;
  };
}

interface AlertViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertData: GenericAlertData;
  title?: string;
}

// Helper function to convert Alert + AlertFile to GenericAlertData
export function createPrometheusAlertData(alert: Alert, file: AlertFile): GenericAlertData {
  return {
    name: alert.alert,
    severity: alert.labels?.severity,
    labels: alert.labels,
    annotations: alert.annotations,
    expr: alert.expr,
    for: alert.for,
    contextInfo: {
      fileName: file.name,
      category: file.category,
    },
  };
}


export function AlertViewDialog({
  open,
  onOpenChange,
  alertData,
}: AlertViewDialogProps) {
  const severityColorClasses = alertData.severity ? getSeverityColor(alertData.severity) : '';
  const statusColorClasses = alertData.status ? getStatusColor(alertData.status) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 pt-2">
              <DialogTitle className="text-lg font-mono">{alertData.name}</DialogTitle>
              {alertData.severity && (
                <Badge className={`${severityColorClasses} px-2 py-0.5 text-xs`}>
                  {alertData.severity.toUpperCase()}
                </Badge>
              )}
            </div>
            <DialogDescription className="flex items-center gap-2">
              {alertData.contextInfo?.fileName && (
                <>
                  <span className="font-mono text-xs">{alertData.contextInfo.fileName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs">{alertData.contextInfo.category}</span>
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Expression (Prometheus alerts only) */}
          {alertData.expr && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Expression</h4>
              <div className="bg-muted/50 rounded border p-3">
                <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
                  {alertData.expr}
                </pre>
              </div>
            </div>
          )}

          {/* Duration (Prometheus alerts only) */}
          {alertData.for && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
              <div className="font-mono text-sm">{alertData.for}</div>
            </div>
          )}

          {/* Status (Triggered alerts only) */}
          {alertData.status && (
            <div className="space-y-1.5">
              <Badge className={`${statusColorClasses} text-sm`}>
                {alertData.status.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Time Information (Triggered alerts only) */}
          {alertData.startsAt && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Time Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Started:</span>
                  <span className="text-sm text-muted-foreground">{formatAlertDate(alertData.startsAt)}</span>
                </div>
                {alertData.endsAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ended:</span>
                    <span className="text-sm text-muted-foreground">{formatAlertDate(alertData.endsAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Annotations */}
          {alertData.annotations && Object.keys(alertData.annotations).length > 0 && (
            <div className="space-y-1.5">
              <div className="space-y-2">
                {Object.entries(alertData.annotations).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {alertData.labels && Object.keys(alertData.labels).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Labels</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(alertData.labels).map(([key, value]) => (
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
